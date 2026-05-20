import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fix() {
  // Find the invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: '9d0c5153-9ef0-447a-9f32-e9b98726582a' },
    include: { lines: true }
  });
  if (!invoice) { console.log("Invoice not found"); return; }
  console.log("Invoice state:", invoice.state, "PO:", invoice.purchaseOrderId);
  
  if (invoice.purchaseOrderId) {
    for (const line of invoice.lines) {
      if (line.lineType === 'line' && line.productId) {
        const poLines = await prisma.purchaseOrderLine.findMany({
          where: { orderId: invoice.purchaseOrderId, productId: line.productId }
        });
        for (const poLine of poLines) {
          console.log(`Product ${line.productId}: qtyInvoiced=${poLine.qtyInvoiced}, will reset to 0`);
          await prisma.purchaseOrderLine.update({
            where: { id: poLine.id },
            data: { qtyInvoiced: 0 }
          });
        }
      }
    }
  }
  console.log("Done fixing qtyInvoiced");
}
fix().then(() => process.exit(0));
