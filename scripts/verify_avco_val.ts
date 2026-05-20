
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

// Mocking getSession and ensureDefaultAccounts for script context
async function getSession() {
    return { companyId: 'default_company_id' };
}

async function ensureDefaultAccounts(companyId: string) {
    // Return mock default accounts if needed, or query them
    const journal = await prisma.journal.findFirst({ where: { companyId } });
    const expense = await prisma.account.findFirst({ where: { type: 'expense', companyId } });
    const stockInput = await prisma.account.findFirst({ where: { type: 'liability', companyId } });
    return {
        journal: journal || { id: 'mock_journal_id' },
        expense: expense || { id: 'mock_expense_id' },
        stockInput: stockInput || { id: 'mock_input_id' }
    };
}

async function generateStockMoveEntryV2(moveId: string) {
    // 1. Fetch Full Move Details
    const move = await prisma.stockMove.findUnique({
        where: { id: moveId },
        include: {
            product: { include: { category: true } },
            sourceLocation: true,
            destLocation: true
        }
    });

    if (!move || !move.product || !move.product.category || !move.productId) return;

    // 2. AVCO Cost Update (Only for Incoming Moves to Internal Location from Non-Internal)
    let valuationCost = move.product.costPrice;

    if (move.product.category.costingMethod === 'avco' &&
        move.destLocation?.type === 'internal' &&
        move.sourceLocation?.type !== 'internal') {

        try {
            const currentStock = await prisma.stockQuant.aggregate({
                where: {
                    productId: move.productId,
                    location: { type: 'internal' }
                },
                _sum: { quantity: true }
            });

            const totalQty = new Decimal(currentStock._sum?.quantity || 0);
            const moveQty = new Decimal(move.quantityDone || move.quantity || 0);
            // The StockQuant update likely happened BEFORE this hook, so totalQty includes the moveQty.
            // We need the OLD quantity to weigh the average properly.
            const oldQty = totalQty.minus(moveQty);

            // Determine Incoming Price
            let purchasePrice = move.product.costPrice;
            if (move.purchaseLineId) {
                const poLine = await prisma.purchaseOrderLine.findUnique({ where: { id: move.purchaseLineId } });
                if (poLine) purchasePrice = poLine.priceUnit;
            }

            // Formula: ((OldQty * OldCost) + (MoveQty * MovePrice)) / (OldQty + MoveQty)
            if (totalQty.greaterThan(0)) {
                const oldValue = oldQty.mul(move.product.costPrice);
                const newValue = moveQty.mul(purchasePrice);
                const totalValue = oldValue.plus(newValue);
                const newCost = totalValue.div(totalQty);

                valuationCost = newCost; // Update local variable

                await prisma.product.update({
                    where: { id: move.productId },
                    data: { costPrice: newCost }
                });
            }
        } catch (e) {
            console.error("Failed to update AVCO cost", e);
        }
    }

    // 3. Automated Inventory Valuation (Journal Entries)
    if (move.product.category.valuation === 'real_time') {
        const sourceLoc = move.sourceLocation;
        const destLoc = move.destLocation;
        const companyId = move.companyId || 'default_company_id';

        if (!sourceLoc || !destLoc) return;

        // @ts-ignore
        const defaults = await ensureDefaultAccounts(companyId);

        let debitAccountId = null;
        let creditAccountId = null;
        // @ts-ignore
        let journalId = move.product.category.propertyStockJournalId || defaults.journal.id;

        // Determine Accounts based on Move Type
        // Incoming: Supplier -> Internal
        if (sourceLoc.type === 'supplier' && destLoc.type === 'internal') {
            debitAccountId = move.product.category.propertyStockAccountId || null;
            // @ts-ignore
            creditAccountId = move.product.category.propertyStockAccountInputId || defaults.stockInput?.id;
        }
        // Outgoing: Internal -> Customer
        else if (sourceLoc.type === 'internal' && destLoc.type === 'customer') {
            // @ts-ignore
            debitAccountId = move.product.category.propertyStockAccountOutputId || defaults.expense?.id;
            creditAccountId = move.product.category.propertyStockAccountId || null;
        }

        if (debitAccountId && creditAccountId) {
            const amount = new Decimal(move.quantityDone).mul(valuationCost);

            await prisma.journalEntry.create({
                data: {
                    name: `STJ/${move.id.substring(0, 8)}`,
                    date: new Date(),
                    journalId: journalId,
                    ref: move.name || `Stock Move ${move.product.name}`,
                    state: 'posted',
                    companyId: move.companyId,
                    items: {
                        create: [
                            {
                                accountId: debitAccountId,
                                name: `Stock Move: ${move.product.name}`,
                                debit: amount,
                                credit: new Decimal(0),
                                balance: amount,
                                productId: move.productId
                            },
                            {
                                accountId: creditAccountId,
                                name: `Stock Move: ${move.product.name}`,
                                debit: new Decimal(0),
                                credit: amount,
                                balance: amount.negated(),
                                productId: move.productId
                            }
                        ]
                    }
                }
            });
        }
    }
}

