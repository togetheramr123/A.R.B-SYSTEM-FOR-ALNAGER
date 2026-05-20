import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const invoice = await prisma.invoice.findUnique({
    where: { id: '9d0c5153-9ef0-447a-9f32-e9b98726582a' },
    include: { lines: true }
  });
  console.log(invoice?.lines.map(l => l.accountId));
}
run();
