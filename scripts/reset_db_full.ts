import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("==========================================");
    console.log("⚠️ STARTING COMPLETE DATABASE ZERO-OUT ⚠️");
    console.log("==========================================");

    try {
        console.log("1. Deleting Sales and Purchases...");
        await prisma.saleOrderOption.deleteMany({});
        await prisma.saleOrderLineTax.deleteMany({});
        await prisma.saleOrderLine.deleteMany({});
        await prisma.saleOrder.deleteMany({});
        await prisma.purchaseOrderLineTax.deleteMany({});
        await prisma.purchaseOrderLine.deleteMany({});
        await prisma.purchaseOrder.deleteMany({});
        await prisma.saleAgreement.deleteMany({});
        await prisma.purchaseAgreement.deleteMany({});
        
        console.log("2. Deleting Invoices and Collections...");
        await prisma.collectionMessage.deleteMany({});
        await prisma.invoiceLineTax.deleteMany({});
        await prisma.invoiceLine.deleteMany({});
        await prisma.invoice.deleteMany({});
        
        console.log("3. Deleting Inventory and Stock...");
        await prisma.stockValuationLayer.deleteMany({});
        await prisma.stockMove.deleteMany({});
        await prisma.stockQuant.deleteMany({});
        await prisma.stockPicking.deleteMany({});
        await prisma.inventoryAdjustmentLine.deleteMany({});
        await prisma.inventoryAdjustmentRecord.deleteMany({});
        await prisma.stockPutawayRule.deleteMany({});
        await prisma.stockScrap.deleteMany({});
        await prisma.stockLot.deleteMany({});
        
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
        await prisma.accountStatementRequest.deleteMany({});
        await prisma.deferredEntryLine.deleteMany({});
        await prisma.deferredEntry.deleteMany({});
        
        console.log("5. Deleting Products and Categories...");
        await prisma.priceListItem.deleteMany({});
        await prisma.priceList.deleteMany({});
        await prisma.productSupplierInfo.deleteMany({});
        await prisma.productAttributeLine.deleteMany({});
        await prisma.productTax.deleteMany({});
        await prisma.productTag.deleteMany({});
        await prisma.bOMLine.deleteMany({});
        await prisma.billOfMaterial.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.productCategory.deleteMany({});
        await prisma.attributeValue.deleteMany({});
        await prisma.attribute.deleteMany({});
        
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
        
        console.log("7. Deleting Partners (Customers & Vendors)...");
        // We only keep partners linked directly to the system's users.
        const users = await prisma.user.findMany({
            where: { partnerId: { not: null } },
            select: { partnerId: true }
        });
        const userPartnerIds = users.map(u => u.partnerId as string);
        
        await prisma.resPartnerBank.deleteMany({});
        await prisma.portalUser.deleteMany({});
        await prisma.partnerTag.deleteMany({});
        
        const deleteResult = await prisma.partner.deleteMany({
            where: {
                id: { notIn: userPartnerIds }
            }
        });
        console.log(`Deleted ${deleteResult.count} partners.`);

        console.log("==========================================");
        console.log("✅ DATABASE SUCCESSFULLY ZEROED OUT ✅");
        console.log("Retained: Users, Roles, Accounts, Journals, Companies, UOMs, and System User Partners.");
        console.log("==========================================");

    } catch (error) {
        console.error("❌ ERROR during zero-out:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
