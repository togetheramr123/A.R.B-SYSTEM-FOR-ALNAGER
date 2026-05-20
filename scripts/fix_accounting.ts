
// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Starting Accounting Fix (Generating Journal Entries)...');

    const company = await prisma.company.findFirst();
    if (!company) { console.error("No company"); return; }

    // Ensure Journals
    let salesJournal = await prisma.journal.findFirst({ where: { type: 'sale' } });
    if (!salesJournal) {
        salesJournal = await prisma.journal.create({
            data: { name: 'Customer Invoices', code: 'INV', type: 'sale', companyId: company.id }
        });
    }

    let purchaseJournal = await prisma.journal.findFirst({ where: { type: 'purchase' } });
    if (!purchaseJournal) {
        purchaseJournal = await prisma.journal.create({
            data: { name: 'Vendor Bills', code: 'BILL', type: 'purchase', companyId: company.id }
        });
    }

    // Ensure Accounts
    const receivable = await ensureAccount("120000", "Account Receivable", "asset_receivable");
    const income = await ensureAccount("400000", "Product Sales", "income");
    const tax = await ensureAccount("250000", "Tax Payable", "liability_current");

    const payable = await ensureAccount("210000", "Account Payable", "liability_payable");
    const expense = await ensureAccount("600000", "Expenses", "expense");

    // Fetch ALL syncable moves that are posted and missing journals
    const invoices = await prisma.invoice.findMany({
        where: {
            state: { in: ['posted', 'paid'] },
            journalEntryId: null,
        },
    });
    console.log(`Processing ${invoices.length} invoices/bills/refunds...`);

    for (const inv of invoices) {
        try {
            const isSales = inv.type === 'out_invoice' || inv.type === 'out_refund';
            const journalId = isSales ? salesJournal.id : purchaseJournal.id;

            const je = await prisma.journalEntry.create({
                data: {
                    name: inv.name || `INV/${inv.odooId}`,
                    ref: inv.name,
                    date: inv.dateInvoice,
                    journalId: journalId,
                    state: 'posted'
                }
            });
            await prisma.invoice.update({ where: { id: inv.id }, data: { journalEntryId: je.id } });

            if (inv.type === 'out_invoice') {
                // Debit Receivable
                await createItem(je.id, receivable.id, inv.amountTotal, 0, inv);
                // Credit Tax
                if (inv.amountTax > 0) await createItem(je.id, tax.id, 0, inv.amountTax, inv);
                // Credit Income
                await createItem(je.id, income.id, 0, inv.amountUntaxed, inv);
            }
            else if (inv.type === 'in_invoice') { // Vendor Bill
                // Credit Payable
                await createItem(je.id, payable.id, 0, inv.amountTotal, inv);
                // Debit Tax
                if (inv.amountTax > 0) await createItem(je.id, tax.id, inv.amountTax, 0, inv);
                // Debit Expense
                await createItem(je.id, expense.id, inv.amountUntaxed, 0, inv);
            }
            else if (inv.type === 'in_refund') { // Vendor Refund
                // Debit Payable
                await createItem(je.id, payable.id, inv.amountTotal, 0, inv);
                // Credit Tax
                if (inv.amountTax > 0) await createItem(je.id, tax.id, 0, inv.amountTax, inv);
                // Credit Expense (Reversal)
                await createItem(je.id, expense.id, 0, inv.amountUntaxed, inv);
            }
            else if (inv.type === 'out_refund') { // Customer Refund
                // Credit Receivable
                await createItem(je.id, receivable.id, 0, inv.amountTotal, inv);
                // Debit Tax
                if (inv.amountTax > 0) await createItem(je.id, tax.id, inv.amountTax, 0, inv);
                // Debit Income (Reversal)
                await createItem(je.id, income.id, inv.amountUntaxed, 0, inv);
            }

        } catch (e) { console.error(`Failed ${inv.id}: ${e.message}`); }
    }
    console.log("Done.");
}

async function createItem(entryId, accountId, debit, credit, inv) {
    await prisma.journalItem.create({
        data: {
            entryId: entryId,
            accountId: accountId,
            name: inv.name || 'Line',
            debit: debit,
            credit: credit,
            // strictly minimal schema
        }
    });
}

async function ensureAccount(code: string, name: string, type: string) {
    const company = await prisma.company.findFirst();
    let account = await prisma.account.findFirst({ where: { code } });
    if (!account) {
        account = await prisma.account.create({
            data: { code, name, type, companyId: company?.id }
        });
    }
    return account;
}

main();
