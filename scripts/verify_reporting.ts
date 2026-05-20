
import { PrismaClient } from '@prisma/client';
import { getProfitLoss, getBalanceSheet } from '../app/actions/reporting';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Reporting Verification...");

    // 1. Verify Profit & Loss
    // From O2C Simulation:
    // Income: 300
    // COGS: 150
    // Net Profit: 150
    // Note: Other simulations (P2P, Returns) might have affected this if they used Income/Expense accounts.
    // P2P: No Income/Expense (Asset/Liability only).
    // Returns: Vendor Refund (In_Refund) -> Cr Expense. Vendor Return -> Dr Stock Output (Expense).
    // In Returns Sim: 
    // Return Picking: Dr Output (Expense) 100 | Cr Asset 100.
    // Vendor Refund: Dr Payable 100 | Cr Expense/Interim 100.
    // Net Effect of Returns Sim on Expense: Dr 100 (Picking) - Cr 100 (Refund) = 0.
    // So Net Profit should be mostly driven by O2C.

    console.log("[1] Checking Profit & Loss...");
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const pnl = await getProfitLoss(startOfYear, now);
    console.log(`    Total Income: ${pnl.totalIncome}`);
    console.log(`    Total Expenses: ${pnl.totalExpenses}`);
    console.log(`    Net Profit: ${pnl.netProfit}`);

    pnl.income.forEach(l => console.log(`      Revenue: ${l.name} = ${l.balance}`));
    pnl.expenses.forEach(l => console.log(`      Expense: ${l.name} = ${l.balance}`));

    // 2. Verify Stock Valuation
    // Calculate Theoretical Inventory Value: Sum(Product.costPrice * StockQuant.quantity)
    console.log("[2] Checking Stock Valuation...");
    const products = await prisma.product.findMany({
        where: {
            type: 'storable',
            // OR: [
            //     { name: { contains: 'Simulated Product' } },
            //     { name: { contains: 'O2C Product' } },
            //     { name: { contains: 'Return Product' } }
            // ]
        },
        include: {
            category: true
        }
    });

    let theoreticalValue = 0;
    console.log("    Product-wise Valuation:");
    for (const p of products) {
        const stockAgg = await prisma.stockQuant.aggregate({
            where: { productId: p.id, location: { type: 'internal' } },
            _sum: { quantity: true }
        });
        const qty = stockAgg._sum.quantity || 0;
        const value = qty * (p.costPrice || 0); // Handle null cost
        if (value !== 0) {
            console.log(`      ${p.name}: ${qty} units * ${p.costPrice} = ${value}`);
            theoreticalValue += value;
        }
    }
    console.log(`    Total Theoretical Inventory Value: ${theoreticalValue}`);

    // Check Balance Sheet "Stock Valuation" Account
    const bs = await getBalanceSheet(now);
    const stockAssetLine = bs.assets.find(l => l.name.toLowerCase().includes('valuation') || l.name.toLowerCase().includes('stock'));

    // We might have multiple stock accounts if categories differ, so sum asset lines that look like stock
    // Or just look for the specific account used in simulations.
    // For simplicity, let's filter by type 'asset' and maybe check name.
    console.log("    Balance Sheet Assets:");
    bs.assets.forEach(l => console.log(`      [${l.code}] ${l.name}: ${l.balance}`));

    // Find '101000 Stock Valuation' usually
    const stockAccountBalance = bs.assets
        .filter(l => l.name.includes('Stock Valuation'))
        .reduce((sum, l) => sum + l.balance, 0);

    console.log(`    Balance Sheet Stock Value: ${stockAccountBalance}`);
    console.log(`    Difference: ${stockAccountBalance - theoreticalValue}`);

    if (Math.abs(stockAccountBalance - theoreticalValue) > 0.01) {
        console.warn("WARNING: Stock Valuation Mismatch!");
    } else {
        console.log("SUCCESS: Stock Valuation Matches!");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
