
// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('📊 Generating Data Audit Report...');

    const report = {
        timestamp: new Date().toISOString(),
        system_status: "Mirroring Complete",
        counts: {},
        financials: {},
        integrity_checks: {},
        samples: {}
    };

    // 1. Counts
    report.counts = {
        products: await prisma.product.count(),
        partners: await prisma.partner.count(),
        sales_orders: await prisma.saleOrder.count(),
        purchase_orders: await prisma.purchaseOrder.count(),
        invoices: await prisma.invoice.count(),
        journal_entries: await prisma.journalEntry.count(),
        journal_items: await prisma.journalItem.count(),
        stock_pickings: await prisma.stockPicking.count(),
    };

    // 2. Financial Totals (Aggregation)
    const salesTotal = await prisma.saleOrder.aggregate({ _sum: { amountTotal: true } });
    const purchasesTotal = await prisma.purchaseOrder.aggregate({ _sum: { amountTotal: true } });
    const invoicesTotal = await prisma.invoice.aggregate({ _sum: { amountTotal: true } });

    // Journal Debits/Credits (Should be equal)
    const journalDebits = await prisma.journalItem.aggregate({ _sum: { debit: true } });
    const journalCredits = await prisma.journalItem.aggregate({ _sum: { credit: true } });

    report.financials = {
        total_sales_amount: salesTotal._sum.amountTotal || 0,
        total_purchases_amount: purchasesTotal._sum.amountTotal || 0,
        total_invoiced_amount: invoicesTotal._sum.amountTotal || 0,
        gl_total_debit: journalDebits._sum.debit || 0,
        gl_total_credit: journalCredits._sum.credit || 0,
        gl_balanced: Math.abs((journalDebits._sum.debit || 0) - (journalCredits._sum.credit || 0)) < 0.01
    };

    // 3. Integrity Checks
    const orphanedInvoices = await prisma.invoice.count({ where: { journalEntryId: null, state: 'posted' } });

    report.integrity_checks = {
        posted_invoices_without_journal_entry: orphanedInvoices,
        sync_health: (orphanedInvoices === 0) ? "HEALTHY" : "WARNING"
    };

    // 4. Samples (First 3 of each)
    report.samples.product = await prisma.product.findMany({ take: 3 });
    report.samples.partner = await prisma.partner.findMany({ take: 3 });
    report.samples.sale_order = await prisma.saleOrder.findMany({ take: 3, include: { lines: true } });
    report.samples.invoice = await prisma.invoice.findMany({ take: 3, include: { journalEntry: true } });
    report.samples.journal_entry = await prisma.journalEntry.findMany({
        take: 3,
        include: { items: true },
        where: { state: 'posted' }
    });

    console.log('✅ Data gathered. Writing to file...');

    // Define path in user's artifact folder
    const outputPath = 'C:\\Users\\abd alazez\\.gemini\\antigravity\\brain\\5405c2ea-71ca-4623-a813-7f42d9c3a9af\\audit_data.json';

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to: ${outputPath}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
