
import prisma from '../lib/prisma';
import { validatePicking } from '../app/actions/inventory';

async function main() {
    console.log('--- Verifying Warehouse -> Accounting Notification ---');

    console.log('[1] Creating Test PO...');
    const partner = await prisma.partner.findFirst();
    const product = await prisma.product.findFirst();

    if (!partner || !product) {
        console.error('Missing demo data (Partner/Product)');
        return;
    }

    const po = await prisma.purchaseOrder.create({
        data: {
            name: `PO-NOTIF-TEST-${Date.now()}`,
            partnerId: partner.id,
            status: 'purchase',
            lines: {
                create: {
                    productId: product.id,
                    name: product.name,
                    quantity: 10,
                    priceUnit: 10,
                    priceSubtotal: 100
                }
            }
        }
    });

    const location = await prisma.location.findFirst({ where: { name: 'WH/Stock' } }) || await prisma.location.findFirst();

    console.log('[2] Creating Receipt (Picking)...');
    const picking = await prisma.stockPicking.create({
        data: {
            name: `WH/IN/${po.name}`,
            purchaseOrderId: po.id,
            partnerId: partner.id,
            pickingType: 'INCOMING',
            locationDestId: location?.id || 'error-no-location',
            status: 'assigned'
        }
    });

    console.log('[3] Validating Picking (should trigger notification)...');
    // We need to pass movesData. For simplicity, we just pass what the action expects.
    // The action expects movesData to update moves, but also just needs pickingId for the notification logic which is largely independent of moves detailing in our simplified injection.
    // However, validatePicking iterates over movesData.
    // Let's create a move first.
    const move = await prisma.stockMove.create({
        data: {
            pickingId: picking.id,
            productId: product.id,
            quantity: 10,
            quantityDone: 0,
            destLocationId: location?.id || 'error',
            companyId: po.companyId
        }
    });

    const movesData = [{ id: move.id, qtyDone: 10, productId: product.id }];

    // We need to mock session for ensureAccess if it's called downstream?
    // validatePicking calls `getSession`.
    // We assume running via `tsx` (script) won't have session headers.
    // `validatePicking` checks `if (!session) throw Error`.
    // We might need to mock getSession in the action or just rely on the fact that `getSession` auto-logins admin in scripts (as seen in lib/auth.ts).

    await validatePicking(picking.id, movesData);

    console.log('[4] Checking Messages on PO...');
    const poWithMessages = await prisma.purchaseOrder.findUnique({
        where: { id: po.id },
        include: { messages: true }
    });

    const notification = poWithMessages?.messages.find(m => m.body === "Goods Received. Ready for Billing.");

    if (notification) {
        console.log('SUCCESS: Notification found!', notification.body);
    } else {
        console.error('FAILURE: Notification NOT found.');
        console.log('Messages:', poWithMessages?.messages);
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
