import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { SaleOrderForm } from '@/components/sales/SaleOrderForm';
import { getSession } from '@/lib/auth';
export default async function EditSaleOrderPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const order = await prisma.saleOrder.findUnique({
    where: {
      id: id
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
  const initialData = order ? {
    ...order,
    lines: order.lines.map((l: any) => ({
      ...l,
      qty: l.quantity,
      price: l.priceUnit,
      uom: l.unitName,
      cost: l.product?.costPrice || 0
    }))
  } : undefined;
  const session = await getSession();
  const canViewCost = session?.canViewCost ?? true;
  const allowedCustomerType = session?.allowedCustomerType || "ALL";

  return <SaleOrderForm initialData={initialData} showMargins={canViewCost} allowedCustomerType={allowedCustomerType} />;
}