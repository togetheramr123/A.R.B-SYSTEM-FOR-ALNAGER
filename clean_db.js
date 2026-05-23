const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Dropping constraints on ProductTax...");
  await prisma.$executeRawUnsafe('ALTER TABLE "ProductTax" DROP CONSTRAINT IF EXISTS "producttax_saletax_fkey";');
  await prisma.$executeRawUnsafe('ALTER TABLE "ProductTax" DROP CONSTRAINT IF EXISTS "producttax_purchtax_fkey";');
  await prisma.$executeRawUnsafe('ALTER TABLE "ProductTax" DROP CONSTRAINT IF EXISTS "ProductTax_taxId_fkey";');
  console.log("Constraints dropped successfully!");
}

main()
  .catch((e) => {
    console.error("Error dropping constraints:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
