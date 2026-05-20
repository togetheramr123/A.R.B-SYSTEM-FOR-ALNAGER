import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { serializeDecimal } from "@/lib/serialize";
import { PurchasesTableClient } from "../PurchasesTableClient";
export const dynamic = "force-dynamic";

export default async function PurchasesPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; search?: string; filter?: string }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const search = searchParams?.search;
  const filter = searchParams?.filter;
  const currentPage = parseInt(searchParams?.page || "1");
  const pageSize = 80;
  const skip = (currentPage - 1) * pageSize;
  const session = await getSession();
  const companyId = session?.companyId;

  // Build where clause based on filters
  const where: any = {
    ...(companyId ? { companyId } : {}),
    ...(filter === "draft" ? { status: "draft" } : {}),
    ...(filter === "sent" ? { status: "sent" } : {}),
    ...(filter === "purchase" ? { status: "purchase" } : {}),
    ...(filter === "done" ? { status: "done" } : {}),
    ...(filter === "cancel" ? { status: "cancel" } : {}),
    ...(filter === "rfq" ? { status: { in: ["draft", "sent"] } } : {}),
    ...(filter === "po" ? { status: { in: ["purchase", "done"] } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { partner: { name: { contains: search } } },
          ],
        }
      : {}),
  };

  // Calculate date ranges
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    orders,
    totalCount,
    // KPI: Invoiced Amounts
    invoicedThisMonthAgg,
    invoicedLastMonthAgg,
    // KPI: Waiting Approval
    waitingApproval,
    // Active orders for receipt/bill calculation
    activeOrders,
    // Footer: Total of filtered results
    totalAmountAggregate
  ] = await Promise.all([
    // Main data query
    prisma.purchaseOrder.findMany({
      where,
      include: {
        partner: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.purchaseOrder.count({ where }),

    // KPI: Invoiced this month
    prisma.invoice.aggregate({
      _sum: { amountTotal: true },
      where: {
        type: "in_invoice",
        state: { not: "cancel" },
        dateInvoice: { gte: startOfThisMonth }
      }
    }),

    // KPI: Invoiced last month
    prisma.invoice.aggregate({
      _sum: { amountTotal: true },
      where: {
        type: "in_invoice",
        state: { not: "cancel" },
        dateInvoice: { gte: startOfLastMonth, lt: startOfThisMonth }
      }
    }),

    // KPI: Waiting for approval
    prisma.purchaseOrder.count({
      where: { companyId, status: { in: ["draft", "sent"] } },
    }),

    // Active orders for calculating waiting receipt/bill
    prisma.purchaseOrder.findMany({
      where: { companyId, status: { in: ["purchase", "done"] } },
      select: { lines: { select: { quantity: true, qtyReceived: true, qtyInvoiced: true } } }
    }),

    // Footer: Total of filtered results
    prisma.purchaseOrder.aggregate({
      _sum: { amountTotal: true },
      where,
    }),
  ]);

  const waitingReceipt = activeOrders.filter(o => o.lines.some(l => Number(l.quantity) > Number(l.qtyReceived))).length;
  const waitingBill = activeOrders.filter(o => o.lines.some(l => Number(l.quantity) > Number(l.qtyInvoiced))).length;

  const serializedOrders = serializeDecimal(orders);
  const serializedFilteredTotal = serializeDecimal(totalAmountAggregate);

  let pageTitle = "كافة الطلبات";
  if (filter === "draft") pageTitle = "مسودات طلبات عروض الأسعار";
  if (filter === "sent") pageTitle = "طلبات عروض الأسعار المُرسلة";
  if (filter === "rfq") pageTitle = "طلبات عروض الأسعار";
  if (filter === "purchase") pageTitle = "أوامر الشراء";
  if (filter === "po") pageTitle = "أوامر الشراء";
  if (filter === "done") pageTitle = "مقفل";
  if (filter === "cancel") pageTitle = "ملغي";

  return (
    <div className="p-0 bg-gray-50 min-h-screen">
      <PurchasesTableClient
        orders={serializedOrders}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        searchQuery={search || ""}
        baseUrl={`/${locale}/purchases`}
        locale={locale}
        pageTitle={pageTitle}
        activeFilter={filter || ""}
        metrics={{
          invoicedThisMonth: Number(serializeDecimal(invoicedThisMonthAgg)._sum?.amountTotal || 0),
          invoicedLastMonth: Number(serializeDecimal(invoicedLastMonthAgg)._sum?.amountTotal || 0),
          waitingApproval,
          waitingReceipt,
          waitingBill,
        }}
        filteredTotal={Number(serializedFilteredTotal._sum?.amountTotal || 0)}
      />
    </div>
  );
}