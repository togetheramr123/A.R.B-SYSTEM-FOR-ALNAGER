/**
 * Odoo Full Sync: Partners → Sales → Purchases → Invoices
 * 
 * Run with: npx tsx scripts/sync-odoo-all.ts
 */

import xmlrpc from 'xmlrpc';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ODOO_CONFIG = {
    url: 'http://161.97.141.100:10016',
    db: 'hosien_alnagar',
    username: 'togetheramr123@mail.com',
    password: '1993'
};

const COMPANY_ID = 'real_company_id';

// ===================== XML-RPC Helpers =====================

function getOdooClient() {
    const urlParts = new URL(ODOO_CONFIG.url);
    const clientOptions = {
        host: urlParts.hostname,
        port: parseInt(urlParts.port) || 80,
        path: '/xmlrpc/2/common',
        headers: { 'User-Agent': 'NodeJS XML-RPC Client' }
    };
    const createClient = urlParts.protocol === 'https:' ? xmlrpc.createSecureClient : xmlrpc.createClient;
    return { createClient, clientOptions };
}

async function authenticate(): Promise<{ object: any; uid: number }> {
    const { createClient, clientOptions } = getOdooClient();
    const common = createClient(clientOptions);

    const uid = await new Promise<number>((resolve, reject) => {
        common.methodCall('authenticate', [
            ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}
        ], (error: any, value: any) => {
            if (error) reject(error);
            else if (typeof value !== 'number') reject(new Error("Authentication failed"));
            else resolve(value);
        });
    });

    const objectClientOptions = { ...clientOptions, path: '/xmlrpc/2/object' };
    const object = createClient(objectClientOptions);
    console.log(`✅ Authenticated with Odoo (uid: ${uid})`);
    return { object, uid };
}

function executeKW(object: any, uid: number, model: string, method: string, args: any[], kwargs: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
        object.methodCall('execute_kw', [
            ODOO_CONFIG.db, uid, ODOO_CONFIG.password,
            model, method, args, kwargs
        ], (error: any, value: any) => {
            if (error) reject(error);
            else resolve(value);
        });
    });
}

// ===================== 1. Sync Partners =====================

