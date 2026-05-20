import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting UOM Factor fix...');
  const products = await prisma.product.findMany({
    where: {
      hasSecondaryUnit: true,
      secondaryUom: {
        not: null
      }
    }
  });

  console.log(`Found ${products.length} products to check.`);

  let updatedCount = 0;

  for (const product of products) {
    if (!product.secondaryUom) continue;
    
    const currentFactor = Number(product.secondaryUomFactor);
    if (currentFactor > 1) continue; // Already correct

    const match = product.secondaryUom.match(/\d+/);
    if (match) {
      const extractedRatio = parseInt(match[0], 10);
      if (extractedRatio > 1) {
        console.log(`Updating product: ${product.name} - Unit: ${product.secondaryUom} -> Ratio: ${extractedRatio}`);
        await prisma.product.update({
          where: { id: product.id },
          data: { secondaryUomFactor: extractedRatio }
        });
        updatedCount++;
      }
    }
  }

  console.log(`Finished fixing. Updated ${updatedCount} products.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
