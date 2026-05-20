import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTrialBalance } from "@/app/actions/reporting";
import { BrowserPrintButton } from "@/components/common/BrowserPrintButton";
import DateRangeFilter from "@/components/common/DateRangeFilter";
import { TopPortal } from "@/components/common/TopPortal";
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
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;
  const accounts = await getTrialBalance(fromDate, toDate);
  const totalInitial = accounts.reduce((sum: number, acc: any) => sum + acc.initialBalance, 0);
  const totalDebit = accounts.reduce((sum: number, acc: any) => sum + acc.debit, 0);
  const totalCredit = accounts.reduce((sum: number, acc: any) => sum + acc.credit, 0);
  const totalBalance = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
  return <div className="p-4 text-slate-900" dir={locale === "ar" ? "rtl" : "ltr"}>
      {" "}
      <TopPortal>
        {" "}
        <BrowserPrintButton />{" "}
      </TopPortal>{" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { @page { size: A4; margin: 1cm; } body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } } `}</style>{" "}
      <div className="max-w-5xl mx-auto">
        {" "}
        <div className="flex justify-between items-center mb-4">
          {" "}
          <div>
            {" "}
            <h1 className="text-xl font-bold">
              ميزان المراجعة (Trial Balance)
            </h1>{" "}
          </div>{" "}
        </div>{" "}
        <div className="no-print">
          {" "}
          <DateRangeFilter />{" "}
        </div>{" "}
        <div className="overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
          {" "}
          <table className="w-full text-right text-sm">
            {" "}
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              {" "}
              <tr>
                {" "}
                <th className="p-3 border-r">الكود</th>{" "}
                <th className="p-3 border-r">الحساب</th>{" "}
                <th className="p-3 border-r bg-slate-100">رصيد افتتاحي</th>{" "}
                <th className="p-3 border-r">مدين (Debit)</th>{" "}
                <th className="p-3 border-r">دائن (Credit)</th>{" "}
                <th className="p-3 bg-slate-100">رصيد ختامي</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {accounts.map((acc: any) => <tr key={acc.code} className="hover:bg-slate-50 transition-colors">
                  {" "}
                  <td className="p-3 font-mono text-slate-500 border-r">
                    {acc.code}
                  </td>{" "}
                  <td className="p-3 font-medium text-slate-800 border-r">
                    {acc.name}
                  </td>{" "}
                  <td className="p-3 font-mono border-r bg-slate-50 text-slate-700">
                    {acc.initialBalance === 0 ? "-" : acc.initialBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                  </td>{" "}
                  <td className="p-3 font-mono border-r text-slate-600">
                    {acc.debit === 0 ? "-" : acc.debit.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                  </td>{" "}
                  <td className="p-3 font-mono border-r text-slate-600">
                    {acc.credit === 0 ? "-" : acc.credit.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                  </td>{" "}
                  <td className={`p-3 font-bold font-mono bg-slate-50 ${acc.balance < 0 ? "text-red-600" : "text-green-600"} ${acc.balance === 0 ? "text-slate-400" : ""}`} dir="ltr">
                    {" "}
                    {acc.balance.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}{" "}
                  </td>{" "}
                </tr>)}{" "}
            </tbody>{" "}
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
              {" "}
              <tr>
                {" "}
                <td colSpan={2} className="p-3 text-center border-r">
                  الإجمالي
                </td>{" "}
                <td className="p-3 font-mono border-r">
                  {totalInitial.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                </td>{" "}
                <td className="p-3 font-mono border-r">
                  {totalDebit.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                </td>{" "}
                <td className="p-3 font-mono border-r">
                  {totalCredit.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                </td>{" "}
                <td className="p-3 font-mono">
                  {totalBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                </td>{" "}
              </tr>{" "}
            </tfoot>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}