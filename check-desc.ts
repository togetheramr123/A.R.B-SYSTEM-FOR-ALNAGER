import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const purchaseLines = await prisma.purchaseOrderLine.findMany({
    take: 5,
    select: { id: true, name: true, productId: true }
  });
  console.log("Purchase Order Lines:", purchaseLines);
}

check()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
