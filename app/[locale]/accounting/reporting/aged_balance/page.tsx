import { getTranslations } from "next-intl/server";
import { getAgedPartnerBalance } from "@/app/actions/reporting";
import { BrowserPrintButton } from "@/components/common/BrowserPrintButton";
import { TopPortal } from "@/components/common/TopPortal";
function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
export default async function AgedPartnerBalancePage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    type?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    type = "receivable"
  } = await props.searchParams;
  const reportType = type === "receivable" || type === "payable" ? type : "receivable";
  const data = await getAgedPartnerBalance(reportType);
  const totalDue = data.reduce((sum, row) => sum + row.total, 0);
  return <div className="flex flex-col h-full bg-slate-50 p-4" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <BrowserPrintButton />{" "}
      </TopPortal>{" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { @page { size: A4 landscape; margin: 1cm; } body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } } `}</style>{" "}
      <div className="max-w-7xl mx-auto w-full space-y-6">
        {" "}
        {/* Header */}{" "}
        <div className="flex justify-between items-center mb-2">
          {" "}
          <div>
            {" "}
            <h1 className="text-xl font-bold text-slate-800">
              {" "}
              {reportType === "receivable" ? "تقادم الذمم المدينة (العملاء)" : "تقادم الذمم الدائنة (الموردين)"}{" "}
            </h1>{" "}
            <p className="text-slate-500 text-sm mt-1">
              {" "}
              بتاريخ{" "}
              {new Date().toLocaleDateString("en-GB", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            }).split("/").reverse().join("/")}{" "}
            </p>{" "}
          </div>{" "}
          <div className="flex items-center gap-3 no-print">
            {" "}
            {/* Filters */}{" "}
            <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {" "}
              <a href={`?type=receivable`} className={`px-5 py-2.5 text-sm font-bold transition-colors ${reportType === "receivable" ? "bg-indigo-600 text-white" : "hover:bg-slate-50 text-slate-600"}`}>
                {" "}
                ذمم مدينة{" "}
              </a>{" "}
              <div className="w-[1px] bg-slate-200"></div>{" "}
              <a href={`?type=payable`} className={`px-5 py-2.5 text-sm font-bold transition-colors ${reportType === "payable" ? "bg-indigo-600 text-white" : "hover:bg-slate-50 text-slate-600"}`}>
                {" "}
                ذمم دائنة{" "}
              </a>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Summary Cards */}{" "}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 no-print">
          {" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
            {" "}
            <p className="text-xs text-slate-500 font-bold mb-1">
              إجمالي المستحق
            </p>{" "}
            <p className="text-xl font-bold text-slate-900" dir="ltr">
              {fmt(totalDue)}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
            {" "}
            <p className="text-xs text-slate-500 font-bold mb-1">
              غير مستحق بعد
            </p>{" "}
            <p className="text-xl font-bold text-green-600" dir="ltr">
              {fmt(data.reduce((s, r) => s + r.not_due, 0))}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
            {" "}
            <p className="text-xs text-orange-500 font-bold mb-1">
              1-30 يوم
            </p>{" "}
            <p className="text-xl font-bold text-orange-600" dir="ltr">
              {fmt(data.reduce((s, r) => s + r.range_0_30, 0))}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
            {" "}
            <p className="text-xs text-red-500 font-bold mb-1">
              أكثر من 90 يوم
            </p>{" "}
            <p className="text-xl font-bold text-red-700" dir="ltr">
              {fmt(data.reduce((s, r) => s + r.range_90_plus, 0))}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Report Table */}{" "}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {" "}
          <table className="w-full text-right text-sm">
            {" "}
            <thead className="bg-slate-50 border-b border-slate-200">
              {" "}
              <tr>
                {" "}
                <th className="py-3 px-4 font-bold text-slate-700 text-right">
                  الشريك
                </th>{" "}
                <th className="py-3 px-4 font-bold text-slate-700 text-left">
                  إجمالي المستحق
                </th>{" "}
                <th className="py-3 px-4 text-left text-slate-500 font-medium">
                  غير مستحق
                </th>{" "}
                <th className="py-3 px-4 text-left text-orange-600 font-medium">
                  1 - 30 يوم
                </th>{" "}
                <th className="py-3 px-4 text-left text-orange-700 font-medium">
                  31 - 60 يوم
                </th>{" "}
                <th className="py-3 px-4 text-left text-red-600 font-medium">
                  61 - 90 يوم
                </th>{" "}
                <th className="py-3 px-4 text-left text-red-800 font-medium">
                  أكثر من 90
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {data.length === 0 ? <tr>
                  {" "}
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {" "}
                    لا توجد بيانات لهذه الفترة.{" "}
                  </td>{" "}
                </tr> : data.map(row => <tr key={row.id} className="hover:bg-slate-50 group">
                    {" "}
                    <td className="py-3 px-4 font-medium text-slate-900 group-hover:text-indigo-600 cursor-pointer text-right">
                      {" "}
                      {row.name}{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-left font-bold text-slate-900" dir="ltr">
                      {" "}
                      {fmt(row.total)}{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-left text-slate-600" dir="ltr">
                      {" "}
                      {row.not_due !== 0 ? fmt(row.not_due) : "-"}{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-left text-orange-600" dir="ltr">
                      {" "}
                      {row.range_0_30 !== 0 ? fmt(row.range_0_30) : "-"}{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-left text-orange-700" dir="ltr">
                      {" "}
                      {row.range_30_60 !== 0 ? fmt(row.range_30_60) : "-"}{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-left text-red-600" dir="ltr">
                      {" "}
                      {row.range_60_90 !== 0 ? fmt(row.range_60_90) : "-"}{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-left text-red-800 font-bold bg-red-50/50" dir="ltr">
                      {" "}
                      {row.range_90_plus !== 0 ? fmt(row.range_90_plus) : "-"}{" "}
                    </td>{" "}
                  </tr>)}{" "}
            </tbody>{" "}
            {/* Footer Totals */}{" "}
            {data.length > 0 && <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                {" "}
                <tr>
                  {" "}
                  <td className="py-3 px-4 text-right">الإجمالي</td>{" "}
                  <td className="py-3 px-4 text-left" dir="ltr">
                    {fmt(totalDue)}
                  </td>{" "}
                  <td className="py-3 px-4 text-left" dir="ltr">
                    {fmt(data.reduce((s, r) => s + r.not_due, 0))}
                  </td>{" "}
                  <td className="py-3 px-4 text-left" dir="ltr">
                    {fmt(data.reduce((s, r) => s + r.range_0_30, 0))}
                  </td>{" "}
                  <td className="py-3 px-4 text-left" dir="ltr">
                    {fmt(data.reduce((s, r) => s + r.range_30_60, 0))}
                  </td>{" "}
                  <td className="py-3 px-4 text-left" dir="ltr">
                    {fmt(data.reduce((s, r) => s + r.range_60_90, 0))}
                  </td>{" "}
                  <td className="py-3 px-4 text-left" dir="ltr">
                    {fmt(data.reduce((s, r) => s + r.range_90_plus, 0))}
                  </td>{" "}
                </tr>{" "}
              </tfoot>}{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}