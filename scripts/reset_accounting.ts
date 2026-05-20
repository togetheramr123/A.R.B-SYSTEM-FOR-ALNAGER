
// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Clearing Linkages...');

    const res = await prisma.invoice.updateMany({
        where: { journalEntryId: { not: null } },
        data: { journalEntryId: null }
    });
    console.log(` - Unlinked ${res.count} invoices.`);

    const items = await prisma.journalItem.deleteMany({});
    console.log(` - Deleted ${items.count} journal items.`);

    const entries = await prisma.journalEntry.deleteMany({});
    console.log(` - Deleted ${entries.count} journal entries.`);

    console.log('✅ Reset Complete.');
}

main();
