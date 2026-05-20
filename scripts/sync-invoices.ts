/**
 * Sync Invoices from Odoo
 * Run: npx tsx scripts/sync-invoices.ts
 */
import xmlrpc from 'xmlrpc';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const CFG = { url: 'http://161.97.141.100:10016', db: 'hosien_alnagar', username: 'togetheramr123@mail.com', password: '1993' };

function mkClient() {
    const u = new URL(CFG.url);
    return { create: xmlrpc.createClient, opts: { host: u.hostname, port: parseInt(u.port), path: '/xmlrpc/2/common' } };
}

async function auth() {
    const { create, opts } = mkClient();
    const c = create(opts);
    const uid: number = await new Promise((res, rej) => c.methodCall('authenticate', [CFG.db, CFG.username, CFG.password, {}], (e: any, v: any) => e ? rej(e) : res(v)));
    return { obj: create({ ...opts, path: '/xmlrpc/2/object' }), uid };
}

function rpc(obj: any, uid: number, model: string, method: string, args: any[], kw: any = {}): Promise<any> {
    return new Promise((res, rej) => obj.methodCall('execute_kw', [CFG.db, uid, CFG.password, model, method, args, kw], (e: any, v: any) => e ? rej(e) : res(v)));
}

async function main() {
    const { obj, uid } = await auth();
    console.log('✅ Connected to Odoo\n');

    // Get company
    const companies = await prisma.company.findMany();
    if (companies.length === 0) { console.log('No company found'); return; }
    const companyId = companies[0].id;

    // Get recent invoices from Odoo (all types)
    const odooInvoices = await rpc(obj, uid, 'account.move', 'search_read', [[
        ['move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']]
    ]], {
        fields: ['name', 'move_type', 'partner_id', 'invoice_date', 'invoice_date_due',
            'state', 'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual',
            'narration', 'invoice_origin', 'invoice_line_ids'],
        limit: 50,
        order: 'id desc'
    });

    console.log(`Found ${odooInvoices.length} invoices in Odoo\n`);

    let synced = 0;
    for (const inv of odooInvoices) {
        // Find or create partner
        let partner = await prisma.partner.findFirst({ where: { name: inv.partner_id[1] } });
        if (!partner) {
            partner = await prisma.partner.create({
                data: {
                    name: inv.partner_id[1],
                    isCustomer: inv.move_type.startsWith('out'),
                    isVendor: inv.move_type.startsWith('in'),
                    companyId,
                }
            });
            console.log(`  Created partner: ${partner.name}`);
        }

        // Check if already synced
        const existing = await prisma.invoice.findFirst({ where: { odooId: inv.id } });
        if (existing) { continue; }

        // Get invoice lines
        let lines: any[] = [];
        if (inv.invoice_line_ids && inv.invoice_line_ids.length > 0) {
            lines = await rpc(obj, uid, 'account.move.line', 'read', [inv.invoice_line_ids], {
                fields: ['product_id', 'name', 'quantity', 'price_unit', 'price_subtotal',
                    'discount', 'product_uom_id', 'display_type']
            });
        }

        // Create invoice
        try {
            await prisma.invoice.create({
                data: {
                    name: inv.name || `INV-${inv.id}`,
                    type: inv.move_type,
                    partnerId: partner.id,
                    dateInvoice: inv.invoice_date ? new Date(inv.invoice_date) : new Date(),
                    dateDue: inv.invoice_date_due ? new Date(inv.invoice_date_due) : null,
                    state: inv.state === 'draft' ? 'draft' : inv.state === 'cancel' ? 'cancelled' : inv.amount_residual === 0 ? 'paid' : 'posted',
                    amountUntaxed: new Prisma.Decimal(inv.amount_untaxed || 0),
                    amountTax: new Prisma.Decimal(inv.amount_tax || 0),
                    amountTotal: new Prisma.Decimal(inv.amount_total || 0),
                    amountResidual: new Prisma.Decimal(inv.amount_residual || 0),
                    narration: inv.narration || null,
                    invoiceOrigin: inv.invoice_origin || null,
                    companyId,
                    odooId: inv.id,
                    lines: {
                        create: lines
                            .filter((l: any) => l.display_type !== 'payment_term')
                            .map((l: any) => ({
                                name: l.name || '',
                                quantity: new Prisma.Decimal(l.quantity || 0),
                                priceUnit: new Prisma.Decimal(l.price_unit || 0),
                                priceSubtotal: new Prisma.Decimal(l.price_subtotal || 0),
                                discount1: new Prisma.Decimal(l.discount || 0),
                                discount2: new Prisma.Decimal(0),
                                priceNet: new Prisma.Decimal(l.price_unit * (1 - (l.discount || 0) / 100)),
                                unitName: l.product_uom_id ? l.product_uom_id[1] : null,
                                lineType: l.display_type === 'line_section' ? 'section' :
                                    l.display_type === 'line_note' ? 'note' : 'line',
                                // Try to link product
                                ...(l.product_id ? {
                                    productId: undefined // We'd need to match by name or odooId
                                } : {})
                            }))
                    }
                }
            });
            synced++;
            console.log(`✅ ${inv.name} (${inv.move_type}) - ${Number(inv.amount_total).toFixed(2)}`);
        } catch (e: any) {
            console.log(`❌ ${inv.name}: ${e.message?.substring(0, 80)}`);
        }
    }

    console.log(`\n🎉 Synced ${synced} new invoices`);
    await prisma.$disconnect();
}

main().catch(console.error);
