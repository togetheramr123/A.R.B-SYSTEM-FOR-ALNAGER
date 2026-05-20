import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Integration for Product: افيز بجوان 11/4 ( النجار )...');

    const companyName = 'My Real Business';
    const company = await prisma.company.findFirst({ where: { name: companyName } });

    if (!company) {
        console.error(`❌ Company "${companyName}" not found.`);
        return;
    }

    // 1. Get Category and Accounts
    const category = await prisma.productCategory.findFirst({ where: { name: 'مجموعة افيز ( S.R // النجار )' } });
    const incomeAccount = await prisma.account.findUnique({ where: { code: '500001' } });
    const expenseAccount = await prisma.account.findUnique({ where: { code: '400002' } });

    if (!category || !incomeAccount || !expenseAccount) {
        console.error('❌ Required category or accounting accounts are missing.');
        return;
    }

    // 2. Create/Update Product
    const productName = 'افيز بجوان 11/4 ( النجار )';
    const productSku = 'Odoo_AF_114_NAJJ';

    // Odoo showed 69.60 Cartons = 6264 Pieces -> 6264 / 69.60 = 90
    const conversionFactor = 90;

    console.log(`📦 Registering product: ${productName}`);

    const product = await prisma.product.upsert({
        where: { sku: productSku },
        update: {
            name: productName,
            uom: 'قطعه',
            hasSecondaryUnit: true,
            secondaryUom: 'كرتونة',
            secondaryUomFactor: conversionFactor,
            propertyAccountIncomeId: incomeAccount.id,
            propertyAccountExpenseId: expenseAccount.id,
            categoryId: category.id,
            costPrice: 8.37,
            salePrice: 1.00,
            companyId: company.id
        },
        create: {
            name: productName,
            sku: productSku,
            type: 'storable',
            uom: 'قطعه',
            hasSecondaryUnit: true,
            secondaryUom: 'كرتونة',
            secondaryUomFactor: conversionFactor,
            propertyAccountIncomeId: incomeAccount.id,
            propertyAccountExpenseId: expenseAccount.id,
            categoryId: category.id,
            costPrice: 8.37,
            salePrice: 1.00,
            companyId: company.id
        }
    });

    // 3. Set Initial Stock Level
    const warehouseName = 'مخزن العبور';
    const location = await prisma.location.findFirst({ where: { name: `${warehouseName}/مخزن` } });

    if (!location) {
        console.error(`❌ Location "${warehouseName}/مخزن" not found.`);
        return;
    }

    const initialQty = 6264; // From Odoo screenshot
    await prisma.stockQuant.upsert({
        where: { productId_locationId: { productId: product.id, locationId: location.id } },
        update: { quantity: initialQty },
        create: {
            productId: product.id,
            locationId: location.id,
            quantity: initialQty,
            companyId: company.id
        }
    });

    console.log(`✅ Product and Stock (Qty: ${initialQty}) integrated successfully.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
