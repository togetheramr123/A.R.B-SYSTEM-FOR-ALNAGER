
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Accounting Configuration Fix...");

    const companies = await prisma.company.findMany();
    console.log(`Found ${companies.length} companies.`);

    for (const company of companies) {
        console.log(`Configuring Company: ${company.name}`);

        // 1. Ensure Default Accounts
        const accountsToCreate = [
            { code: '121000', name: 'Account Receivable', type: 'receivable' },
            { code: '400000', name: 'Product Sales', type: 'income' },
            { code: '211000', name: 'Account Payable', type: 'payable' },
            { code: '600000', name: 'Product Expenses', type: 'expense' },
            { code: '250000', name: 'Tax Received', type: 'current_liability' },
            { code: '200000', name: 'Stock Interim (Received)', type: 'liability' },
            { code: '101000', name: 'Stock Valuation', type: 'current_asset' },
            { code: '101100', name: 'Stock Interim (Delivered)', type: 'current_asset' },
            { code: '101404', name: 'Bank', type: 'bank' },
        ];

        const accountMap: Record<string, string> = {};

        for (const acc of accountsToCreate) {
            const account = await prisma.account.upsert({
                where: { code: acc.code }, // Assuming code is unique globally or per company? Schema likely unique per company but for now we trust code.
                update: {},
                create: {
                    code: acc.code,
                    name: acc.name,
                    type: acc.type,
                    companyId: company.id
                }
            });
            accountMap[acc.code] = account.id;
        }

        // 2. Ensure Journals
        await prisma.journal.upsert({
            where: { code: 'INV' },
            update: {},
            create: { code: 'INV', name: 'Customer Invoices', type: 'sale', companyId: company.id }
        });
        const stockJournal = await prisma.journal.upsert({
            where: { code: 'STJ' },
            update: {},
            create: { code: 'STJ', name: 'Stock Journal', type: 'general', companyId: company.id }
        });

        // 3. Configure Product Categories
        // Update ALL categories to have valid accounting props for Real-Time Valuation
        const categories = await prisma.productCategory.findMany();
        console.log(`Updating ${categories.length} Product Categories...`);

        for (const cat of categories) {
            await prisma.productCategory.update({
                where: { id: cat.id },
                data: {
                    propertyAccountIncomeId: accountMap['400000'],
                    propertyAccountExpenseId: accountMap['600000'],
                    propertyStockAccountId: accountMap['101000'],
                    propertyStockAccountInputId: accountMap['200000'], // Received
                    propertyStockAccountOutputId: accountMap['600000'], // Delivered (COGS) - usually expense
                    propertyStockJournalId: stockJournal.id,
                    valuation: 'real_time',
                    costingMethod: 'avco'
                }
            });
        }
    }
    console.log("✅ Configuration Fix Complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
