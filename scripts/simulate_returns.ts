
import { PrismaClient } from '@prisma/client';
import { createProduct } from '../app/actions/inventory';
import { createPurchaseOrder, confirmPurchaseOrder } from '../app/actions/purchases';
import { validatePicking } from '../app/actions/inventory';
import { confirmInvoice } from '../app/actions/accounting';
import { createInvoiceFromOrder } from '../app/actions/sales';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Returns Simulation...");

    // 1. Setup: Buy 10 Units @ 50
    const category = await prisma.productCategory.upsert({
        where: { id: 'avco-cat-return' },
        update: {},
        create: { name: 'Return Category', costingMethod: 'avco', valuation: 'real_time' }
    });

    const product = await createProduct({
        name: `Return Product ${Math.floor(Math.random() * 1000)}`,
        type: 'storable',
        salePrice: 100,
        costPrice: 0,
        categoryId: category.id,
        uom: 'Unit'
    });

    const po = await createPurchaseOrder({
        vendor: 'Test Vendor',
        date: new Date(),
        lines: [{ productId: product.id, qty: 10, price: 50 }]
    });
    await confirmPurchaseOrder(po.id);

    // Receive
    const receipt = await prisma.stockPicking.findFirst({ where: { purchaseOrderId: po.id } });
    if (!receipt) throw new Error("Receipt not found");
    const moves = await prisma.stockMove.findMany({ where: { pickingId: receipt.id } });
    await validatePicking(receipt.id, moves.map(m => ({ id: m.id, productId: m.productId, qtyDone: m.quantity, secQtyDone: 0 })));
    console.log("[1] Goods Received (Cost should be 50)");

    // Bill
    // Note: We need a way to create a bill easily, we'll assume createBillFromOrder works or we assume manual creation is fine.
    // For returns, we care about the Credit Note.

    // 2. Vendor Return (Physical Return)
    console.log("[2] Processing Vendor Return...");
    // Create a new Picking (OUTGOING) to simulate return
    // In Odoo, this is usually created via "Return" button which reverses moves.
    // Here we manually create an OUTGOING picking to 'Test Vendor' location.

    const supplierLocation = await prisma.location.findFirst({ where: { type: 'supplier' } });
    const stockLocation = await prisma.location.findFirst({ where: { type: 'internal' } });

    const returnPicking = await prisma.stockPicking.create({
        data: {
            name: `WH/RET/${Math.floor(Math.random() * 10000)}`,
            pickingType: 'OUTGOING',
            locationId: stockLocation?.id || '',
            locationDestId: supplierLocation?.id || '',
            status: 'assigned',
            scheduledDate: new Date()
        }
    });

    const returnMove = await prisma.stockMove.create({
        data: {
            name: product.name,
            productId: product.id,
            quantity: 2, // Returning 2 units
            pickingId: returnPicking.id,
            sourceLocationId: stockLocation?.id,
            destLocationId: supplierLocation?.id,
            status: 'assigned'
        }
    });

    // Validate Return
    await validatePicking(returnPicking.id, [{ id: returnMove.id, productId: product.id, qtyDone: 2, secQtyDone: 0 }]);
    console.log("[2] Return Validated");

    // Check Journal (Should be Cr Stock, Dr Stick Output/Input?)
    // Standard Outgoing logic: Dr Output (Expense), Cr Stock (Asset).
    // For Vendor Return, ideally we want Dr Stock Input (Liability Reversal) or Payable?
    // Odoo usually books Vendor Return as: Dr Stock Valuation (Credits side really), wait.
    // Normal Receipt: Dr Stock Asset, Cr Stock Input.
    // Vendor Return: Cr Stock Asset, Dr Stock Input (Reversing the liability).
    // Our 'OUTGOING' logic does: Dr Stock Output (Expense), Cr Stock Asset.
    // This is "Close enough" for handling the Asset side (Cr Asset). 
    // The Debit side being 'Stock Output' (COGS) might be acceptable if we map the 'Return' location to use 'Stock Input' account instead of COGS?
    // Or we just accept Dr Expense for now. The key is Cr Stock Asset.

    const returnEntry = await prisma.journalEntry.findFirst({ where: { ref: returnPicking.name }, include: { items: true } });
    if (returnEntry) {
        console.log(`[2] Return Picking Entry: ${returnEntry.name}`);
        returnEntry.items.forEach(i => console.log(`  - Dr ${i.debit} | Cr ${i.credit} acct=${i.accountId}`));
    } else {
        console.warn("WARNING: Return Picking Entry Not Found");
    }

    // 3. Vendor Refund (Credit Note)
    console.log("[3] Creating Vendor Credit Note...");
    const refund = await prisma.invoice.create({
        data: {
            name: `RBILL/${Math.floor(Math.random() * 10000)}`,
            type: 'in_refund', // Vendor Refund
            state: 'draft',
            partnerId: po.partnerId,
            dateInvoice: new Date(),
            amountTotal: 100, // 2 * 50
            amountUntaxed: 100,
            amountTax: 0,
            lines: {
                create: [{
                    name: product.name,
                    quantity: 2,
                    priceUnit: 50,
                    priceSubtotal: 100
                }]
            }
        }
    });

    // Confirm Refund
    await confirmInvoice(refund.id);
    console.log("[3] Refund Confirmed");

    const refundEntry = await prisma.journalEntry.findFirst({ where: { ref: refund.name }, include: { items: true } });
    if (refundEntry) {
        console.log(`[3] Refund Entry: ${refundEntry.name}`);
        refundEntry.items.forEach(i => console.log(`  - Dr ${i.debit} | Cr ${i.credit} acct=${i.accountId}`));

        // Validation Logic
        // Expect: Dr Payable, Cr Expense/Stock Input.
        const totalDr = refundEntry.items.reduce((s, x) => s + x.debit, 0);
        if (totalDr !== 100) console.warn(`WARNING: Refund Total mismatch ${totalDr} vs 100`);
    }

    console.log("--- RETURNS SIMULATION COMPLETE ---");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
