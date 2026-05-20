const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('Seeding demo data...');

        // 1. Create Company
        const company = await prisma.company.upsert({
            where: { id: 'default-company' },
            update: {},
            create: {
                id: 'default-company',
                name: 'شركة النور للتجارة (نسخة تجريبية)',
                currency: 'EGP',
                address: 'القاهرة، مصر',
            },
        });

        // 2. Create Warehouse
        await prisma.warehouse.upsert({
            where: { code: 'WH1' },
            update: {},
            create: {
                name: 'المخزن الرئيسي - ديمو',
                code: 'WH1',
                companyId: company.id,
            },
        });

        // 3. Create Categories
        const cat = await prisma.productCategory.create({
            data: { name: 'المكتب والأثاث' }
        });

        // 4. Create Products
        await prisma.product.createMany({
            data: [
                { name: 'مكتب خشبي مدير فاخر', barcode: '100200300', salePrice: 5500, costPrice: 4000, categoryId: cat.id },
                { name: 'كرسي مكتب طبي رمادي', barcode: '100200301', salePrice: 2500, costPrice: 1800, categoryId: cat.id },
                { name: 'وحدة أدراج معدنية', barcode: '100200302', salePrice: 1500, costPrice: 1100, categoryId: cat.id },
            ]
        });

        console.log('✅ Seed data created successfully for Demo mode!');
    } catch (error) {
        console.error('❌ Error seeding data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
