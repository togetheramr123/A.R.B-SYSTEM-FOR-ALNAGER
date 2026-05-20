/**
 * Deep Odoo Product Analysis - Study product structure, fields, and related data
 * Run: npx tsx scripts/odoo-product-analysis.ts
 */
import xmlrpc from 'xmlrpc';

const CFG = { url: 'http://161.97.141.100:10016', db: 'hosien_alnagar', username: 'togetheramr123@mail.com', password: '1993' };

function client() {
    const u = new URL(CFG.url);
    return { create: xmlrpc.createClient, opts: { host: u.hostname, port: parseInt(u.port) || 80, path: '/xmlrpc/2/common', headers: { 'User-Agent': 'Node' } } };
}

async function auth() {
    const { create, opts } = client();
    const c = create(opts);
    const uid: number = await new Promise((res, rej) => c.methodCall('authenticate', [CFG.db, CFG.username, CFG.password, {}], (e: any, v: any) => e ? rej(e) : res(v)));
    return { obj: create({ ...opts, path: '/xmlrpc/2/object' }), uid };
}

function rpc(obj: any, uid: number, model: string, method: string, args: any[], kw: any = {}): Promise<any> {
    return new Promise((res, rej) => obj.methodCall('execute_kw', [CFG.db, uid, CFG.password, model, method, args, kw], (e: any, v: any) => e ? rej(e) : res(v)));
}

