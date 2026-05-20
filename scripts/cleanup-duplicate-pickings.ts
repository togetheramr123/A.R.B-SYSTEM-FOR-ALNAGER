// Cleanup script: Remove duplicate stock pickings
// Run with: npx tsx scripts/cleanup-duplicate-pickings.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Scanning for duplicate stock pickings...\n');

  // Find all purchase orders that have more than 1 picking
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      pickings: {
        include: {
          moves: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  let totalDuplicatesRemoved = 0;

  for (const order of orders) {
    if (order.pickings.length <= 1) continue;

    // Group pickings by type (INCOMING vs OUTGOING)
    const incomingPickings = order.pickings.filter(p => p.pickingType === 'INCOMING');
    const outgoingPickings = order.pickings.filter(p => p.pickingType === 'OUTGOING');

    // For each type, keep only the first one (oldest) and remove duplicates
    for (const group of [
      { type: 'INCOMING', pickings: incomingPickings },
      { type: 'OUTGOING', pickings: outgoingPickings }
    ]) {
      if (group.pickings.length <= 1) continue;

      const [keep, ...duplicates] = group.pickings;
      
      // Only remove duplicates that haven't been validated/done
      const removable = duplicates.filter(p => p.status !== 'done');

      if (removable.length === 0) continue;

      console.log(`📦 Order ${order.name}: Found ${removable.length} duplicate ${group.type} picking(s)`);
      console.log(`   ✅ Keeping: ${keep.name} (created: ${keep.createdAt})`);

      for (const dup of removable) {
        console.log(`   🗑️  Removing: ${dup.name} (created: ${dup.createdAt}, moves: ${dup.moves.length})`);
        
        // Delete moves first (foreign key)
        await prisma.stockMove.deleteMany({
          where: { pickingId: dup.id }
        });
        
        // Delete the duplicate picking
        await prisma.stockPicking.delete({
          where: { id: dup.id }
        });
        
        totalDuplicatesRemoved++;
      }
    }
  }

  // Also check sale orders
  const saleOrders = await prisma.saleOrder.findMany({
    include: {
      pickings: {
        include: {
          moves: true
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  for (const order of saleOrders) {
    if (order.pickings.length <= 1) continue;

    const outgoingPickings = order.pickings.filter(p => p.pickingType === 'OUTGOING');

    if (outgoingPickings.length <= 1) continue;

    const [keep, ...duplicates] = outgoingPickings;
    const removable = duplicates.filter(p => p.status !== 'done');

    if (removable.length === 0) continue;

    console.log(`🛒 Sale ${order.name}: Found ${removable.length} duplicate OUTGOING picking(s)`);
    console.log(`   ✅ Keeping: ${keep.name} (created: ${keep.createdAt})`);

    for (const dup of removable) {
      console.log(`   🗑️  Removing: ${dup.name} (created: ${dup.createdAt}, moves: ${dup.moves.length})`);
      
      await prisma.stockMove.deleteMany({
        where: { pickingId: dup.id }
      });
      
      await prisma.stockPicking.delete({
        where: { id: dup.id }
      });
      
      totalDuplicatesRemoved++;
    }
  }

  if (totalDuplicatesRemoved === 0) {
    console.log('\n✅ No duplicate pickings found!');
  } else {
    console.log(`\n✅ Cleaned up ${totalDuplicatesRemoved} duplicate picking(s)`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
