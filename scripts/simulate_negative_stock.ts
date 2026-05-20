
import prisma from '../lib/prisma';
import {
    createSaleOrder,
    confirmSaleOrder,
    requestNegativeStockApproval,
    approveNegativeStock
} from '../app/actions/sales';

async function main() {
    console.log('--- Simulating Negative Stock Approval Workflow ---');

    // 1. Setup: Create Product with 0 Stock
    console.log('[1] Creating "Zero Stock Product"...');
    const product = await prisma.product.create({
        data: {
            name: `ZeroStock-Prod-${Date.now()}`,
            type: 'storable',
            salePrice: 100,
            costPrice: 50,
            uom: 'Units',
            // No Quants created means 0 stock
        }
    });

    // 2. Create Sale Order
    console.log('[2] Creating Sale Order for 5 units...');
    const so = await createSaleOrder({
        customer: 'Azure Interior',
        date: new Date().toISOString(),
        lines: [
            { productId: product.id, qty: 5, price: 100 }
        ]
    });
    console.log(`PO Created: ${so.name} (Status: ${so.status})`);

    // 3. Attempt Confirmation (Should Fail)
    console.log('[3] Attempting Confirmation (Expect Failure)...');
    try {
        await confirmSaleOrder(so.id);
        console.error('FAILURE: Unexpected Success. Should have been blocked.');
    } catch (error: any) {
        if (error.message.includes('NEGATIVE_STOCK')) {
            console.log('SUCCESS: Blocked correctly with NEGATIVE_STOCK error.');
            console.log('Error Details:', error.message);
        } else {
            console.error('FAILURE: Unexpected Error:', error);
        }
    }

    // 4. Request Approval
    console.log('[4] Requesting Approval...');
    await requestNegativeStockApproval(so.id);

    const soAfterRequest = await prisma.saleOrder.findUnique({ where: { id: so.id } });
    console.log(`SO Approval Status: ${soAfterRequest?.approvalStatus}`); // Expect pending_approval

    // Verify Chatter
    const messages1 = await prisma.message.findMany({ where: { saleOrderId: so.id } });
    console.log('Chatter Messages:', messages1.map(m => m.body));


    // 5. Approve (Mock Manager)
    console.log('[5] Manager Approving...');
    await approveNegativeStock(so.id);

    const soAfterApprove = await prisma.saleOrder.findUnique({ where: { id: so.id } });
    console.log(`SO Approval Status: ${soAfterApprove?.approvalStatus}`); // Expect approved

    // Verify Chatter
    const messages2 = await prisma.message.findMany({ where: { saleOrderId: so.id } });
    console.log('Chatter Messages (Latest):', messages2[messages2.length - 1].body);

    // 6. Confirm Again (Should Success)
    console.log('[6] Attempting Confirmation (Expect Success)...');
    try {
        await confirmSaleOrder(so.id);
        console.log('SUCCESS: Sale Order Confirmed!');

        const finalSO = await prisma.saleOrder.findUnique({ where: { id: so.id } });
        console.log(`Final SO Status: ${finalSO?.status}`);
    } catch (error) {
        console.error('FAILURE: Confirmation failed even after approval:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
