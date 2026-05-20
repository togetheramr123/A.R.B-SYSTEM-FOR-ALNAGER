import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  console.log("Fixing Purchase Order Lines names...");
  const purchaseLines = await prisma.purchaseOrderLine.findMany({
    where: { name: { startsWith: '[No Code] ' } }
  });
  let pCount = 0;
  for (const line of purchaseLines) {
    if (line.name) {
      await prisma.purchaseOrderLine.update({
        where: { id: line.id },
        data: { name: line.name.replace('[No Code] ', '') }
      });
      pCount++;
    }
  }
  console.log("Updated purchase lines:", pCount);

  console.log("Fixing Sale Order Lines names...");
  const saleLines = await prisma.saleOrderLine.findMany({
    where: { name: { startsWith: '[No Code] ' } }
  });
  let sCount = 0;
  for (const line of saleLines) {
    if (line.name) {
      await prisma.saleOrderLine.update({
        where: { id: line.id },
        data: { name: line.name.replace('[No Code] ', '') }
      });
      sCount++;
    }
  }
  console.log("Updated sale lines:", sCount);
}

fix()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
