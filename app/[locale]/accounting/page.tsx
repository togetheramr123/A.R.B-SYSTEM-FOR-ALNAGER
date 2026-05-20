import prisma from "@/lib/prisma";
import { getDashboardData } from "@/app/actions/notifications";
import Link from "next/link";
import { FileText, Receipt, Banknote, AlertTriangle, TrendingUp, TrendingDown, ArrowUpFromLine, ArrowDownToLine, Users, Clock, ChartPie, BookOpen } from "lucide-react";
import { JournalsKanban } from "@/components/accounting/JournalsKanban";
function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
import { getSession } from "@/lib/auth";

export default async function AccountingPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  
  const session = await getSession();
  const companyId = session?.companyId;
  const data = await getDashboardData(companyId);
  const [draftInvoices, unpaidInvoices, draftBills, unpaidBills, receiptsTotalRaw] = await Promise.all([prisma.invoice.count({
    where: {
      type: "out_invoice",
      state: "draft",
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.invoice.count({
    where: {
      type: "out_invoice",
      state: "posted",
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.invoice.count({
    where: {
      type: "in_invoice",
      state: "draft",
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.invoice.count({
    where: {
      type: "in_invoice",
      state: "posted",
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.payment.aggregate({
    where: {
      paymentType: "inbound",
      state: "posted",
      ...(companyId ? {
        companyId
      } : {})
    },
    _sum: {
      amount: true
    }
  })]);
  const receiptsTotal = Number(receiptsTotalRaw._sum.amount || 0);
  const quickLinks = [{
    href: `/${locale}/accounting/invoices`,
    label: "الفواتير",
    icon: FileText,
    count: data.unpaidInvoices,
    badge: "غير مدفوعة",
    color: "indigo"
  }, {
    href: `/${locale}/accounting/bills`,
    label: "فواتير الموردين",
    icon: Receipt,
    count: data.unpaidBills,
    badge: "معلقة",
    color: "orange"
  }, {
    href: `/${locale}/accounting/payments`,
    label: "الدفعات",
    icon: Banknote,
    count: null,
    badge: null,
    color: "emerald"
  }, {
    href: `/${locale}/accounting/journal-entries`,
    label: "قيود اليومية",
    icon: BookOpen,
    count: null,
    badge: null,
    color: "violet"
  }, {
    href: `/${locale}/accounting/chart-of-accounts`,
    label: "دليل الحسابات",
    icon: ChartPie,
    count: null,
    badge: null,
    color: "cyan"
  }, {
    href: `/${locale}/accounting/reporting`,
    label: "التقارير المالية",
    icon: TrendingUp,
    count: null,
    badge: null,
    color: "slate"
  }];
  return <div className="p-6 bg-[#F5F6FA] min-h-full" dir="rtl">
      {" "}
      <div className="max-w-7xl mx-auto space-y-6">
        {" "}
        {/* Page Header */}{" "}
        <div className="flex justify-between items-center">
          {" "}
          <div>
            {" "}
            <h1 className="text-2xl font-bold text-slate-900">
              لوحة التحكم المحاسبية
            </h1>{" "}
            <p className="text-sm text-slate-500 mt-1">
              نظرة شاملة على الأداء المالي
            </p>{" "}
          </div>{" "}
          <div className="text-sm text-slate-400">
            {" "}
            {new Date().toLocaleDateString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          }).split("/").reverse().join("/")}{" "}
          </div>{" "}
        </div>{" "}
        {/* --- NEW ODOO KANBAN DASHBOARD --- */}{" "}
        <JournalsKanban locale={locale} />{" "}
        {/* --- EXISTING CHARTS & KPI SECTION (Preserved) --- */}{" "}
        <div className="mt-12 pt-8 border-t border-slate-200">
          {" "}
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            مؤشرات الأداء العامة (KPIs)
          </h2>{" "}
          {/* KPI Cards Row */}{" "}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {" "}
            {/* Monthly Revenue */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
              {" "}
              <div className="flex items-center justify-between mb-3">
                {" "}
                <div className="w-10 h-10 bg-teal-50 rounded-sm flex items-center justify-center">
                  {" "}
                  <TrendingUp className="w-5 h-5 text-teal-700" />{" "}
                </div>{" "}
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  هذا الشهر
                </span>{" "}
              </div>{" "}
              <p className="text-xs text-slate-500 font-medium">الإيرادات</p>{" "}
              <p className="text-2xl font-bold text-emerald-700 mt-1" dir="ltr">
                {fmt(data.monthlyRevenue)}
              </p>{" "}
            </div>{" "}
            {/* Monthly Expenses */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
              {" "}
              <div className="flex items-center justify-between mb-3">
                {" "}
                <div className="w-10 h-10 bg-red-100 rounded-sm flex items-center justify-center">
                  {" "}
                  <TrendingDown className="w-5 h-5 text-red-600" />{" "}
                </div>{" "}
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  هذا الشهر
                </span>{" "}
              </div>{" "}
              <p className="text-xs text-slate-500 font-medium">المصروفات</p>{" "}
              <p className="text-2xl font-bold text-red-700 mt-1" dir="ltr">
                {fmt(data.monthlyExpenses)}
              </p>{" "}
            </div>{" "}
            {/* Net Cash Flow */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
              {" "}
              <div className="flex items-center justify-between mb-3">
                {" "}
                <div className={`w-10 h-10 ${data.netCashFlow >= 0 ? "bg-blue-100" : "bg-amber-100"} rounded-sm flex items-center justify-center`}>
                  {" "}
                  <Banknote className={`w-5 h-5 ${data.netCashFlow >= 0 ? "text-blue-600" : "text-amber-600"}`} />{" "}
                </div>{" "}
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  صافي التدفق
                </span>{" "}
              </div>{" "}
              <p className="text-xs text-slate-500 font-medium">
                التدفق النقدي
              </p>{" "}
              <p className={`text-2xl font-bold mt-1 ${data.netCashFlow >= 0 ? "text-blue-700" : "text-amber-700"}`} dir="ltr">
                {" "}
                {data.netCashFlow >= 0 ? "+" : ""}
                {fmt(data.netCashFlow)}{" "}
              </p>{" "}
            </div>{" "}
            {/* Overdue */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
              {" "}
              <div className="flex items-center justify-between mb-3">
                {" "}
                <div className="w-10 h-10 bg-orange-100 rounded-sm flex items-center justify-center">
                  {" "}
                  <AlertTriangle className="w-5 h-5 text-orange-600" />{" "}
                </div>{" "}
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${data.overdueInvoices > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                  {" "}
                  {data.overdueInvoices} فاتورة{" "}
                </span>{" "}
              </div>{" "}
              <p className="text-xs text-slate-500 font-medium">
                فواتير متأخرة
              </p>{" "}
              <p className="text-2xl font-bold text-orange-700 mt-1" dir="ltr">
                {fmt(data.totalOverdueAmount)}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {/* Cash Flow Details */}{" "}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {" "}
            {/* Receipts vs Disbursements */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
              {" "}
              <h3 className="text-sm font-bold text-slate-800 mb-4">
                التدفقات النقدية — هذا الشهر
              </h3>{" "}
              <div className="space-y-4">
                {" "}
                <div className="flex items-center gap-4">
                  {" "}
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    {" "}
                    <ArrowDownToLine className="w-5 h-5 text-teal-700" />{" "}
                  </div>{" "}
                  <div className="flex-1">
                    {" "}
                    <div className="flex justify-between items-center mb-1">
                      {" "}
                      <span className="text-sm font-bold text-slate-700">
                        تحصيلات (واردة)
                      </span>{" "}
                      <span className="text-sm font-bold text-emerald-700" dir="ltr">
                        {fmt(data.totalReceipts)}
                      </span>{" "}
                    </div>{" "}
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      {" "}
                      <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{
                      width: `${Math.min(100, data.totalReceipts / (data.totalReceipts + data.totalDisbursements + 1) * 100)}%`
                    }}></div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flex items-center gap-4">
                  {" "}
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {" "}
                    <ArrowUpFromLine className="w-5 h-5 text-red-600" />{" "}
                  </div>{" "}
                  <div className="flex-1">
                    {" "}
                    <div className="flex justify-between items-center mb-1">
                      {" "}
                      <span className="text-sm font-bold text-slate-700">
                        مدفوعات (صادرة)
                      </span>{" "}
                      <span className="text-sm font-bold text-red-700" dir="ltr">
                        {fmt(data.totalDisbursements)}
                      </span>{" "}
                    </div>{" "}
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      {" "}
                      <div className="bg-red-500 h-2 rounded-full transition-all" style={{
                      width: `${Math.min(100, data.totalDisbursements / (data.totalReceipts + data.totalDisbursements + 1) * 100)}%`
                    }}></div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Top 5 Debtors */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
              {" "}
              <div className="flex justify-between items-center mb-4">
                {" "}
                <h3 className="text-sm font-bold text-slate-800">
                  أكبر 5 مديونين
                </h3>{" "}
                <Link href={`/${locale}/accounting/reporting/aged_balance`} className="text-xs text-indigo-600 hover:underline font-bold">
                  {" "}
                  عرض التقادم ←{" "}
                </Link>{" "}
              </div>{" "}
              {data.topDebtors.length === 0 ? <div className="text-center py-6 text-slate-400 text-sm">
                  {" "}
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" /> لا توجد
                  ذمم مدينة{" "}
                </div> : <div className="space-y-3">
                  {" "}
                  {data.topDebtors.map((debtor, i) => {
                const maxBalance = data.topDebtors[0]?.balance || 1;
                const pct = debtor.balance / maxBalance * 100;
                return <div key={i} className="flex items-center gap-3">
                        {" "}
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                          {" "}
                          {i + 1}{" "}
                        </div>{" "}
                        <div className="flex-1 min-w-0">
                          {" "}
                          <div className="flex justify-between items-center mb-1">
                            {" "}
                            <span className="text-sm font-bold text-slate-800 truncate">
                              {debtor.name}
                            </span>{" "}
                            <span className="text-sm font-bold text-slate-900" dir="ltr">
                              {fmt(debtor.balance)}
                            </span>{" "}
                          </div>{" "}
                          <div className="w-full bg-slate-100 rounded-full h-1.5">
                            {" "}
                            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{
                        width: `${pct}%`
                      }}></div>{" "}
                          </div>{" "}
                        </div>{" "}
                      </div>;
              })}{" "}
                </div>}{" "}
            </div>{" "}
          </div>{" "}
          {/* Invoices Summary */}{" "}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
              {" "}
              <div className="flex items-center gap-3 mb-2">
                {" "}
                <FileText className="w-5 h-5 text-indigo-500" />{" "}
                <span className="text-xs font-bold text-slate-500">
                  فواتير مسودة
                </span>{" "}
              </div>{" "}
              <p className="text-3xl font-bold text-slate-900">
                {data.draftInvoices}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
              {" "}
              <div className="flex items-center gap-3 mb-2">
                {" "}
                <Clock className="w-5 h-5 text-sky-500" />{" "}
                <span className="text-xs font-bold text-slate-500">
                  فواتير غير مدفوعة
                </span>{" "}
              </div>{" "}
              <p className="text-3xl font-bold text-slate-900">
                {data.unpaidInvoices}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
              {" "}
              <div className="flex items-center gap-3 mb-2">
                {" "}
                <Receipt className="w-5 h-5 text-orange-500" />{" "}
                <span className="text-xs font-bold text-slate-500">
                  فواتير موردين مسودة
                </span>{" "}
              </div>{" "}
              <p className="text-3xl font-bold text-slate-900">
                {data.draftBills}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
              {" "}
              <div className="flex items-center gap-3 mb-2">
                {" "}
                <AlertTriangle className="w-5 h-5 text-red-500" />{" "}
                <span className="text-xs font-bold text-slate-500">
                  فواتير موردين معلقة
                </span>{" "}
              </div>{" "}
              <p className="text-3xl font-bold text-slate-900">
                {data.unpaidBills}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {/* Quick Links */}{" "}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {" "}
            {quickLinks.map(link => {
            const Icon = link.icon;
            const colorMap: Record<string, {
              bg: string;
              text: string;
              badgeBg: string;
              badgeText: string;
            }> = {
              indigo: {
                bg: "bg-indigo-100",
                text: "text-indigo-600",
                badgeBg: "bg-indigo-100",
                badgeText: "text-indigo-700"
              },
              orange: {
                bg: "bg-orange-100",
                text: "text-orange-600",
                badgeBg: "bg-orange-100",
                badgeText: "text-orange-700"
              },
              emerald: {
                bg: "bg-teal-50",
                text: "text-teal-700",
                badgeBg: "bg-teal-50",
                badgeText: "text-emerald-700"
              },
              violet: {
                bg: "bg-violet-100",
                text: "text-violet-600",
                badgeBg: "bg-violet-100",
                badgeText: "text-violet-700"
              },
              cyan: {
                bg: "bg-cyan-100",
                text: "text-cyan-600",
                badgeBg: "bg-cyan-100",
                badgeText: "text-cyan-700"
              },
              slate: {
                bg: "bg-slate-100",
                text: "text-slate-600",
                badgeBg: "bg-slate-100",
                badgeText: "text-slate-700"
              }
            };
            const c = colorMap[link.color] || colorMap.slate;
            return <Link key={link.href} href={link.href} className="bg-white rounded-sm shadow-sm border border-slate-200 p-5 hover:shadow-sm hover:border-indigo-200 transition-all group">
                  {" "}
                  <div className="flex items-center justify-between">
                    {" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <div className={`w-10 h-10 ${c.bg} rounded-sm flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        {" "}
                        <Icon className={`w-5 h-5 ${c.text}`} />{" "}
                      </div>{" "}
                      <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                        {" "}
                        {link.label}{" "}
                      </span>{" "}
                    </div>{" "}
                    {link.count !== null && link.count > 0 && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.badgeBg} ${c.badgeText}`}>
                        {" "}
                        {link.count} {link.badge}{" "}
                      </span>}{" "}
                  </div>{" "}
                </Link>;
          })}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}