
// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🐞 Debugging Accounting Data...');

    const total = await prisma.invoice.count();
    console.log(`Total Invoices: ${total}`);

    const posted = await prisma.invoice.count({ where: { state: 'posted' } });
    console.log(`Posted Invoices: ${posted}`);

    const unlinked = await prisma.invoice.count({ where: { journalEntryId: null } });
    console.log(`Unlinked Invoices: ${unlinked}`);

    const target = await prisma.invoice.count({ where: { state: 'posted', journalEntryId: null } });
    console.log(`Target (Posted & Unlinked): ${target}`);

    if (total > 0) {
        const sample = await prisma.invoice.findFirst();
        console.log('Sample Invoice:', JSON.stringify(sample, null, 2));
    }
}

main();
