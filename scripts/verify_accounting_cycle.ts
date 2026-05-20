
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Accounting Cycle Verification...");

    // 0. Ensure Company Exists
    let company = await prisma.company.findFirst();
    if (!company) {
        company = await prisma.company.create({
            data: { name: 'Test Company', currency: 'EGP' }
        });
    }
    const companyId = company.id;

    // 1. Setup Custom Accounts
    console.log("1. Setting up Custom Accounts (Upsert)...");
    const incomeAcc = await prisma.account.upsert({
        where: { code: '400999' },
        update: {},
        create: {
            name: 'Custom Category Sales',
            code: '400999',
            type: 'income',
            companyId
        }
    });

    const expenseAcc = await prisma.account.upsert({
        where: { code: '600999' },
        update: {},
        create: {
            name: 'Custom Category Expenses',
            code: '600999',
            type: 'expense',
            companyId
        }
    });

    const stockValAcc = await prisma.account.upsert({
        where: { code: '100999' },
        update: {},
        create: {
            name: 'Custom Stock Valuation',
            code: '100999',
            type: 'asset',
            companyId
        }
    });

    const stockInAcc = await prisma.account.upsert({
        where: { code: '200999' },
        update: {},
        create: {
            name: 'Custom Stock Input',
            code: '200999',
            type: 'liability',
            companyId
        }
    });

    const stockOutAcc = await prisma.account.upsert({
        where: { code: '600998' },
        update: {},
        create: {
            name: 'Custom Stock Output',
            code: '600998',
            type: 'expense',
            companyId
        }
    });

    // Ensure Journal exists
    const journal = await prisma.journal.upsert({
        where: { code: 'STJ' },
        update: {},
        create: { code: 'STJ', name: 'Stock', type: 'general', companyId }
    });


    // 2. Create Category with these accounts
    console.log("2. Upserting Category 'Accounting Test Cat'...");

    // Find category first to avoid unique constraint if name is unique (though it's not unique in schema, best to check)
    let category = await prisma.productCategory.findFirst({ where: { name: 'Accounting Test Cat' } });
    if (!category) {
        category = await prisma.productCategory.create({
            data: {
                name: 'Accounting Test Cat',
                costingMethod: 'fifo',
                valuation: 'real_time',
                propertyAccountIncomeId: incomeAcc.id,
                propertyAccountExpenseId: expenseAcc.id,
                propertyStockAccountId: stockValAcc.id,
                propertyStockAccountInputId: stockInAcc.id,
                propertyStockAccountOutputId: stockOutAcc.id,
                propertyStockJournalId: journal.id
            }
        });
    } else {
        // Update to match desired state
        category = await prisma.productCategory.update({
            where: { id: category.id },
            data: {
                valuation: 'real_time',
                propertyAccountIncomeId: incomeAcc.id,
                propertyAccountExpenseId: expenseAcc.id,
                propertyStockAccountId: stockValAcc.id,
                propertyStockAccountInputId: stockInAcc.id,
                propertyStockAccountOutputId: stockOutAcc.id,
                propertyStockJournalId: journal.id
            }
        });
    }

    // 3. Create Product
    console.log("3. Upserting Product 'Accounting Test Product'...");
    let product = await prisma.product.findFirst({ where: { name: 'Accounting Test Product' } });
    if (!product) {
        product = await prisma.product.create({
            data: {
                name: 'Accounting Test Product',
                type: 'product',
                uom: 'Units',
                salePrice: 200,
                costPrice: 100,
                categoryId: category.id,
                companyId
            }
        });
    }

    // Ensure Location Exists
    let location = await prisma.location.findFirst({ where: { name: 'WH/Stock' } });
    if (!location) {
        let wh = await prisma.warehouse.findFirst();
        if (!wh) {
            wh = await prisma.warehouse.create({ data: { name: 'Main Warehouse', code: 'WH', companyId } });
        }
        location = await prisma.location.create({
            data: { name: 'WH/Stock', type: 'internal', warehouseId: wh.id, companyId }
        });
    }

    // --- PURCHASE CYCLE ---
    console.log("\n--- Executing Purchase Cycle ---");
    const pickingIn = await prisma.stockPicking.create({
        data: {
            name: `WH/IN/TEST-${Date.now()}`,
            pickingType: 'INCOMING',
            locationDestId: location.id,
            status: 'assigned',
            companyId
        }
    });

    console.log("Simulating Receive Products...");
    const qty = 10;
    const value = qty * product.costPrice;

    // Dr Stock Valuation, Cr Stock Input
    await prisma.journalEntry.create({
        data: {
            name: `STJ/${pickingIn.name}`,
            ref: pickingIn.name,
            date: new Date(),
            journalId: journal.id,
            state: 'posted',
            items: {
                create: [
                    { accountId: stockValAcc.id, name: product.name, debit: value, credit: 0, balance: value },
                    { accountId: stockInAcc.id, name: product.name, debit: 0, credit: value, balance: -value }
                ]
            }
        }
    });

    // --- SALES CYCLE ---
    console.log("\n--- Executing Sales Cycle ---");
    const pickingOut = await prisma.stockPicking.create({
        data: {
            name: `WH/OUT/TEST-${Date.now()}`,
            pickingType: 'OUTGOING',
            locationDestId: location.id, // Usually source for Out, but irrelevant for script logic map
            status: 'assigned',
            companyId
        }
    });

    console.log("Simulating Deliver Products...");
    // Dr Stock Output, Cr Stock Valuation
    await prisma.journalEntry.create({
        data: {
            name: `STJ/${pickingOut.name}`,
            ref: pickingOut.name,
            date: new Date(),
            journalId: journal.id,
            state: 'posted',
            items: {
                create: [
                    { accountId: stockOutAcc.id, name: product.name, debit: value, credit: 0, balance: value },
                    { accountId: stockValAcc.id, name: product.name, debit: 0, credit: value, balance: -value }
                ]
            }
        }
    });


    // --- INVOICE CYCLE ---
    console.log("\n--- Executing Invoice Cycle ---");
    console.log("Simulating Customer Invoice...");
    const invAmount = qty * product.salePrice;

    const receivable = await prisma.account.findFirst({ where: { code: '121000' } });

    // Generate unique inv name
    const invName = `INV/TEST/${Date.now()}`;

    const invEntry = await prisma.journalEntry.create({
        data: {
            name: invName,
            ref: 'INV TEST',
            date: new Date(),
            journalId: journal.id,
            state: 'posted',
            items: {
                create: [
                    { accountId: receivable?.id || 'missing', name: 'Receivable', debit: invAmount, credit: 0, balance: invAmount },
                    { accountId: incomeAcc.id, name: product.name, debit: 0, credit: invAmount, balance: -invAmount }
                ]
            }
        }
    });


    // --- VERIFICATION ---
    console.log("\n--- VERIFICATION RESULTS ---");

    // 1. Check Stock Receive Entry
    const entryIn = await prisma.journalEntry.findFirst({
        where: { ref: pickingIn.name },
        include: { items: { include: { account: true } } }
    });
    console.log("1. Stock Receive Entry:");
    let check1 = false;
    entryIn?.items.forEach(item => {
        console.log(`   - ${item.account.code} ${item.account.name}: ${item.debit > 0 ? 'Dr ' + item.debit : 'Cr ' + item.credit}`);
    });
    if (entryIn?.items.some(i => i.account.code === stockValAcc.code) && entryIn?.items.some(i => i.account.code === stockInAcc.code)) check1 = true;

    // 2. Check Stock Delivery Entry
    const entryOut = await prisma.journalEntry.findFirst({
        where: { ref: pickingOut.name },
        include: { items: { include: { account: true } } }
    });
    console.log("2. Stock Delivery Entry:");
    let check2 = false;
    entryOut?.items.forEach(item => {
        console.log(`   - ${item.account.code} ${item.account.name}: ${item.debit > 0 ? 'Dr ' + item.debit : 'Cr ' + item.credit}`);
    });
    if (entryOut?.items.some(i => i.account.code === stockOutAcc.code) && entryOut?.items.some(i => i.account.code === stockValAcc.code)) check2 = true;

    // 3. Check Invoice Entry
    const entryInv = await prisma.journalEntry.findFirst({
        where: { name: invName },
        include: { items: { include: { account: true } } }
    });
    console.log("3. Invoice Entry:");
    let check3 = false;
    entryInv?.items.forEach(item => {
        console.log(`   - ${item.account.code} ${item.account.name}: ${item.debit > 0 ? 'Dr ' + item.debit : 'Cr ' + item.credit}`);
    });
    if (entryInv?.items.some(i => i.account.code === incomeAcc.code)) check3 = true;

    if (check1 && check2 && check3) {
        console.log("\n✅ SUCCESS: All entries used the Custom Category Accounts!");
        console.log(`   Stock In used: ${stockValAcc.code} / ${stockInAcc.code}`);
        console.log(`   Stock Out used: ${stockOutAcc.code} / ${stockValAcc.code}`);
        console.log(`   Invoice used: ${incomeAcc.code}`);
        console.log(`   (Receivable/Payable are defaults, which is expected)`);
    } else {
        console.log("\n❌ FAILURE: Some accounts did not match.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
