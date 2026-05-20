/**
 * Deep Odoo Product Analysis v2 - Get ALL data from one product, organized by tabs
 */
import xmlrpc from 'xmlrpc';

const CFG = { url: 'http://161.97.141.100:10016', db: 'hosien_alnagar', username: 'togetheramr123@mail.com', password: '1993' };

function mkClient() {
    const u = new URL(CFG.url);
    return { create: xmlrpc.createClient, opts: { host: u.hostname, port: parseInt(u.port) || 80, path: '/xmlrpc/2/common', headers: { 'User-Agent': 'Node' } } };
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

function fmt(v: any): string {
    if (v === false || v === null) return '-';
    if (Array.isArray(v) && v.length === 2 && typeof v[1] === 'string') return v[1]; // Many2one: [id, name]
    if (Array.isArray(v)) return JSON.stringify(v);
    return String(v);
}

async function main() {
    const { obj, uid } = await auth();
    console.log('✅ Connected\n');

    // Get ONE product (no field list = Odoo returns ALL fields)
    const products = await rpc(obj, uid, 'product.template', 'search_read',
        [[['type', '=', 'product'], ['qty_available', '>', 0]]],
        { limit: 1, order: 'id desc' }
    );

    if (!products || products.length === 0) { console.log('No product found'); return; }
    const p = products[0];

    console.log('═══════════════════════════════════════');
    console.log('   📦 PRODUCT: ' + p.name);
    console.log('═══════════════════════════════════════');

    // Define tabs just like Odoo's product form
    const tabs: Record<string, string[]> = {
        'HEADER (الرأس)': ['name', 'default_code', 'categ_id', 'type', 'detailed_type', 'sale_ok', 'purchase_ok', 'active', 'barcode', 'company_id'],
        'PRICING (الأسعار)': ['list_price', 'standard_price', 'taxes_id', 'supplier_taxes_id'],
        'UNITS (الوحدات)': ['uom_id', 'uom_po_id', 'tracking'],
        'STOCK SMART BUTTONS': ['qty_available', 'virtual_available', 'incoming_qty', 'outgoing_qty', 'nbr_reordering_rules'],
        'GENERAL TAB (معلومات عامة)': ['description', 'description_sale'],
        'SALES TAB (المبيعات)': ['invoice_policy', 'sale_delay', 'optional_product_ids', 'available_in_pos', 'to_weight', 'pos_categ_ids'],
        'PURCHASE TAB (المشتريات)': ['purchase_method', 'purchase_line_warn', 'purchase_line_warn_msg', 'seller_ids', 'description_purchase'],
        'INVENTORY TAB (المخزون)': ['weight', 'volume', 'route_ids', 'responsible_id', 'produce_delay', 'property_stock_production', 'property_stock_inventory', 'description_picking', 'description_pickingout', 'hs_code', 'country_of_origin'],
        'ACCOUNTING TAB (المحاسبة)': ['property_account_income_id', 'property_account_expense_id', 'property_account_creditor_price_difference', 'asset_category_id'],
        'VARIANTS (المتغيرات)': ['attribute_line_ids', 'product_variant_count', 'product_variant_ids'],
    };

    const shownKeys = new Set<string>();
    for (const [tabName, keys] of Object.entries(tabs)) {
        console.log('\n┌─── ' + tabName + ' ───┐');
        for (const k of keys) {
            shownKeys.add(k);
            if (p[k] !== undefined) {
                console.log('  ' + k + ': ' + fmt(p[k]));
            }
        }
    }

    // Show ALL remaining non-empty fields
    const skip = ['id', '__last_update', 'write_date', 'create_date', 'create_uid', 'write_uid', 'display_name', 'image_1920', 'image_1024', 'image_512', 'image_256', 'image_128', 'has_configurable_attributes'];
    const remaining = Object.keys(p)
        .filter(k => !shownKeys.has(k) && !skip.includes(k) && p[k] !== false && p[k] !== null && !(Array.isArray(p[k]) && p[k].length === 0) && p[k] !== '' && p[k] !== 0 && p[k] !== 0.0)
        .sort();

    if (remaining.length > 0) {
        console.log('\n┌─── OTHER NON-EMPTY FIELDS ───┐');
        for (const k of remaining) {
            const val = fmt(p[k]);
            console.log('  ' + k + ': ' + val.substring(0, 120));
        }
    }

    // Get FORM VIEW structure (tabs / pages)
    console.log('\n\n═══ ODOO FORM VIEW TABS ═══\n');
    try {
        const view = await rpc(obj, uid, 'product.template', 'fields_view_get', [], { view_type: 'form' });
        if (view && view.arch) {
            const pageRegex = /<page[^>]*string="([^"]+)"/g;
            let match;
            while ((match = pageRegex.exec(view.arch)) !== null) {
                console.log('  📑 ' + match[1]);
            }
        }
    } catch (e: any) {
        console.log('  Error:', (e.message || '').substring(0, 80));
    }

    // Supplier info
    if (p.seller_ids && p.seller_ids.length > 0) {
        console.log('\n\n═══ SUPPLIER INFO ═══\n');
        try {
            const suppliers = await rpc(obj, uid, 'product.supplierinfo', 'read', [p.seller_ids], {
                fields: ['partner_id', 'price', 'min_qty', 'delay', 'product_code', 'currency_id']
            });
            for (const s of suppliers) {
                console.log('  ' + fmt(s.partner_id) + ': price=' + s.price + ' min_qty=' + s.min_qty + ' delay=' + s.delay + 'd');
            }
        } catch (e: any) { console.log('  Error:', (e.message || '').substring(0, 80)); }
    }

    // Stock valuation
    console.log('\n\n═══ STOCK VALUATION ═══\n');
    try {
        const pvs = await rpc(obj, uid, 'product.product', 'search_read',
            [[['product_tmpl_id', '=', p.id]]], { fields: ['id', 'name'], limit: 1 }
        );
        if (pvs.length > 0) {
            const vals = await rpc(obj, uid, 'stock.valuation.layer', 'search_read',
                [[['product_id', '=', pvs[0].id]]],
                { fields: ['quantity', 'value', 'unit_cost', 'remaining_qty', 'remaining_value', 'description'], limit: 5, order: 'id desc' }
            );
            for (const v of vals) {
                console.log('  ' + (v.description || '-').substring(0, 60) + ': qty=' + v.quantity + ' val=' + v.value + ' cost=' + v.unit_cost);
            }
            if (vals.length === 0) console.log('  No valuation layers');
        }
    } catch (e: any) { console.log('  Error:', (e.message || '').substring(0, 80)); }

    // Recent sales
    console.log('\n\n═══ RECENT SALES ═══\n');
    try {
        const saleLines = await rpc(obj, uid, 'sale.order.line', 'search_read',
            [[['product_template_id', '=', p.id]]],
            { fields: ['order_id', 'product_uom_qty', 'price_unit', 'price_total', 'product_uom'], limit: 3, order: 'id desc' }
        );
        for (const sl of saleLines) {
            console.log('  ' + fmt(sl.order_id) + ': qty=' + sl.product_uom_qty + ' ' + fmt(sl.product_uom) + ' price=' + sl.price_unit + ' total=' + sl.price_total);
        }
        if (saleLines.length === 0) console.log('  No sales');
    } catch (e: any) { console.log('  Error:', (e.message || '').substring(0, 80)); }

    // Recent purchases  
    console.log('\n\n═══ RECENT PURCHASES ═══\n');
    try {
        const pvs = await rpc(obj, uid, 'product.product', 'search_read',
            [[['product_tmpl_id', '=', p.id]]], { fields: ['id'], limit: 1 }
        );
        if (pvs.length > 0) {
            const poLines = await rpc(obj, uid, 'purchase.order.line', 'search_read',
                [[['product_id', '=', pvs[0].id]]],
                { fields: ['order_id', 'product_qty', 'price_unit', 'price_total', 'product_uom'], limit: 3, order: 'id desc' }
            );
            for (const pl of poLines) {
                console.log('  ' + fmt(pl.order_id) + ': qty=' + pl.product_qty + ' ' + fmt(pl.product_uom) + ' price=' + pl.price_unit + ' total=' + pl.price_total);
            }
            if (poLines.length === 0) console.log('  No purchases');
        }
    } catch (e: any) { console.log('  Error:', (e.message || '').substring(0, 80)); }

    console.log('\n\n🎉 Deep analysis complete!');
}

main().catch(console.error);
