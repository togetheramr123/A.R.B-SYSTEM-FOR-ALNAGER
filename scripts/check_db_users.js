const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== USERS ===");
  const users = await prisma.user.findMany({
    include: {
      groups: true
    }
  });
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    groups: u.groups.map(g => g.name)
  })), null, 2));

  console.log("\n=== GROUPS ===");
  const groups = await prisma.resGroup.findMany();
  console.log(JSON.stringify(groups.map(g => ({
    id: g.id,
    name: g.name,
    category: g.category
  })), null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
