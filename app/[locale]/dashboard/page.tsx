import { getTranslations } from "next-intl/server";
import { ShoppingCart, TrendingUp, Package, Wallet, CreditCard, AlertCircle, Users } from "lucide-react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { serializeDecimal } from "@/lib/serialize";
import { BookOpen } from "lucide-react";
import { getSession } from "@/lib/auth";
import PendingWorkDashboard from "@/components/dashboard/PendingWorkDashboard";
import { redirect } from "next/navigation";
import ClientDashboard from "@/components/dashboard/ClientDashboard";

export default async function DashboardPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations("Dashboard");
  const session = await getSession();
  const companyId = session?.companyId;
  const isAdmin = session?.role === "ADMIN";
  if (!companyId) {
    redirect(`/${locale}`);
  }

  // --- Client Dashboard Switch ---
  if (session?.role === "USER") {
    return <ClientDashboard locale={locale} />;
  }

  /* Get current month start and end dates */
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  /* Fetch real stats filtered by Company and Current Month */
  const [partnerCount, productCount, orderCount, invoiceAggregate, billAggregate, stockQuants] = await Promise.all([prisma.partner.count({
    where: {
      companyId
    }
  }), prisma.product.count({
    where: {
      companyId
    }
  }), prisma.saleOrder.count({
    where: {
      status: "sale",
      companyId,
      dateOrder: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  }), prisma.invoice.aggregate({
    _sum: {
      amountTotal: true
    },
    where: {
      state: {
        in: ["posted", "paid"]
      },
      type: "out_invoice",
      companyId,
      dateInvoice: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  }), prisma.invoice.aggregate({
    _sum: {
      amountTotal: true
    },
    where: {
      state: {
        in: ["posted", "paid"]
      },
      type: "in_invoice",
      companyId,
      dateInvoice: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    }
  }), prisma.stockQuant.findMany({
    where: {
      companyId,
      location: {
        type: "internal"
      }
    },
    include: {
      product: true
    }
  })]);
  const statsData = serializeDecimal({
    invoiceTotal: invoiceAggregate._sum.amountTotal || 0,
    billTotal: billAggregate._sum.amountTotal || 0,
    stockQuants: stockQuants
  });
  /* Calculate Stock Value (Quantity * Cost) */
  const stockValue = statsData.stockQuants.reduce((sum: number, quant: any) => {
    return sum + quant.quantity * (quant.product.costPrice || 0);
  }, 0);
  const netProfit = Number(statsData.invoiceTotal) - Number(statsData.billTotal);
  const stats = [{
    label: t("revenue"),
    value: Number(statsData.invoiceTotal).toLocaleString("en-US") + " " + t("currency"),
    icon: Wallet,
    color: "text-teal-700",
    bg: "bg-emerald-50",
    link: `/${locale}/accounting/invoices`
  }, {
    label: t("purchaseTotal"),
    value: Number(statsData.billTotal).toLocaleString("en-US") + " " + t("currency"),
    icon: CreditCard,
    color: "text-red-700",
    bg: "bg-rose-50",
    link: `/${locale}/accounting/bills`
  }, {
    label: "التقارير المالية",
    value: "عرض التفاصيل",
    icon: TrendingUp,
    color: "text-blue-600",
    bg: "bg-blue-50",
    link: `/${locale}/accounting/reporting`
  }, {
    label: t("stockValue"),
    value: Number(stockValue).toLocaleString("en-US") + " " + t("currency"),
    icon: Package,
    color: "text-amber-600",
    bg: "bg-amber-50",
    link: `/${locale}/inventory/valuation`
  }];
  const quickMetrics = [{
    label: t("partners"),
    value: partnerCount,
    icon: Users,
    color: "text-slate-600"
  }, {
    label: t("products"),
    value: productCount,
    icon: Package,
    color: "text-slate-600"
  }, {
    label: t("sales"),
    value: orderCount,
    icon: ShoppingCart,
    color: "text-slate-600"
  }];
  const recentInvoices = await prisma.invoice.findMany({
    take: 10,
    orderBy: {
      dateInvoice: "desc"
    },
    where: {
      companyId,
      type: "out_invoice"
    },
    include: {
      partner: true
    }
  });
  const serializedInvoices = serializeDecimal(recentInvoices);
  const shortageProductsRaw = await prisma.product.findMany({
    where: {
      type: "storable",
      companyId,
      active: true
    },
    include: {
      stockQuants: {
        where: {
          location: {
            type: "internal"
          }
        }
      }
    }
  });
  const shortageProducts = shortageProductsRaw.map((p: any) => {
    const qty = p.stockQuants.reduce((sum: number, q: any) => sum + Number(q.quantity), 0);
    return {
      ...p,
      qty
    };
  }).filter((p: any) => p.qty <= 5).sort((a: any, b: any) => a.qty - b.qty).slice(0, 5);
  return <div className="space-y-10 pb-20">
      {" "}
      {/* Pending Work — أعمالك المعلقة */} <PendingWorkDashboard />{" "}
      {/* Hero Header */}{" "}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-sm border border-gray-200 shadow-sm relative overflow-hidden">
        {" "}
        <div className="relative z-10">
          {" "}
          <h1 className="text-2xl font-medium text-gray-800 tracking-tight">
            {t("title")}
          </h1>{" "}
          <p className="text-gray-500 mt-1 text-sm">{t("subTitle")}</p>{" "}
        </div>{" "}
        <div className="flex gap-3 relative z-10">
          {" "}
          <div className="hidden lg:flex items-center gap-6 mr-6 pr-6 border-r border-gray-200">
            {" "}
            {quickMetrics.map((m, i) => <div key={i} className="text-center">
                {" "}
                <p className="text-[11px] uppercase text-gray-500">
                  {m.label}
                </p>{" "}
                <p className="text-lg font-medium text-gray-800">
                  {m.value}
                </p>{" "}
              </div>)}{" "}
          </div>{" "}
          <div className="flex flex-col md:flex-row gap-2">
            {" "}
            <Link href={`/${locale}/manual`} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-sm text-sm font-medium transition-colors flex items-center gap-2 border border-gray-200">
              {" "}
              <BookOpen className="w-4 h-4 text-gray-500" /> دليل المستخدم{" "}
            </Link>{" "}
            <Link href={`/${locale}/accounting/reporting`} className="bg-[#714B67] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#5a3b52] transition-colors flex items-center gap-2">
              {" "}
              <TrendingUp className="w-4 h-4" /> {t("performanceReport")}{" "}
            </Link>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Financial Stats Grid — Admin Only */}{" "}
      {isAdmin && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {" "}
          {stats.map((stat: any, i: number) => <Link key={i} href={stat.link} className="block group">
              {" "}
              <div className="bg-white p-7 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-sm hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
                {" "}
                <div className="flex justify-between items-start mb-6">
                  {" "}
                  <div className={`${stat.bg} ${stat.color} p-4 rounded-sm shadow-inner`}>
                    {" "}
                    <stat.icon className="w-6 h-6" />{" "}
                  </div>{" "}
                </div>{" "}
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest group-hover:text-blue-600 transition-colors">
                  {stat.label}
                </p>{" "}
                <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">
                  {stat.value}
                </h3>{" "}
                <div className="absolute bottom-0 right-0 w-24 h-24 translate-x-12 translate-y-12 bg-slate-50 rounded-full -z-10 group-hover:bg-blue-50 transition-colors" />{" "}
              </div>{" "}
            </Link>)}{" "}
        </div>}{" "}
      {/* Recent Invoices — Full Width */}{" "}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {" "}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          {" "}
          <div>
            {" "}
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {t("recentInvoices")}
            </h3>{" "}
            <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">
              {t("recentSalesSub")}
            </p>{" "}
          </div>{" "}
          <Link href={`/${locale}/accounting/invoices`} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-600 hover:text-white transition-all">
            {" "}
            {t("viewAll")}{" "}
          </Link>{" "}
        </div>{" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {" "}
              <tr>
                {" "}
                <th className="px-8 py-5 text-right">{t("reference")}</th>{" "}
                <th className="px-8 py-5 text-right">{t("customer")}</th>{" "}
                <th className="px-8 py-5 text-right">{t("amount")}</th>{" "}
                <th className="px-8 py-5 text-right font-bold">
                  {t("status")}
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-50">
              {" "}
              {serializedInvoices.length === 0 && <tr>
                  {" "}
                  <td colSpan={4} className="px-8 py-12 text-center text-slate-400 text-sm font-bold">
                    لا توجد فواتير بعد
                  </td>{" "}
                </tr>}{" "}
              {serializedInvoices.map((inv: any) => <tr key={inv.id} className="hover:bg-slate-50/80 transition-all group">
                  {" "}
                  <td className="px-8 py-4 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                    {" "}
                    <Link href={`/${locale}/accounting/invoices/${inv.id}`} className="hover:underline">
                      {inv.name}
                    </Link>{" "}
                  </td>{" "}
                  <td className="px-8 py-4 text-slate-600 font-bold">
                    {inv.partner?.name || "—"}
                  </td>{" "}
                  <td className="px-8 py-4 font-bold text-slate-900">
                    {Number(inv.amountTotal).toLocaleString("en-US")}{" "}
                    <span className="text-[10px] font-medium text-slate-400">
                      {t("currency")}
                    </span>
                  </td>{" "}
                  <td className="px-8 py-4">
                    {" "}
                    <span className={`px-3 py-1 rounded-sm text-[10px] font-bold tracking-tighter shadow-sm border ${inv.state === "posted" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : inv.state === "paid" ? "bg-teal-50 text-teal-700 border-teal-100" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                      {" "}
                      {inv.state === "posted" ? t("posted") : inv.state === "paid" ? "مدفوعة" : t("draft")}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
      {/* Shortage Report */}{" "}
      {shortageProducts.length > 0 && <div className="bg-white rounded-[2rem] shadow-sm border border-rose-100 overflow-hidden relative group">
          {" "}
          <div className="absolute top-0 right-0 w-1 p-8 h-full bg-rose-500 rounded-l-full opacity-20" />{" "}
          <div className="p-8 border-b border-rose-50 flex justify-between items-center bg-rose-50/20">
            {" "}
            <div className="flex items-center gap-4">
              {" "}
              <div className="bg-red-50 p-3 rounded-sm shadow-inner border border-rose-200 text-red-700">
                {" "}
                <AlertCircle className="w-6 h-6" />{" "}
              </div>{" "}
              <div>
                {" "}
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  نواقص المخزون
                </h3>{" "}
                <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-tighter">
                  منتجات أوشكت على النفاذ
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <Link href={`/${locale}/inventory/reports/shortages`} className="bg-rose-50 text-red-700 px-4 py-2 rounded-sm text-xs font-bold hover:bg-rose-600 hover:text-white transition-all">
              {" "}
              عرض تقرير النواقص المتقدم{" "}
            </Link>{" "}
          </div>{" "}
          <div className="overflow-x-auto">
            {" "}
            <table className="w-full text-right relative z-10">
              {" "}
              <thead className="text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50/50">
                {" "}
                <tr>
                  {" "}
                  <th className="px-8 py-5 text-right">المنتج</th>{" "}
                  <th className="px-8 py-5 text-right">الكود</th>{" "}
                  <th className="px-8 py-5 text-right">الرصيد المتبقي</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-slate-50">
                {" "}
                {shortageProducts.map((prod: any) => <tr key={prod.id} className="hover:bg-rose-50/30 transition-all">
                    {" "}
                    <td className="px-8 py-5 font-bold text-slate-800">
                      {prod.name}
                    </td>{" "}
                    <td className="px-8 py-5 text-slate-500 font-mono text-xs">
                      {prod.defaultCode || prod.barcode || "-"}
                    </td>{" "}
                    <td className="px-8 py-5">
                      {" "}
                      <span className={`px-4 py-1.5 rounded-sm text-xs font-bold tracking-tighter shadow-sm border ${prod.qty <= 0 ? "bg-red-50 text-rose-700 border-rose-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
                        {" "}
                        {prod.qty.toLocaleString("en-US")} وحدة{" "}
                      </span>{" "}
                    </td>{" "}
                  </tr>)}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}