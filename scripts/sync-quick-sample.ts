/**
 * Quick sync: 1 Partner + 1 Sale Order + 1 Purchase Order + 1 Invoice from Odoo
 * Run: npx tsx scripts/sync-quick-sample.ts
 */
import xmlrpc from 'xmlrpc';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CFG = { url: 'http://161.97.141.100:10016', db: 'hosien_alnagar', username: 'togetheramr123@mail.com', password: '1993' };
const CID = 'real_company_id';

function client() {
    const u = new URL(CFG.url);
    const opts = { host: u.hostname, port: parseInt(u.port) || 80, path: '/xmlrpc/2/common', headers: { 'User-Agent': 'Node' } };
    return { create: xmlrpc.createClient, opts };
}

async function auth() {
    const { create, opts } = client();
    const c = create(opts);
    const uid: number = await new Promise((res, rej) => c.methodCall('authenticate', [CFG.db, CFG.username, CFG.password, {}], (e: any, v: any) => e ? rej(e) : res(v)));
    const obj = create({ ...opts, path: '/xmlrpc/2/object' });
    return { obj, uid };
}

function rpc(obj: any, uid: number, model: string, method: string, args: any[], kw: any = {}): Promise<any> {
    return new Promise((res, rej) => obj.methodCall('execute_kw', [CFG.db, uid, CFG.password, model, method, args, kw], (e: any, v: any) => e ? rej(e) : res(v)));
}

