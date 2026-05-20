import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipeInventory() {
  console.log("Starting to wipe inventory data...");

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Delete Stock Quants (Balances)
      console.log("Deleting Stock Quants...");
      await tx.stockQuant.deleteMany({});

      // 2. Delete Stock Valuation Layers (Costs)
      console.log("Deleting Stock Valuation Layers...");
      await tx.stockValuationLayer.deleteMany({});

      // 3. Delete Stock Moves & Pickings
      console.log("Deleting Stock Moves...");
      await tx.stockMove.deleteMany({});
      console.log("Deleting Stock Pickings...");
      await tx.stockPicking.deleteMany({});

      // 4. Delete Inventory Adjustments
      console.log("Deleting Inventory Adjustments...");
      await tx.inventoryAdjustmentLine.deleteMany({});
      await tx.inventoryAdjustmentRecord.deleteMany({});

      // 5. Delete Order Lines related to products
      console.log("Deleting Purchase Order Lines...");
      await tx.purchaseOrderLine.deleteMany({});
      console.log("Deleting Sale Order Lines...");
      await tx.saleOrderLine.deleteMany({});
      console.log("Deleting Invoice Lines...");
      await tx.invoiceLine.deleteMany({});

      // 6. Delete Product related tables
      console.log("Deleting Product dependencies...");
      await tx.productSupplierInfo.deleteMany({});
      await tx.priceListItem.deleteMany({});
      await tx.productTax.deleteMany({});
      
      // Additional relations (like BOMLine, AssetLine) just in case
      await tx.bOMLine.deleteMany({});
      await tx.billOfMaterial.deleteMany({});
      await tx.stockScrap.deleteMany({});

      // 7. Finally, Delete Products
      console.log("Deleting Products...");
      const result = await tx.product.deleteMany({});
      console.log(`Deleted ${result.count} products successfully.`);
    });

    console.log("Wipe completed successfully!");
  } catch (error) {
    console.error("Error wiping inventory data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeInventory();
