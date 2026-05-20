const xmlrpc = require('xmlrpc');
const fs = require('fs');

const HOST = '161.97.141.100';
const PORT = 10016;
const DB = 'hosien_alnagar';
const USER = 'togetheramr123@mail.com';
const PASS = '1993';

const common = xmlrpc.createClient({ host: HOST, port: PORT, path: '/xmlrpc/2/common' });
const object = xmlrpc.createClient({ host: HOST, port: PORT, path: '/xmlrpc/2/object' });

console.log(`--- Connecting to Odoo Full Feature Extraction (${DB}) ---`);

common.methodCall('authenticate', [DB, USER, PASS, {}], async (err, uid) => {
    if (err || !uid) {
        console.error('Login Failed:', err || 'Invalid UID');
        return;
    }

    console.log(`✅ Logged in: UID ${uid}`);

    const models = [
        { odoo: 'stock.picking', file: 'pickings.json', fields: ['name', 'origin', 'state', 'scheduled_date', 'date_done', 'location_id', 'location_dest_id', 'partner_id'] },
        { odoo: 'stock.move', file: 'stock_moves.json', fields: ['picking_id', 'product_id', 'name', 'product_uom_qty', 'quantity_done', 'sh_sec_qty', 'sh_sec_uom', 'state'] },
        { odoo: 'res.partner', file: 'partners.json', fields: ['name', 'email', 'phone', 'is_company'] },
        { odoo: 'product.product', file: 'products.json', fields: ['name', 'list_price', 'standard_price', 'barcode', 'default_code'] },
        { odoo: 'sale.order', file: 'sales.json', fields: ['name', 'partner_id', 'date_order', 'state', 'amount_untaxed', 'amount_tax', 'amount_total'] },
        { odoo: 'sale.order.line', file: 'sale_lines.json', fields: ['order_id', 'product_id', 'name', 'product_uom_qty', 'price_unit', 'price_subtotal', 'discount_one', 'discount_two', 'sh_sec_qty', 'sh_sec_uom'] },
        { odoo: 'purchase.order', file: 'purchases.json', fields: ['name', 'partner_id', 'date_order', 'state', 'amount_untaxed', 'amount_tax', 'amount_total'] },
        { odoo: 'purchase.order.line', file: 'purchase_lines.json', fields: ['order_id', 'product_id', 'name', 'product_qty', 'price_unit', 'price_subtotal', 'discount_one', 'discount_two', 'sh_sec_qty', 'sh_sec_uom'] },
        { odoo: 'account.move', file: 'invoices.json', fields: ['name', 'partner_id', 'invoice_date', 'move_type', 'state', 'amount_untaxed', 'amount_tax', 'amount_total'] },
        { odoo: 'account.move.line', file: 'invoice_lines.json', fields: ['move_id', 'product_id', 'name', 'quantity', 'price_unit', 'price_subtotal', 'display_type', 'discount', 'sh_sec_qty', 'sh_sec_uom'] }
    ];

    for (const m of models) {
        console.log(`Fetching ${m.odoo}...`);
        await new Promise((resolve) => {
            object.methodCall('execute_kw', [DB, uid, PASS, m.odoo, 'search_read', [[]], { fields: m.fields }], (err, data) => {
                if (err) {
                    console.error(`Error fetching ${m.odoo}:`, err.message);
                } else {
                    console.log(`✅ Fetched ${data.length} records for ${m.odoo}`);
                    fs.writeFileSync(`./scripts/import/odoo_${m.file}`, JSON.stringify(data, null, 2));
                }
                resolve();
            });
        });
    }
    console.log('--- Full Feature Extraction Complete ---');
});