async function main() {
    const { obj, uid } = await auth();
    console.log('✅ Connected\n');

    // 1. Get ALL fields of product.template model
    console.log('═══════════════════════════════════════');
    console.log('    PRODUCT TEMPLATE FIELDS (product.template)');
    console.log('═══════════════════════════════════════\n');

    const ptFields = await rpc(obj, uid, 'product.template', 'fields_get', [], { attributes: ['string', 'type', 'required', 'readonly', 'help'] });
    const fieldEntries = Object.entries(ptFields).sort((a: any, b: any) => a[0].localeCompare(b[0]));

    console.log(`Total fields: ${fieldEntries.length}\n`);

    // Group by type
    const groups: any = {};
    for (const [name, info] of fieldEntries) {
        const f = info as any;
        const type = f.type;
        if (!groups[type]) groups[type] = [];
        groups[type].push({ name, label: f.string, required: f.required, readonly: f.readonly, help: f.help });
    }

    for (const [type, fields] of Object.entries(groups)) {
        const flds = fields as any[];
        console.log(`\n--- ${type.toUpperCase()} fields (${flds.length}) ---`);
        for (const f of flds) {
            const flags = [f.required && 'REQUIRED', f.readonly && 'readonly'].filter(Boolean).join(', ');
            console.log(`  ${f.name}: "${f.label}" ${flags ? `[${flags}]` : ''}`);
        }
    }

    // 2. Get ONE complete example product with ALL fields
    console.log('\n\n═══════════════════════════════════════');
    console.log('    EXAMPLE PRODUCT (with all data)');
    console.log('═══════════════════════════════════════\n');

    const [product] = await rpc(obj, uid, 'product.template', 'search_read', [[['type', '=', 'product']]], { limit: 1, order: 'id desc' });

    if (product) {
        console.log(`Product: ${product.name} (ID: ${product.id})`);
        console.log('\nAll field values:');
        for (const [key, value] of Object.entries(product).sort((a, b) => a[0].localeCompare(b[0]))) {
            if (value !== false && value !== null && value !== '' && value !== 0 && !(Array.isArray(value) && value.length === 0)) {
                console.log(`  ${key}: ${JSON.stringify(value)}`);
            }
        }
    }

    // 3. Get product categories hierarchy
    console.log('\n\n═══════════════════════════════════════');
    console.log('    PRODUCT CATEGORIES');
    console.log('═══════════════════════════════════════\n');

    const categories = await rpc(obj, uid, 'product.category', 'search_read', [[]], {
        fields: ['id', 'name', 'complete_name', 'parent_id', 'child_id'],
        order: 'complete_name asc'
    });
    for (const cat of categories.slice(0, 20)) {
        console.log(`  [${cat.id}] ${cat.complete_name}`);
    }
    console.log(`  ... total: ${categories.length} categories`);

    // 4. Stock/Inventory info for a product
    console.log('\n\n═══════════════════════════════════════');
    console.log('    STOCK QUANTS (Inventory)');
    console.log('═══════════════════════════════════════\n');

    const quants = await rpc(obj, uid, 'stock.quant', 'search_read', [[['product_id.active', '=', true]]], {
        fields: ['product_id', 'location_id', 'quantity', 'reserved_quantity', 'lot_id'],
        limit: 5, order: 'id desc'
    });
    for (const q of quants) {
        console.log(`  ${q.product_id[1]}: ${q.quantity} @ ${q.location_id[1]}`);
    }

    // 5. UoM categories and UoMs
    console.log('\n\n═══════════════════════════════════════');
    console.log('    UNITS OF MEASURE');
    console.log('═══════════════════════════════════════\n');

    const uoms = await rpc(obj, uid, 'uom.uom', 'search_read', [[]], {
        fields: ['id', 'name', 'category_id', 'uom_type', 'factor', 'rounding'],
        order: 'category_id asc'
    });
    for (const u of uoms) {
        console.log(`  [${u.id}] ${u.name} (${u.category_id[1]}) - type: ${u.uom_type}, factor: ${u.factor}`);
    }

    // 6. Check what stock moves exist for a product  
    console.log('\n\n═══════════════════════════════════════');
    console.log('    STOCK MOVES (recent)');
    console.log('═══════════════════════════════════════\n');

    const moves = await rpc(obj, uid, 'stock.move', 'search_read', [[]], {
        fields: ['product_id', 'product_uom_qty', 'state', 'picking_id', 'origin', 'location_id', 'location_dest_id', 'date'],
        limit: 5, order: 'id desc'
    });
    for (const m of moves) {
        console.log(`  ${m.product_id[1]}: ${m.product_uom_qty} (${m.state}) ${m.location_id[1]} → ${m.location_dest_id[1]} [${m.origin || '-'}]`);
    }

    // 7. Price lists  
    console.log('\n\n═══════════════════════════════════════');
    console.log('    PRICE LISTS');
    console.log('═══════════════════════════════════════\n');

    try {
        const pricelists = await rpc(obj, uid, 'product.pricelist', 'search_read', [[]], {
            fields: ['id', 'name', 'currency_id', 'active'],
            limit: 10
        });
        for (const pl of pricelists) {
            console.log(`  [${pl.id}] ${pl.name} (${pl.currency_id[1]})`);
        }
    } catch (e: any) {
        console.log('  Not available:', e.message?.substring(0, 50));
    }

    // 8. Stock warehouses and locations
    console.log('\n\n═══════════════════════════════════════');
    console.log('    WAREHOUSES & LOCATIONS');
    console.log('═══════════════════════════════════════\n');

    const warehouses = await rpc(obj, uid, 'stock.warehouse', 'search_read', [[]], {
        fields: ['id', 'name', 'code', 'lot_stock_id', 'company_id']
    });
    for (const w of warehouses) {
        console.log(`  Warehouse: [${w.id}] ${w.name} (${w.code}) - Stock: ${w.lot_stock_id[1]}`);
    }

    const locations = await rpc(obj, uid, 'stock.location', 'search_read', [[['usage', 'in', ['internal', 'transit']]]], {
        fields: ['id', 'name', 'complete_name', 'usage', 'company_id'],
        order: 'complete_name'
    });
    for (const loc of locations) {
        console.log(`  Location: [${loc.id}] ${loc.complete_name} (${loc.usage})`);
    }

    console.log('\n🎉 Analysis complete!');
}

main().catch(console.error);
