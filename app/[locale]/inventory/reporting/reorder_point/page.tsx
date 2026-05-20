import { getReorderAnalysis } from "@/app/actions/reorder_analysis";
import { BrowserPrintButton } from "@/components/common/BrowserPrintButton";
import Link from "next/link";
function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(n);
}
function StatusBadge({
  status
}: {
  status: "ok" | "low" | "critical";
}) {
  const styles = {
    ok: "bg-teal-50 text-emerald-700 border-emerald-200",
    low: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-red-100 text-red-700 border-red-200"
  };
  const labels = {
    ok: "متوفر",
    low: "منخفض",
    critical: "حرج"
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>
      {" "}
      {status === "critical" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-1.5 animate-pulse" />}{" "}
      {labels[status]}{" "}
    </span>;
}
export default async function ReorderPointPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    days?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    days: daysStr = "30"
  } = await props.searchParams;
  const days = parseInt(daysStr) || 30;
  const data = await getReorderAnalysis(days);
  const criticalCount = data.filter(r => r.status === "critical").length;
  const lowCount = data.filter(r => r.status === "low").length;
  const totalDeficit = data.reduce((sum, r) => sum + r.deficit, 0);
  return <div className="flex flex-col h-full bg-slate-50 p-6" dir="rtl">
      {" "}
      <style>{` @media print { @page { size: A4 landscape; margin: 1cm; } body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } } `}</style>{" "}
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {" "}
        {/* Header */}{" "}
        <div className="flex justify-between items-start">
          {" "}
          <div>
            {" "}
            <h1 className="text-2xl font-bold text-slate-800">
              {" "}
              تحليل نقاط إعادة الطلب{" "}
            </h1>{" "}
            <p className="text-slate-500 text-sm mt-1">
              {" "}
              تحليل مبيعات آخر {days} يوم — تغطية مخزونية 60 يوم{" "}
            </p>{" "}
          </div>{" "}
          <div className="flex items-center gap-3 no-print">
            {" "}
            {/* Period Filter */}{" "}
            <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {" "}
              {[30, 60, 90].map(d => <a key={d} href={`?days=${d}`} className={`px-5 py-2.5 text-sm font-bold transition-colors ${days === d ? "bg-indigo-600 text-white" : "hover:bg-slate-50 text-slate-600"}`}>
                  {" "}
                  {d} يوم{" "}
                </a>)}{" "}
            </div>{" "}
            <BrowserPrintButton />{" "}
          </div>{" "}
        </div>{" "}
        {/* Summary Cards */}{" "}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          {" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
            {" "}
            <p className="text-xs text-slate-500 font-bold mb-1">
              إجمالي المنتجات
            </p>{" "}
            <p className="text-2xl font-bold text-slate-900">
              {data.length}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm shadow-sm border border-red-200 p-4">
            {" "}
            <p className="text-xs text-red-500 font-bold mb-1">
              حرج (يحتاج طلب فوري)
            </p>{" "}
            <p className="text-2xl font-bold text-red-700">
              {criticalCount}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm shadow-sm border border-amber-200 p-4">
            {" "}
            <p className="text-xs text-amber-500 font-bold mb-1">منخفض</p>{" "}
            <p className="text-2xl font-bold text-amber-700">{lowCount}</p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
            {" "}
            <p className="text-xs text-slate-500 font-bold mb-1">
              إجمالي العجز (وحدات)
            </p>{" "}
            <p className="text-2xl font-bold text-slate-900" dir="ltr">
              {fmt(totalDeficit)}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Report Table */}{" "}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {" "}
          <div className="overflow-x-auto">
            {" "}
            <table className="w-full text-right text-sm">
              {" "}
              <thead className="bg-slate-50 border-b border-slate-200">
                {" "}
                <tr>
                  {" "}
                  <th className="py-3 px-4 font-bold text-slate-700 text-right">
                    المنتج
                  </th>{" "}
                  <th className="py-3 px-4 font-bold text-slate-700 text-right">
                    SKU
                  </th>{" "}
                  <th className="py-3 px-4 text-left text-slate-600 font-medium">
                    المخزون الحالي
                  </th>{" "}
                  <th className="py-3 px-4 text-left text-slate-600 font-medium">
                    كراتين
                  </th>{" "}
                  <th className="py-3 px-4 text-left text-slate-600 font-medium">
                    إجمالي المبيعات
                  </th>{" "}
                  <th className="py-3 px-4 text-left text-slate-600 font-medium">
                    م. يومي
                  </th>{" "}
                  <th className="py-3 px-4 text-left text-indigo-600 font-bold">
                    مستوى الطلب (60 يوم)
                  </th>{" "}
                  <th className="py-3 px-4 text-left text-indigo-600 font-medium">
                    كراتين مطلوبة
                  </th>{" "}
                  <th className="py-3 px-4 text-left text-red-600 font-bold">
                    العجز
                  </th>{" "}
                  <th className="py-3 px-4 text-center font-medium text-slate-600">
                    الحالة
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-slate-100">
                {" "}
                {data.length === 0 ? <tr>
                    {" "}
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      {" "}
                      <div className="flex flex-col items-center gap-2">
                        {" "}
                        <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {" "}
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />{" "}
                        </svg>{" "}
                        <p>لا توجد منتجات مخزنية</p>{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr> : data.map(row => <tr key={row.productId} className={`hover:bg-slate-50 group ${row.status === "critical" ? "bg-red-50/30" : row.status === "low" ? "bg-amber-50/30" : ""}`}>
                      {" "}
                      <td className="py-3 px-4 font-medium text-slate-900 text-right">
                        {" "}
                        <Link href={`/${locale}/inventory/products/${row.productId}`} className="hover:text-indigo-600 transition-colors">
                          {" "}
                          {row.productName}{" "}
                        </Link>{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-slate-500 text-right font-mono text-xs">
                        {" "}
                        {row.sku || "-"}{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-left text-slate-800 font-medium" dir="ltr">
                        {" "}
                        {fmt(row.currentStock)}{" "}
                        <span className="text-xs text-slate-400">
                          {row.uom}
                        </span>{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-left text-slate-600" dir="ltr">
                        {" "}
                        {row.hasSecondaryUnit ? `${fmt(row.currentStockCartons)} ${row.secondaryUom}` : "-"}{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-left text-slate-600" dir="ltr">
                        {" "}
                        {fmt(row.totalSold)}{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-left text-slate-600" dir="ltr">
                        {" "}
                        {fmt(row.avgDailySales)}{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-left font-bold text-indigo-700" dir="ltr">
                        {" "}
                        {fmt(row.reorderLevel)}{" "}
                        <span className="text-xs text-slate-400 font-normal">
                          {row.uom}
                        </span>{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-left text-indigo-600" dir="ltr">
                        {" "}
                        {row.hasSecondaryUnit ? `${fmt(row.reorderLevelCartons)} ${row.secondaryUom}` : "-"}{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-left font-bold" dir="ltr">
                        {" "}
                        {row.deficit > 0 ? <span className="text-red-700">
                            {" "}
                            {fmt(row.deficit)}{" "}
                            {row.hasSecondaryUnit && <span className="text-xs text-red-400 font-normal">
                                {" "}
                                ({fmt(row.deficitCartons)} {row.secondaryUom})
                              </span>}{" "}
                          </span> : <span className="text-teal-700">0</span>}{" "}
                      </td>{" "}
                      <td className="py-3 px-4 text-center">
                        {" "}
                        <StatusBadge status={row.status} />{" "}
                      </td>{" "}
                    </tr>)}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>{" "}
        {/* Legend */}{" "}
        <div className="flex items-center gap-6 text-xs text-slate-500 no-print">
          {" "}
          <div className="flex items-center gap-1.5">
            {" "}
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> حرج:
            المخزون أقل من 30% من المطلوب{" "}
          </div>{" "}
          <div className="flex items-center gap-1.5">
            {" "}
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> منخفض:
            المخزون بين 30% و 70%{" "}
          </div>{" "}
          <div className="flex items-center gap-1.5">
            {" "}
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> متوفر:
            المخزون أكثر من 70%{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}