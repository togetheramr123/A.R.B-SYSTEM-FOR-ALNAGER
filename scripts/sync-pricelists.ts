/**
 * Sync Price Lists from Odoo
 * Run: npx tsx scripts/sync-pricelists.ts
 */
import xmlrpc from 'xmlrpc';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const CFG = { url: 'http://161.97.141.100:10016', db: 'hosien_alnagar', username: 'togetheramr123@mail.com', password: '1993' };

function mkClient() {
    const u = new URL(CFG.url);
    return xmlrpc.createClient({ host: u.hostname, port: parseInt(u.port), path: '/xmlrpc/2/common' });
}

async function auth() {
    const c = mkClient();
    const u = new URL(CFG.url);
    const uid: number = await new Promise((res, rej) => c.methodCall('authenticate', [CFG.db, CFG.username, CFG.password, {}], (e: any, v: any) => e ? rej(e) : res(v)));
    const obj = xmlrpc.createClient({ host: u.hostname, port: parseInt(u.port), path: '/xmlrpc/2/object' });
    return { obj, uid };
}

function rpc(obj: any, uid: number, model: string, method: string, args: any[], kw: any = {}): Promise<any> {
    return new Promise((res, rej) => obj.methodCall('execute_kw', [CFG.db, uid, CFG.password, model, method, args, kw], (e: any, v: any) => e ? rej(e) : res(v)));
}

async function main() {
    const { obj, uid } = await auth();
    console.log('✅ Connected to Odoo\n');

    const companies = await prisma.company.findMany();
    if (companies.length === 0) { console.log('No company'); return; }
    const companyId = companies[0].id;

    // Get price lists
    const odooLists = await rpc(obj, uid, 'product.pricelist', 'search_read', [[]], {
        fields: ['name', 'currency_id', 'active'],
        limit: 20,
    });

    console.log(`Found ${odooLists.length} price lists\n`);

    for (const pl of odooLists) {
        // Create or update price list
        let priceList = await prisma.priceList.findFirst({ where: { name: pl.name } });

        if (!priceList) {
            priceList = await prisma.priceList.create({
                data: {
                    name: pl.name,
                    currencyId: pl.currency_id ? pl.currency_id[1] : 'EGP',
                    companyId,
                    active: pl.active,
                }
            });
            console.log(`✅ Created: ${pl.name}`);
        }

        // Get price list items
        const odooItems = await rpc(obj, uid, 'product.pricelist.item', 'search_read', [
            [['pricelist_id', '=', pl.id]]
        ], {
            fields: ['product_tmpl_id', 'min_quantity', 'fixed_price', 'date_start', 'date_end'],
            limit: 500,
        });

        let synced = 0;
        for (const item of odooItems) {
            if (!item.product_tmpl_id) continue;

            // Find product by name
            const product = await prisma.product.findFirst({
                where: { name: item.product_tmpl_id[1] }
            });

            if (!product) continue;

            // Check if already exists
            const existing = await prisma.priceListItem.findFirst({
                where: { priceListId: priceList.id, productId: product.id }
            });

            if (existing) continue;

            await prisma.priceListItem.create({
                data: {
                    priceListId: priceList.id,
                    productId: product.id,
                    minQuantity: new Prisma.Decimal(item.min_quantity || 0),
                    price: new Prisma.Decimal(item.fixed_price || 0),
                    buyPrice: product.costPrice,
                    startDate: item.date_start ? new Date(item.date_start) : null,
                    endDate: item.date_end ? new Date(item.date_end) : null,
                }
            });
            synced++;
        }

        console.log(`  ${pl.name}: ${synced} items synced (${odooItems.length} total in Odoo)`);
    }

    console.log('\n🎉 Done!');
    await prisma.$disconnect();
}

main().catch(console.error);
