import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Tax and Sequence data...');

  // --- Taxes ---
  const taxes = [
    { name: 'معفاة 0%', amount: 0, taxScope: 'sale', description: '0%', sequence: 1 },
    { name: 'ض.ق.م مخفّضة 5%', amount: 5, taxScope: 'sale', description: '5%', sequence: 2 },
    { name: 'ض.ق.م 14%', amount: 14, taxScope: 'sale', description: '14%', sequence: 3 },
    { name: 'معفاة شراء 0%', amount: 0, taxScope: 'purchase', description: '0%', sequence: 4 },
    { name: 'ض.ق.م شراء 5%', amount: 5, taxScope: 'purchase', description: '5%', sequence: 5 },
    { name: 'ض.ق.م شراء 14%', amount: 14, taxScope: 'purchase', description: '14%', sequence: 6 },
  ];

  for (const tax of taxes) {
    const existing = await prisma.tax.findFirst({ where: { name: tax.name } });
    if (!existing) {
      await prisma.tax.create({ data: tax });
      console.log(`  ✅ Tax: ${tax.name}`);
    } else {
      console.log(`  ⏭️  Tax exists: ${tax.name}`);
    }
  }

  // --- Sequences ---
  const sequences = [
    { code: 'sale.order', name: 'أمر البيع', prefix: 'S' },
    { code: 'purchase.order', name: 'أمر الشراء', prefix: 'P' },
    { code: 'account.invoice.out', name: 'فاتورة مبيعات', prefix: 'INV/' },
    { code: 'account.invoice.in', name: 'فاتورة مشتريات', prefix: 'BILL/' },
    { code: 'stock.picking.incoming', name: 'إيصال استلام', prefix: 'WH/IN/' },
    { code: 'stock.picking.outgoing', name: 'أمر تسليم', prefix: 'WH/OUT/' },
    { code: 'stock.picking.internal', name: 'تحويل داخلي', prefix: 'WH/INT/' },
    { code: 'account.payment', name: 'دفعة', prefix: 'PAY/' },
    { code: 'account.journal.entry', name: 'قيد يومية', prefix: 'JE/' },
  ];

  for (const seq of sequences) {
    const existing = await prisma.irSequence.findFirst({ where: { code: seq.code } });
    if (!existing) {
      await prisma.irSequence.create({ data: seq });
      console.log(`  ✅ Sequence: ${seq.code}`);
    } else {
      console.log(`  ⏭️  Sequence exists: ${seq.code}`);
    }
  }

  // --- Payment Terms ---
  const paymentTerms = [
    { name: 'سداد فوري' },
    { name: '15 يوم' },
    { name: '30 يوم' },
    { name: '60 يوم' },
    { name: 'نهاية الشهر التالي' },
  ];

  for (const pt of paymentTerms) {
    const existing = await prisma.paymentTerm.findFirst({ where: { name: pt.name } });
    if (!existing) {
      await prisma.paymentTerm.create({ data: pt });
      console.log(`  ✅ PaymentTerm: ${pt.name}`);
    } else {
      console.log(`  ⏭️  PaymentTerm exists: ${pt.name}`);
    }
  }

  console.log('✨ Seed complete!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
