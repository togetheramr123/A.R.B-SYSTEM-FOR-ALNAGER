import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cogsAccount = await prisma.account.findFirst({ where: { code: '400002' } });
  const stockAccount = await prisma.account.findFirst({ where: { code: '103049' } });
  if (!cogsAccount || !stockAccount) return;

  const entries = await prisma.journalEntry.findMany({
    where: {
      OR: [
        { name: { contains: 'INV/2026/001' } },
        { name: { contains: 'INV/2026/002' } },
        { ref: { contains: 'INV/2026/001' } },
        { ref: { contains: 'INV/2026/002' } },
      ]
    },
    include: { items: true }
  });

  for (const entry of entries) {
    const isOpening = entry.ref?.includes('أرصدة') || entry.name?.includes('أرصدة') || entry.items.some(i => i.name?.includes('أرصدة'));
    if (!isOpening) continue;

    console.log(`Fixing Entry: ${entry.name}`);
    
    // Find all COGS and Stock Interim lines in this entry
    const linesToDelete = entry.items.filter(i => i.accountId === cogsAccount.id || i.accountId === stockAccount.id);
    
    if (linesToDelete.length > 0) {
      console.log(`Deleting ${linesToDelete.length} COGS/Stock lines...`);
      await prisma.journalItem.deleteMany({
        where: { id: { in: linesToDelete.map(l => l.id) } }
      });
    }
  }
}
main().then(() => prisma.$disconnect());
