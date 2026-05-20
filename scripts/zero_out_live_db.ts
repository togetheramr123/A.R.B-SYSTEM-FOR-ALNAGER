const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("==========================================");
    console.log("⚠️ STARTING DATABASE ZERO-OUT PROCESS ⚠️");
    console.log("==========================================");
    
    // We must delete in the correct order to respect foreign key constraints.
    // E.g., delete InvoiceLines before Invoices, StockMoves before Products, etc.
    // Prisma deleteMany does not automatically cascade if relationMode is not Prisma-level.

    try {
        console.log("1. Deleting Sales and Purchases...");
        await prisma.saleOrderLine.deleteMany({});
        await prisma.saleOrder.deleteMany({});
        await prisma.purchaseOrderLine.deleteMany({});
        await prisma.purchaseOrder.deleteMany({});
        
        console.log("2. Deleting Invoices and Collections...");
        await prisma.collectionMessage.deleteMany({});
        await prisma.invoiceLineTax.deleteMany({});
        await prisma.invoiceLine.deleteMany({});
        await prisma.invoice.deleteMany({});
        
        console.log("3. Deleting Inventory and Stock...");
        await prisma.stockMoveLine.deleteMany({});
        await prisma.stockMove.deleteMany({});
        await prisma.stockQuant.deleteMany({});
        await prisma.stockPicking.deleteMany({});
        await prisma.inventoryAdjustmentRecord.deleteMany({});
        await prisma.stockPutawayRule.deleteMany({});
        
        console.log("4. Deleting Accounting and Payments...");
        await prisma.journalItem.deleteMany({});
        await prisma.journalEntry.deleteMany({});
        await prisma.payment.deleteMany({});
        await prisma.cheque.deleteMany({});
        await prisma.bankStatementLine.deleteMany({});
        await prisma.bankStatement.deleteMany({});
        await prisma.cashTransaction.deleteMany({});
        await prisma.cashSettlement.deleteMany({});
        await prisma.budgetLine.deleteMany({});
        await prisma.budget.deleteMany({});
        await prisma.assetLine.deleteMany({});
        await prisma.asset.deleteMany({});
        
        console.log("5. Deleting Products and Categories (as requested)...");
        await prisma.priceListItem.deleteMany({});
        await prisma.priceList.deleteMany({});
        await prisma.productSupplierInfo.deleteMany({});
        await prisma.productAttributeValue.deleteMany({});
        await prisma.productAttribute.deleteMany({});
        await prisma.productVariant.deleteMany({});
        // Remove variants from base products first
        await prisma.product.deleteMany({});
        await prisma.productCategory.deleteMany({});
        
        console.log("6. Deleting Analytics, Tickets, and Follow-ups...");
        await prisma.ticketMessage.deleteMany({});
        await prisma.ticket.deleteMany({});
        await prisma.debtFollowUpHistory.deleteMany({});
        await prisma.debtFollowUp.deleteMany({});
        await prisma.auditLog.deleteMany({});
        await prisma.userPerformanceLog.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.approvalRequest.deleteMany({});
        await prisma.chatMessageReaction.deleteMany({});
        await prisma.chatMessage.deleteMany({});

        console.log("==========================================");
        console.log("✅ DATABASE SUCCESSFULLY ZEROED OUT ✅");
        console.log("Retained: Users, Roles, Partners, Accounts, Journals, Companies.");
        console.log("==========================================");

    } catch (error) {
        console.error("❌ ERROR during zero-out:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
