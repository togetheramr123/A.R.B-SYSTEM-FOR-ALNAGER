import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { PurchaseOrderForm } from "@/components/purchases/PurchaseOrderForm";
export default async function EditPurchaseOrderPage(props: {
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
  const order = await prisma.purchaseOrder.findUnique({
    where: {
      id
    },
    include: {
      lines: {
        include: {
          product: true
        }
      },
      partner: true
    }
  });
  if (!order) notFound();
  return <div className="max-w-7xl mx-auto p-6">
      {" "}
      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        تعديل أمر الشراء {order.name}
      </h1>{" "}
      <PurchaseOrderForm initialData={order} />{" "}
    </div>;
}