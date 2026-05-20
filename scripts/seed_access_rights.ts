
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Access Rights...');

    const groupManager = await prisma.resGroup.upsert({
        where: { name: 'Inventory / Manager' },
        update: {},
        create: {
            name: 'Inventory / Manager',
            category: 'Inventory'
        }
    });

    const groupUser = await prisma.resGroup.upsert({
        where: { name: 'Inventory / User' },
        update: {},
        create: {
            name: 'Inventory / User',
            category: 'Inventory'
        }
    });

    // Grant Access to Manager
    await prisma.irModelAccess.create({
        data: {
            name: 'access_product_manager',
            model: 'product',
            groupId: groupManager.id,
            permRead: true,
            permWrite: true,
            permCreate: true,
            permUnlink: true
        }
    });

    // Grant Read-Only to User for now (Demo)
    await prisma.irModelAccess.create({
        data: {
            name: 'access_product_user',
            model: 'product',
            groupId: groupUser.id,
            permRead: true,
            permWrite: false,
            permCreate: false,
            permUnlink: false
        }
    });

    console.log('Access Rights Seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