async function syncPartners(object: any, uid: number) {
    console.log('\n👤 Syncing Partners (Contacts)...');

    const totalCount = await executeKW(object, uid, 'res.partner', 'search_count', [[]]);
    console.log(`   Total partners in Odoo: ${totalCount}`);

    const BATCH_SIZE = 100;
    let offset = 0;
    let totalCreated = 0, totalUpdated = 0;

    while (offset < totalCount) {
        const partners = await executeKW(object, uid, 'res.partner', 'search_read',
            [[]],
            {
                fields: [
                    'id', 'name', 'email', 'phone', 'mobile',
                    'street', 'street2', 'city', 'state_id', 'zip', 'country_id',
                    'vat', 'ref', 'website', 'lang', 'title',
                    'function', 'comment',
                    'is_company', 'type',
                    'customer_rank', 'supplier_rank',
                    'parent_id',
                    'property_payment_term_id',
                    'property_supplier_payment_term_id',
                ],
                offset: offset,
                limit: BATCH_SIZE,
                order: 'id asc'
            }
        );

        let batchCreated = 0, batchUpdated = 0;

        for (const p of partners) {
            try {
                const isCustomer = (p.customer_rank || 0) > 0;
                const isVendor = (p.supplier_rank || 0) > 0;

                const data: any = {
                    name: p.name || 'Unknown',
                    email: p.email || null,
                    phone: p.phone || null,
                    mobile: p.mobile || null,
                    street: p.street || null,
                    street2: p.street2 || null,
                    city: p.city || null,
                    state: p.state_id && Array.isArray(p.state_id) ? p.state_id[1] : null,
                    zip: p.zip || null,
                    country: p.country_id && Array.isArray(p.country_id) ? p.country_id[1] : null,
                    vat: p.vat || null,
                    ref: p.ref || null,
                    website: p.website || null,
                    lang: p.lang || 'ar_001',
                    title: p.title && Array.isArray(p.title) ? p.title[1] : null,
                    function: p.function || null,
                    notes: p.comment || null,
                    type: p.is_company ? 'company' : (p.type || 'person'),
                    isCustomer: isCustomer,
                    isVendor: isVendor,
                    companyId: COMPANY_ID,
                    odooId: p.id,
                };

                const existing = await prisma.partner.findFirst({
                    where: { odooId: p.id }
                });

                if (existing) {
                    await prisma.partner.update({
                        where: { id: existing.id },
                        data
                    });
                    batchUpdated++;
                } else {
                    await prisma.partner.create({ data });
                    batchCreated++;
                }
            } catch (err: any) {
                console.error(`   ⚠️ Error syncing partner "${p.name}" (ID: ${p.id}): ${err.message}`);
            }
        }

        totalCreated += batchCreated;
        totalUpdated += batchUpdated;
        offset += BATCH_SIZE;
        console.log(`   Batch ${Math.ceil(offset / BATCH_SIZE)}: +${batchCreated} created, ${batchUpdated} updated`);
    }

    // Second pass: set parent relationships
    console.log('   Setting parent relationships...');
    const allPartners = await executeKW(object, uid, 'res.partner', 'search_read',
        [[['parent_id', '!=', false]]],
        { fields: ['id', 'parent_id'] }
    );

    for (const p of allPartners) {
        if (p.parent_id && Array.isArray(p.parent_id)) {
            const child = await prisma.partner.findFirst({ where: { odooId: p.id } });
            const parent = await prisma.partner.findFirst({ where: { odooId: p.parent_id[0] } });
            if (child && parent) {
                await prisma.partner.update({
                    where: { id: child.id },
                    data: { parentId: parent.id }
                });
            }
        }
    }

    console.log(`   ✅ Partners: ${totalCreated} created, ${totalUpdated} updated (total: ${totalCreated + totalUpdated})`);
}

// ===================== 2. Sync Sale Orders =====================

