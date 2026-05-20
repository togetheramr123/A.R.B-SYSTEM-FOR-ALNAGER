
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const products = await prisma.product.count();
    const partners = await prisma.partner.count();
    const sales = await prisma.saleOrder.count();
    const purchases = await prisma.purchaseOrder.count();
    const invoices = await prisma.invoice.count();
    console.log(`Products: ${products}`);
    console.log(`Partners: ${partners}`);
    console.log(`Sales: ${sales}`);
    console.log(`Purchases: ${purchases}`);
    console.log(`Invoices: ${invoices}`);
}
main().finally(() => prisma.$disconnect());
