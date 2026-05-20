const fs = require('fs');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');

const db = new Database('./dev.db');
db.pragma('foreign_keys = OFF');
db.pragma('journal_mode = WAL');
db.pragma('synchronous = OFF');

const partnerMap = new Map();
const productMap = new Map();
const pickingMap = new Map();

function getJson(file) {
    const path = `./scripts/import/odoo_${file}`;
    if (!fs.existsSync(path)) return [];
    console.log(`Loading ${file}...`);
    return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function sqlVal(val) {
    if (val === false || val === undefined) return null;
    return val;
}

function groupBy(arr, keyGetter) {
    const map = new Map();
    arr.forEach((item) => {
        const key = keyGetter(item);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    });
    return map;
}

async function start() {
    try {
        console.log('Clearing old data...');
        db.prepare('DELETE FROM StockMove').run();
        db.prepare('DELETE FROM StockPicking').run();
        db.prepare('DELETE FROM InvoiceLine').run();
        db.prepare('DELETE FROM Invoice').run();
        db.prepare('DELETE FROM PurchaseOrderLine').run();
        db.prepare('DELETE FROM PurchaseOrder').run();
        db.prepare('DELETE FROM SaleOrderLine').run();
        db.prepare('DELETE FROM SaleOrder').run();
        // Partners and Products use ON CONFLICT, so we can keep them or clear them.
        // Let's clear lines to be safe.

        // 1. Partners
        const partners = getJson('partners.json');
        const pInsert = db.prepare('INSERT INTO Partner (id, name, email, phone, isCustomer, isVendor, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET name=excluded.name');
        db.transaction(() => {
            for (const p of partners) {
                const uuid = uuidv4();
                const email = p.email || `p_${p.id}@noemail.com`;
                pInsert.run(uuid, sqlVal(p.name) || 'Unknown', email, sqlVal(p.phone) || '', 1, 0, new Date().toISOString());
                partnerMap.set(p.id, uuid);
            }
        })();
        console.log(`✅ Loaded ${partnerMap.size} partners.`);

        // 2. Products
        const products = getJson('products.json');
        const prInsert = db.prepare('INSERT INTO Product (id, name, barcode, salePrice, costPrice, updatedAt) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(barcode) DO UPDATE SET name=excluded.name');
        db.transaction(() => {
            for (const p of products) {
                const uuid = uuidv4();
                const barcode = p.barcode || p.default_code || `sku_${p.id}`;
                prInsert.run(uuid, sqlVal(p.name) || 'Unnamed', barcode, p.list_price || 0, p.standard_price || 0, new Date().toISOString());
                productMap.set(p.id, uuid);
            }
        })();
        console.log(`✅ Loaded ${productMap.size} products.`);

        // 3. Sales
        const sales = getJson('sales.json');
        const saleLines = getJson('sale_lines.json');
        const saleLinesMap = groupBy(saleLines, l => l.order_id ? l.order_id[0] : -1);

        const sInsert = db.prepare('INSERT INTO SaleOrder (id, name, partnerId, dateOrder, status, amountUntaxed, amountTax, amountTotal, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const slInsert = db.prepare('INSERT INTO SaleOrderLine (id, orderId, productId, name, quantity, priceUnit, priceSubtotal, discount1, discount2, unitName, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        db.transaction(() => {
            for (const s of sales) {
                const sUuid = uuidv4();
                const pId = partnerMap.get(s.partner_id ? s.partner_id[0] : -1);
                if (!pId) continue;
                sInsert.run(sUuid, s.name, pId, new Date(s.date_order).toISOString(), s.state, s.amount_untaxed || 0, s.amount_tax || 0, s.amount_total || 0, new Date().toISOString());

                const lines = saleLinesMap.get(s.id) || [];
                for (const l of lines) {
                    const prodUuid = l.product_id ? productMap.get(l.product_id[0]) : null;
                    if (!prodUuid) continue;
                    slInsert.run(uuidv4(), sUuid, prodUuid, sqlVal(l.name), l.product_uom_qty || 0, l.price_unit || 0, l.price_subtotal || 0, l.discount_one || 0, l.discount_two || 0, l.sh_sec_uom ? l.sh_sec_uom[1] : null, new Date().toISOString());
                }
            }
        })();
        console.log('✅ Imported Sales.');

        // 4. Purchases
        const purchases = getJson('purchases.json');
        const purchaseLines = getJson('purchase_lines.json');
        const purchaseLinesMap = groupBy(purchaseLines, l => l.order_id ? l.order_id[0] : -1);

        const purInsert = db.prepare('INSERT INTO PurchaseOrder (id, name, partnerId, dateOrder, status, amountUntaxed, amountTax, amountTotal, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const purlInsert = db.prepare('INSERT INTO PurchaseOrderLine (id, orderId, productId, name, quantity, priceUnit, priceSubtotal, discount1, discount2, unitName, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        db.transaction(() => {
            for (const p of purchases) {
                const pUuid = uuidv4();
                const partId = partnerMap.get(p.partner_id ? p.partner_id[0] : -1);
                if (!partId) continue;
                purInsert.run(pUuid, p.name, partId, new Date(p.date_order).toISOString(), p.state, p.amount_untaxed || 0, p.amount_tax || 0, p.amount_total || 0, new Date().toISOString());

                const lines = purchaseLinesMap.get(p.id) || [];
                for (const l of lines) {
                    const prodUuid = l.product_id ? productMap.get(l.product_id[0]) : null;
                    if (!prodUuid) continue;
                    purlInsert.run(uuidv4(), pUuid, prodUuid, sqlVal(l.name), l.product_qty || 0, l.price_unit || 0, l.price_subtotal || 0, l.discount_one || 0, l.discount_two || 0, l.sh_sec_uom ? l.sh_sec_uom[1] : null, new Date().toISOString());
                }
            }
        })();
        console.log('✅ Imported Purchases.');

        // 5. Invoices
        const invoices = getJson('invoices.json');
        const invoiceLines = getJson('invoice_lines.json');
        const invoiceLinesMap = groupBy(invoiceLines, l => l.move_id ? l.move_id[0] : -1);

        const iInsert = db.prepare('INSERT INTO Invoice (id, name, type, partnerId, dateInvoice, state, amountUntaxed, amountTax, amountTotal, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        const ilInsert = db.prepare('INSERT INTO InvoiceLine (id, invoiceId, productId, name, quantity, priceUnit, priceSubtotal, discount1, unitName, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        db.transaction(() => {
            for (const inv of invoices) {
                const iUuid = uuidv4();
                const partId = partnerMap.get(inv.partner_id ? inv.partner_id[0] : -1);
                if (!partId) continue;
                iInsert.run(iUuid, inv.name, inv.move_type, partId, new Date(inv.invoice_date || Date.now()).toISOString(), inv.state, inv.amount_untaxed || 0, inv.amount_tax || 0, inv.amount_total || 0, new Date().toISOString());

                const lines = invoiceLinesMap.get(inv.id) || [];
                for (const l of lines) {
                    if (l.display_type === 'line_section') continue;
                    const prodUuid = l.product_id ? productMap.get(l.product_id[0]) : null;
                    if (!prodUuid) continue;
                    ilInsert.run(uuidv4(), iUuid, prodUuid, sqlVal(l.name), l.quantity || 0, l.price_unit || 0, l.price_subtotal || 0, l.discount || 0, l.sh_sec_uom ? l.sh_sec_uom[1] : null, new Date().toISOString());
                }
            }
        })();
        console.log('✅ Imported Invoices.');

        // 6. Pickings
        const pickings = getJson('pickings.json');
        const stockMoves = getJson('stock_moves.json');
        const stockMovesMap = groupBy(stockMoves, m => m.picking_id ? m.picking_id[0] : -1);

        const pickInsert = db.prepare('INSERT INTO StockPicking (id, name, origin, status, scheduledDate, dateDone, partnerId, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        const moveInsert = db.prepare('INSERT INTO StockMove (id, pickingId, productId, name, quantity, quantityDone, status, secQty, secUnitName, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

        db.transaction(() => {
            for (const p of pickings) {
                const pUuid = uuidv4();
                const partId = partnerMap.get(p.partner_id ? p.partner_id[0] : -1);
                pickInsert.run(pUuid, p.name, sqlVal(p.origin), p.state, sqlVal(p.scheduled_date), sqlVal(p.date_done), partId || null, new Date().toISOString());
                pickingMap.set(p.id, pUuid);

                const moves = stockMovesMap.get(p.id) || [];
                for (const m of moves) {
                    const prodUuid = m.product_id ? productMap.get(m.product_id[0]) : null;
                    if (!prodUuid) continue;
                    moveInsert.run(uuidv4(), pUuid, prodUuid, sqlVal(m.name), m.product_uom_qty || 0, m.quantity_done || 0, m.state, m.sh_sec_qty || 0, m.sh_sec_uom ? m.sh_sec_uom[1] : null, new Date().toISOString());
                }
            }
        })();
        console.log('✅ Imported Pickings.');

        console.log('--- FINAL SUCCESS: All Odoo Data Indexed & Imported ---');
    } catch (e) {
        console.error('Import Failed:', e);
    } finally {
        db.pragma('foreign_keys = ON');
        db.close();
    }
}

start();
