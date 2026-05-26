import { getTrialBalance } from "@/app/actions/accounting/reports";
import { Download, Printer, Filter, Calendar } from "lucide-react";
import Link from "next/link";
export default async function TrialBalancePage(props: {
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
  const {
    from,
    to
  } = await props.searchParams;
  const data = await getTrialBalance(from, to);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP"
    }).format(Math.abs(val));
  };
  const renderBalance = (val: number) => {
    if (val === 0) return "-";
    return <span className={val > 0 ? "text-indigo-700" : "text-rose-700"}>
        {" "}
        {val < 0 ? `(${formatCurrency(val)})` : formatCurrency(val)}{" "}
      </span>;
  };
  return <div className="p-4 print-tb" dir="rtl">
      {" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print-tb { padding: 0 !important; background: white !important; } .no-print { display: none !important; } .print-only { display: block !important; } table { border-collapse: collapse; width: 100%; font-size: 11px; } th, td { border: 1px solid #ccc !important; padding: 6px 8px !important; } th { background: #f0f0f0 !important; font-weight: 700; } tfoot td { background: #333 !important; color: white !important; } @page { size: A4 landscape; margin: 15mm; } } .print-only { display: none; } `}</style>{" "}
      {/* Date Filter (inline, not sticky) */}{" "}
      <div className="flex justify-between items-center mb-4 no-print">
        {" "}
        <form method="GET" className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-sm text-sm">
          {" "}
          <label className="text-slate-600 text-xs font-bold">من:</label>{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" name="from" defaultValue={from || ""} className="bg-transparent border-none text-xs outline-none" />{" "}
          <label className="text-slate-600 text-xs font-bold mr-2">إلى:</label>{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" name="to" defaultValue={to || ""} className="bg-transparent border-none text-xs outline-none" />{" "}
          <button type="submit" className="text-indigo-600 font-bold hover:text-indigo-800 mr-2 border-r border-slate-300 pr-2 text-xs">
            تحديث
          </button>{" "}
        </form>{" "}
        <div className="flex gap-2">
          {" "}
          <button id="tb-print-btn" className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-colors">
            {" "}
            <Printer size={14} /> طباعة{" "}
          </button>{" "}
          <script dangerouslySetInnerHTML={{
          __html: `document.getElementById('tb-print-btn')?.addEventListener('click', () => window.print())`
        }} />{" "}
          <button className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-sm text-xs flex items-center gap-1.5 transition-colors">
            {" "}
            <Download size={14} /> تصدير Excel{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <div className="space-y-6">
        {" "}
        {/* Information Callout */}{" "}
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex gap-3 text-indigo-800 text-sm shadow-sm">
          {" "}
          <span className="font-bold">معلومة محاسبية:</span>{" "}
          <span>
            {" "}
            ميزان المراجعة يؤكد صحة قيد اليومية المزدوج. يجب أن يكون مجموع
            "الرصيد الافتتاحي" وكذلك "الرصيد الختامي" صفراً (مجاميع الأرصدة
            المدينة تساوي الدائنة).{" "}
          </span>{" "}
        </div>{" "}
        {/* Table */}{" "}
        <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
          {" "}
          <div className="overflow-x-auto">
            {" "}
            <table className="w-full text-sm text-right">
              {" "}
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-300">
                {" "}
                <tr>
                  {" "}
                  <th className="px-4 py-3 font-bold border-l border-slate-200 w-24">
                    رمز الحساب
                  </th>{" "}
                  <th className="px-4 py-3 font-bold border-l border-slate-200">
                    البيان (الحساب)
                  </th>{" "}
                  <th className="px-4 py-3 font-bold border-l border-slate-200 text-center w-36">
                    الرصيد الافتتاحي
                  </th>{" "}
                  <th className="px-4 py-3 font-bold border-l border-slate-200 text-center w-36">
                    حركة مدينة (Debit)
                  </th>{" "}
                  <th className="px-4 py-3 font-bold border-l border-slate-200 text-center w-36">
                    حركة دائنة (Credit)
                  </th>{" "}
                  <th className="px-4 py-3 font-bold text-center w-36">
                    الرصيد الختامي
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-slate-200">
                {" "}
                {data.rows.length === 0 && <tr>
                    {" "}
                    <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                      لا توجد حركات محاسبية مسجلة.
                    </td>{" "}
                  </tr>}{" "}
                {data.rows.map((row: any) => <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    {" "}
                    <td className="px-4 py-2 border-l border-slate-100 font-mono text-xs text-slate-500">
                      {row.code}
                    </td>{" "}
                    <td className="px-4 py-2 border-l border-slate-100 font-semibold text-slate-800">
                      {row.name}
                    </td>{" "}
                    <td className="px-4 py-2 border-l border-slate-100 text-center font-medium bg-slate-50/50">
                      {renderBalance(row.initialBalance)}
                    </td>{" "}
                    <td className="px-4 py-2 border-l border-slate-100 text-center text-slate-700">
                      {row.debit === 0 ? "-" : formatCurrency(row.debit)}
                    </td>{" "}
                    <td className="px-4 py-2 border-l border-slate-100 text-center text-slate-700">
                      {row.credit === 0 ? "-" : formatCurrency(row.credit)}
                    </td>{" "}
                    <td className="px-4 py-2 text-center font-bold bg-slate-50">
                      {renderBalance(row.endBalance)}
                    </td>{" "}
                  </tr>)}{" "}
              </tbody>{" "}
              <tfoot className="bg-slate-800 text-white font-bold border-t-2 border-slate-400">
                {" "}
                <tr>
                  {" "}
                  <td colSpan={2} className="px-4 py-4 border-l border-slate-600 text-left">
                    الإجماليات (Totals)
                  </td>{" "}
                  <td className="px-4 py-4 border-l border-slate-600 text-center font-mono">
                    {" "}
                    {/* Initial Balance sum should ideally be 0 if balanced */}{" "}
                    {Math.abs(data.totals.initialBalance) < 0.01 ? "-" : `${data.totals.initialBalance.toFixed(2)} ⚠️`}{" "}
                  </td>{" "}
                  <td className="px-4 py-4 border-l border-slate-600 text-center text-emerald-400">
                    {" "}
                    {formatCurrency(data.totals.debit)}{" "}
                  </td>{" "}
                  <td className="px-4 py-4 border-l border-slate-600 text-center text-rose-400">
                    {" "}
                    {formatCurrency(data.totals.credit)}{" "}
                  </td>{" "}
                  <td className="px-4 py-4 text-center font-mono">
                    {" "}
                    {/* End Balance sum should ideally be 0 if balanced */}{" "}
                    {Math.abs(data.totals.endBalance) < 0.01 ? "متزن (0.00)" : `${data.totals.endBalance.toFixed(2)} ⚠️`}{" "}
                  </td>{" "}
                </tr>{" "}
              </tfoot>{" "}
            </table>{" "}
          </div>{" "}
        </div>{" "}
        {Math.abs(data.totals.endBalance) > 0.01 && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center gap-3 mt-4 font-bold shadow-sm">
            {" "}
            <span className="text-xl">⚠️</span> ميزان المراجعة غير متزن! هناك
            فرق بقيمة {data.totals.endBalance.toFixed(2)}. يرجى مراجعة القيود
            اليدوية غير المكتملة.{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}