async function syncSaleOrders(object: any, uid: number) {
    console.log('\n🛒 Syncing Sale Orders...');

    const totalCount = await executeKW(object, uid, 'sale.order', 'search_count', [[]]);
    console.log(`   Total sale orders in Odoo: ${totalCount}`);

    const BATCH_SIZE = 50;
    let offset = 0;
    let totalCreated = 0, totalUpdated = 0;

    while (offset < totalCount) {
        const orders = await executeKW(object, uid, 'sale.order', 'search_read',
            [[]],
            {
                fields: [
                    'id', 'name', 'partner_id', 'state',
                    'date_order', 'validity_date',
                    'amount_untaxed', 'amount_tax', 'amount_total',
                    'note', 'invoice_status',
                    'order_line',
                ],
                offset: offset,
                limit: BATCH_SIZE,
                order: 'id asc'
            }
        );

        console.log(`   Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${offset + 1}-${offset + orders.length} of ${totalCount})...`);

        let batchCreated = 0, batchUpdated = 0;

        for (const order of orders) {
            try {
                // Find partner
                let partnerId: string | null = null;
                if (order.partner_id && Array.isArray(order.partner_id)) {
                    const partner = await prisma.partner.findFirst({ where: { odooId: order.partner_id[0] } });
                    if (partner) partnerId = partner.id;
                }

                if (!partnerId) {
                    // Create a minimal partner if not found
                    const partnerName = order.partner_id && Array.isArray(order.partner_id) ? order.partner_id[1] : 'Unknown';
                    const newPartner = await prisma.partner.create({
                        data: { name: partnerName, companyId: COMPANY_ID }
                    });
                    partnerId = newPartner.id;
                }

                // Map Odoo state to our status
                let status = 'draft';
                switch (order.state) {
                    case 'draft': status = 'draft'; break;
                    case 'sent': status = 'sent'; break;
                    case 'sale': status = 'sale'; break;
                    case 'done': status = 'done'; break;
                    case 'cancel': status = 'cancel'; break;
                    default: status = order.state || 'draft';
                }

                const data: any = {
                    name: order.name,
                    partnerId: partnerId,
                    status: status,
                    dateOrder: order.date_order ? new Date(order.date_order) : new Date(),
                    validityDate: order.validity_date ? new Date(order.validity_date) : null,
                    amountUntaxed: order.amount_untaxed || 0,
                    amountTax: order.amount_tax || 0,
                    amountTotal: order.amount_total || 0,
                    note: order.note || null,
                    companyId: COMPANY_ID,
                    odooId: order.id,
                };

                const existing = await prisma.saleOrder.findFirst({
                    where: { odooId: order.id }
                });

                let saleOrderId: string;

                if (existing) {
                    await prisma.saleOrder.update({
                        where: { id: existing.id },
                        data
                    });
                    saleOrderId = existing.id;
                    batchUpdated++;
                } else {
                    const created = await prisma.saleOrder.create({ data });
                    saleOrderId = created.id;
                    batchCreated++;
                }

                // Sync order lines
                if (order.order_line && order.order_line.length > 0) {
                    const lines = await executeKW(object, uid, 'sale.order.line', 'read',
                        [order.order_line],
                        { fields: ['id', 'name', 'product_id', 'product_uom_qty', 'price_unit', 'price_subtotal', 'qty_delivered', 'qty_invoiced', 'discount', 'product_uom'] }
                    );

                    // Delete existing lines and recreate
                    await prisma.saleOrderLine.deleteMany({ where: { orderId: saleOrderId } });

                    for (const line of lines) {
                        let productId: string | null = null;
                        if (line.product_id && Array.isArray(line.product_id)) {
                            const product = await prisma.product.findFirst({ where: { odooId: line.product_id[0] } });
                            if (product) productId = product.id;
                        }

                        await prisma.saleOrderLine.create({
                            data: {
                                orderId: saleOrderId,
                                productId: productId,
                                name: line.name || null,
                                quantity: line.product_uom_qty || 0,
                                priceUnit: line.price_unit || 0,
                                priceSubtotal: line.price_subtotal || 0,
                                qtyDelivered: line.qty_delivered || 0,
                                qtyInvoiced: line.qty_invoiced || 0,
                                discount1: line.discount || 0,
                                unitName: line.product_uom && Array.isArray(line.product_uom) ? line.product_uom[1] : null,
                            }
                        });
                    }
                }

            } catch (err: any) {
                console.error(`   ⚠️ Error syncing SO "${order.name}" (ID: ${order.id}): ${err.message}`);
            }
        }

        totalCreated += batchCreated;
        totalUpdated += batchUpdated;
        offset += BATCH_SIZE;
        console.log(`   ✅ Batch done: ${batchCreated} created, ${batchUpdated} updated`);
    }

    console.log(`\n🛒 Sale Orders sync complete: ${totalCreated} created, ${totalUpdated} updated`);
}

// ===================== 3. Sync Purchase Orders =====================

