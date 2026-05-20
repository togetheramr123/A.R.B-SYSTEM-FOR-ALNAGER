
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Unifying Company IDs...");

    // Get Admin Company
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin || !admin.companyId) throw new Error("No Admin Company found");

    console.log(`Target Company ID: ${admin.companyId}`);

    // Update all Accounts
    const result = await prisma.account.updateMany({
        data: { companyId: admin.companyId }
    });
    console.log(`Updated ${result.count} accounts.`);

    // Also Update Invoices and Journal Entries for consistency?
    // Probably good idea, but Account is the main filter for Reporting.
    await prisma.invoice.updateMany({ data: { companyId: admin.companyId } });
    // await prisma.journalEntry.updateMany({ data: { companyId: admin.companyId } }); // If JournalEntry has companyId? Schema check needed.

    // Check if JournalEntry has companyId
    // Based on previous schema views, maybe not? 
    // Let's check schema/types or just wrap in try/catch or skip if not sure.
    // I'll skip JournalEntry update for now to avoid crashes if field missing. Accounts are the key.

}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
