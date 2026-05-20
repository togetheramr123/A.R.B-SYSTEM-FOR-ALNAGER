import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cogsAccount = await prisma.account.findFirst({ where: { code: '400002' } });
  if (!cogsAccount) return;
  const items = await prisma.journalItem.findMany({
    where: { accountId: cogsAccount.id },
    orderBy: { debit: 'desc' },
    take: 5,
    include: { entry: true, product: true }
  });
  for (const item of items) {
    console.log(`Entry: ${item.entry?.name}, Product: ${item.product?.name}, Debit: ${item.debit}, Credit: ${item.credit}`);
  }
}
main().then(() => prisma.$disconnect());
