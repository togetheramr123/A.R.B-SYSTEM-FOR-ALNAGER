import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { PurchaseOrderForm } from "@/components/purchases/PurchaseOrderForm";
import { serializeDecimal } from "@/lib/serialize";
import { getUserGroupPermissions } from "@/app/actions/settings";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function PurchaseOrderDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    edit?: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const searchParams = await props.searchParams;
  const isEditing = searchParams?.edit === "true";
  const t = await getTranslations("Purchases");
  const session = await getSession();
  const [permissions, order] = await Promise.all([
    getUserGroupPermissions(),
    prisma.purchaseOrder.findUnique({
    where: {
      id: id
    },
    include: {
      partner: true,
      lines: {
        include: {
          product: true
        },
        orderBy: {
          sequence: "asc"
        }
      },
      entreprise: true,
      fiscalPosition: true,
      paymentTerm: true,
      company: true,
      messages: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  })
  ]);
  const canEditUomFactor = session?.role === "ADMIN" || permissions._isAdmin || permissions.inv_edit_uom_factor || false;
  if (!order) notFound();
  const orderAny = order as any;
  const userIds = [orderAny.createdById, orderAny.updatedById].filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds
      }
    },
    select: {
      id: true,
      name: true,
      email: true
    }
  });
  const createdBy = users.find(u => u.id === orderAny.createdById) || null;
  const updatedBy = users.find(u => u.id === orderAny.updatedById) || null;
  const serializedOrder = serializeDecimal({
    ...order,
    createdBy: createdBy ? {
      name: createdBy.name || createdBy.email
    } : null,
    updatedBy: updatedBy ? {
      name: updatedBy.name || updatedBy.email
    } : null
  });
  return <PurchaseOrderForm initialData={serializedOrder} defaultEditing={isEditing} canEditUomFactor={canEditUomFactor} />;
}