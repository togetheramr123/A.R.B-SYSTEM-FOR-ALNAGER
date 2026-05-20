import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function auditSystem() {
    console.log('--- 🛡️ SMART ERP DEEP SYSTEM AUDIT 🛡️ ---');
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    // 0. System Configuration
    console.log('🔍 Checking System Configuration...');
    const companies = await prisma.company.findMany();
    if (companies.length === 0) {
        errors.push('[CRITICAL] No Company record found. System is uninitialized.');
    } else {
        info.push(`✅ Found ${companies.length} active companies.`);
        companies.forEach(c => {
            if (!c.currency) warnings.push(`[WARNING] Company ${c.name} has no default currency.`);
        });
    }

    // 1. Financial Integrity: Journal Entries must balance
    console.log('🔍 Checking Financial Integrity...');
    const journalEntries = await prisma.journalEntry.findMany({
        include: { items: true }
    });

    let balancedEntries = 0;
    for (const entry of journalEntries) {
        let totalDebit = new Decimal(0);
        let totalCredit = new Decimal(0);
        entry.items.forEach(item => {
            totalDebit = totalDebit.plus(item.debit);
            totalCredit = totalCredit.plus(item.credit);
        });

        if (!totalDebit.equals(totalCredit)) {
            errors.push(`[CRITICAL] Journal Entry ${entry.name} (${entry.id}) is unbalanced! Debit: ${totalDebit}, Credit: ${totalCredit}`);
        } else {
            balancedEntries++;
        }
    }
    info.push(`✅ Verified ${balancedEntries}/${journalEntries.length} Journal Entries are balanced.`);

    // 2. Inventory Integrity: Negative Stock & Orphans
    console.log('🔍 Checking Inventory Integrity...');
    const stockQuants = await prisma.stockQuant.findMany({ include: { product: true, location: true } });
    let negativeStock = 0;
    for (const quant of stockQuants) {
        if (new Decimal(quant.quantity).isNegative()) {
            errors.push(`[CRITICAL] Negative Stock detected for ${quant.product.name} at ${quant.location.name}: ${quant.quantity}`);
            negativeStock++;
        }
    }
    if (negativeStock === 0) info.push('✅ No negative stock levels detected.');

    // 3. Partner Integrity
    console.log('🔍 Checking Partner Records...');
    const partners = await prisma.partner.findMany();
    let invalidPartners = 0;
    for (const p of partners) {
        if (!p.propertyAccountReceivableId || !p.propertyAccountPayableId) {
            warnings.push(`[WARNING] Partner ${p.name} missing default accounting entries.`);
            invalidPartners++;
        }
    }
    if (invalidPartners === 0) info.push(`✅ All ${partners.length} partners have valid accounting configuration.`);

    // 4. Product Integrity
    console.log('🔍 Checking Product Catalog...');
    const products = await prisma.product.findMany();
    let invalidProducts = 0;
    for (const p of products) {
        if (!p.categoryId) {
            warnings.push(`[WARNING] Product ${p.name} has no category assigned.`);
            invalidProducts++;
        }
    }
    info.push(`✅ Checked ${products.length} products.`);

    // 5. Transaction Integrity
    const invoices = await prisma.invoice.findMany({ where: { state: 'posted' } });
    let unpostedInvoices = 0;
    for (const inv of invoices) {
        if (!inv.journalEntryId) {
            errors.push(`[CRITICAL] Posted Invoice ${inv.name} has no generated Journal Entry.`);
            unpostedInvoices++;
        }
    }
    if (unpostedInvoices === 0) info.push(`✅ All ${invoices.length} posted invoices have valid Journal Entries.`);

    // Summary Output
    console.log('\n--- 📊 AUDIT SUMMARY REPORT 📊 ---');
    console.log('INFO:');
    info.forEach(i => console.log(i));

    if (warnings.length > 0) {
        console.warn('\n⚠️  WARNINGS (Action Recommended):');
        warnings.forEach(w => console.warn(w));
    } else {
        console.log('\n✅ No Warnings.');
    }

    if (errors.length > 0) {
        console.error('\n🚫 CRITICAL ERRORS (Immediate Action Required):');
        errors.forEach(e => console.error(e));
        process.exit(1);
    } else {
        console.log('\n✨ SYSTEM STATUS: HEALTHY ✨');
        console.log('The system infrastructure is sound. No critical data integrity issues found.');
    }
    console.log('-----------------------------------');
}

auditSystem()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
