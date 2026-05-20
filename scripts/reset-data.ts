import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⏳ جاري تصفير البيانات والمعاملات المالية والمخزنية...');

  try {
    // 1. Inventory & Stock
    console.log('- مسح حركات المخزون والتقييمات...');
    await prisma.stockValuationLayer.deleteMany({});
    await prisma.stockMove.deleteMany({});
    await prisma.stockQuant.deleteMany({});
    await prisma.stockScrap.deleteMany({});
    await prisma.stockPicking.deleteMany({});
    await prisma.inventoryAdjustmentLine.deleteMany({});
    await prisma.inventoryAdjustmentRecord.deleteMany({});

    // 2. Sales
    console.log('- مسح أوامر البيع والفواتير...');
    await prisma.saleOrderLine.deleteMany({});
    await prisma.saleOrderOption.deleteMany({});
    await prisma.saleOrder.deleteMany({});

    // 3. Purchases
    console.log('- مسح أوامر الشراء...');
    await prisma.purchaseOrderLine.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});

    // 4. Invoices & Accounting
    console.log('- مسح الفواتير والسندات والقيود...');
    await prisma.invoiceLine.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.cheque.deleteMany({});
    
    // مسح عناصر القيود قبل القيود نفسها لتجنب مشاكل الربط
    await prisma.journalItem.deleteMany({});
    await prisma.journalEntry.deleteMany({});

    // 5. Products & Items
    console.log('- مسح الأصناف والمكونات...');
    await prisma.productSupplierInfo.deleteMany({});
    await prisma.bOMLine.deleteMany({});
    await prisma.billOfMaterial.deleteMany({});
    await prisma.priceListItem.deleteMany({});
    await prisma.productAttributeLine.deleteMany({});
    await prisma.portalFavorite.deleteMany({});
    // Delete variants before templates (if needed)
    await prisma.product.deleteMany({
      where: { templateId: { not: null } }
    });
    // Delete main products
    await prisma.product.deleteMany({});

    console.log('✅ تم تصفير جميع البيانات بنجاح! النظام الآن نظيف تماماً.');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء مسح البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
