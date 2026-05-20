import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import QuotationPrintTemplate from '@/components/sales/QuotationPrintTemplate';
import { serializeDecimal } from '@/lib/serialize';
export default async function SalePrintPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const order = await prisma.saleOrder.findUnique({
    where: {
      id
    },
    include: {
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  if (!order) notFound();
  return <QuotationPrintTemplate order={serializeDecimal(order)} locale={locale} />;
}