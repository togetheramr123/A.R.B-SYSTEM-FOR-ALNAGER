const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
    // 1. Create company with ID 'real_company_id' if not exists
    let co = await p.company.findUnique({ where: { id: 'real_company_id' } });
    if (!co) {
        co = await p.company.create({
            data: { id: 'real_company_id', name: 'My Real Business', currency: 'EGP' }
        });
        console.log('Created company: real_company_id');
    } else {
        console.log('Company real_company_id already exists');
    }

    // 2. Move all synced products to this company
    const r1 = await p.product.updateMany({
        where: { companyId: 'test-company-verify-123' },
        data: { companyId: 'real_company_id' }
    });
    console.log('Products moved:', r1.count);

    // 3. Move all synced categories  
    const r2 = await p.productCategory.updateMany({
        where: { companyId: 'test-company-verify-123' },
        data: { companyId: 'real_company_id' }
    });
    console.log('Categories moved:', r2.count);

    // Also move categories with null companyId
    const r3 = await p.productCategory.updateMany({
        where: { companyId: null, odooId: { not: null } },
        data: { companyId: 'real_company_id' }
    });
    console.log('Null-company categories moved:', r3.count);

    // 4. Verify
    const count = await p.product.count({ where: { companyId: 'real_company_id' } });
    console.log('Products in real_company_id:', count);

    const catCount = await p.productCategory.count({ where: { companyId: 'real_company_id' } });
    console.log('Categories in real_company_id:', catCount);

    await p.$disconnect();
})();
