
import prisma from '../lib/prisma';

async function main() {
    console.log('--- Seeding Access Rights ---');

    // 1. Create Groups
    const groupManager = await prisma.resGroup.upsert({
        where: { name: 'Inventory / Manager' },
        update: {},
        create: { name: 'Inventory / Manager', category: 'Inventory' }
    });
    console.log('Group Manager:', groupManager.name);

    const groupUser = await prisma.resGroup.upsert({
        where: { name: 'Inventory / User' },
        update: {},
        create: { name: 'Inventory / User', category: 'Inventory' }
    });
    console.log('Group User:', groupUser.name);

    // 2. Create Access Rights for 'product'
    // Manager: Full Access
    await prisma.irModelAccess.upsert({
        where: { name: 'access_product_manager' },
        update: {},
        create: {
            name: 'access_product_manager',
            model: 'product',
            groupId: groupManager.id,
            permRead: true,
            permWrite: true,
            permCreate: true,
            permUnlink: true
        }
    });

    // User: Read Only (for verifying strictly)
    await prisma.irModelAccess.upsert({
        where: { name: 'access_product_user' },
        update: {},
        create: {
            name: 'access_product_user',
            model: 'product',
            groupId: groupUser.id,
            permRead: true,
            permWrite: false,
            permCreate: false,
            permUnlink: false
        }
    });
    console.log('Access Rights for "product" created/updated.');

    // 3. Assign Admin to Manager Group (to be safe, though Admin role bypasses)
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) {
        // Disconnect all first to avoid duplicates if specific array logic isn't used (Prisma simple connect is safe)
        await prisma.user.update({
            where: { id: admin.id },
            data: {
                groups: {
                    connect: { id: groupManager.id }
                }
            }
        });
        console.log(`Assigned Admin (${admin.email}) to Inventory / Manager`);
    }

    console.log('--- Access Rights Seeding Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
