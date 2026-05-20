import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🛡️ Starting Role Seeding...');

    const demoCompany = await prisma.company.findFirst({
        where: { name: 'Demo Company (San Francisco)' }
    });

    if (!demoCompany) {
        console.error('Demo company not found. Please run main seed.ts first.');
        process.exit(1);
    }

    // Prepare password
    const hashedPassword = await bcrypt.hash('3080', 10);

    // Definitions
    const roles = [
        {
            groupName: 'Sales / Manager',
            category: 'Sales',
            user: { email: 'sales@mail.com', name: 'Sales Representative' },
            permissions: [
                { model: 'saleOrder', r: true, w: true, c: true, u: false },
                { model: 'saleOrderLine', r: true, w: true, c: true, u: false },
                { model: 'partner', r: true, w: true, c: true, u: false },
                { model: 'product', r: true, w: false, c: false, u: false }
            ]
        },
        {
            groupName: 'Purchases / Manager',
            category: 'Purchases',
            user: { email: 'purchase@mail.com', name: 'Purchasing Agent' },
            permissions: [
                { model: 'purchaseOrder', r: true, w: true, c: true, u: false },
                { model: 'purchaseOrderLine', r: true, w: true, c: true, u: false },
                { model: 'partner', r: true, w: true, c: true, u: false },
                { model: 'product', r: true, w: true, c: true, u: false }
            ]
        },
        {
            groupName: 'Inventory / Manager',
            category: 'Inventory',
            user: { email: 'warehouse@mail.com', name: 'Warehouse Manager' },
            permissions: [
                { model: 'stockPicking', r: true, w: true, c: true, u: false },
                { model: 'stockMove', r: true, w: true, c: true, u: false },
                { model: 'stockQuant', r: true, w: true, c: true, u: false },
                { model: 'product', r: true, w: true, c: true, u: false },
                { model: 'warehouse', r: true, w: false, c: false, u: false },
                { model: 'location', r: true, w: true, c: true, u: false }
            ]
        },
        {
            groupName: 'Accounting / Accountant',
            category: 'Accounting',
            user: { email: 'accountant@mail.com', name: 'Financial Accountant' },
            permissions: [
                { model: 'account', r: true, w: true, c: true, u: false },
                { model: 'journalItem', r: true, w: true, c: true, u: false },
                { model: 'journalEntry', r: true, w: true, c: true, u: false },
                { model: 'invoice', r: true, w: true, c: true, u: false },
                { model: 'invoiceLine', r: true, w: true, c: true, u: false },
                { model: 'payment', r: true, w: true, c: true, u: false },
                { model: 'partner', r: true, w: true, c: true, u: false },
                { model: 'saleOrder', r: true, w: false, c: false, u: false }, // read-only visibility
                { model: 'purchaseOrder', r: true, w: false, c: false, u: false } // read-only visibility
            ]
        }
    ];

    for (const roleDef of roles) {
        // 1. Create or Find Group
        const group = await prisma.resGroup.upsert({
            where: { name: roleDef.groupName },
            update: { category: roleDef.category },
            create: {
                name: roleDef.groupName,
                category: roleDef.category
            }
        });

        // 2. Clear old permissions for the group to reset
        await prisma.irModelAccess.deleteMany({
            where: { groupId: group.id }
        });

        // 3. Insert specific permissions
        for (const p of roleDef.permissions) {
            await prisma.irModelAccess.create({
                data: {
                    name: `${roleDef.groupName} access to ${p.model}`,
                    model: p.model,
                    groupId: group.id,
                    permRead: p.r,
                    permWrite: p.w,
                    permCreate: p.c,
                    permUnlink: p.u
                }
            });
        }

        // 4. Create User
        await prisma.user.upsert({
            where: { email: roleDef.user.email },
            update: {
                password: hashedPassword,
                role: 'USER',
                companyId: demoCompany.id,
                groups: {
                    connect: [{ id: group.id }]
                }
            },
            create: {
                email: roleDef.user.email,
                name: roleDef.user.name,
                password: hashedPassword,
                role: 'USER', // Important: Not 'ADMIN'
                companyId: demoCompany.id,
                groups: {
                    connect: [{ id: group.id }]
                }
            }
        });

        console.log(`✅ Created User: ${roleDef.user.email} -> Group: ${roleDef.groupName}`);
    }

    console.log('🎉 Role Seeding Finished!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
