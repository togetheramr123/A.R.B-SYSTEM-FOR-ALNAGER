
import { PrismaClient } from '@prisma/client';
import { createProduct } from '../app/actions/inventory';
import { createSaleOrder, confirmSaleOrder, createInvoiceFromOrder } from '../app/actions/sales';
import { validatePicking } from '../app/actions/inventory';
import { confirmInvoice } from '../app/actions/accounting';
import { createPurchaseOrder, confirmPurchaseOrder } from '../app/actions/purchases';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting O2C Simulation...");

    // 1. Setup Data: Create Product & Partner
    const category = await prisma.productCategory.upsert({
        where: { id: 'avco-cat-o2c' },
        update: {},
        create: { name: 'O2C Category', costingMethod: 'avco', valuation: 'real_time' }
    });

    const product = await createProduct({
        name: `O2C Product ${Math.floor(Math.random() * 1000)}`,
        type: 'storable',
        salePrice: 100,
        costPrice: 0,
        categoryId: category.id,
        uom: 'Unit'
    });
    console.log(`[1] Product Created: ${product.name}`);

    const customer = await prisma.partner.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: { name: 'Test Customer', email: 'customer@example.com' }
    });

    // 2. Initialize Stock (Buy 10 @ 50) - Essential for COGS
    console.log("[2] Initializing Stock...");
    const po = await createPurchaseOrder({
        vendor: customer.id, // Buying from customer for simplicity or use another
        date: new Date(),
        lines: [{ productId: product.id, qty: 10, price: 50 }]
    });
    await confirmPurchaseOrder(po.id);
    const receipt = await prisma.stockPicking.findFirst({ where: { purchaseOrderId: po.id } });
    if (!receipt) throw new Error("Receipt not found");

    // Validate Receipt
    const moves = await prisma.stockMove.findMany({ where: { pickingId: receipt.id } });
    await validatePicking(receipt.id, moves.map(m => ({ id: m.id, productId: m.productId, qtyDone: m.quantity, secQtyDone: 0 })));
    await validatePicking(receipt.id, moves.map(m => ({ id: m.id, productId: m.productId, qtyDone: m.quantity, secQtyDone: 0 })));
    console.log("[2] Stock Initialized (Cost: 50, Qty: 10)");

    const debugQuants = await prisma.stockQuant.findMany({ where: { productId: product.id } });
    console.log('[DEBUG] Quants:', debugQuants);

    // 3. Create Sales Order
    console.log("[3] Creating Sales Order...");
    const so = await createSaleOrder({
        customer: customer.name,
        date: new Date(),
        lines: [{ productId: product.id, qty: 3, price: 100 }]
    });
    console.log(`[3] SO Created: ${so.name}`);

    // 4. Confirm SO
    await confirmSaleOrder(so.id);
    console.log("[4] SO Confirmed");

    // 5. Deliver Goods
    console.log("[5] Delivering Goods...");
    const delivery = await prisma.stockPicking.findFirst({ where: { saleOrderId: so.id } });
    if (!delivery) throw new Error("Delivery Picking not found");

    const deliveryMoves = await prisma.stockMove.findMany({ where: { pickingId: delivery.id } });
    await validatePicking(delivery.id, deliveryMoves.map(m => ({ id: m.id, productId: m.productId, qtyDone: m.quantity, secQtyDone: 0 })));
    console.log("[5] Delivery Validated");

    // 6. Check Stock Move Journal Entry (COGS)
    // Should be Dr COGS (Exp), Cr Valuation (Asset) -> 3 * 50 = 150
    const deliveryEntry = await prisma.journalEntry.findFirst({
        where: { ref: delivery.name },
        include: { items: true }
    });
    if (!deliveryEntry) console.warn("WARNING: Delivery Journal Entry not found!");
    else {
        console.log(`[6] Delivery Entry: ${deliveryEntry.name}`);
        deliveryEntry.items.forEach(item => {
            console.log(`  - Dr ${item.debit} | Cr ${item.credit} (Acct: ${item.accountId})`);
        });
        const totalDr = deliveryEntry.items.reduce((s, i) => s + i.debit, 0);
        if (totalDr !== 150) console.warn(`WARNING: Expected COGS 150, got ${totalDr}`);
    }

    // 7. Create Invoice
    console.log("[7] Creating Customer Invoice...");
    const invoice = await createInvoiceFromOrder(so.id);
    console.log(`[7] Invoice Created: ${invoice.name}`);

    // 8. Validate Invoice
    await confirmInvoice(invoice.id);
    console.log("[8] Invoice Validated");

    // 9. Check Invoice Journal Entry
    // Should be Dr Receivable (100*3 = 300), Cr Income (300)
    const invEntry = await prisma.journalEntry.findFirst({
        where: { name: invoice.name }, // Invoice name is usually used as entry name or ref
        include: { items: true }
    });
    // Backup check with ref if name mismatch (sometimes JRNL/ vs INV/)
    const invEntryRef = invEntry || await prisma.journalEntry.findFirst({ where: { ref: invoice.name }, include: { items: true } });

    if (!invEntryRef) console.warn("WARNING: Invoice Entry not found!");
    else {
        console.log(`[9] Invoice Entry: ${invEntryRef.name}`);
        invEntryRef.items.forEach(item => {
            console.log(`  - Dr ${item.debit} | Cr ${item.credit} (Acct: ${item.accountId})`);
        });
    }

    console.log("--- O2C SIMULATION COMPLETE ---");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
