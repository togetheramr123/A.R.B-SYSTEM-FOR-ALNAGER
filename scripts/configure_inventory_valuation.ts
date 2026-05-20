import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Inventory Valuation Configuration...');

    const companyName = 'My Real Business';
    const company = await prisma.company.findFirst({ where: { name: companyName } });

    if (!company) {
        console.error(`❌ Company "${companyName}" not found.`);
        return;
    }

    // 1. Rename Accounts to Arabic Names from Odoo
    const accountUpdates = [
        { code: '103029', name: 'حساب المخزون' },
        { code: '103039', name: 'حساب المخزون الوارد' },
        { code: '103049', name: 'حساب المخزون المنصرف' }
    ];

    for (const update of accountUpdates) {
        await prisma.account.update({
            where: { code: update.code },
            data: { name: update.name }
        });
        console.log(`✅ Updated account ${update.code} to: ${update.name}`);
    }

    // 2. Rename Stock Journal
    const journal = await prisma.journal.findFirst({ where: { code: 'STJ' } });
    if (journal) {
        await prisma.journal.update({
            where: { id: journal.id },
            data: { name: 'دفتر / المخزون' }
        });
        console.log(`✅ Updated Stock Journal name to: دفتر / المخزون`);
    }

    // 3. Create/Update Product Category with Automated Valuation
    const categoryName = 'مجموعة افيز ( S.R // النجار )';

    // Get account IDs
    const accStock = await prisma.account.findUnique({ where: { code: '103029' } });
    const accInput = await prisma.account.findUnique({ where: { code: '103039' } });
    const accOutput = await prisma.account.findUnique({ where: { code: '103049' } });
    const accIncome = await prisma.account.findUnique({ where: { code: '500001' } });
    const accExpense = await prisma.account.findUnique({ where: { code: '400002' } });

    console.log(`📂 Configuring category: ${categoryName}`);

    const category = await prisma.productCategory.upsert({
        where: { id: 'odoo_afiz_cat_id' }, // Using a fixed ID for the specific category from Odoo
        update: {
            name: categoryName,
            costingMethod: 'avco',
            valuation: 'real_time',
            propertyStockAccountId: accStock?.id,
            propertyStockAccountInputId: accInput?.id,
            propertyStockAccountOutputId: accOutput?.id,
            propertyStockJournalId: journal?.id,
            propertyAccountIncomeId: accIncome?.id,
            propertyAccountExpenseId: accExpense?.id
        },
        create: {
            id: 'odoo_afiz_cat_id',
            name: categoryName,
            costingMethod: 'avco',
            valuation: 'real_time',
            propertyStockAccountId: accStock?.id,
            propertyStockAccountInputId: accInput?.id,
            propertyStockAccountOutputId: accOutput?.id,
            propertyStockJournalId: journal?.id,
            propertyAccountIncomeId: accIncome?.id,
            propertyAccountExpenseId: accExpense?.id
        }
    }).catch(async () => {
        // Fallback if ID strategy fails for some reason
        return await prisma.productCategory.create({
            data: {
                name: categoryName,
                costingMethod: 'avco',
                valuation: 'real_time',
                propertyStockAccountId: accStock?.id,
                propertyStockAccountInputId: accInput?.id,
                propertyStockAccountOutputId: accOutput?.id,
                propertyStockJournalId: journal?.id,
                propertyAccountIncomeId: accIncome?.id,
                propertyAccountExpenseId: accExpense?.id
            }
        });
    });

    // 4. Link Product to Category
    const productSku = 'Odoo_AF_50_NAJJ';
    const product = await prisma.product.findUnique({ where: { sku: productSku } });
    if (product) {
        await prisma.product.update({
            where: { id: product.id },
            data: { categoryId: category.id }
        });
        console.log(`🔗 Linked product ${product.name} to category ${categoryName}`);
    }

    console.log(`✅ Inventory Valuation Configuration finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
