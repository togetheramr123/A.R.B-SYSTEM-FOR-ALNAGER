/**
 * Odoo Full Products & Categories Sync Script
 * 
 * Syncs all product categories and products from Odoo to the ERP system.
 * Run with: npx tsx scripts/sync-odoo-products.ts
 */

import xmlrpc from 'xmlrpc';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Odoo connection config
const ODOO_CONFIG = {
    url: 'http://161.97.141.100:10016',
    db: 'hosien_alnagar',
    username: 'togetheramr123@mail.com',
    password: '1993'
};

async function getCompanyId(): Promise<string> {
    // Find the most recent "My Real Business" company
    let company = await prisma.company.findFirst({
        where: { currency: 'EGP' },
        orderBy: { createdAt: 'desc' }
    });
    if (!company) {
        company = await prisma.company.create({
            data: { name: 'My Real Business', currency: 'EGP' }
        });
    }
    return company.id;
}

// ===================== XML-RPC Helper =====================

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

// ===================== Sync Categories =====================

async function syncCategories(object: any, uid: number, companyId: string) {
    console.log('\n📁 Syncing Product Categories...');

    const categories = await executeKW(object, uid, 'product.category', 'search_read',
        [[]],
        { fields: ['id', 'name', 'parent_id', 'complete_name'] }
    );

    console.log(`   Found ${categories.length} categories in Odoo`);

    let created = 0, updated = 0;

    // First pass: create/update all categories without parent links
    for (const cat of categories) {
        const existing = await prisma.productCategory.findFirst({
            where: { OR: [{ odooId: cat.id }, { name: cat.name }] }
        });

        if (existing) {
            await prisma.productCategory.update({
                where: { id: existing.id },
                data: {
                    name: cat.complete_name || cat.name,
                    odooId: cat.id
                }
            });
            updated++;
        } else {
            await prisma.productCategory.create({
                data: {
                    name: cat.complete_name || cat.name,
                    odooId: cat.id,
                    companyId: companyId
                }
            });
            created++;
        }
    }

    // Second pass: set parent relationships
    for (const cat of categories) {
        if (cat.parent_id && Array.isArray(cat.parent_id)) {
            const parentOdooId = cat.parent_id[0];
            const parent = await prisma.productCategory.findFirst({ where: { odooId: parentOdooId } });
            const child = await prisma.productCategory.findFirst({ where: { odooId: cat.id } });
            if (parent && child) {
                await prisma.productCategory.update({
                    where: { id: child.id },
                    data: { parentId: parent.id }
                });
            }
        }
    }

    console.log(`   ✅ Categories: ${created} created, ${updated} updated`);
}

// ===================== Sync Products (Batched) =====================

