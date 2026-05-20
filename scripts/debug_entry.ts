import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const invoiceName = 'INV/2026/4376';
    const invoice = await prisma.invoice.findFirst({
        where: { name: invoiceName },
        include: { journalEntry: { include: { items: { include: { account: true } } } } }
    });

    if (invoice) {
        console.log(`Invoice: ${invoice.name} (ID: ${invoice.id})`);
        console.log(`State: ${invoice.state}`);
        console.log(`Untaxed: ${invoice.amountUntaxed}`);
        console.log(`Tax: ${invoice.amountTax}`);
        console.log(`Total: ${invoice.amountTotal}`);

        if (invoice.journalEntry) {
            console.log(`Journal Entry: ${invoice.journalEntry.name}`);
            invoice.journalEntry.items.forEach(item => {
                console.log(`- ${item.name} | ${item.account.name} | Dr: ${item.debit} | Cr: ${item.credit}`);
            });
        } else {
            console.log('No Journal Entry linked (weird if the audit found it linked).');
        }
    } else {
        console.log('Invoice not found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
