import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStockShortageReport } from "@/app/actions/inventoryReporting";
import { AlertTriangle, TrendingDown, ArrowDownToLine, Package, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ShortageTopActions } from "./ShortageTopActions";
export default async function StockShortagePage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session?.companyId) redirect(`/${locale}`);
  const {
    from,
    to
  } = searchParams;
  const reportData = await getStockShortageReport(from, to);
  const fmt = (num: number) => new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
  return <>
      {" "}
      <ShortageTopActions from={from} to={to} />{" "}
      <div className="p-6 space-y-5" dir="rtl">
        {" "}
        {/* Summary KPI Cards */}{" "}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {" "}
          <div className="bg-white rounded-sm border border-slate-200 p-5 pl-6 shadow-sm flex items-center gap-4">
            {" "}
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
              {" "}
              <AlertTriangle className="w-6 h-6 text-red-700" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-sm text-slate-500 font-bold mb-0.5">
                أصناف بها عجز حرج
              </p>{" "}
              <p className="text-2xl font-bold text-rose-700">
                {reportData.filter(d => d.forecasted < 0).length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm border border-slate-200 p-5 pl-6 shadow-sm flex items-center gap-4">
            {" "}
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              {" "}
              <TrendingDown className="w-6 h-6 text-amber-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-sm text-slate-500 font-bold mb-0.5">
                وصلت للحد الأدنى
              </p>{" "}
              <p className="text-2xl font-bold text-amber-700">
                {reportData.filter(d => d.forecasted >= 0 && d.forecasted <= d.minQty).length}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm border border-slate-200 p-5 pl-6 shadow-sm flex items-center gap-4">
            {" "}
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              {" "}
              <ArrowDownToLine className="w-6 h-6 text-indigo-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <p className="text-sm text-slate-500 font-bold mb-0.5">
                وحدات مطلوب طلبها (إجمالي)
              </p>{" "}
              <p className="text-2xl font-bold text-indigo-700">
                {fmt(reportData.reduce((s, x) => s + x.toOrder, 0))}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Report Table */}{" "}
        <div className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden text-sm">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="bg-[#f8f9fa] border-b border-slate-200 text-slate-600 font-bold">
              {" "}
              <tr>
                {" "}
                <th className="py-3.5 px-5">الصنف</th>{" "}
                <th className="py-3.5 px-5 text-center bg-slate-50 font-bold border-r border-l border-slate-200">
                  الرصيد الفعلي
                </th>{" "}
                <th className="py-3.5 px-5 text-center text-teal-700">
                  + وارد
                </th>{" "}
                <th className="py-3.5 px-5 text-center text-red-700">
                  - منصرف
                </th>{" "}
                <th className="py-3.5 px-5 text-center bg-blue-50 text-blue-900 border-r border-l border-slate-200">
                  المتوقع
                </th>{" "}
                <th className="py-3.5 px-5 text-center">الحد الأدنى</th>{" "}
                <th className="py-3.5 px-5 text-center text-indigo-700 bg-indigo-50 border-r border-slate-200">
                  الكمية للتجديد
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {reportData.length === 0 ? <tr>
                  {" "}
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    {" "}
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />{" "}
                    <p className="font-bold">
                      المخزون متزن، ولا توجد اي نواقص تطابق محددات البحث.
                    </p>{" "}
                  </td>{" "}
                </tr> : reportData.map((row: any) => {
              const isCritical = row.forecasted < 0;
              return <tr key={row.productId} className="hover:bg-slate-50/50 transition-colors">
                      {" "}
                      <td className="py-3 px-5">
                        {" "}
                        <div className="flex flex-col">
                          {" "}
                          <Link href={`/${locale}/inventory/products/${row.productId}`} className="font-bold text-slate-800 hover:text-indigo-600 hover:underline">
                            {" "}
                            {row.productName}{" "}
                          </Link>{" "}
                          {row.productCode && <span className="text-xs text-slate-400 font-mono mt-0.5">
                              {row.productCode}
                            </span>}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="py-3 px-5 text-center font-bold text-slate-700 bg-slate-50 border-r border-l border-slate-100">
                        {" "}
                        {fmt(row.onHand)}{" "}
                      </td>{" "}
                      <td className="py-3 px-5 text-center font-semibold text-teal-700">
                        {" "}
                        {row.incoming > 0 ? fmt(row.incoming) : "-"}{" "}
                      </td>{" "}
                      <td className="py-3 px-5 text-center font-semibold text-red-700">
                        {" "}
                        {row.outgoing > 0 ? fmt(row.outgoing) : "-"}{" "}
                      </td>{" "}
                      <td className={cn("py-3 px-5 text-center font-bold border-r border-l border-slate-100", isCritical ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>
                        {" "}
                        <div className="flex items-center justify-center gap-1.5">
                          {" "}
                          {isCritical && <AlertTriangle className="w-3 h-3" />}{" "}
                          {fmt(row.forecasted)}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="py-3 px-5 text-center font-bold text-slate-500">
                        {" "}
                        {fmt(row.minQty)}{" "}
                      </td>{" "}
                      <td className="py-3 px-5 text-center font-bold text-indigo-700 bg-indigo-50/50 border-r border-indigo-100/50">
                        {" "}
                        <span className="bg-indigo-100 px-2 py-0.5 rounded-sm">
                          {" "}
                          {fmt(row.toOrder)}{" "}
                        </span>{" "}
                      </td>{" "}
                    </tr>;
            })}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </>;
}