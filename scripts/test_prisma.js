process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const users = await prisma.user.findMany();
        console.log('Success! Users found:', users.length);
    } catch (e) {
        console.error('Prisma Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

test();
