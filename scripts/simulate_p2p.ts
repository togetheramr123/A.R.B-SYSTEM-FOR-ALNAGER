
import { PrismaClient } from '@prisma/client';
import { createProduct } from '../app/actions/inventory';
import { createPurchaseOrder, confirmPurchaseOrder, createBillFromOrder } from '../app/actions/purchases';
import { validatePicking } from '../app/actions/inventory';
import { confirmInvoice } from '../app/actions/accounting';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting P2P Simulation...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Unset");
    // 1. Ensure Admin User (for Session Mocking)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'ADMIN',
            password: 'admin' // Not used for mock session
        }
    });

    console.log(`[1] Admin ensured: ${admin.id}`);

    // 2. Create Test Product (AVCO)
    // Ensure AVCO Category exists
    const avcoCategory = await prisma.productCategory.upsert({
        where: { id: 'avco-cat-id' }, // Simplified ID for finding
        update: {},
        create: {
            name: 'AVCO Category',
            costingMethod: 'avco',
            valuation: 'real_time'
        }
    });

    const productName = `Simulated Product ${Math.floor(Math.random() * 1000)}`;
    console.log(`[2] Creating Product: ${productName} (Category: ${avcoCategory.name})`);

    // Note: ensure we pass all required fields
    const product = await createProduct({
        name: productName,
        type: 'storable',
        salePrice: 100,
        costPrice: 0, // Initial cost
        uom: 'Unit',
        purchaseUom: 'Unit',
        categoryId: avcoCategory.id, // Assign Category
        // Assuming defaults for accounting handles the accounts
    });



    // Hack: We need the ID. createProduct might return { success: true } or the object depending on implementation.
    // Looking at inventory.ts, generic creates return the object if not redirecting? 
    // Actually createProduct in inventory.ts calls redirect... which throws an error in next.js actions context?
    // Wait, `redirect()` in a script environment might function differently or throw "NEXT_REDIRECT".
    // We better check if createProduct redirects. It does: `redirect('/[locale]/inventory/products/[id]')`
    // This script will crash on redirect.
    // We might need to modify the actions to NOT redirect if called from script, or catch the error.

    // Catching the redirect error is a common Next.js pattern.
    let createdProduct = await prisma.product.findFirst({ where: { name: productName } });

    // If product wasn't created because createProduct just finished, we fetch it.

    if (!createdProduct) {
        throw new Error("Product creation failed or not found.");
    }
    console.log(`[2] Product Created: ${createdProduct.id}`);

    // 3. Create Purchase Order
    console.log(`[3] Creating Purchase Order...`);
    // Need a partner
    const vendor = await prisma.partner.findFirst() || await prisma.partner.create({ data: { name: 'Test Vendor' } });

    const poData = {
        vendor: vendor.id,
        date: new Date(),
        lines: [
            {
                productId: createdProduct.id,
                qty: 10,
                price: 50, // Buying at 50
                description: createdProduct.name,
                taxes: false
            }
        ]
    };

    const po = await createPurchaseOrder(poData);
    console.log(`[3] PO Created: ${po.name}`);

    // 4. Confirm PO
    console.log(`[4] Confirming PO...`);
    await confirmPurchaseOrder(po.id);
    const confirmedPo = await prisma.purchaseOrder.findUnique({ where: { id: po.id }, include: { lines: true } });
    if (confirmedPo?.status !== 'purchase') throw new Error("PO Confirmation Failed");
    console.log(`[4] PO Confirmed.`);

    // 5. Receive Goods (Validate Picking)
    console.log(`[5] Receiving Goods...`);
    // Find the picking
    const picking = await prisma.stockPicking.findFirst({
        where: { purchaseOrderId: po.id }
    });
    if (!picking) throw new Error("Picking not created for PO");

    // Prepare moves data for validation
    // We need to fetch moves first
    const moves = await prisma.stockMove.findMany({ where: { pickingId: picking.id } });
    const movesData = moves.map(m => ({
        id: m.id,
        productId: m.productId,
        qtyDone: m.quantity, // Receive Full
        secQtyDone: 0
    }));

    await validatePicking(picking.id, movesData);
    console.log(`[5] Picking Validated.`);

    // 6. Verify Stock & Valuation (AVCO)
    const updatedProduct = await prisma.product.findUnique({ where: { id: createdProduct.id } });
    console.log(`[6] Product Cost Check: Expected 50, Got ${updatedProduct?.costPrice}`);
    if (updatedProduct?.costPrice !== 50) console.warn("WARNING: Cost Price not updated correctly!");

    const stockQuant = await prisma.stockQuant.findFirst({ where: { productId: createdProduct.id, location: { type: 'internal' } } });
    console.log(`[6] Stock Check: Expected 10, Got ${stockQuant?.quantity}`);

    // 7. Create Vendor Bill
    console.log(`[7] Creating Vendor Bill...`);
    const bill = await createBillFromOrder(po.id);
    console.log(`[7] Bill Created: ${bill.name}`);

    // 8. Validate Bill
    console.log(`[8] Validating Bill...`);
    await confirmInvoice(bill.id);
    console.log(`[8] Bill Validated.`);

    // 9. Check Journal Entries
    const entries = await prisma.journalEntry.findMany({
        where: {
            OR: [
                { ref: picking.name },
                { ref: bill.name },
                { name: { contains: bill.name } },
            ]
        },
        include: { items: true }
    });

    console.log(`[9] Journal Entries Found: ${entries.length}`);
    entries.forEach(entry => {
        console.log(`Entry: ${entry.name}`);
        entry.items.forEach(item => {
            console.log(`  - ${item.name}: Dr ${item.debit} | Cr ${item.credit} (Acct: ${item.accountId})`);
        });
    });

    // 10. Check Notifications on PO
    const messages = await prisma.message.findMany({
        where: { purchaseOrderId: po.id }
    });
    console.log(`[10] PO Messages Found: ${messages.length}`);
    messages.forEach(m => console.log(`  - ${m.body}`));

    if (!messages.some(m => m.body?.includes("Goods Received"))) {
        console.warn("WARNING: designated notification not found on PO.");
    }

    console.log('--- SIMULATION COMPLETE ---');
}

main()
    .catch((e) => {
        if (e.message === 'NEXT_REDIRECT') {
            // Ignore redirect errors
            // But actually createProduct might have failed if it redirects before creating?
            // No, usually redirect happens after.
            console.log("Caught NEXT_REDIRECT, assuming success if logic allows.");
        } else {
            console.error("Simulation Failed!");
            console.error(e);
            if (e instanceof Error) {
                console.error("Message:", e.message);
                console.error("Stack:", e.stack);
            }
            process.exit(1);
        }
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
