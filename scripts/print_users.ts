import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    }
  });
  console.log("Users in DB:", JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
