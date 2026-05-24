const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Dropping table ProductTax...");
  await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS "ProductTax" CASCADE;');
  console.log("Table ProductTax dropped successfully!");
}

main()
  .catch((e) => {
    console.error("Error dropping table:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
