import { getProfitAndLoss } from "@/app/actions/accounting/reports";
import { Download, Printer, TrendingDown, TrendingUp, BarChart3, Receipt, Wallet } from "lucide-react";
import Link from "next/link";
import { ProfitLossHeader } from "@/components/accounting/reporting/ProfitLossHeader";
import prisma from "@/lib/prisma";
export default async function ProfitLossPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    target?: string;
    showDc?: string;
    journals?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    from,
    to,
    target,
    showDc,
    journals
  } = await props.searchParams;
  /* Fetch all active journals for the modal */
  const dbJournals = await prisma.journal.findMany({
    select: {
      id: true,
      name: true,
      code: true
    },
    orderBy: {
      name: "asc"
    }
  });
  const options = {
    startDate: from,
    endDate: to,
    targetState: target as any || "posted",
    journals: journals ? journals.split(",") : undefined
  };
  const pl = await getProfitAndLoss(options);
  const showColumns = showDc === "true";
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP"
    }).format(val);
  };
  return <div className="p-4 print-pl" dir="rtl">
      {" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print-pl { padding: 0 !important; background: white !important; } .no-print { display: none !important; } .print-only { display: block !important; } @page { size: A4 portrait; margin: 15mm; } } .print-only { display: none; } `}</style>{" "}
      {/* Report Header & Filter Modal */}{" "}
      <ProfitLossHeader journals={dbJournals} currentFilters={{
      from,
      to,
      target,
      showDc,
      journals
    }} plData={pl} />{" "}
      {/* Print-only Header */}{" "}
      <div className="print-only" style={{
      textAlign: "center",
      marginBottom: 20,
      borderBottom: "2px solid #333",
      paddingBottom: 10
    }}>
        {" "}
        <h2 style={{
        fontSize: 20,
        fontWeight: 900
      }}>
          قائمة الدخل (الأرباح والخسائر)
        </h2>{" "}
        <p style={{
        fontSize: 12,
        color: "#555"
      }}>
          {" "}
          {from && to ? `الفترة: من ${from} إلى ${to}` : "كل الفترات"} | تاريخ
          الإصدار: {new Date().toLocaleDateString("ar-EG")}{" "}
        </p>{" "}
      </div>{" "}
      <div className="max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 mt-4">
        {" "}
        {/* KPI Cards */}{" "}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {" "}
          <div className="bg-white rounded border border-slate-200 p-6 flex flex-col items-center justify-center border-b-[6px] border-b-emerald-500 hover:-translate-y-1 transition-transform shadow-sm">
            {" "}
            <Wallet className="w-8 h-8 text-emerald-500 mb-2 opacity-90" />{" "}
            <span className="text-sm font-bold text-slate-500 mb-1">
              صافي الإيرادات التشغيلية
            </span>{" "}
            <span className="text-3xl font-bold text-slate-800">
              {formatCurrency(pl.totalIncome)}
            </span>{" "}
          </div>{" "}
          <div className="bg-white rounded border border-slate-200 p-6 flex flex-col items-center justify-center border-b-[6px] border-b-indigo-500 hover:-translate-y-1 transition-transform shadow-sm">
            {" "}
            <TrendingUp className="w-8 h-8 text-indigo-500 mb-2 opacity-90" />{" "}
            <span className="text-sm font-bold text-slate-500 mb-1">
              مجمل الربح (Gross Profit)
            </span>{" "}
            <span className="text-3xl font-bold text-slate-800">
              {formatCurrency(pl.grossProfit)}
            </span>{" "}
            {pl.totalIncome > 0 && <span className="text-xs text-indigo-400 mt-2 font-bold">
                هامش: {(pl.grossProfit / pl.totalIncome * 100).toFixed(1)}%
              </span>}{" "}
          </div>{" "}
          <div className={`bg-white rounded border border-slate-200 p-6 flex flex-col items-center justify-center border-b-[6px] hover:-translate-y-1 transition-transform shadow-sm ${pl.netProfit >= 0 ? "border-b-green-600" : "border-b-red-600"}`}>
            {" "}
            <TrendingDown className={`w-8 h-8 mb-2 opacity-90 ${pl.netProfit >= 0 ? "text-green-600" : "text-red-600"}`} />{" "}
            <span className="text-sm font-bold text-slate-500 mb-1">
              صافي الربح / (الخسارة)
            </span>{" "}
            <span className={`text-4xl font-bold ${pl.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(pl.netProfit)}
            </span>{" "}
            {pl.totalIncome > 0 && <span className={`text-xs mt-2 font-bold ${pl.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                صافي الهامش:{" "}
                {(pl.netProfit / pl.totalIncome * 100).toFixed(1)}%
              </span>}{" "}
          </div>{" "}
        </div>{" "}
        {/* Statement Report */}{" "}
        <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden text-sm relative">
          {" "}
          {/* Watermark */}{" "}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
            {" "}
            <BarChart3 className="w-[30rem] h-[30rem]" />{" "}
          </div>{" "}
          {/* Income Section */}{" "}
          <div className="relative z-10">
            {" "}
            <div className="bg-slate-100/80 px-5 py-4 font-bold text-slate-800 flex justify-between items-center text-lg border-b border-slate-200">
              {" "}
              <span>الإيرادات التمويلية والتشغيلية</span>{" "}
              <div className="flex items-center gap-8">
                {" "}
                {showColumns && <div className="flex gap-16 mr-8 opacity-0 pointer-events-none">
                    <span className="w-24 text-center">مدين</span>
                    <span className="w-24 text-center">دائن</span>
                  </div>}{" "}
                <span className="w-32 text-left">
                  {formatCurrency(pl.totalIncome)}
                </span>{" "}
              </div>{" "}
            </div>{" "}
            {showColumns && <div className="bg-white px-5 py-2 flex justify-end items-center text-xs font-bold text-slate-500 border-b border-slate-200 gap-8">
                {" "}
                <span className="w-24 text-center">مدين (Debit)</span>{" "}
                <span className="w-24 text-center">دائن (Credit)</span>{" "}
                <span className="w-32 text-left">الرصيد</span>{" "}
              </div>}{" "}
            <div className="px-5 py-2 min-h-[60px]">
              {" "}
              {pl.income.length === 0 && <div className="text-slate-400 py-4 italic text-center">
                  لا توجد حركات إيرادات مسجلة بهذه الفترة
                </div>}{" "}
              {pl.income.map(acc => <div key={acc.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  {" "}
                  <div className="flex gap-4 items-center">
                    {" "}
                    <span className="text-slate-400 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {acc.code}
                    </span>{" "}
                    <span className="text-slate-700 font-semibold">
                      {acc.name}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-8">
                    {" "}
                    {showColumns && <>
                        {" "}
                        <span className="w-24 text-center font-mono text-slate-500 text-xs">
                          {acc.debit > 0 ? formatCurrency(acc.debit) : "-"}
                        </span>{" "}
                        <span className="w-24 text-center font-mono text-slate-500 text-xs">
                          {acc.credit > 0 ? formatCurrency(acc.credit) : "-"}
                        </span>{" "}
                      </>}{" "}
                    <span className="w-32 text-left font-bold text-emerald-700 text-sm">
                      {formatCurrency(acc.balance)}
                    </span>{" "}
                  </div>{" "}
                </div>)}{" "}
            </div>{" "}
          </div>{" "}
          {/* COGS Section */}{" "}
          <div className="relative z-10 border-t-2 border-slate-200">
            {" "}
            <div className="bg-orange-50/70 px-5 py-4 font-bold text-slate-800 flex justify-between items-center text-lg border-b border-slate-100">
              {" "}
              <span>يُخصم: تكلفة البضاعة المباعة (COGS)</span>{" "}
              <div className="flex items-center gap-8">
                {" "}
                {showColumns && <div className="flex gap-16 mr-8 opacity-0 pointer-events-none">
                    <span className="w-24 text-center">مدين</span>
                    <span className="w-24 text-center">دائن</span>
                  </div>}{" "}
                <span className="w-32 text-left text-orange-700">
                  ({formatCurrency(pl.totalCogs)})
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="px-5 py-2 min-h-[60px]">
              {" "}
              {pl.cogs.length === 0 && <div className="text-slate-400 py-4 italic text-center">
                  لا توجد حركات تكلفة بضاعة مباعة
                </div>}{" "}
              {pl.cogs.map(acc => <div key={acc.id} className="flex justify-between items-center py-3 border-b border-orange-50 last:border-0 hover:bg-orange-50/50 transition-colors">
                  {" "}
                  <div className="flex gap-4 items-center">
                    {" "}
                    <span className="text-slate-400 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {acc.code}
                    </span>{" "}
                    <span className="text-slate-700 font-semibold">
                      {acc.name}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-8">
                    {" "}
                    {showColumns && <>
                        {" "}
                        <span className="w-24 text-center font-mono text-slate-500 text-xs">
                          {acc.debit > 0 ? formatCurrency(acc.debit) : "-"}
                        </span>{" "}
                        <span className="w-24 text-center font-mono text-slate-500 text-xs">
                          {acc.credit > 0 ? formatCurrency(acc.credit) : "-"}
                        </span>{" "}
                      </>}{" "}
                    <span className="w-32 text-left font-bold text-slate-700 text-sm">
                      {formatCurrency(acc.balance)}
                    </span>{" "}
                  </div>{" "}
                </div>)}{" "}
            </div>{" "}
          </div>{" "}
          {/* GROSS PROFIT TOTAL */}{" "}
          <div className="relative z-10 bg-indigo-50 border-y-2 border-indigo-200 px-5 py-5 flex justify-between items-center">
            {" "}
            <span className="font-bold text-indigo-900 text-xl tracking-tight">
              إجمالي الربح المشتق من المتاجرة (Gross Profit)
            </span>{" "}
            <span className="font-bold text-indigo-900 text-2xl">
              {formatCurrency(pl.grossProfit)}
            </span>{" "}
          </div>{" "}
          {/* Expenses Section */}{" "}
          <div className="relative z-10">
            {" "}
            <div className="bg-rose-50/70 px-5 py-4 font-bold text-slate-800 flex justify-between items-center text-lg border-b border-slate-100">
              {" "}
              <span>يُخصم: المصروفات العمومية، والإدارية، والتشغيلية</span>{" "}
              <div className="flex items-center gap-8">
                {" "}
                {showColumns && <div className="flex gap-16 mr-8 opacity-0 pointer-events-none">
                    <span className="w-24 text-center">مدين</span>
                    <span className="w-24 text-center">دائن</span>
                  </div>}{" "}
                <span className="w-32 text-left text-rose-700">
                  ({formatCurrency(pl.totalExpenses)})
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="px-5 py-2 min-h-[60px]">
              {" "}
              {pl.expenses.length === 0 && <div className="text-slate-400 py-4 italic text-center">
                  لا توجد حركات مصروفات مسجلة بهذه الفترة
                </div>}{" "}
              {pl.expenses.map(acc => <div key={acc.id} className="flex justify-between items-center py-3 border-b border-rose-50 last:border-0 hover:bg-rose-50/50 transition-colors">
                  {" "}
                  <div className="flex gap-4 items-center">
                    {" "}
                    <span className="text-slate-400 font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                      {acc.code}
                    </span>{" "}
                    <span className="text-slate-700 font-semibold">
                      {acc.name}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-8">
                    {" "}
                    {showColumns && <>
                        {" "}
                        <span className="w-24 text-center font-mono text-slate-500 text-xs">
                          {acc.debit > 0 ? formatCurrency(acc.debit) : "-"}
                        </span>{" "}
                        <span className="w-24 text-center font-mono text-slate-500 text-xs">
                          {acc.credit > 0 ? formatCurrency(acc.credit) : "-"}
                        </span>{" "}
                      </>}{" "}
                    <span className="w-32 text-left font-bold text-slate-700 text-sm">
                      {formatCurrency(acc.balance)}
                    </span>{" "}
                  </div>{" "}
                </div>)}{" "}
            </div>{" "}
          </div>{" "}
          {/* NET PROFIT TOTAL */}{" "}
          <div className={`relative z-10 px-5 py-6 flex justify-between items-center border-t-4 ${pl.netProfit >= 0 ? "bg-green-100 border-green-500 shadow-[inset_0_4px_6px_rgba(34,197,94,0.1)]" : "bg-red-50 border-red-500"}`}>
            {" "}
            <div className="flex flex-col">
              {" "}
              <span className={`font-bold text-2xl tracking-tight ${pl.netProfit >= 0 ? "text-green-900" : "text-red-900"}`}>
                {" "}
                {pl.netProfit >= 0 ? "صافي الربح النهائي (Net Profit)" : "صافي الخسارة النهائية (Net Loss)"}{" "}
              </span>{" "}
              <span className="text-sm font-semibold opacity-70 mt-1">
                الربح القابل للتوزيع أو الاحتجاز
              </span>{" "}
            </div>{" "}
            <span className={`font-bold text-4xl ${pl.netProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
              {" "}
              {formatCurrency(pl.netProfit)}{" "}
            </span>{" "}
          </div>{" "}
        </div>{" "}
        <div className="text-center text-xs text-slate-400 pt-6 flex justify-center items-center gap-2">
          {" "}
          <Receipt size={14} /> هذا التقرير مبني حصرياً على{" "}
          <strong>قيود اليومية المُرحلة (Posted Journal Items)</strong> ويتبع
          المعايير المحاسبية للمعادلة المزدوجة ومبدأ الاستحقاق.{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}