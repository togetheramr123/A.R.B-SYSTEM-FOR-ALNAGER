
import { PrismaClient } from '@prisma/client';
import { validatePicking, createScrapOrder, validateScrap, createCategory, createProduct } from '../app/actions/inventory';
import { createPurchaseOrder, confirmPurchaseOrder, createBillFromOrder } from '../app/actions/purchases';
import { createSaleOrder, confirmSaleOrder, createInvoiceFromOrder } from '../app/actions/sales';
import { confirmInvoice } from '../app/actions/accounting';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Master Trading Cycle Verification...");

    // Ensure Internal Location exists
    let internalLocation = await prisma.location.findFirst({ where: { type: 'internal' } });
    if (!internalLocation) {
        console.log("⚠️ No Internal Location found. Creating 'WH/Stock'...");
        internalLocation = await prisma.location.create({
            data: { name: 'WH/Stock', type: 'internal' }
        });
    }
    const scrapLocation = await prisma.location.findFirst({ where: { type: { in: ['inventory', 'scrap'] } } })
        || await prisma.location.create({ data: { name: 'Virtual/Scrap', type: 'scrap' } });

    const company = await prisma.company.findFirst();
    if (!company) throw new Error("No Company found");

    // 1. Setup Accounts (COGS, Stock, Income, Expense, Interim)
    const incomeAccount = (await prisma.account.findFirst({ where: { code: '400000' } }))
        || (await prisma.account.findFirst({ where: { type: 'income' } }))
        || await prisma.account.create({ data: { code: '400000', name: 'Product Sales', type: 'income', companyId: company.id } });

    const expenseAccount = (await prisma.account.findFirst({ where: { code: '500000' } }))
        || (await prisma.account.findFirst({ where: { type: 'expense' } }))
        || await prisma.account.create({ data: { code: '500000', name: 'Expenses', type: 'expense', companyId: company.id } });

    const cogsAccount = (await prisma.account.findFirst({ where: { code: '500100' } }))
        || (await prisma.account.findFirst({ where: { name: { contains: 'Cost of Goods' } } }))
        || (await prisma.account.findFirst({ where: { code: { startsWith: '5' } } }))
        || await prisma.account.create({ data: { code: '500100', name: 'Cost of Goods Sold', type: 'expense', companyId: company.id } });

    const stockAccount = (await prisma.account.findFirst({ where: { code: '101000' } }))
        || (await prisma.account.findFirst({ where: { type: 'current_asset', code: { startsWith: '1' } } }))
        || await prisma.account.create({ data: { code: '101000', name: 'Stock Valuation', type: 'current_asset', companyId: company.id } });

    const interimInput = (await prisma.account.findFirst({ where: { code: '101100' } }))
        || (await prisma.account.findFirst({ where: { name: { contains: 'Input' } } }))
        || await prisma.account.create({ data: { code: '101100', name: 'Stock Interim (Received)', type: 'current_asset', companyId: company.id } });

    // Output Interim / COGS (We use COGS for immediate recognition)
    const interimOutput = cogsAccount;

    console.log(`ℹ️ Accounts: Income=${incomeAccount.name}, Expense=${expenseAccount.name}, Stock=${stockAccount.name}, Input=${interimInput.name}, Output(COGS)=${interimOutput.name}`);

    // 2. Setup: Partner
    let partner = await prisma.partner.findFirst({ where: { name: { contains: 'Trading Partner' } } });
    if (!partner) {
        partner = await prisma.partner.create({
            data: { name: 'Trading Partner', isCustomer: true, isVendor: true, companyId: company.id }
        });
    }

    // 3. Setup: Product & Category
    // Ensure Category is Real Time with Correct Accounts
    let category = await prisma.productCategory.findFirst({ where: { name: 'Trading Category' } });
    if (!category) {
        try {
            category = await prisma.productCategory.create({
                data: {
                    name: "Trading Category (Auto)",
                    costingMethod: "avco",
                    valuation: "real_time",
                    propertyAccountIncomeId: incomeAccount.id,
                    propertyAccountExpenseId: expenseAccount.id,
                    propertyStockAccountId: stockAccount.id,
                    propertyStockAccountInputId: interimInput.id,
                    propertyStockAccountOutputId: interimOutput.id, // Pointing to COGS for immediate recognition
                    // type: "storable" // Category doesn't have type
                }
            });
        } catch (e) {
            category = await prisma.productCategory.findFirst();
        }
    } else {
        await prisma.productCategory.update({
            where: { id: category.id },
            data: {
                valuation: 'real_time',
                costingMethod: 'average',
                propertyStockAccountId: stockAccount.id,
                propertyStockAccountInputId: interimInput.id,
                propertyStockAccountOutputId: interimOutput.id // COGS
            }
        });
    }

    const productName = `Trading Item ${Date.now()}`;
    const product = await prisma.product.create({
        data: {
            name: productName,
            type: 'product',
            costPrice: 0,
            salePrice: 200,
            companyId: company.id,
            categoryId: category?.id
        }
    });

    console.log(`✅ Created Product: ${product.name}`);

    // --- PURCHASE ---
    console.log("📦 Starting Purchase Cycle (10 @ $100)...");

    const po = await createPurchaseOrder({
        vendor: partner.name,
        date: new Date(),
        lines: [{ productId: product.id, qty: 10, price: 100 }]
    });
    console.log(`   -> Created PO: ${po.name}`);

    await confirmPurchaseOrder(po.id);
    const poPicking = await prisma.stockPicking.findFirst({ where: { origin: po.name } });

    // Receive
    await validatePicking(poPicking!.id);

    // Verify Stock Journal
    const stockMove = await prisma.stockMove.findFirst({
        where: { pickingId: poPicking!.id },
        orderBy: { date: 'desc' },
        include: { journalEntry: { include: { items: { include: { account: true } } } } }
    });

    // @ts-ignore
    if (stockMove?.journalEntry) {
        console.log("   -> Received Goods. Stock Entry: ✅ Created");
        // @ts-ignore
        console.log("      Lines:", stockMove.journalEntry.items.map(l => `${l.debit > 0 ? 'Dr' : 'Cr'} ${l.account.name}: ${l.debit || l.credit}`).join(', '));
    } else {
        console.log("   -> Received Goods. Stock Entry: ❌ Missing");
    }

    // Bill
    const bill = await createBillFromOrder(po.id);
    if (bill) {
        await confirmInvoice(bill.id); // Post
        console.log("   -> Posted Vendor Bill.");
    }

    // --- SALES ---
    console.log("💰 Starting Sales Cycle (5 @ $200)...");

    const so = await createSaleOrder({
        customer: partner.name,
        date: new Date(),
        lines: [{ productId: product.id, qty: 5, price: 200 }]
    });
    console.log(`   -> Created SO: ${so.name}`);

    await confirmSaleOrder(so.id);
    const soPicking = await prisma.stockPicking.findFirst({ where: { origin: so.name } });

    // Deliver
    await validatePicking(soPicking!.id);

    // Verify COGS Journal
    const outMove = await prisma.stockMove.findFirst({
        where: { pickingId: soPicking!.id },
        orderBy: { date: 'desc' },
        include: { journalEntry: { include: { items: { include: { account: true } } } } }
    });

    // @ts-ignore
    if (outMove?.journalEntry) {
        console.log("   -> Delivered Goods. COGS Entry: ✅ Created");
        // @ts-ignore
        console.log("      Lines:", outMove.journalEntry.items.map(l => `${l.debit > 0 ? 'Dr' : 'Cr'} ${l.account.name}: ${l.debit || l.credit}`).join(', '));
    } else {
        console.log("   -> Delivered Goods. COGS Entry: ❌ Missing");
    }

    // Invoice
    const inv = await createInvoiceFromOrder(so.id);
    if (inv) {
        await confirmInvoice(inv.id);
        console.log("   -> Posted Customer Invoice.");
    }

    // --- SCRAP ---
    console.log("🗑️ Starting Scrap Cycle (1 Unit)...");
    const formData = new FormData();
    formData.append('productId', product.id);
    formData.append('quantity', '1');
    formData.append('sourceLocationId', internalLocation.id);
    formData.append('scrapLocationId', scrapLocation.id);

    const scrapRes = await createScrapOrder(null, formData);
    if (scrapRes && scrapRes.id) {
        await validateScrap(scrapRes.id);

        const scrap = await prisma.stockScrap.findUnique({
            where: { id: scrapRes.id },
            include: {
                move: {
                    include: { journalEntry: { include: { items: { include: { account: true } } } } }
                }
            }
        });

        // @ts-ignore
        if (scrap?.move?.journalEntry) {
            console.log("   -> Validated Scrap. Scrap Entry: ✅ Created");
            // @ts-ignore
            console.log("      Lines:", scrap.move.journalEntry.items.map(l => `${l.debit > 0 ? 'Dr' : 'Cr'} ${l.account.name}: ${l.debit || l.credit}`).join(', '));
        } else {
            console.log("   -> Validated Scrap. Scrap Entry: ❌ Missing");
        }
    }

    console.log("🏁 Master Verification Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