async function main() {
    console.log("Starting AVCO and Valuation Verification...");


    // 0. Ensure Company Exists
    let companyId = 'default_company_id';
    const company = await prisma.company.findFirst();
    if (company) {
        companyId = company.id;
        console.log(`Using existing company: ${company.name} (${companyId})`);
    } else {
        console.log("Creating default company...");
        const newCompany = await prisma.company.create({
            data: {
                id: companyId,
                name: 'Default Company',
                currency: 'USD'
            }
        });
        companyId = newCompany.id;
    }


    try {
        // 1. Create Accounts for Testing
        console.log("1. Setting up Accounts...");
        const stockAsset = await prisma.account.upsert({
            where: { code: '101000_TEST' },
            update: {},
            create: { code: '101000_TEST', name: 'Stock Asset Test', type: 'asset', companyId }
        });
        const stockInput = await prisma.account.upsert({
            where: { code: '200000_TEST' },
            update: {},
            create: { code: '200000_TEST', name: 'Stock Input Test', type: 'liability', companyId }
        });
        const stockJournal = await prisma.journal.upsert({
            where: { code: 'STJ_TEST' },
            update: {},
            create: { code: 'STJ_TEST', name: 'Stock Journal Test', type: 'general', companyId }
        });

        // 2. Create Product Category (AVCO + Automated)
        console.log("2. Creating Test Category...");
        const category = await prisma.productCategory.create({
            data: {
                name: `Test Category ${Date.now()}`,
                costingMethod: 'avco',
                valuation: 'real_time',
                propertyStockAccountId: stockAsset.id,
                propertyStockAccountInputId: stockInput.id,
                propertyStockAccountOutputId: stockInput.id, // Reusing for simplicity
                propertyStockJournalId: stockJournal.id,
            }
        });

        // 3. Create Product
        console.log("3. Creating Test Product...");
        const product = await prisma.product.create({
            data: {
                name: `Test Product ${Date.now()}`,
                categoryId: category.id,
                type: 'product', // Storable
                costPrice: 10.0, // Initial Cost
                companyId
            }
        });

        // 4. Create Locations
        const supplierLoc = await prisma.location.upsert({
            where: { id: 'partner_locations_suppliers' }, // Assuming this ID or fetch one
            update: {},
            create: { id: 'partner_locations_suppliers', name: 'Vendors', type: 'supplier' }
        });

        // Find an internal location or create one
        let internalLoc = await prisma.location.findFirst({ where: { type: 'internal' } });
        if (!internalLoc) {
            internalLoc = await prisma.location.create({
                data: { name: 'Stock', type: 'internal' }
            });
        }

        // 5. Scenario 1: First Incoming Move (10 units @ $20)
        // Current Cost: $10. Current Qty: 0 (assuming fresh).
        // Wait, AVCO uses current stock. If stock is 0, new cost = incoming price.
        // But our logic: ((OldQty * OldCost) + (MoveQty * MovePrice)) / (OldQty + MoveQty)

        console.log("4. Executing Stock Move 1...");
        // Define Purchase Price (Mocking PO Line efficiency by setting standard cost slightly different or via mock PO)
        // For this test, let's assume `costPrice` on product is the "Old Cost".
        // To simulate a different purchase price, we'd need a PO Line. 
        // Our logic falls back to `product.costPrice` if no PO Line. 
        // Let's update product cost to 10 manually first (did above).

        // We need to simulate that we bought it for $20. 
        // Since we don't want to create a full PO chain, let's temporarily mock the PO logic or just accept that 
        // if we don't have a PO, it uses the Product Cost. 
        // IF it uses Product Cost ($10), and Old Cost is $10 -> New Cost will be $10. No change.


        // 4.5 Ensure Partner Exists
        let partnerId = 'dummy_partner';
        const partner = await prisma.partner.findFirst();
        if (partner) {
            partnerId = partner.id;
        } else {
            const newPartner = await prisma.partner.create({
                data: {
                    name: 'Test Vendor',
                    companyId
                }
            });
            partnerId = newPartner.id;
        }

        // Let's CREATE A PO LINE to test properly.
        const po = await prisma.purchaseOrder.create({
            data: {
                name: 'PO/TEST/01',
                partnerId: partnerId, // Use valid partnerId
                companyId
            }
        });

        const poLine = await prisma.purchaseOrderLine.create({
            data: {
                orderId: po.id,
                productId: product.id,
                name: product.name,
                quantity: 10,
                priceUnit: 20.0, // DIFFERENT PRICE
                priceSubtotal: 200.0,
            }
        });

        const moveName = `WH/IN/TEST/${Date.now()}`;
        const move1 = await prisma.stockMove.create({
            data: {
                name: moveName,
                productId: product.id,
                sourceLocationId: supplierLoc.id,
                destLocationId: internalLoc.id,
                quantity: 10,
                quantityDone: 10,
                status: 'done',
                companyId,
                purchaseLineId: poLine.id
            }
        });

        // Manually create the Quant that would have resulted from this move 
        // (Since we are calling the hook manually, but usually the system does this)
        await prisma.stockQuant.create({
            data: {
                productId: product.id,
                locationId: internalLoc.id,
                quantity: 10,
                companyId
            }
        });

        // RUN THE LOGIC
        await generateStockMoveEntryV2(move1.id);

        // CHECK RESULTS
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`\n--- Verification Results ---`);
        console.log(`Product: ${product.name}`);
        console.log(`Initial Cost: 10.0`);
        console.log(`Incoming: 10 units @ 20.0`);
        console.log(`Expected New Cost: ((0 * 10) + (10 * 20)) / 10 = 20.0 (If starting from 0 qty)`);
        // Wait, if we added the quant manually, total qty is 10. Move is 10. Old Qty = 0.
        // Old Val = 0 * 10 = 0. New Val = 10 * 20 = 200. Total = 200. Total Qty = 10. New Cost = 20.
        console.log(`Actual New Cost: ${updatedProduct?.costPrice}`);

        const journalEntry = await prisma.journalEntry.findFirst({
            where: { ref: { contains: move1.name || '' } },
            include: { items: true }
        });

        console.log(`\nJournal Entry Created: ${!!journalEntry}`);
        if (journalEntry) {
            console.log(`State: ${journalEntry.state}`);
            journalEntry.items.forEach((item: any) => {
                console.log(` - Account: ${item.accountId} | Dr: ${item.debit} | Cr: ${item.credit}`);
            });
        }

    } catch (e) {
        console.error("Error during verification:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
