const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { OR: [{ email: { contains: 'عميل' } }, { name: { contains: 'عميل' } }, { phone: { contains: 'عميل' } }] }
  });
  console.log('Users matching عميل:', users);
  
  const allUsers = await prisma.user.findMany({ select: { email: true, name: true, phone: true, role: true }});
  console.log('All users:', allUsers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
