import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Odoo Product Integration...');

    const companyName = 'My Real Business';
    const company = await prisma.company.findFirst({ where: { name: companyName } });

    if (!company) {
        console.error(`❌ Company "${companyName}" not found. Please run seed first.`);
        return;
    }

    // 1. Ensure Accounts Exist (Codes from Odoo screenshots)
    const incomeAccount = await prisma.account.findUnique({ where: { code: '500001' } });
    const expenseAccount = await prisma.account.findUnique({ where: { code: '400002' } });

    if (!incomeAccount || !expenseAccount) {
        console.error('❌ Required accounting accounts (500001 or 400002) are missing.');
        return;
    }

    // 2. Create/Update Product
    const productName = 'افيز بجوان لكس 50 ( النجار )';
    const productSku = 'Odoo_AF_50_NAJJ';
    
    // Odoo showed 31.42 Cartons = 2828 Pieces -> 2828 / 31.42 = ~90
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
            companyId: company.id,
            salePrice: 0, // Set defaults or update later
            costPrice: 0
        }
    });

    // 3. Set Initial Stock Level
    const warehouseName = 'مخزن العبور'; // From Odoo screenshot
    let warehouse = await prisma.warehouse.findFirst({ where: { name: warehouseName, companyId: company.id } });
    if (!warehouse) {
        warehouse = await prisma.warehouse.create({
            data: { name: warehouseName, code: 'ABOUR', companyId: company.id }
        });
    }

    let location = await prisma.location.findFirst({ where: { name: `${warehouseName}/مخزن`, warehouseId: warehouse.id } });
    if (!location) {
        location = await prisma.location.create({
            data: { name: `${warehouseName}/مخزن`, type: 'internal', warehouseId: warehouse.id }
        });
    }

    const initialQty = 2828; // From Odoo screenshot
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
