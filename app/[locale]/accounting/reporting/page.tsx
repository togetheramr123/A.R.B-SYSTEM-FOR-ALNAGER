import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PieChart, TrendingUp, Scale, FileSpreadsheet, Users, Banknote, Receipt, BookOpen } from "lucide-react";
export default async function ReportingPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const reports = [{
    title: "الأرباح والخسائر",
    description: "صافي الدخل (الإيرادات - المصروفات)",
    icon: TrendingUp,
    color: "text-green-600 bg-green-50",
    href: `/${locale}/accounting/reporting/profit_and_loss`
  }, {
    title: "الميزانية العمومية",
    description: "الأصول، الخصوم، وحقوق الملكية",
    icon: Scale,
    color: "text-blue-600 bg-blue-50",
    href: `/${locale}/accounting/reporting/balance_sheet`
  }, {
    title: "ميزان المراجعة",
    description: "أرصدة جميع الحسابات (مدين/دائن)",
    icon: FileSpreadsheet,
    color: "text-slate-600 bg-slate-50",
    href: `/${locale}/accounting/reporting/trial_balance`
  }, {
    title: "دفتر الأستاذ العام",
    description: "تفاصيل جميع القيود المحاسبية",
    icon: BookOpen,
    color: "text-orange-600 bg-orange-50",
    href: `/${locale}/accounting/reporting/ledger`
  }, {
    title: "كشف حساب العميل/المورد",
    description: "الحركات المالية لكل شريك تجاري",
    icon: Users,
    color: "text-indigo-600 bg-indigo-50",
    href: `/${locale}/accounting/reporting/partner_ledger`
  }, {
    title: "أعمار الديون",
    description: "تحليل المبالغ المستحقة حسب الفترة",
    icon: Receipt,
    color: "text-red-600 bg-red-50",
    href: `/${locale}/accounting/reporting/aged_balance`
  }, {
    title: "التدفق النقدي",
    description: "حركة الأموال الداخلة والخارجة",
    icon: Banknote,
    color: "text-teal-600 bg-teal-50",
    href: `/${locale}/accounting/reporting/cash_flow`
  }, {
    title: "تقرير الضرائب",
    description: "ملخص الضرائب المستحقة والمحصلة",
    icon: PieChart,
    color: "text-amber-600 bg-amber-50",
    href: `/${locale}/accounting/reporting/tax`
  }];
  return <div className="p-8">
      {" "}
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        التقارير المالية
      </h1>{" "}
      <p className="text-slate-500 mb-8">
        جميع التقارير المحاسبية والمالية في مكان واحد
      </p>{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {" "}
        {reports.map((report: any, idx: number) => <Link key={idx} href={report.href} className="block group">
            {" "}
            <div className="bg-white p-6 rounded-sm border border-slate-200 shadow-sm hover:shadow-md transition-all hover:border-blue-300 h-full">
              {" "}
              <div className={`${report.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {" "}
                <report.icon className="w-6 h-6" />{" "}
              </div>{" "}
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {report.title}
              </h3>{" "}
              <p className="text-slate-500 text-sm leading-relaxed">
                {" "}
                {report.description}{" "}
              </p>{" "}
            </div>{" "}
          </Link>)}{" "}
      </div>{" "}
    </div>;
}