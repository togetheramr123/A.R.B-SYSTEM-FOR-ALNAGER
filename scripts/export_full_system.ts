
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    // 1. Setup Export Directory
    // content of this dir will be moved to Desktop later
    const exportDir = path.resolve(process.cwd(), 'full_export');
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }
    console.log(`📦 Starting Full System Export to: ${exportDir}`);

    // 2. Export Helper
    async function dumpTable(modelName: string, query: any = {}) {
        console.log(` - Exporting ${modelName}...`);
        const data = await prisma[modelName].findMany(query);
        fs.writeFileSync(
            path.join(exportDir, `${modelName}.json`),
            JSON.stringify(data, null, 2)
        );
        console.log(`   > ${data.length} records saved.`);
    }

    // 3. Execute Exports
    // Core Data
    await dumpTable('company');
    await dumpTable('partner');
    await dumpTable('product');

    // Sales
    await dumpTable('saleOrder', { include: { lines: true } });

    // Purchases
    await dumpTable('purchaseOrder', { include: { lines: true } });

    // Accounting
    await dumpTable('account');
    await dumpTable('journal');
    await dumpTable('invoice', { include: { lines: true } });
    await dumpTable('journalEntry', { include: { items: true } });

    // Inventory
    await dumpTable('location');
    await dumpTable('stockPicking', { include: { moves: true } });
    // Moves are included in picking, but lets dump separate table if needed? 
    // Actually stockMove is usually accessed via picking, but let's dump raw table too just in case
    await dumpTable('stockMove');

    console.log('✅ Export Complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
