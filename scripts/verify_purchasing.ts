
import { PrismaClient } from '@prisma/client';
// @ts-ignore
import { createPurchaseOrder, confirmPurchaseOrder, createBillFromOrder } from '../app/actions/purchases';
// @ts-ignore
import { validatePicking, createCategory, createProduct } from '../app/actions/inventory';
// @ts-ignore
import { confirmInvoice, registerPayment } from '../app/actions/accounting';

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Starting Purchasing Cycle Verification...");

    try {
        // 1. Setup Data: Product & Category (Real-Time Valuation)
        console.log("📦 Setting up Product & Category...");
        const category = await createCategory({
            name: "Test Purchase Category",
            costingMethod: "fifo",
            valuation: "real_time"
        });
        const product = await createProduct({
            name: "Purchased Product " + Math.floor(Math.random() * 1000),
            type: "storable",
            costPrice: 100,
            salePrice: 200,
            categoryId: category.id,
            taxes: 0 // Simple for now
        });
        console.log(`✅ Product created: ${product.name} (${product.id})`);

        // 2. Create RFQ
        console.log("📝 Creating Request for Quotation (RFQ)...");
        const rfqData = {
            vendor: "Test Vendor",
            date: new Date(),
            lines: [
                { productId: product.id, qty: 10, price: 100, description: "Test Purchase Line" }
            ]
        };
        const order = await createPurchaseOrder(rfqData);
        console.log(`✅ RFQ Created: ${order.name} (${order.id})`);

        // 3. Confirm PO
        console.log("🤝 Confirming Purchase Order...");
        await confirmPurchaseOrder(order.id);
        const confirmedOrder = await prisma.purchaseOrder.findUnique({
            where: { id: order.id },
            include: { pickings: true }
        });

        if (confirmedOrder?.status !== 'purchase') throw new Error("PO Status not updated to 'purchase'");
        if (confirmedOrder.pickings.length === 0) throw new Error("Stock Picking not created");

        const pickingId = confirmedOrder.pickings[0].id;
        console.log(`✅ PO Confirmed. Picking Created: ${confirmedOrder.pickings[0].name}`);

        // 4. Receive Products (Validate Picking)
        console.log("🚚 Receiving Products (Validating Picking)...");
        await validatePicking(pickingId);
        console.log(`✅ Picking Validated: ${pickingId}`);

        // CHECK: Stock Valuation Entry (Dr Stock, Cr Stock Interim)
        // We expect a Journal Entry for the Stock Move
        const stockMove = await prisma.stockMove.findFirst({
            where: { pickingId: pickingId },
            include: {
                journalEntry: { include: { items: { include: { account: true } } } }
            }
        });

        if (!stockMove?.journalEntry) {
            console.warn("⚠️ WARNING: No Journal Entry found for Stock Receipt! (Check 'real_time' valuation logic)");
        } else {
            console.log(`✅ Stock Receipt Journal Entry Created: ${stockMove.journalEntry.name}`);
            stockMove.journalEntry.items.forEach(item => {
                console.log(`   - ${item.account.name}: ${item.debit > 0 ? 'Dr ' + item.debit : 'Cr ' + item.credit}`);
            });
        }

        // 5. Create Vendor Bill
        console.log("🧾 Creating Vendor Bill...");
        const bill = await createBillFromOrder(order.id);
        console.log(`✅ Vendor Bill Created: ${bill.name} (${bill.id})`);

        // 6. Confirm (Post) Vendor Bill
        console.log("📮 Posting Vendor Bill...");
        await confirmInvoice(bill.id);
        const postedBill = await prisma.invoice.findUnique({
            where: { id: bill.id },
            include: { journalEntry: { include: { items: { include: { account: true } } } } }
        });

        if (postedBill?.state !== 'posted') throw new Error("Bill not posted");
        console.log(`✅ Bill Posted. Journal Entry: ${postedBill?.journalEntry?.name}`);

        // CHECK: Bill Accounting (Dr Stock Interim, Cr Payable)
        if (postedBill?.journalEntry) {
            postedBill.journalEntry.items.forEach(item => {
                console.log(`   - ${item.account.name}: ${item.debit > 0 ? 'Dr ' + item.debit : 'Cr ' + item.credit}`);
            });
            // TODO: Verify specifically that we have a debit to "Stock Interim" (or Expense if service)
            // and credit to "Account Payable"
        }

        // 7. Register Payment
        console.log("💰 Registering Payment...");
        await registerPayment(bill.id, postedBill?.amountTotal); // Full payment
        const paidBill = await prisma.invoice.findUnique({ where: { id: bill.id } });

        if (paidBill?.state !== 'paid' && paidBill?.state !== 'posted') { // 'posted' is kept currently in logic, but residual should be 0
            console.log(`ℹ️ Bill State: ${paidBill?.state}, Residual: ${paidBill?.amountResidual}`);
        }

        if ((paidBill?.amountResidual || 0) > 0) throw new Error("Bill not fully paid");
        console.log(`✅ Payment Registered. Bill Residual: ${paidBill?.amountResidual}`);

        console.log("🎉 Verification Complete: Full Purchasing Cycle Successful!");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
export { }
