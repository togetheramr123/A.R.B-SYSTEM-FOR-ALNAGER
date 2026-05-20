import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGeneralLedger } from "@/app/actions/reporting";
import DateRangeFilter from "@/components/common/DateRangeFilter";
import { BrowserPrintButton } from "@/components/common/BrowserPrintButton";
import { TopPortal } from "@/components/common/TopPortal";
export default async function LedgerPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    accountId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    accountId,
    from,
    to
  } = await props.searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  /* Default: Start of current year to today */
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = to ? new Date(to) : new Date();
  const accountsData = await getGeneralLedger(accountId, fromDate, toDate);
  return <div className="p-4 text-slate-900" dir={locale === "ar" ? "rtl" : "ltr"}>
      {" "}
      <TopPortal>
        {" "}
        <BrowserPrintButton />{" "}
      </TopPortal>{" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { @page { size: A4 landscape; margin: 1cm; } body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } .page-break { page-break-before: always; } } `}</style>{" "}
      <div className="max-w-6xl mx-auto space-y-8">
        {" "}
        <div className="flex justify-between items-center mb-4">
          {" "}
          <div>
            {" "}
            <h1 className="text-xl font-bold text-slate-800">
              الأستاذ العام (General Ledger)
            </h1>{" "}
          </div>{" "}
        </div>{" "}
        <div className="no-print">
          {" "}
          <DateRangeFilter />{" "}
        </div>{" "}
        {accountsData.length === 0 ? <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            {" "}
            لا توجد بيانات في هذه الفترة (No Data){" "}
          </div> : accountsData.map((data: any, index: number) => {
        let runningBalance = data.initialBalance;
        const totalDebit = data.items.reduce((acc: number, item: any) => acc + item.debit, 0);
        const totalCredit = data.items.reduce((acc: number, item: any) => acc + item.credit, 0);
        return <div key={data.id} className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${index > 0 ? "page-break" : ""}`}>
                {" "}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  {" "}
                  <h2 className="text-lg font-bold text-slate-800">
                    {" "}
                    <span className="font-mono text-slate-500 mr-2">
                      {data.code}
                    </span>{" "}
                    {data.name}{" "}
                  </h2>{" "}
                  <span className="text-sm font-medium bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                    {" "}
                    الرصيد الافتتاحي:{" "}
                    <span dir="ltr">
                      {data.initialBalance.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                    </span>{" "}
                  </span>{" "}
                </div>{" "}
                <table className="w-full text-sm text-left">
                  {" "}
                  <thead className="bg-slate-50/50 text-slate-600 font-semibold border-b border-slate-200">
                    {" "}
                    <tr>
                      {" "}
                      <th className="p-3 w-32">التاريخ</th>{" "}
                      <th className="p-3 w-40">المستند</th>{" "}
                      <th className="p-3 w-48">الشريك</th>{" "}
                      <th className="p-3">البيان</th>{" "}
                      <th className="p-3 text-right w-32 text-slate-500">
                        مدين
                      </th>{" "}
                      <th className="p-3 text-right w-32 text-slate-500">
                        دائن
                      </th>{" "}
                      <th className="p-3 text-right w-32">الرصيد</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="divide-y divide-slate-100">
                    {" "}
                    {data.items.length === 0 ? <tr>
                        {" "}
                        <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                          لا توجد حركات في هذه الفترة
                        </td>{" "}
                      </tr> : data.items.map((item: any) => {
                runningBalance += item.debit - item.credit;
                return <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            {" "}
                            <td className="p-3 text-slate-600">
                              {new Date(item.date).toLocaleDateString()}
                            </td>{" "}
                            <td className="p-3 font-medium text-slate-700">
                              {item.name}
                            </td>{" "}
                            <td className="p-3 text-slate-600 truncate max-w-[12rem]" title={item.partner}>
                              {item.partner || "-"}
                            </td>{" "}
                            <td className="p-3 text-slate-500 truncate max-w-[20rem]" title={item.ref}>
                              {item.ref}
                            </td>{" "}
                            <td className="p-3 text-right text-slate-600 font-mono">
                              {" "}
                              {item.debit > 0 ? item.debit.toLocaleString("en-US", {
                      minimumFractionDigits: 2
                    }) : "-"}{" "}
                            </td>{" "}
                            <td className="p-3 text-right text-slate-600 font-mono">
                              {" "}
                              {item.credit > 0 ? item.credit.toLocaleString("en-US", {
                      minimumFractionDigits: 2
                    }) : "-"}{" "}
                            </td>{" "}
                            <td className="p-3 text-right font-bold text-slate-800 font-mono" dir="ltr">
                              {" "}
                              {runningBalance.toLocaleString("en-US", {
                      minimumFractionDigits: 2
                    })}{" "}
                            </td>{" "}
                          </tr>;
              })}{" "}
                  </tbody>{" "}
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-700">
                    {" "}
                    <tr>
                      {" "}
                      <td colSpan={4} className="p-3 text-center">
                        الإجمالي / الرصيد الختامي
                      </td>{" "}
                      <td className="p-3 text-right font-mono">
                        {totalDebit.toLocaleString("en-US", {
                    minimumFractionDigits: 2
                  })}
                      </td>{" "}
                      <td className="p-3 text-right font-mono">
                        {totalCredit.toLocaleString("en-US", {
                    minimumFractionDigits: 2
                  })}
                      </td>{" "}
                      <td className={`p-3 text-right font-mono ${runningBalance < 0 ? "text-red-600" : "text-green-600"}`} dir="ltr">
                        {" "}
                        {runningBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2
                  })}{" "}
                      </td>{" "}
                    </tr>{" "}
                  </tfoot>{" "}
                </table>{" "}
              </div>;
      })}{" "}
      </div>{" "}
    </div>;
}