async function syncProducts(object: any, uid: number, companyId: string) {
    console.log('\n📦 Syncing Products...');

    // Get total count first
    const totalCount = await executeKW(object, uid, 'product.template', 'search_count',
        [[['active', '=', true]]]
    );
    console.log(`   Total products in Odoo: ${totalCount}`);

    const BATCH_SIZE = 100;
    let offset = 0;
    let totalCreated = 0, totalUpdated = 0;

    while (offset < totalCount) {
        const products = await executeKW(object, uid, 'product.template', 'search_read',
            [[['active', '=', true]]],
            {
                fields: [
                    'id', 'name', 'default_code', 'barcode',
                    'list_price', 'standard_price',
                    'type', 'detailed_type',
                    'uom_id', 'uom_po_id',
                    'categ_id',
                    'sale_ok', 'purchase_ok',
                    'weight', 'volume',
                    'description', 'description_sale', 'description_purchase',
                    'invoice_policy',
                    'active',
                    'image_1920'  // base64 image - we'll skip large ones
                ],
                offset: offset,
                limit: BATCH_SIZE,
                order: 'id asc'
            }
        );

        console.log(`   Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${offset + 1}-${offset + products.length} of ${totalCount})...`);

        let batchCreated = 0, batchUpdated = 0;

        for (const p of products) {
            try {
                // Map Odoo product type to our type
                let productType = 'storable';
                if (p.detailed_type === 'service' || p.type === 'service') {
                    productType = 'service';
                } else if (p.detailed_type === 'consu' || p.type === 'consu') {
                    productType = 'consu';
                }

                // Find category
                let categoryId = null;
                if (p.categ_id && Array.isArray(p.categ_id)) {
                    const cat = await prisma.productCategory.findFirst({ where: { odooId: p.categ_id[0] } });
                    if (cat) categoryId = cat.id;
                }

                // Map UoM
                const uomName = p.uom_id && Array.isArray(p.uom_id) ? p.uom_id[1] : 'Units';
                const purchaseUomName = p.uom_po_id && Array.isArray(p.uom_po_id) ? p.uom_po_id[1] : uomName;

                // Prepare data
                const data: any = {
                    name: p.name || 'Unnamed Product',
                    sku: p.default_code || null,
                    barcode: p.barcode || null,
                    salePrice: p.list_price || 0,
                    costPrice: p.standard_price || 0,
                    type: productType,
                    uom: uomName,
                    purchaseUom: purchaseUomName,
                    canBeSold: p.sale_ok !== false,
                    canBePurchased: p.purchase_ok !== false,
                    weight: p.weight || 0,
                    volume: p.volume || 0,
                    description: p.description || null,
                    descriptionSale: p.description_sale || null,
                    descriptionPurchase: p.description_purchase || null,
                    invoicingPolicy: p.invoice_policy || 'ordered',
                    categoryId: categoryId,
                    odooId: p.id,
                    companyId: companyId,
                    active: p.active !== false,
                };

                // Check if product exists
                let existing = await prisma.product.findFirst({
                    where: { odooId: p.id }
                });

                // Also try by barcode/sku 
                if (!existing && p.barcode) {
                    existing = await prisma.product.findFirst({ where: { barcode: p.barcode } });
                }
                if (!existing && p.default_code) {
                    existing = await prisma.product.findFirst({ where: { sku: p.default_code } });
                }

                if (existing) {
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            ...data,
                            // Remove barcode/sku if they would conflict
                            barcode: data.barcode || existing.barcode,
                            sku: data.sku || existing.sku,
                        }
                    });
                    batchUpdated++;
                } else {
                    // Avoid unique constraint conflicts
                    if (data.barcode) {
                        const barcodeExists = await prisma.product.findFirst({ where: { barcode: data.barcode } });
                        if (barcodeExists) data.barcode = null;
                    }
                    if (data.sku) {
                        const skuExists = await prisma.product.findFirst({ where: { sku: data.sku } });
                        if (skuExists) data.sku = `${data.sku}_${p.id}`;
                    }

                    await prisma.product.create({ data });
                    batchCreated++;
                }
            } catch (err: any) {
                console.error(`   ⚠️ Error syncing product "${p.name}" (Odoo ID: ${p.id}): ${err.message}`);
            }
        }

        totalCreated += batchCreated;
        totalUpdated += batchUpdated;
        offset += BATCH_SIZE;

        console.log(`   ✅ Batch done: ${batchCreated} created, ${batchUpdated} updated`);
    }

    console.log(`\n📦 Products sync complete: ${totalCreated} created, ${totalUpdated} updated (total: ${totalCreated + totalUpdated})`);
}

// ===================== Main =====================

async function main() {
    console.log('🚀 Starting Odoo Full Products & Categories Sync...');
    console.log(`   Server: ${ODOO_CONFIG.url}`);
    console.log(`   Database: ${ODOO_CONFIG.db}`);
    console.log('');

    try {
        const { object, uid } = await authenticate();

        // Step 1: Sync Categories
        const companyId = await getCompanyId();
        console.log(`   Company ID: ${companyId}`);
        await syncCategories(object, uid, companyId);

        // Step 2: Sync Products (batched)
        await syncProducts(object, uid, companyId);

        console.log('\n🎉 Sync completed successfully!');
    } catch (error: any) {
        console.error('\n❌ Sync failed:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