async function main() {
    const { obj, uid } = await auth();
    console.log('✅ Connected\n');

    // Ensure company exists
    await prisma.company.upsert({ where: { id: CID }, create: { id: CID, name: 'My Real Business', currency: 'EGP' }, update: {} });

    // ===== 1. Sync 5 Partners =====
    console.log('👤 Syncing 5 partners...');
    const partners = await rpc(obj, uid, 'res.partner', 'search_read', [[]], {
        fields: ['id', 'name', 'email', 'phone', 'mobile', 'street', 'city', 'vat', 'ref', 'is_company', 'customer_rank', 'supplier_rank'],
        limit: 5, order: 'id desc'
    });
    for (const p of partners) {
        await prisma.partner.upsert({
            where: { odooId: p.id },
            create: {
                name: p.name, email: p.email || null, phone: p.phone || null, mobile: p.mobile || null,
                street: p.street || null, city: p.city || null, vat: p.vat || null, ref: p.ref || null,
                type: p.is_company ? 'company' : 'person',
                isCustomer: (p.customer_rank || 0) > 0, isVendor: (p.supplier_rank || 0) > 0,
                companyId: CID, odooId: p.id
            },
            update: { name: p.name }
        });
        console.log(`  ✓ ${p.name}`);
    }

    // ===== 2. Sync 1 Sale Order + Lines =====
    console.log('\n🛒 Syncing 1 sale order...');
    const [so] = await rpc(obj, uid, 'sale.order', 'search_read', [[['state', '=', 'sale']]], {
        fields: ['id', 'name', 'partner_id', 'state', 'date_order', 'amount_untaxed', 'amount_tax', 'amount_total', 'note', 'order_line'],
        limit: 1, order: 'id desc'
    });
    if (so) {
        // Ensure partner exists
        let soPartnerId: string;
        const existingP = await prisma.partner.findFirst({ where: { odooId: so.partner_id[0] } });
        if (existingP) { soPartnerId = existingP.id; }
        else {
            const np = await prisma.partner.create({ data: { name: so.partner_id[1], companyId: CID, odooId: so.partner_id[0] } });
            soPartnerId = np.id;
        }

        const saleOrder = await prisma.saleOrder.upsert({
            where: { odooId: so.id },
            create: {
                name: so.name, partnerId: soPartnerId, status: so.state, odooId: so.id,
                dateOrder: new Date(so.date_order), amountUntaxed: so.amount_untaxed || 0,
                amountTax: so.amount_tax || 0, amountTotal: so.amount_total || 0,
                note: so.note || null, companyId: CID
            },
            update: { name: so.name, status: so.state, amountTotal: so.amount_total || 0 }
        });
        console.log(`  ✓ ${so.name} (${so.partner_id[1]}) - Total: ${so.amount_total}`);

        // Lines
        if (so.order_line?.length) {
            const lines = await rpc(obj, uid, 'sale.order.line', 'read', [so.order_line], {
                fields: ['name', 'product_id', 'product_uom_qty', 'price_unit', 'price_subtotal', 'qty_delivered', 'qty_invoiced', 'discount', 'product_uom']
            });
            await prisma.saleOrderLine.deleteMany({ where: { orderId: saleOrder.id } });
            for (const l of lines) {
                let prodId: string | null = null;
                if (l.product_id?.[0]) { const pr = await prisma.product.findFirst({ where: { odooId: l.product_id[0] } }); if (pr) prodId = pr.id; }
                await prisma.saleOrderLine.create({
                    data: {
                        orderId: saleOrder.id, productId: prodId, name: l.name || null,
                        quantity: l.product_uom_qty || 0, priceUnit: l.price_unit || 0, priceSubtotal: l.price_subtotal || 0,
                        qtyDelivered: l.qty_delivered || 0, qtyInvoiced: l.qty_invoiced || 0, discount1: l.discount || 0,
                        unitName: l.product_uom?.[1] || null
                    }
                });
            }
            console.log(`    ${lines.length} lines synced`);
        }
    }

    // ===== 3. Sync 1 Purchase Order + Lines =====
    console.log('\n🛍️ Syncing 1 purchase order...');
    const [po] = await rpc(obj, uid, 'purchase.order', 'search_read', [[['state', '=', 'purchase']]], {
        fields: ['id', 'name', 'partner_id', 'state', 'date_order', 'amount_untaxed', 'amount_tax', 'amount_total', 'notes', 'order_line'],
        limit: 1, order: 'id desc'
    });
    if (po) {
        let poPartnerId: string;
        const existingP = await prisma.partner.findFirst({ where: { odooId: po.partner_id[0] } });
        if (existingP) { poPartnerId = existingP.id; }
        else {
            const np = await prisma.partner.create({ data: { name: po.partner_id[1], isVendor: true, companyId: CID, odooId: po.partner_id[0] } });
            poPartnerId = np.id;
        }

        const purchaseOrder = await prisma.purchaseOrder.upsert({
            where: { odooId: po.id },
            create: {
                name: po.name, partnerId: poPartnerId, status: po.state, odooId: po.id,
                dateOrder: new Date(po.date_order), amountUntaxed: po.amount_untaxed || 0,
                amountTax: po.amount_tax || 0, amountTotal: po.amount_total || 0,
                notes: po.notes || null, companyId: CID
            },
            update: { name: po.name, status: po.state, amountTotal: po.amount_total || 0 }
        });
        console.log(`  ✓ ${po.name} (${po.partner_id[1]}) - Total: ${po.amount_total}`);

        if (po.order_line?.length) {
            const lines = await rpc(obj, uid, 'purchase.order.line', 'read', [po.order_line], {
                fields: ['name', 'product_id', 'product_qty', 'price_unit', 'price_subtotal', 'qty_received', 'qty_invoiced', 'product_uom']
            });
            await prisma.purchaseOrderLine.deleteMany({ where: { orderId: purchaseOrder.id } });
            for (const l of lines) {
                let prodId: string | null = null;
                if (l.product_id?.[0]) { const pr = await prisma.product.findFirst({ where: { odooId: l.product_id[0] } }); if (pr) prodId = pr.id; }
                await prisma.purchaseOrderLine.create({
                    data: {
                        orderId: purchaseOrder.id, productId: prodId, name: l.name || null,
                        quantity: l.product_qty || 0, priceUnit: l.price_unit || 0, priceSubtotal: l.price_subtotal || 0,
                        qtyReceived: l.qty_received || 0, qtyInvoiced: l.qty_invoiced || 0,
                        unitName: l.product_uom?.[1] || null
                    }
                });
            }
            console.log(`    ${lines.length} lines synced`);
        }
    }

    // ===== 4. Sync 1 Invoice + Lines =====
    console.log('\n🧾 Syncing 1 invoice...');
    const [inv] = await rpc(obj, uid, 'account.move', 'search_read',
        [[['move_type', 'in', ['out_invoice', 'in_invoice']], ['state', '=', 'posted']]], {
        fields: ['id', 'name', 'move_type', 'partner_id', 'state', 'invoice_date', 'invoice_date_due',
            'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual', 'narration', 'invoice_origin', 'invoice_line_ids'],
        limit: 1, order: 'id desc'
    });
    if (inv) {
        let invPartnerId: string;
        const existingP = await prisma.partner.findFirst({ where: { odooId: inv.partner_id[0] } });
        if (existingP) { invPartnerId = existingP.id; }
        else {
            const np = await prisma.partner.create({ data: { name: inv.partner_id[1], companyId: CID, odooId: inv.partner_id[0] } });
            invPartnerId = np.id;
        }

        let state = inv.state === 'posted' && inv.amount_residual === 0 ? 'paid' : inv.state;

        const invoice = await prisma.invoice.upsert({
            where: { odooId: inv.id },
            create: {
                name: inv.name, type: inv.move_type, partnerId: invPartnerId, state, odooId: inv.id,
                dateInvoice: inv.invoice_date ? new Date(inv.invoice_date) : new Date(),
                dateDue: inv.invoice_date_due ? new Date(inv.invoice_date_due) : null,
                amountUntaxed: inv.amount_untaxed || 0, amountTax: inv.amount_tax || 0,
                amountTotal: inv.amount_total || 0, amountResidual: inv.amount_residual || 0,
                narration: inv.narration || null, invoiceOrigin: inv.invoice_origin || null,
                companyId: CID
            },
            update: { name: inv.name, state, amountTotal: inv.amount_total || 0, amountResidual: inv.amount_residual || 0 }
        });
        console.log(`  ✓ ${inv.name} (${inv.partner_id[1]}) - Total: ${inv.amount_total} - Residual: ${inv.amount_residual}`);

        if (inv.invoice_line_ids?.length) {
            const lines = await rpc(obj, uid, 'account.move.line', 'read', [inv.invoice_line_ids], {
                fields: ['name', 'product_id', 'quantity', 'price_unit', 'price_subtotal', 'discount', 'product_uom_id', 'display_type']
            });
            await prisma.invoiceLine.deleteMany({ where: { invoiceId: invoice.id } });
            for (const l of lines) {
                if (l.display_type === 'payment_term' || l.display_type === 'tax') continue;
                let prodId: string | null = null;
                if (l.product_id?.[0]) { const pr = await prisma.product.findFirst({ where: { odooId: l.product_id[0] } }); if (pr) prodId = pr.id; }
                await prisma.invoiceLine.create({
                    data: {
                        invoiceId: invoice.id, productId: prodId, name: l.name || null,
                        quantity: l.quantity || 0, priceUnit: l.price_unit || 0, priceSubtotal: l.price_subtotal || 0,
                        discount1: l.discount || 0, unitName: l.product_uom_id?.[1] || null
                    }
                });
            }
            console.log(`    ${lines.length} lines synced`);
        }
    }

    console.log('\n🎉 Done! Sample data synced.');
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
