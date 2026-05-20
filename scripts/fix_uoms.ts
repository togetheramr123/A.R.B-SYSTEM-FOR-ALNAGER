import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUoms() {
  console.log("Starting to fix UOMs...");

  try {
    const uoms = await prisma.uom.findMany({
      where: {
        type: 'bigger'
      }
    });

    let updatedCount = 0;

    for (const uom of uoms) {
      const match = uom.name.match(/\d+/);
      if (match) {
        const extractedRatio = parseFloat(match[0]);
        if (extractedRatio > 0 && uom.ratio !== extractedRatio) {
          console.log(`Updating UOM: ${uom.name} - Old Ratio: ${uom.ratio} -> New Ratio: ${extractedRatio}`);
          await prisma.uom.update({
            where: { id: uom.id },
            data: { ratio: extractedRatio }
          });
          updatedCount++;
        }
      }
    }

    console.log(`Finished fixing UOMs. Updated ${updatedCount} UOMs.`);
  } catch (error) {
    console.error("Error fixing UOMs:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUoms();
