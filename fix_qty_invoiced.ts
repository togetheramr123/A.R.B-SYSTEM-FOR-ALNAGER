import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const soLines = await prisma.saleOrderLine.findMany({ include: { order: { include: { invoices: { include: { lines: true } } } } } });
  for (const line of soLines) {
    let trueInvoiced = 0;
    for (const inv of line.order.invoices) {
      if (inv.state === 'posted') {
        const invLine = inv.lines.find(l => l.productId === line.productId);
        if (invLine) trueInvoiced += Number(invLine.quantity);
      }
    }
    if (Number(line.qtyInvoiced) !== trueInvoiced) {
      console.log(`Fixing SO Line ${line.id} from ${line.qtyInvoiced} to ${trueInvoiced}`);
      await prisma.saleOrderLine.update({ where: { id: line.id }, data: { qtyInvoiced: trueInvoiced } });
    }
  }

  const poLines = await prisma.purchaseOrderLine.findMany({ include: { order: { include: { invoices: { include: { lines: true } } } } } });
  for (const line of poLines) {
    let trueInvoiced = 0;
    for (const bill of line.order.invoices) {
      if (bill.state === 'posted') {
        const invLine = bill.lines.find(l => l.productId === line.productId);
        if (invLine) trueInvoiced += Number(invLine.quantity);
      }
    }
    if (Number(line.qtyInvoiced) !== trueInvoiced) {
      console.log(`Fixing PO Line ${line.id} from ${line.qtyInvoiced} to ${trueInvoiced}`);
      await prisma.purchaseOrderLine.update({ where: { id: line.id }, data: { qtyInvoiced: trueInvoiced } });
    }
  }
}
main().then(() => prisma.$disconnect());
