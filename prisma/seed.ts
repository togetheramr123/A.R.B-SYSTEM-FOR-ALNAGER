import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting clean seeding for production...');

    // Clean up existing data in correct dependency order
    const models = [
        'stockMove', 'stockPicking', 'stockQuant', 'invoiceLine', 'invoice',
        'saleOrderLine', 'saleOrder', 'purchaseOrderLine', 'purchaseOrder',
        'product', 'productCategory', 'location', 'warehouse', 'partner', 'user', 'company',
        'account', 'journalItem', 'journalEntry'
    ];

    for (const model of models) {
        try {
            // @ts-ignore
            await prisma[model].deleteMany({});
            console.log(`Deleted all ${model}`);
        } catch (e) {
            console.warn(`Error deleting ${model}:`, e);
        }
    }

    // --- 1. Company Setup ---
    const realCompany = await prisma.company.create({
        data: { name: 'الشركة الرئيسية', currency: 'EGP' }
    });
    console.log('✅ Company seeded');

    // --- 2. Chart of Accounts Setup ---
    const accountsData = [
        { code: '103029', name: 'تقييم المخزون (آلي)', type: 'asset_current' },
        { code: '103039', name: 'مدخلات المخزون (وسيط)', type: 'asset_current' },
        { code: '103049', name: 'مخرجات المخزون (وسيط)', type: 'asset_current' },
        { code: '400002', name: 'تكلفة البضائع المباعة', type: 'expense' },
        { code: '500001', name: 'مبيعات المنتجات', type: 'income' },
    ];

    const createdAccounts: Record<string, any> = {};
    for (const acc of accountsData) {
        createdAccounts[acc.code] = await prisma.account.create({
            data: {
                code: acc.code,
                name: acc.name,
                type: acc.type,
                companyId: realCompany.id
            }
        });
    }
    console.log('✅ Chart of Accounts seeded');

    // --- 3. Default Product Category ---
    const defaultCategory = await prisma.productCategory.create({
        data: {
            name: 'الكل',
            costingMethod: 'avco',
            valuation: 'real_time',
            propertyStockAccountId: createdAccounts['103029'].id,
            propertyStockAccountInputId: createdAccounts['103039'].id,
            propertyStockAccountOutputId: createdAccounts['103049'].id,
            propertyAccountIncomeId: createdAccounts['500001'].id,
            propertyAccountExpenseId: createdAccounts['400002'].id,
        }
    });

    console.log('✅ Default Category seeded (with accounting properties)');

    // --- 4. Warehouses & Locations ---
    const warehouse = await prisma.warehouse.create({
        data: { name: 'المستودع الرئيسي', code: 'WH', companyId: realCompany.id },
    });

    const locationsData = [
        { name: 'المستودع/المخزون', type: 'internal' },
        { name: 'مواقع الشركاء/الموردين', type: 'supplier' },
        { name: 'مواقع الشركاء/العملاء', type: 'customer' },
        { name: 'المستودع/المدخلات', type: 'internal' },
        { name: 'المستودع/المخرجات', type: 'internal' },
    ];

    for (const l of locationsData) {
        await prisma.location.create({
            data: { name: l.name, type: l.type, warehouseId: warehouse.id }
        });
    }
    console.log('✅ Locations & Warehouse seeded');

    // --- 5. Admin User Setup ---
    const hashedPassword = await bcrypt.hash('3080', 10);
    await prisma.user.create({
        data: {
            email: 'togetheramr123@mail.com',
            name: 'Admin Owner',
            password: hashedPassword,
            role: 'ADMIN',
            companyId: realCompany.id
        }
    });
    console.log('✅ Admin User seeded');

    console.log('🎉 Full Clean Seeding Finished. System is ready for use!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
