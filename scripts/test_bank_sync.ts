import { fetchMockBankTransactions, createBankStatement, autoReconcile } from '../app/actions/bank-reconciliation';
import prisma from '../lib/prisma';

async function main() {
    console.log("Starting Bank Sync Test...");

    // 1. Get a Bank Journal
    const journal = await prisma.journal.findFirst({ where: { type: 'bank' } });
    if (!journal) {
        console.error("No Bank Journal found!");
        return;
    }
    console.log(`Using Journal: ${journal.name} (${journal.id})`);
    console.log(`Default Account ID: ${journal.defaultAccountId}`);

    if (!journal.defaultAccountId) {
        console.log("No default account! Attempting to find/link one...");
        const account = await prisma.account.findFirst({ where: { code: '101404' } }) || // Standard Bank
            await prisma.account.findFirst({ where: { type: 'liquidity' } });

        if (account) {
            await prisma.journal.update({
                where: { id: journal.id },
                data: { defaultAccountId: account.id }
            });
            console.log(`Linked Account: ${account.name} (${account.id})`);
        } else {
            console.error("Could not find a valid bank account to link!");
        }
    }

    // 2. Fetch Mock Transactions
    console.log("Fetching mock transactions...");
    const transactions = await fetchMockBankTransactions(journal.id);
    console.log(`Fetched ${transactions.length} transactions.`);
    console.log(transactions);

    if (transactions.length === 0) return;

    // 3. Create Statement
    console.log("Creating Bank Statement...");
    const statement = await createBankStatement({
        journalId: journal.id,
        transactions: transactions,
        name: `TEST-BNK-SYNC-${Date.now()}`,
        date: new Date(),
        balanceStart: 0,
        balanceEnd: 0 // Will be calc'd
    });
    console.log(`Statement Created: ${statement.name} (${statement.id})`);
    console.log(`Lines: ${statement.lines?.length || 0}`);

    // 4. Test Auto-Reconcile (Should be 0 if no matching journal items exist, but runs logic)
    console.log("Running Auto-Reconcile...");
    const matched = await autoReconcile(statement.id);
    console.log(`Auto-Reconciled ${matched} lines.`);

    console.log("Test Complete.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
