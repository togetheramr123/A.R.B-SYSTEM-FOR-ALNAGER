import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, Search, ShoppingBag, ChevronLeft, ChevronRight, Filter, Download } from "lucide-react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { serializeDecimal } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import { SalesTableClient } from "../SalesTableClient";
export default async function SalesOrdersPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    filter?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const search = searchParams?.search;
  const filter = searchParams?.filter;
  const t = await getTranslations("Sales");
  const currentPage = parseInt(searchParams?.page || "1");
  const pageSize = 20;
  const skip = (currentPage - 1) * pageSize;
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) redirect(`/${locale}`);
  const where: any = {
    companyId,
    ...(filter === "draft" ? {
      status: "draft"
    } : {}),
    ...(filter === "sale" ? {
      status: "sale"
    } : {}),
    ...(filter === "done" ? {
      status: "done"
    } : {}),
    ...(search ? {
      OR: [{
        name: {
          contains: search
        }
      }, {
        partner: {
          name: {
            contains: search
          }
        }
      }]
    } : {})
  };
  // Calculate date ranges
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    orders, 
    totalCount,
    invoicedThisMonthAgg,
    invoicedLastMonthAgg,
    waitingApproval,
    activeOrders
  ] = await Promise.all([
    prisma.saleOrder.findMany({
      where,
      include: {
        partner: true
      },
      orderBy: {
        dateOrder: "desc"
      },
      skip,
      take: pageSize
    }), 
    prisma.saleOrder.count({
      where
    }),
    
    // KPI: Invoiced this month
    prisma.invoice.aggregate({
      _sum: { amountTotal: true },
      where: {
        type: "out_invoice",
        state: { not: "cancel" },
        dateInvoice: { gte: startOfThisMonth }
      }
    }),

    // KPI: Invoiced last month
    prisma.invoice.aggregate({
      _sum: { amountTotal: true },
      where: {
        type: "out_invoice",
        state: { not: "cancel" },
        dateInvoice: { gte: startOfLastMonth, lt: startOfThisMonth }
      }
    }),

    // KPI: Waiting for approval
    prisma.saleOrder.count({
      where: { companyId, status: { in: ["draft", "sent"] } },
    }),

    // Active orders for calculating waiting receipt/bill
    prisma.saleOrder.findMany({
      where: { companyId, status: { in: ["sale", "done"] } },
      select: { lines: { select: { quantity: true } } } // TODO: Add qtyDelivered and qtyInvoiced if available, otherwise approximation
    })
  ]);

  const waitingReceipt = activeOrders.length; // Approximate for now if qtyDelivered is not tracked
  const waitingBill = activeOrders.length; // Approximate for now if qtyInvoiced is not tracked

  const totalPages = Math.ceil(totalCount / pageSize);
  const serializedOrders = serializeDecimal(orders);
  const startRecord = skip + 1;
  const endRecord = Math.min(skip + pageSize, totalCount);

  // Check if user is manager or admin
  const isManager = session?.role === "admin" || session?.role === "manager";
  const statusConfig: Record<string, {
    label: string;
    color: string;
  }> = {
    draft: {
      label: "عرض سعر",
      color: "bg-gray-100 text-gray-600 border-gray-200"
    },
    sent: {
      label: "تم الإرسال",
      color: "bg-blue-50 text-blue-700 border-blue-100"
    },
    sale: {
      label: "طلب بيع",
      color: "bg-emerald-50 text-emerald-700 border-emerald-100"
    },
    done: {
      label: "مقفل",
      color: "bg-slate-50 text-slate-700 border-slate-200"
    },
    cancel: {
      label: "ملغي",
      color: "bg-red-50 text-red-600 border-red-100"
    }
  };
  let pageTitle = "طلبات البيع";
  if (filter === "draft") pageTitle = "عروض الأسعار";
  if (filter === "sale") pageTitle = "أوامر البيع";

  return (
    <div className="p-0 bg-gray-50 min-h-screen">
      <SalesTableClient 
        orders={serializedOrders} 
        totalCount={totalCount} 
        currentPage={currentPage} 
        pageSize={pageSize} 
        searchQuery={search || ""} 
        baseUrl={`/${locale}/sales`} 
        locale={locale}
        pageTitle={pageTitle}
        activeFilter={filter || ""}
        isManager={isManager}
        metrics={{
          invoicedThisMonth: Number(serializeDecimal(invoicedThisMonthAgg)._sum?.amountTotal || 0),
          invoicedLastMonth: Number(serializeDecimal(invoicedLastMonthAgg)._sum?.amountTotal || 0),
          waitingApproval,
          waitingReceipt,
          waitingBill,
        }}
      />
    </div>
  );
}