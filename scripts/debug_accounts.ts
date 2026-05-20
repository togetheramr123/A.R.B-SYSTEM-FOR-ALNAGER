
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Account Types and Balances...");

    const accounts = await prisma.account.findMany({
        include: { journalItems: true }
    });

    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    console.log(`Admin Company ID: ${admin?.companyId}`);

    for (const acc of accounts) {
        const balance = acc.journalItems.reduce((s, i) => s + i.balance, 0);
        if (Math.abs(balance) > 0.01) {
            console.log(`[${acc.code}] ${acc.name} (${acc.type}): ${balance} (Company: ${acc.companyId})`);
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
