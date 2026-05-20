import { getProfitLoss } from "@/app/actions/reporting";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import DateRangeFilter from "@/components/common/DateRangeFilter";
import { getTranslations } from "next-intl/server";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { FileText, Download } from "lucide-react";

export default async function ProfitAndLossPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const session = await getSession();
  
  if (!session) redirect(`/${locale}/login`);
  
  const t = await getTranslations("Accounting.Reports.ProfitAndLoss");
  
  const fromDate = searchParams.from ? new Date(searchParams.from as string) : new Date(new Date().getFullYear(), 0, 1);
  const toDate = searchParams.to ? new Date(searchParams.to as string) : new Date();
  
  const data = await getProfitLoss(fromDate, toDate);

  /* Helper */
  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9f9] text-slate-900" dir={locale === "ar" ? "rtl" : "ltr"}>
      <TopPortal>
        <button
          /* @ts-ignore */
          onClick="window.print()" 
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded text-sm font-medium transition-colors no-print"
        >
          <Download className="w-4 h-4" /> {t("printPDF", { fallback: "PDF" })}
        </button>
      </TopPortal>

      <style>{` 
        @media print { 
          @page { size: A4; margin: 1cm; } 
          body { -webkit-print-color-adjust: exact; background: white !important; } 
          .no-print { display: none !important; } 
          .print-border { border-bottom: 2px solid black !important; }
        } 
      `}</style>
      
      <script dangerouslySetInnerHTML={{ __html: `function printPage() { window.print(); }` }} />

      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 no-print shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="hover:underline cursor-pointer">المحاسبة</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">التقارير</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">{t("title")}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-800">{t("title")} (Profit and Loss)</h1>
          <div className="flex items-center gap-3">
             <DateRangeFilter />
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 shadow-sm p-8 pb-16 min-h-[600px]">
          
          <div className="text-center mb-8 border-b border-slate-200 pb-6">
            <h2 className="text-2xl font-bold text-slate-800">{t("title")}</h2>
            <p className="text-slate-500 text-sm mt-2">
              من {fromDate.toLocaleDateString('en-GB')} إلى {toDate.toLocaleDateString('en-GB')}
            </p>
          </div>

          <div className="flex flex-col font-sans">
            
            {/* Income Section */}
            <div className="flex items-center justify-between py-2 px-2 border-b border-slate-200 mt-4">
              <span className="font-bold text-[15px] text-slate-800 select-none">
                {t("income")} (Operating Income)
              </span>
            </div>
            
            {data.income.length === 0 ? (
              <div className="py-3 px-8 text-sm text-slate-400 italic">{t("noIncome")}</div>
            ) : (
              data.income.map((acc: any) => (
                <div key={acc.code} className="flex items-center justify-between py-2.5 px-2 pl-8 hover:bg-slate-50 border-b border-slate-100 group transition-colors">
                  <div className="flex items-center gap-3">
                    <Link href={`/${locale}/accounting/journal-items?account=${acc.accountId}`} className="flex items-center">
                      <span className="font-mono text-[13px] text-slate-500 group-hover:text-indigo-600 transition-colors w-16">
                        {acc.code}
                      </span>
                      <span className="text-[14px] text-slate-700 font-medium group-hover:text-indigo-600 group-hover:underline underline-offset-2">
                        {acc.name}
                      </span>
                    </Link>
                  </div>
                  <div className="font-mono text-[14px] text-slate-800 font-medium tracking-tight" dir="ltr">
                    {formatNumber(acc.balance)}
                  </div>
                </div>
              ))
            )}

            {/* Total Income */}
            <div className="flex items-center justify-between py-3 px-2 border-t-[1.5px] border-slate-300 border-b-[3px] border-double border-b-slate-300 mt-2 mb-6 print-border">
              <span className="font-bold text-[15px] text-black">
                إجمالي الإيرادات (Gross Profit)
              </span>
              <div className="font-mono text-[15px] font-bold text-black tracking-tight" dir="ltr">
                {formatNumber(data.totalIncome)}
              </div>
            </div>

            {/* Expenses Section */}
            <div className="flex items-center justify-between py-2 px-2 border-b border-slate-200 mt-6">
              <span className="font-bold text-[15px] text-slate-800 select-none">
                {t("expenses")} (Operating Expenses & COGS)
              </span>
            </div>
            
            {data.expenses.length === 0 ? (
              <div className="py-3 px-8 text-sm text-slate-400 italic">{t("noExpenses")}</div>
            ) : (
              data.expenses.map((acc: any) => (
                <div key={acc.code} className="flex items-center justify-between py-2.5 px-2 pl-8 hover:bg-slate-50 border-b border-slate-100 group transition-colors">
                  <div className="flex items-center gap-3">
                    <Link href={`/${locale}/accounting/journal-items?account=${acc.accountId}`} className="flex items-center">
                      <span className="font-mono text-[13px] text-slate-500 group-hover:text-indigo-600 transition-colors w-16">
                        {acc.code}
                      </span>
                      <span className="text-[14px] text-slate-700 font-medium group-hover:text-indigo-600 group-hover:underline underline-offset-2">
                        {acc.name}
                      </span>
                    </Link>
                  </div>
                  <div className="font-mono text-[14px] text-slate-800 font-medium tracking-tight" dir="ltr">
                    {formatNumber(acc.balance)}
                  </div>
                </div>
              ))
            )}

            {/* Total Expenses */}
            <div className="flex items-center justify-between py-3 px-2 border-t-[1.5px] border-slate-300 border-b-[3px] border-double border-b-slate-300 mt-2 mb-8 print-border">
              <span className="font-bold text-[15px] text-black">
                إجمالي المصروفات (Total Expenses)
              </span>
              <div className="font-mono text-[15px] font-bold text-black tracking-tight" dir="ltr">
                {formatNumber(data.totalExpenses)}
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex items-center justify-between py-4 px-2 border-t-2 border-black border-b-[4px] border-double border-b-black mt-6 print-border bg-slate-50">
              <span className="font-bold text-[18px] text-black">
                {t("netProfit")} (Net Profit)
              </span>
              <div className={`font-mono text-[18px] font-bold tracking-tight ${data.netProfit < 0 ? 'text-red-600' : 'text-emerald-700'}`} dir="ltr">
                {formatNumber(data.netProfit)} EGP
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}