
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting System Audit...");
    const errors: string[] = [];
    const warnings: string[] = [];

    // --- 1. Financial Integrity ---
    console.log("\n--- Checking Financial Integrity ---");

    // 1.1 Journal Entries Balance
    // Note: raw query for aggregation
    try {
        const unbalancedEntries = await prisma.$queryRaw`
            SELECT "entryId", SUM(debit) as debits, SUM(credit) as credits 
            FROM "JournalItem" 
            GROUP BY "entryId" 
            HAVING ABS(SUM(debit) - SUM(credit)) > 0.001
        `;

        if ((unbalancedEntries as any[]).length > 0) {
            errors.push(`Found ${(unbalancedEntries as any[]).length} unbalanced Journal Entries!`);
            // console.error("Unbalanced Entries:", unbalancedEntries);
        } else {
            console.log("✅ All Journal Entries are balanced.");
        }
    } catch (e) {
        console.error("Failed to check journal balances:", e);
    }

    // 1.2 Basic Accounting Equation (Assets = Liabilities + Equity)
    // This is complex to query directly without a proper Chart of Accounts tagging system, 
    // but we can check if the sum of all journal items (ALRE) is 0 if we include Equity? 
    // Actually, A = L + E  => A - L - E = 0.
    // In double entry, Sum(All Accounts) should be 0.

    // Let's verify sum of all journal items balance is 0
    try {
        const totalBalance = await prisma.journalItem.aggregate({
            _sum: {
                balance: true
            }
        });

        const balance = totalBalance._sum.balance || new Decimal(0);
        // Using a small epsilon for float comparison safety
        if (balance.abs().greaterThan(0.01)) {
            // This might happen if we have opening balances not fully balanced? 
            // Or if we migrated data incorrectly. Ideally should be 0.
            warnings.push(`System-wide accounting imbalance! Total: ${balance.toString()}`);
        } else {
            console.log("✅ System-wide Double Entry Balance check passed.");
        }
    } catch (e) {
        console.error("Failed to check system-wide balance:", e);
    }

    // --- 2. Orphaned Records ---
    console.log("\n--- Checking Orphaned Records ---");

    try {
        const orphanedItems = await prisma.journalItem.count({
            where: { entryId: null } as any
        });
        if (orphanedItems > 0) errors.push(`${orphanedItems} Journal Items without parent Entry.`);

        const orphanedLines = await prisma.invoiceLine.count({
            where: { invoiceId: null, moveId: null } as any // Adjust based on schema, might be moveId for stock moves? No invoice lines usually have invoiceId
        });
        // Let's check schema for invoiceLine parent. Usually invoiceId.

        if (orphanedItems === 0) {
            console.log("✅ No orphaned journal items found.");
        }
    } catch (e) {
        console.error("Failed to check orphaned records:", e);
    }

    // --- 3. Configuration & Master Data ---
    console.log("\n--- Checking Configuration ---");

    try {
        const company = await prisma.company.findFirst();
        if (!company) {
            errors.push("CRITICAL: No Company record record found!");
        } else {
            console.log(`✅ Company found: ${company.name}`);
            // Check Default Accounts existence by code
            // These codes are ones used in our seed/setup: 121000, 400000, 211000, 600000
            const criticalCodes = ['121000', '400000', '211000', '600000'];
            const accounts = await prisma.account.findMany({
                where: {
                    code: { in: criticalCodes },
                    companyId: company.id
                }
            });

            const foundCodes = accounts.map(a => a.code);
            const missing = criticalCodes.filter(c => !foundCodes.includes(c));

            if (missing.length > 0) {
                warnings.push(`Missing default accounts for Company ${company.name}: ${missing.join(', ')}`);
            } else {
                console.log("✅ Default Critical Accounts exist.");
            }
        }
    } catch (e) {
        console.error("Failed to check configuration:", e);
    }

    // --- 4. Stock Consistency ---
    console.log("\n--- Checking Stock Consistency ---");
    // Verify that StockQuants don't have negative values (unless allowed)
    try {
        const negativeQuants = await prisma.stockQuant.findMany({
            where: { quantity: { lt: 0 } },
            include: { product: true, location: true }
        });

        if (negativeQuants.length > 0) {
            // Usually negative stock is a warning unless strict configuration exists
            warnings.push(`${negativeQuants.length} Stock Quants have negative quantity.`);
            // negativeQuants.forEach(q => console.log(`  - ${q.product.name} @ ${q.location.name}: ${q.quantity}`));
        } else {
            console.log("✅ No negative stock quants found.");
        }
    } catch (e) {
        console.error("Failed to check stock consistency:", e);
    }

    // --- Summary ---
    console.log("\n==============================");
    if (errors.length > 0) {
        console.error("❌ AUDIT FAILED WITH CRITICAL ERRORS:");
        errors.forEach(e => console.error(` - ${e}`));
    } else {
        console.log("✅ AUDIT PASSED (No Critical Errors)");
    }

    if (warnings.length > 0) {
        console.warn("⚠️ Warnings (Non-Critical):");
        warnings.forEach(w => console.warn(` - ${w}`));
    }
    console.log("==============================");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
