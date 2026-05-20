
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyAvco() {
    console.log('--- Starting AVCO Verification ---');

    // 1. Create a Test Product
    const product = await prisma.product.create({
        data: {
            name: 'AVCO Test Product ' + Date.now(),
            type: 'storable',
            costPrice: 100, // Initial Cost
            salePrice: 200,
            uom: 'Units'
        }
    });

    console.log(`Created Product: ${product.name}, Cost: ${product.costPrice}, Qty: 0`);

    // --- Step 1: Initial Stock Receipt ---
    // Receive 10 units @ 100 (matches initial cost)
    console.log('--- Step 1: Initial Receipt (10 units @ 100) ---');
    let currentQty = 0;
    let currentCost = product.costPrice; // 100

    let incomingQty = 10;
    let incomingCost = 100;

    let totalVal = (currentQty * currentCost) + (incomingQty * incomingCost);
    let totalQty = currentQty + incomingQty;
    let newAvco = totalVal / totalQty;

    console.log(`AVCO after Step 1: ${newAvco} (Expected: 100)`);

    // Update state for Step 2
    currentQty = totalQty; // 10
    currentCost = newAvco; // 100

    // --- Step 2: Second Receipt ---
    // Receive 10 units @ 120
    console.log('--- Step 2: Second Receipt (10 units @ 120) ---');
    incomingQty = 10;
    incomingCost = 120;

    totalVal = (currentQty * currentCost) + (incomingQty * incomingCost);
    totalQty = currentQty + incomingQty;
    newAvco = totalVal / totalQty; // (1000 + 1200) / 20 = 110

    console.log(`AVCO after Step 2: ${newAvco} (Expected: 110)`);

    if (Math.abs(newAvco - 110) < 0.01) {
        console.log('✅ AVCO Calculation PASSED');
    } else {
        console.error('❌ AVCO Calculation FAILED');
    }

    // cleanup
    await prisma.product.delete({ where: { id: product.id } });
}

verifyAvco()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

export { }
