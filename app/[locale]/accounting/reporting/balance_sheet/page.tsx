import { getBalanceSheet } from "@/app/actions/reporting";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BalanceSheetHeader } from "@/components/accounting/reporting/BalanceSheetHeader";
import Link from "next/link";
import prisma from "@/lib/prisma";
export default async function BalanceSheetPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const t = await getTranslations("Accounting.Reports.BalanceSheet");
  /* Parse Search Params */
  const from = searchParams.from as string | undefined;
  const to = searchParams.to as string | undefined;
  const target = searchParams.target as string | undefined;
  /* 'posted' or 'all' */
  const showDc = searchParams.showDc as string | undefined;
  const journals = searchParams.journals as string | undefined;
  /* comma separated IDs */
  const plOptions = {
    startDate: from ? new Date(from).toISOString() : undefined,
    endDate: to ? new Date(to).toISOString() : undefined,
    targetState: target === "all" ? "all" : "posted",
    journals: journals ? journals.split(",") : undefined
  };
  /* Fetch Data */
  const data = await getBalanceSheet(plOptions);
  /* Fetch Journals for the Modal */
  const dbJournals = await prisma.journal.findMany({
    where: {
      companyId: session.companyId
    },
    select: {
      id: true,
      name: true,
      code: true
    }
  });
  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  const showDebitCredit = showDc === "true";
  const renderAccountRow = (acc: any, invert: boolean) => <tr key={acc.code} className="hover:bg-slate-50 transition-colors group">
      {" "}
      <td className="py-2 px-2 text-slate-700">
        {" "}
        <Link href={`/${locale}/accounting/journal-items?accountId=${acc.accountId}`} className="flex items-center gap-2 group-hover:text-indigo-600 transition-colors">
          {" "}
          <span className={`font-mono text-xs text-slate-400 group-hover:text-indigo-400 transition-colors ${locale === "ar" ? "ml-2" : "mr-2"}`}>
            {acc.code}
          </span>{" "}
          <span className="font-semibold">{acc.name}</span>{" "}
        </Link>{" "}
      </td>{" "}
      {showDebitCredit && <>
          {" "}
          <td className={`py-2 px-2 font-mono text-slate-500 ${locale === "ar" ? "text-left" : "text-right"}`} dir="ltr">
            {formatNumber(acc.debit || 0)}
          </td>{" "}
          <td className={`py-2 px-2 font-mono text-slate-500 ${locale === "ar" ? "text-left" : "text-right"}`} dir="ltr">
            {formatNumber(acc.credit || 0)}
          </td>{" "}
        </>}{" "}
      <td className={`py-2 px-2 font-bold ${acc.balance < 0 ? "text-red-700" : "text-slate-900"} ${locale === "ar" ? "text-left" : "text-right"} font-mono`} dir="ltr">
        {formatNumber(acc.balance)}
      </td>{" "}
    </tr>;
  const tableHeader = <thead>
      {" "}
      <tr className="bg-slate-50 text-slate-500 text-xs text-right border-b border-slate-200">
        {" "}
        <th className={`py-2 px-2 font-bold ${locale === "ar" ? "text-right" : "text-left"}`}>
          الحساب
        </th>{" "}
        {showDebitCredit && <>
            {" "}
            <th className={`py-2 px-2 font-bold ${locale === "ar" ? "text-left" : "text-right"}`}>
              مدين
            </th>{" "}
            <th className={`py-2 px-2 font-bold ${locale === "ar" ? "text-left" : "text-right"}`}>
              دائن
            </th>{" "}
          </>}{" "}
        <th className={`py-2 px-2 font-bold ${locale === "ar" ? "text-left" : "text-right"}`}>
          الرصيد
        </th>{" "}
      </tr>{" "}
    </thead>;
  return <div className="p-4 text-slate-900" dir={locale === "ar" ? "rtl" : "ltr"}>
      {" "}
      <style>{` @media print { @page { size: A4; margin: 1cm; } body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } } `}</style>{" "}
      <div className="max-w-6xl mx-auto">
        {" "}
        <BalanceSheetHeader journals={dbJournals} currentFilters={{
        from,
        to,
        target,
        showDc,
        journals
      }} bsData={data} />{" "}
        {/* Print-only Header */}{" "}
        <div className="hidden print:block mb-8 text-center">
          {" "}
          <h1 className="text-2xl font-bold mb-2">الميزانية العمومية</h1>{" "}
          <p className="text-sm text-slate-500">
            {" "}
            {from && to ? `الفترة: من ${from} إلى ${to}` : to ? `حتى تاريخ: ${to}` : "حتى تاريخ اليوم"}{" "}
          </p>{" "}
          <p className="text-sm text-slate-500">
            الحركات:{" "}
            {target === "all" ? "كل الإدخالات" : "كل الإدخالات المرحلة"}
          </p>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 gap-12">
          {" "}
          <table className="w-full text-sm border border-slate-200 shadow-sm bg-white print:shadow-none print:border-none rounded-lg overflow-hidden">
            {" "}
            {tableHeader}{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {/* ASSETS */}{" "}
              <tr className="bg-slate-50/80">
                <td colSpan={showDebitCredit ? 4 : 2} className="py-3 px-4 font-bold text-slate-800 border-t-2 border-emerald-500">
                  {t("assets")}
                </td>
              </tr>{" "}
              {data.assets.length === 0 && <tr>
                  <td colSpan={showDebitCredit ? 4 : 2} className="text-slate-400 italic p-3 text-center">
                    {t("noBalance")}
                  </td>
                </tr>}{" "}
              {data.assets.map((acc: any) => renderAccountRow(acc, false))}{" "}
              <tr className="bg-emerald-50/50">
                {" "}
                <td colSpan={showDebitCredit ? 3 : 1} className="py-3 px-4 font-bold text-emerald-900">
                  {t("totalAssets")}
                </td>{" "}
                <td className={`py-3 px-4 font-bold text-emerald-700 ${locale === "ar" ? "text-left" : "text-right"} font-mono border-t border-emerald-200`} dir="ltr">
                  {formatNumber(data.totalAssets)}
                </td>{" "}
              </tr>{" "}
              {/* LIABILITIES */}{" "}
              <tr className="bg-slate-50/80">
                <td colSpan={showDebitCredit ? 4 : 2} className="py-3 px-4 font-bold text-slate-800 border-t-2 border-red-500">
                  {t("liabilities")}
                </td>
              </tr>{" "}
              {data.liabilities.length === 0 && <tr>
                  <td colSpan={showDebitCredit ? 4 : 2} className="text-slate-400 italic p-3 text-center">
                    {t("noBalance")}
                  </td>
                </tr>}{" "}
              {data.liabilities.map((acc: any) => renderAccountRow(acc, true))}{" "}
              {/* EQUITY */}{" "}
              <tr className="bg-slate-50/80">
                <td colSpan={showDebitCredit ? 4 : 2} className="py-3 px-4 font-bold text-slate-800 border-t-2 border-orange-500">
                  {t("equity")}
                </td>
              </tr>{" "}
              {data.equity.map((acc: any) => renderAccountRow(acc, true))}{" "}
              <tr className="hover:bg-slate-50 transition-colors">
                {" "}
                <td className="py-2 px-2 text-slate-700 font-semibold pl-6">
                  {" "}
                  <span className={`font-mono text-xs text-slate-400 ${locale === "ar" ? "ml-2" : "mr-2"}`}>
                    999999
                  </span>{" "}
                  {t("currentYearEarnings")}{" "}
                </td>{" "}
                {showDebitCredit && <>
                    {" "}
                    <td className={`py-2 px-2 font-mono text-slate-500 ${locale === "ar" ? "text-left" : "text-right"}`} dir="ltr">
                      -
                    </td>{" "}
                    <td className={`py-2 px-2 font-mono text-slate-500 ${locale === "ar" ? "text-left" : "text-right"}`} dir="ltr">
                      -
                    </td>{" "}
                  </>}{" "}
                <td className={`py-2 px-2 font-bold text-slate-900 ${locale === "ar" ? "text-left" : "text-right"} font-mono`} dir="ltr">
                  {formatNumber(data.currentYearEarnings)}
                </td>{" "}
              </tr>{" "}
              <tr className="bg-red-50/50 border-y border-red-200">
                {" "}
                <td colSpan={showDebitCredit ? 3 : 1} className="py-3 px-4 font-bold text-red-900">
                  {t("totalEquityAndLiabilities")}
                </td>{" "}
                <td className={`py-3 px-4 font-bold ${data.totalEquityAndLiabilities < 0 ? "text-rose-700" : "text-red-700"} ${locale === "ar" ? "text-left" : "text-right"} font-mono border-t border-red-200`} dir="ltr">
                  {formatNumber(data.totalEquityAndLiabilities)}
                </td>{" "}
              </tr>{" "}
              {/* BALANCE CHECK */}{" "}
              <tr className={`border-t-4 ${Math.abs(data.totalAssets - data.totalEquityAndLiabilities) > 0.01 ? "bg-amber-100 border-amber-400" : "bg-emerald-50 border-emerald-400"}`}>
                {" "}
                <td colSpan={showDebitCredit ? 3 : 1} className={`py-4 px-4 font-bold ${Math.abs(data.totalAssets - data.totalEquityAndLiabilities) > 0.01 ? "text-amber-900" : "text-emerald-900"}`}>
                  {" "}
                  الصافي / فرق الميزانية (يجب أن يكون صفر){" "}
                </td>{" "}
                <td className={`py-4 px-4 font-bold ${Math.abs(data.totalAssets - data.totalEquityAndLiabilities) > 0.01 ? "text-amber-700" : "text-emerald-700"} ${locale === "ar" ? "text-left" : "text-right"} font-mono`} dir="ltr">
                  {" "}
                  {formatNumber(data.totalAssets - data.totalEquityAndLiabilities)}{" "}
                </td>{" "}
              </tr>{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}