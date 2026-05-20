import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSpecific() {
    const invoiceId = 'bc4e62ae-5fb8-4053-a225-4f7ff570003e';
    console.log(`Deleting bad invoice ${invoiceId}...`);

    // Delete items first?
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { journalEntry: true } });
    if (invoice) {
        if (invoice.journalEntry) {
            await prisma.journalItem.deleteMany({ where: { entryId: invoice.journalEntry.id } });
            // Break relation first?
            await prisma.invoice.update({ where: { id: invoiceId }, data: { journalEntryId: null } });
            await prisma.journalEntry.delete({ where: { id: invoice.journalEntry.id } });
        }
        await prisma.invoiceLine.deleteMany({ where: { invoiceId } });
        await prisma.invoice.delete({ where: { id: invoiceId } });
        console.log('Deleted invoice and entry.');
    } else {
        console.log('Invoice not found.');
    }
}

fixSpecific()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