async function syncPurchaseOrders(object: any, uid: number) {
    console.log('\n🛍️ Syncing Purchase Orders...');

    const totalCount = await executeKW(object, uid, 'purchase.order', 'search_count', [[]]);
    console.log(`   Total purchase orders in Odoo: ${totalCount}`);

    const BATCH_SIZE = 50;
    let offset = 0;
    let totalCreated = 0, totalUpdated = 0;

    while (offset < totalCount) {
        const orders = await executeKW(object, uid, 'purchase.order', 'search_read',
            [[]],
            {
                fields: [
                    'id', 'name', 'partner_id', 'state',
                    'date_order',
                    'amount_untaxed', 'amount_tax', 'amount_total',
                    'notes', 'invoice_status',
                    'order_line',
                ],
                offset: offset,
                limit: BATCH_SIZE,
                order: 'id asc'
            }
        );

        console.log(`   Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${offset + 1}-${offset + orders.length} of ${totalCount})...`);

        let batchCreated = 0, batchUpdated = 0;

        for (const order of orders) {
            try {
                // Find partner
                let partnerId: string | null = null;
                if (order.partner_id && Array.isArray(order.partner_id)) {
                    const partner = await prisma.partner.findFirst({ where: { odooId: order.partner_id[0] } });
                    if (partner) partnerId = partner.id;
                }

                if (!partnerId) {
                    const partnerName = order.partner_id && Array.isArray(order.partner_id) ? order.partner_id[1] : 'Unknown';
                    const newPartner = await prisma.partner.create({
                        data: { name: partnerName, isVendor: true, companyId: COMPANY_ID }
                    });
                    partnerId = newPartner.id;
                }

                let status = 'draft';
                switch (order.state) {
                    case 'draft': status = 'draft'; break;
                    case 'sent': status = 'sent'; break;
                    case 'purchase': status = 'purchase'; break;
                    case 'done': status = 'done'; break;
                    case 'cancel': status = 'cancel'; break;
                    default: status = order.state || 'draft';
                }

                const data: any = {
                    name: order.name,
                    partnerId: partnerId,
                    status: status,
                    dateOrder: order.date_order ? new Date(order.date_order) : new Date(),
                    amountUntaxed: order.amount_untaxed || 0,
                    amountTax: order.amount_tax || 0,
                    amountTotal: order.amount_total || 0,
                    notes: order.notes || null,
                    companyId: COMPANY_ID,
                    odooId: order.id,
                };

                const existing = await prisma.purchaseOrder.findFirst({
                    where: { odooId: order.id }
                });

                let purchaseOrderId: string;

                if (existing) {
                    await prisma.purchaseOrder.update({
                        where: { id: existing.id },
                        data
                    });
                    purchaseOrderId = existing.id;
                    batchUpdated++;
                } else {
                    const created = await prisma.purchaseOrder.create({ data });
                    purchaseOrderId = created.id;
                    batchCreated++;
                }

                // Sync order lines
                if (order.order_line && order.order_line.length > 0) {
                    const lines = await executeKW(object, uid, 'purchase.order.line', 'read',
                        [order.order_line],
                        { fields: ['id', 'name', 'product_id', 'product_qty', 'price_unit', 'price_subtotal', 'qty_received', 'qty_invoiced', 'product_uom'] }
                    );

                    // Delete existing lines and recreate
                    await prisma.purchaseOrderLine.deleteMany({ where: { orderId: purchaseOrderId } });

                    for (const line of lines) {
                        let productId: string | null = null;
                        if (line.product_id && Array.isArray(line.product_id)) {
                            const product = await prisma.product.findFirst({ where: { odooId: line.product_id[0] } });
                            if (product) productId = product.id;
                        }

                        await prisma.purchaseOrderLine.create({
                            data: {
                                orderId: purchaseOrderId,
                                productId: productId,
                                name: line.name || null,
                                quantity: line.product_qty || 0,
                                priceUnit: line.price_unit || 0,
                                priceSubtotal: line.price_subtotal || 0,
                                qtyReceived: line.qty_received || 0,
                                qtyInvoiced: line.qty_invoiced || 0,
                                unitName: line.product_uom && Array.isArray(line.product_uom) ? line.product_uom[1] : null,
                            }
                        });
                    }
                }

            } catch (err: any) {
                console.error(`   ⚠️ Error syncing PO "${order.name}" (ID: ${order.id}): ${err.message}`);
            }
        }

        totalCreated += batchCreated;
        totalUpdated += batchUpdated;
        offset += BATCH_SIZE;
        console.log(`   ✅ Batch done: ${batchCreated} created, ${batchUpdated} updated`);
    }

    console.log(`\n🛍️ Purchase Orders sync complete: ${totalCreated} created, ${totalUpdated} updated`);
}

// ===================== 4. Sync Invoices =====================

