// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import xmlrpc from 'xmlrpc';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const CONFIG = {
    url: 'http://161.97.141.100:10016',
    db: 'hosien_alnagar',
    username: 'togetheramr123@mail.com',
    password: '1993'
};

async function getOdooClient() {
    const urlParts = new URL(CONFIG.url);
    const clientOptions = {
        host: urlParts.hostname,
        port: urlParts.port ? parseInt(urlParts.port) : (urlParts.protocol === 'https:' ? 443 : 80),
        path: '/xmlrpc/2/common',
    };

    const createClient = urlParts.protocol === 'https:' ? xmlrpc.createSecureClient : xmlrpc.createClient;
    const common = createClient(clientOptions);

    // Authenticate
    const uid = await new Promise((resolve, reject) => {
        common.methodCall('authenticate', [CONFIG.db, CONFIG.username, CONFIG.password, {}], (error, value) => {
            if (error) reject(error);
            else resolve(value);
        });
    });

    const objectClientOptions = { ...clientOptions, path: '/xmlrpc/2/object' };
    const object = createClient(objectClientOptions);

    return { object, uid };
}

async function sync() {
    console.log('🚀 Starting Odoo Sync...');
    try {
        const { object, uid } = await getOdooClient();
        console.log(`✅ Authenticated with Odoo (UID: ${uid})`);

        // Get Main Company
        const company = await prisma.company.findFirst();
        if (!company) throw new Error("No company found in DB");

        // --- 1. Sync Partners ---
        console.log('👥 Syncing Partners...');
        const partners = await new Promise<any[]>((resolve, reject) => {
            // @ts-ignore
            object.methodCall('execute_kw', [
                CONFIG.db, uid, CONFIG.password,
                'res.partner', 'search_read',
                [['|', ['customer_rank', '>', 0], ['supplier_rank', '>', 0]]],
                { fields: ['id', 'name', 'email', 'phone', 'vat', 'street', 'customer_rank', 'supplier_rank'] }
            ], (error, value) => {
                if (error) reject(error);
                else resolve(value);
            });
        });
        console.log(`found ${partners.length} partners.`);
        for (const p of partners) {
            let existing = await prisma.partner.findFirst({ where: { odooId: p.id } });

            // If not found by ID, check by Email to avoid unique constraint errors
            if (!existing && p.email) {
                existing = await prisma.partner.findFirst({ where: { email: p.email } });
                if (existing) {
                    // Update the existing partner with the Odoo ID
                    await prisma.partner.update({
                        where: { id: existing.id },
                        data: { odooId: p.id }
                    });
                    continue;
                }
            }

            if (existing) continue;

            try {
                await prisma.partner.create({
                    data: {
                        name: p.name,
                        email: p.email || undefined,
                        phone: p.phone || undefined,
                        address: p.street || undefined,
                        vat: p.vat || undefined,
                        isCustomer: p.customer_rank > 0,
                        isVendor: p.supplier_rank > 0,
                        odooId: p.id,
                        companyId: company.id
                    }
                });
            } catch (e) {
                console.warn(`⚠️ Skipped Partner ${p.name} (ID: ${p.id}): ${e.message}`);
            }
        }

        // --- 2. Sync Products ---
        console.log('📦 Syncing Products...');
        const products = await new Promise<any[]>((resolve, reject) => {
            // @ts-ignore
            object.methodCall('execute_kw', [
                CONFIG.db, uid, CONFIG.password,
                'product.product', 'search_read',
                [[['active', '=', true]]],
                { fields: ['id', 'name', 'list_price', 'standard_price', 'default_code', 'uom_id'] }
            ], (error, value) => {
                if (error) reject(error);
                else resolve(value);
            });
        });

        console.log(`found ${products.length} products in Odoo.`);
        let prodCount = 0;

        for (const p of products) {
            let existing = await prisma.product.findUnique({ where: { odooId: p.id } });
            if (!existing && p.default_code) {
                existing = await prisma.product.findUnique({ where: { sku: p.default_code } });
            }

            const data = {
                name: p.name,
                salePrice: p.list_price,
                costPrice: p.standard_price,
                sku: p.default_code || undefined,
                odooId: p.id,
                companyId: company.id,
                uom: p.uom_id ? String(p.uom_id[1]) : 'Units'
            };

            if (existing) {
                await prisma.product.update({ where: { id: existing.id }, data: { salePrice: p.list_price, costPrice: p.standard_price, odooId: p.id } });
            } else {
                await prisma.product.create({
                    data: {
                        ...data,
                        type: 'storable',
                        description: `Imported from Odoo [ID: ${p.id}]`
                    }
                });
            }
            prodCount++;
        }
        console.log(`✅ Synced ${prodCount} Products.`);

        // ---------------------------------------------------------
        // --- 3. Sync Sales Orders ---
        console.log('📈 Syncing Sales Orders...');
        const sales = await new Promise<any[]>((resolve, reject) => {
            // @ts-ignore
            object.methodCall('execute_kw', [
                CONFIG.db, uid, CONFIG.password,
                'sale.order', 'search_read',
                [], // Fetch all
                { fields: ['id', 'name', 'partner_id', 'date_order', 'state', 'amount_total', 'amount_untaxed', 'amount_tax', 'order_line'] }
            ], (error, value) => {
                if (error) reject(error);
                else resolve(value);
            });
        });
        console.log(`found ${sales.length} sales.`);

        for (const s of sales) {
            const existing = await prisma.saleOrder.findUnique({ where: { odooId: s.id } });
            if (existing) continue;

            const partner = await prisma.partner.findFirst({ where: { odooId: s.partner_id[0] } });
            if (!partner) continue; // Skip if partner missing (shouldn't happen if Step 1 ran)

            // Fetch lines
            const lines = await new Promise<any[]>((resolve, reject) => {
                // @ts-ignore
                object.methodCall('execute_kw', [
                    CONFIG.db, uid, CONFIG.password,
                    'sale.order.line', 'read',
                    [s.order_line],
                    { fields: ['product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal', 'discount'] }
                ], (error, value) => {
                    if (error) reject(error);
                    else resolve(value);
                });
            });

            const linesData = [];
            for (const l of lines) {
                let productId = null;
                if (l.product_id) {
                    const p = await prisma.product.findUnique({ where: { odooId: l.product_id[0] } });
                    if (p) productId = p.id;
                }
                linesData.push({
                    productId,
                    name: l.name,
                    quantity: l.product_uom_qty,
                    priceUnit: l.price_unit,
                    priceSubtotal: l.price_subtotal,
                    discount1: l.discount
                });
            }

            await prisma.saleOrder.create({
                data: {
                    odooId: s.id,
                    name: s.name,
                    partnerId: partner.id,
                    companyId: company.id,
                    dateOrder: new Date(s.date_order),
                    status: s.state === 'sale' || s.state === 'done' ? 'sale' : 'draft',
                    amountTotal: s.amount_total,
                    amountUntaxed: s.amount_untaxed,
                    amountTax: s.amount_tax,
                    lines: { create: linesData }
                }
            });
        }

        // --- 4. Sync Purchase Orders ---
        console.log('🛒 Syncing Purchase Orders...');
        const purchases = await new Promise<any[]>((resolve, reject) => {
            // @ts-ignore
            object.methodCall('execute_kw', [
                CONFIG.db, uid, CONFIG.password,
                'purchase.order', 'search_read',
                [],
                { fields: ['id', 'name', 'partner_id', 'date_order', 'state', 'amount_total', 'amount_untaxed', 'amount_tax', 'order_line'] }
            ], (error, value) => {
                if (error) reject(error);
                else resolve(value);
            });
        });
        console.log(`found ${purchases.length} purchases.`);

        for (const p of purchases) {
            const existing = await prisma.purchaseOrder.findUnique({ where: { odooId: p.id } });
            if (existing) continue;

            const partner = await prisma.partner.findFirst({ where: { odooId: p.partner_id[0] } });
            if (!partner) continue;

            // Fetch lines
            const lines = await new Promise<any[]>((resolve, reject) => {
                // @ts-ignore
                object.methodCall('execute_kw', [
                    CONFIG.db, uid, CONFIG.password,
                    'purchase.order.line', 'read',
                    [p.order_line],
                    { fields: ['product_id', 'name', 'product_qty', 'price_unit', 'price_subtotal'] } // Purchases usually don't have discount by default in base
                ], (error, value) => {
                    if (error) reject(error);
                    else resolve(value);
                });
            });

            const linesData = [];
            for (const l of lines) {
                let productId = null;
                if (l.product_id) {
                    const prod = await prisma.product.findUnique({ where: { odooId: l.product_id[0] } });
                    if (prod) productId = prod.id;
                }
                linesData.push({
                    productId,
                    name: l.name,
                    quantity: l.product_qty,
                    priceUnit: l.price_unit,
                    priceSubtotal: l.price_subtotal,
                });
            }

            await prisma.purchaseOrder.create({
                data: {
                    odooId: p.id,
                    name: p.name,
                    partnerId: partner.id,
                    companyId: company.id,
                    dateOrder: new Date(p.date_order),
                    status: p.state === 'purchase' || p.state === 'done' ? 'purchase' : 'draft',
                    amountTotal: p.amount_total,
                    amountUntaxed: p.amount_untaxed,
                    amountTax: p.amount_tax,
                    lines: { create: linesData }
                }
            });
        }

        // --- 5. Sync Invoices ---
        console.log('📄 Syncing Invoices...');
        const invoices = await new Promise<any[]>((resolve, reject) => {
            // @ts-ignore
            object.methodCall('execute_kw', [
                CONFIG.db, uid, CONFIG.password,
                'account.move', 'search_read',
                // Filter for Customer Invoices, Vendor Bills, and Refunds
                [[['move_type', 'in', ['out_invoice', 'in_invoice', 'in_refund', 'out_refund']], ['state', '=', 'posted']]],
                { fields: ['id', 'name', 'invoice_date', 'partner_id', 'amount_total', 'amount_untaxed', 'amount_tax', 'invoice_line_ids', 'move_type', 'state'], limit: 200 }
            ], (error, value) => {
                if (error) reject(error);
                else resolve(value);
            });
        });

        console.log(`found ${invoices.length} invoices in Odoo.`);
        let invCount = 0;

        for (const inv of invoices) {
            const existing = await prisma.invoice.findUnique({ where: { odooId: inv.id } });
            if (existing) continue;

            const partnerOdooId = inv.partner_id[0];
            const partnerName = inv.partner_id[1];

            let partner = await prisma.partner.findFirst({ where: { odooId: partnerOdooId } });
            if (!partner) {
                partner = await prisma.partner.findFirst({ where: { name: partnerName } });
                if (partner) {
                    await prisma.partner.update({ where: { id: partner.id }, data: { odooId: partnerOdooId } });
                } else {
                    partner = await prisma.partner.create({
                        data: {
                            name: partnerName,
                            odooId: partnerOdooId,
                            companyId: company.id,
                            isCustomer: true
                        }
                    });
                }
            }

            // Lines
            const lineIds = inv.invoice_line_ids;
            let linesData = [];
            if (lineIds.length > 0) {
                const lines = await new Promise<any[]>((resolve, reject) => {
                    // @ts-ignore
                    object.methodCall('execute_kw', [
                        CONFIG.db, uid, CONFIG.password,
                        'account.move.line', 'read',
                        [lineIds],
                        { fields: ['product_id', 'name', 'quantity', 'price_unit', 'price_subtotal', 'discount'] }
                    ], (error, value) => {
                        if (error) reject(error);
                        else resolve(value);
                    });
                });

                for (const line of lines) {
                    let productId = null;
                    if (Array.isArray(line.product_id)) {
                        const pOdooId = line.product_id[0];
                        const p = await prisma.product.findUnique({ where: { odooId: pOdooId } });
                        if (p) productId = p.id;
                    }

                    linesData.push({
                        productId,
                        name: line.name,
                        quantity: line.quantity,
                        priceUnit: line.price_unit,
                        priceSubtotal: line.price_subtotal,
                        discount1: line.discount
                    });
                }
            }

            await prisma.invoice.create({
                data: {
                    odooId: inv.id,
                    name: inv.name,
                    type: inv.move_type,
                    state: inv.state,
                    partnerId: partner.id,
                    dateInvoice: new Date(inv.invoice_date),
                    amountTotal: inv.amount_total,
                    amountTax: inv.amount_tax,
                    amountUntaxed: inv.amount_untaxed,
                    companyId: company.id,
                    lines: {
                        create: linesData
                    }
                }
            });
            invCount++;
        }
        console.log(`✅ Synced ${invCount} Invoices.`);

        // ---------------------------------------------------------
        // --- 6. Sync Locations ---
        console.log('🏭 Syncing Locations...');
        const locations = await new Promise<any[]>((resolve, reject) => {
            // @ts-ignore
            object.methodCall('execute_kw', [
                CONFIG.db, uid, CONFIG.password,
                'stock.location', 'search_read',
                [['usage', 'in', ['internal', 'supplier', 'customer', 'inventory']]],
                { fields: ['id', 'name', 'usage', 'location_id'] }
            ], (error, value) => {
                if (error) reject(error);
                else resolve(value);
            });
        });

        // Helper to find/create warehouse first if needed, but for now we map to existing or create raw
        // Strategy: Just create the locations.
        const warehouse = await prisma.warehouse.findFirst({ where: { companyId: company.id } });
        if (!warehouse) {
            // Should exist from seed, but just in case
        }

        for (const loc of locations) {
            const existing = await prisma.location.findFirst({ where: { name: loc.name } }); // Name match for now as we didn't add odooId to Location yet
            if (existing) continue;

            await prisma.location.create({
                data: {
                    name: loc.name,
                    type: loc.usage === 'supplier' ? 'supplier' : loc.usage === 'customer' ? 'customer' : 'internal',
                    warehouseId: warehouse?.id || '', // Fallback
                    // No odooId on Location model yet, so we just rely on name matching for linking
                }
            });
        }
        console.log(`✅ Synced ${locations.length} Locations.`);

        // --- 7. Sync Stock Pickings ---
        console.log('🚚 Syncing Inventory Transfers (Pickings)...');
        const pickings = await new Promise<any[]>((resolve, reject) => {
            // @ts-ignore
            object.methodCall('execute_kw', [
                CONFIG.db, uid, CONFIG.password,
                'stock.picking', 'search_read',
                [['state', 'in', ['assigned', 'done']]],
                { fields: ['id', 'name', 'origin', 'state', 'scheduled_date', 'date_done', 'partner_id'] }
            ], (error, value) => {
                if (error) reject(error);
                else resolve(value);
            });
        });
        console.log(`found ${pickings.length} pickings.`);

        for (const p of pickings) {
            const existing = await prisma.stockPicking.findUnique({ where: { odooId: p.id } });
            if (existing) continue;

            const partner = p.partner_id ? await prisma.partner.findFirst({ where: { odooId: p.partner_id[0] } }) : null;

            // Fetch Moves
            const moves = await new Promise<any[]>((resolve, reject) => {
                // @ts-ignore
                object.methodCall('execute_kw', [
                    CONFIG.db, uid, CONFIG.password,
                    'stock.move', 'search_read',
                    [['picking_id', '=', p.id]],
                    { fields: ['product_id', 'name', 'product_uom_qty', 'quantity_done', 'location_id', 'location_dest_id'] }
                ], (error, value) => {
                    if (error) reject(error);
                    else resolve(value);
                });
            });

            const movesData = [];
            for (const m of moves) {
                const prod = m.product_id ? await prisma.product.findUnique({ where: { odooId: m.product_id[0] } }) : null;
                if (!prod) continue;

                // Find locations by name (best effort since we don't have odooId on Location)
                const locSrc = await prisma.location.findFirst({ where: { name: m.location_id[1] } });
                const locDest = await prisma.location.findFirst({ where: { name: m.location_dest_id[1] } });

                // Fallback to defaults
                const defaultLoc = await prisma.location.findFirst({ where: { name: 'WH/Stock' } });

                movesData.push({
                    productId: prod.id,
                    name: m.name,
                    quantity: m.product_uom_qty,
                    quantityDone: m.quantity_done,
                    sourceLocationId: locSrc?.id || defaultLoc?.id || '',
                    destLocationId: locDest?.id || defaultLoc?.id || '',
                    companyId: company.id,
                    unitName: 'Units'
                });
            }

            await prisma.stockPicking.create({
                data: {
                    odooId: p.id,
                    name: p.name,
                    origin: p.origin || '',
                    status: p.state,
                    pickingType: pickingType,
                    scheduledDate: new Date(p.scheduled_date || Date.now()),
                    dateDone: p.date_done ? new Date(p.date_done) : undefined,
                    partnerId: partner?.id,
                    companyId: company.id,
                    moves: { create: movesData }
                }
            });
        }
        console.log(`✅ Synced ${pickings.length} Pickings.`);

    } catch (e) {
        console.error("❌ Sync Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
