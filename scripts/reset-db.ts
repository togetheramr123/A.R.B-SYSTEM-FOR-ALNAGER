import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Starting database reset (Functional Data)...');
    
    // 1. Delete Financial entries (Dependencies of Sale/Purchase/Invoices)
    console.log('Deleting Payments...');
    await prisma.payment.deleteMany({});
    
    console.log('Deleting Bank Statement Lines...');
    await prisma.bankStatementLine.deleteMany({});
    
    console.log('Deleting Journal Items...');
    await prisma.journalItem.deleteMany({});
    
    console.log('Deleting Journal Entries...');
    await prisma.journalEntry.deleteMany({});
    
    // 2. Delete Stock/Inventory entries
    console.log('Deleting Stock Valuation...');
    await prisma.stockValuationLayer.deleteMany({});
    
    console.log('Deleting Stock Moves...');
    await prisma.stockMove.deleteMany({});
    
    console.log('Deleting Stock Quants...');
    await prisma.stockQuant.deleteMany({});
    
    console.log('Deleting Stock Scrap/Lots...');
    await prisma.stockScrap.deleteMany({});
    await prisma.stockLot.deleteMany({});
    
    console.log('Deleting Stock Pickings...');
    await prisma.stockPicking.deleteMany({});
    
    // 3. Delete Sales & Purchases & Invoices
    console.log('Deleting Invoice Lines...');
    await prisma.invoiceLine.deleteMany({});
    console.log('Deleting Invoices...');
    await prisma.invoice.deleteMany({});
    
    console.log('Deleting Sale Order Lines...');
    await prisma.saleOrderLine.deleteMany({});
    console.log('Deleting Sale Orders...');
    await prisma.saleOrder.deleteMany({});
    
    console.log('Deleting Purchase Order Lines...');
    await prisma.purchaseOrderLine.deleteMany({});
    console.log('Deleting Purchase Orders...');
    await prisma.purchaseOrder.deleteMany({});

    // 4. Delete Products (Leaves config alone)
    console.log('Deleting Product Variants/Supplier Info/BOMs...');
    await prisma.productSupplierInfo.deleteMany({});
    await prisma.productAttributeLine.deleteMany({});
    await prisma.bOMLine.deleteMany({});
    await prisma.billOfMaterial.deleteMany({});
    console.log('Deleting Products...');
    await prisma.product.deleteMany({});

    // 5. Delete Partners (Customers/Vendors)
    console.log('Deleting Partner Banks/Tags...');
    await prisma.resPartnerBank.deleteMany({});
    await prisma.partnerTag.deleteMany({});
    console.log('Deleting Partners...');
    // Because partners have hierarchy (parentId), we delete them multiple times or raw query
    await prisma.$executeRaw`DELETE FROM "Partner"`; 

    // Note: Leaving Users, Categories, Accounts, Companies, Locations, UoM...
    console.log('✅ Database reset completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
