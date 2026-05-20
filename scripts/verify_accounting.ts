
import { PrismaClient } from '@prisma/client';
import { validatePicking, createCategory, createProduct } from '../app/actions/inventory';

const prisma = new PrismaClient();

async function verifyAccounting() {
    console.log("Starting Accounting Verification...");

    try {
        // 1. Setup Data: Company & Accounts (Assuming they exist or we create mocks)
        // For simplicity, we assume default accounts exist or we skip strict checks if they are missing
        // In a real test, we would seed them.

        // 2. Create Category (Real Time)
        console.log("Creating Category...");
        const category = await createCategory({
            name: "Real Time Test Category " + Math.floor(Math.random() * 1000),
            valuation: 'real_time',
            // We need valid account IDs here normally, but for the script we might need to fetch them
            // Let's assume some exist or finding them
        });

        // Fetch valid accounts to use
        const stockAccount = await prisma.account.findFirst({ where: { code: '100000' } }); // Proxy Stock
        const inputAccount = await prisma.account.findFirst({ where: { code: '200000' } }); // Stock Interim
        const journal = await prisma.journal.findFirst({ where: { type: 'stock' } }) || await prisma.journal.findFirst();

        if (!stockAccount || !inputAccount || !journal) {
            console.error("Missing required accounts/journal for test. Please seed DB first.");
            // We can try to proceed if the user has some data, but likely will fail
        }

        // Update category with accounts if found
        if (stockAccount && inputAccount && journal) {
            await prisma.productCategory.update({
                where: { id: category.id },
                data: {
                    propertyStockAccountId: stockAccount.id,
                    propertyStockAccountInputId: inputAccount.id,
                    propertyStockAccountOutputId: inputAccount.id,
                    propertyStockJournalId: journal.id
                }
            });
        }

        // 3. Create Product
        console.log("Creating Product...");
        const product = await createProduct({
            name: "Test Valuation Product " + Math.floor(Math.random() * 1000),
            type: 'storable',
            categoryId: category.id,
            costPrice: 100, // Important for valuation
            uom: 'Units',
            purchaseUom: 'Units'
        });

        // 4. Create Stock Picking (Incoming)
        console.log("Creating Stock Picking...");
        const picking = await prisma.stockPicking.create({
            data: {
                name: "WH/IN/TEST/" + Math.floor(Math.random() * 1000),
                pickingType: 'incoming',
                locationDestId: 'WH/Stock', // Mock location
                status: 'draft',
                // @ts-ignore
                companyId: 'default_company_id'
            }
        });

        // 5. Create Stock Move
        const move = await prisma.stockMove.create({
            data: {
                name: product.name,
                productId: product.id,
                pickingId: picking.id,
                quantity: 10,
                // @ts-ignore
                companyId: 'default_company_id',
                destLocationId: 'WH/Stock'
            }
        });

        // 6. Validate (This should trigger the hook)
        console.log("Validating Picking...");
        await validatePicking(picking.id, [{ id: move.id, qtyDone: 10 }]);

        // 7. Check Journal Items
        console.log("Checking Journal Entries...");
        await new Promise(r => setTimeout(r, 1000)); // Wait for async hook

        const items = await prisma.journalItem.findMany({
            where: { productId: product.id },
            include: { account: true, entry: true }
        });

        if (items.length > 0) {
            console.log("SUCCESS: Journal Items found!");
            items.forEach(item => {
                console.log(` - ${item.entry.name}: ${item.account.name} | Dr: ${item.debit} | Cr: ${item.credit}`);
            });
        } else {
            console.error("FAILURE: No Journal Items created.");
            // Debug info
            const updatedCat = await prisma.productCategory.findUnique({ where: { id: category.id } });
            console.log("Category Config:", updatedCat);
        }

    } catch (e) {
        console.error("Verification Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAccounting();
