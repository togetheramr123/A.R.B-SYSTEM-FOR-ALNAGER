import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { SaleOrderForm } from "@/components/sales/SaleOrderForm";
import { serializeDecimal } from "@/lib/serialize";
export const dynamic = "force-dynamic";
export default async function SaleOrderDetailPage(props: {
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
  const {
    getSession
  } = await import("@/lib/auth");
  const session = await getSession();
  const userRole = session?.role || "USER";
  if (id === "create") {
    return <SaleOrderForm userRole={userRole} />;
  }
  const order = await prisma.saleOrder.findUnique({
    where: {
      id
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
      user: true,
      salesTeam: true,
      warehouse: true,
      entreprise: true,
      fiscalPosition: true,
      paymentTerm: true,
      priceList: true,
      messages: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });
  if (!order) {
    notFound();
  }
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
  return <SaleOrderForm initialData={serializedOrder} defaultEditing={isEditing} userRole={userRole} />;
}