async function syncInvoices(object: any, uid: number) {
    console.log('\n🧾 Syncing Invoices...');

    // Only sync actual invoices and bills (not journal entries)
    const domain = [['move_type', 'in', ['out_invoice', 'in_invoice', 'out_refund', 'in_refund']]];
    const totalCount = await executeKW(object, uid, 'account.move', 'search_count', [domain]);
    console.log(`   Total invoices in Odoo: ${totalCount}`);

    const BATCH_SIZE = 50;
    let offset = 0;
    let totalCreated = 0, totalUpdated = 0;

    while (offset < totalCount) {
        const invoices = await executeKW(object, uid, 'account.move', 'search_read',
            [domain],
            {
                fields: [
                    'id', 'name', 'move_type', 'partner_id', 'state',
                    'invoice_date', 'invoice_date_due',
                    'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual',
                    'narration', 'invoice_origin', 'ref',
                    'invoice_line_ids',
                ],
                offset: offset,
                limit: BATCH_SIZE,
                order: 'id asc'
            }
        );

        console.log(`   Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${offset + 1}-${offset + invoices.length} of ${totalCount})...`);

        let batchCreated = 0, batchUpdated = 0;

        for (const inv of invoices) {
            try {
                // Find partner
                let partnerId: string | null = null;
                if (inv.partner_id && Array.isArray(inv.partner_id)) {
                    const partner = await prisma.partner.findFirst({ where: { odooId: inv.partner_id[0] } });
                    if (partner) partnerId = partner.id;
                }

                if (!partnerId) {
                    const partnerName = inv.partner_id && Array.isArray(inv.partner_id) ? inv.partner_id[1] : 'Unknown';
                    const newPartner = await prisma.partner.create({
                        data: { name: partnerName, companyId: COMPANY_ID }
                    });
                    partnerId = newPartner.id;
                }

                // Map state
                let state = 'draft';
                switch (inv.state) {
                    case 'draft': state = 'draft'; break;
                    case 'posted': state = 'posted'; break;
                    case 'cancel': state = 'cancel'; break;
                    default: state = inv.state || 'draft';
                }

                // Check if fully paid
                if (state === 'posted' && (inv.amount_residual === 0 || inv.amount_residual === 0.0)) {
                    state = 'paid';
                }

                // Map move_type to our type
                let invoiceType = 'out_invoice';
                switch (inv.move_type) {
                    case 'out_invoice': invoiceType = 'out_invoice'; break;
                    case 'in_invoice': invoiceType = 'in_invoice'; break;
                    case 'out_refund': invoiceType = 'out_refund'; break;
                    case 'in_refund': invoiceType = 'in_refund'; break;
                }

                // Link to sale/purchase order if origin exists
                let saleOrderId: string | null = null;
                let purchaseOrderId: string | null = null;
                if (inv.invoice_origin) {
                    if (inv.invoice_origin.startsWith('S')) {
                        const so = await prisma.saleOrder.findFirst({ where: { name: inv.invoice_origin } });
                        if (so) saleOrderId = so.id;
                    } else if (inv.invoice_origin.startsWith('P')) {
                        const po = await prisma.purchaseOrder.findFirst({ where: { name: inv.invoice_origin } });
                        if (po) purchaseOrderId = po.id;
                    }
                }

                const data: any = {
                    name: inv.name || `INV-${inv.id}`,
                    type: invoiceType,
                    partnerId: partnerId,
                    state: state,
                    dateInvoice: inv.invoice_date ? new Date(inv.invoice_date) : new Date(),
                    dateDue: inv.invoice_date_due ? new Date(inv.invoice_date_due) : null,
                    amountUntaxed: inv.amount_untaxed || 0,
                    amountTax: inv.amount_tax || 0,
                    amountTotal: inv.amount_total || 0,
                    amountResidual: inv.amount_residual || 0,
                    narration: inv.narration || null,
                    invoiceOrigin: inv.invoice_origin || null,
                    saleOrderId: saleOrderId,
                    purchaseOrderId: purchaseOrderId,
                    companyId: COMPANY_ID,
                    odooId: inv.id,
                };

                const existing = await prisma.invoice.findFirst({
                    where: { odooId: inv.id }
                });

                let invoiceId: string;

                if (existing) {
                    await prisma.invoice.update({
                        where: { id: existing.id },
                        data
                    });
                    invoiceId = existing.id;
                    batchUpdated++;
                } else {
                    const created = await prisma.invoice.create({ data });
                    invoiceId = created.id;
                    batchCreated++;
                }

                // Sync invoice lines
                if (inv.invoice_line_ids && inv.invoice_line_ids.length > 0) {
                    try {
                        const lines = await executeKW(object, uid, 'account.move.line', 'read',
                            [inv.invoice_line_ids],
                            { fields: ['id', 'name', 'product_id', 'quantity', 'price_unit', 'price_subtotal', 'discount', 'product_uom_id'] }
                        );

                        // Delete existing lines and recreate
                        await prisma.invoiceLine.deleteMany({ where: { invoiceId: invoiceId } });

                        for (const line of lines) {
                            // Skip non-product lines (tax lines, totals, etc.)
                            if (!line.name && !line.product_id) continue;

                            let productId: string | null = null;
                            if (line.product_id && Array.isArray(line.product_id)) {
                                const product = await prisma.product.findFirst({ where: { odooId: line.product_id[0] } });
                                if (product) productId = product.id;
                            }

                            await prisma.invoiceLine.create({
                                data: {
                                    invoiceId: invoiceId,
                                    productId: productId,
                                    name: line.name || null,
                                    quantity: line.quantity || 0,
                                    priceUnit: line.price_unit || 0,
                                    priceSubtotal: line.price_subtotal || 0,
                                    discount1: line.discount || 0,
                                    unitName: line.product_uom_id && Array.isArray(line.product_uom_id) ? line.product_uom_id[1] : null,
                                }
                            });
                        }
                    } catch (lineErr: any) {
                        // Some invoice lines may fail to read - skip them
                        console.error(`   ⚠️ Error reading lines for ${inv.name}: ${lineErr.message?.substring(0, 80)}`);
                    }
                }

            } catch (err: any) {
                console.error(`   ⚠️ Error syncing invoice "${inv.name}" (ID: ${inv.id}): ${err.message}`);
            }
        }

        totalCreated += batchCreated;
        totalUpdated += batchUpdated;
        offset += BATCH_SIZE;
        console.log(`   ✅ Batch done: ${batchCreated} created, ${batchUpdated} updated`);
    }

    console.log(`\n🧾 Invoices sync complete: ${totalCreated} created, ${totalUpdated} updated`);
}

// ===================== Main =====================

async function main() {
    console.log('🚀 Starting Odoo Full Sync (Partners → Sales → Purchases → Invoices)');
    console.log(`   Server: ${ODOO_CONFIG.url}`);
    console.log(`   Database: ${ODOO_CONFIG.db}`);
    console.log(`   Company ID: ${COMPANY_ID}`);
    console.log('');

    // Ensure company exists
    let company = await prisma.company.findUnique({ where: { id: COMPANY_ID } });
    if (!company) {
        company = await prisma.company.create({
            data: { id: COMPANY_ID, name: 'My Real Business', currency: 'EGP' }
        });
        console.log('   Created company: real_company_id');
    }

    try {
        const { object, uid } = await authenticate();

        // Step 1: Partners (needed first - other models reference them)
        await syncPartners(object, uid);

        // Step 2: Sales Orders + Lines
        await syncSaleOrders(object, uid);

        // Step 3: Purchase Orders + Lines
        await syncPurchaseOrders(object, uid);

        // Step 4: Invoices + Lines (references sales/purchases)
        await syncInvoices(object, uid);

        console.log('\n🎉 Full sync completed successfully!');
    } catch (error: any) {
        console.error('\n❌ Sync failed:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
