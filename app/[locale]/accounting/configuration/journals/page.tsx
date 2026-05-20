import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getAllJournals } from "@/app/actions/journals";
import { Plus, Search, BookOpen, Download } from "lucide-react";
import { cn } from "@/lib/utils";
export default async function JournalsListPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const journals = await getAllJournals();
  const typeConfig: Record<string, {
    label: string;
    color: string;
    border: string;
  }> = {
    sale: {
      label: "المبيعات",
      color: "bg-blue-50 text-blue-700",
      border: "border-blue-200"
    },
    purchase: {
      label: "المشتريات",
      color: "bg-amber-50 text-amber-700",
      border: "border-amber-200"
    },
    cash: {
      label: "النقدي",
      color: "bg-slate-50 text-slate-700",
      border: "border-slate-300"
    },
    bank: {
      label: "البنك",
      color: "bg-emerald-50 text-emerald-700",
      border: "border-emerald-200"
    },
    general: {
      label: "منوعات",
      color: "bg-gray-50 text-gray-700",
      border: "border-gray-200"
    }
  };
  return <div className="p-6 space-y-5">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-xl font-bold text-gray-900">دفاتر اليومية</h1>{" "}
        <div className="flex gap-3 items-center">
          {" "}
          <span className="text-sm text-gray-500 font-medium">
            {" "}
            {journals.length} دفتر{" "}
          </span>{" "}
          <Link href={`/${locale}/accounting/configuration/journals/new`} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold shadow-sm">
            {" "}
            <Plus className="w-4 h-4" /> جديد{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
      {/* Table */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="p-4 border-b border-gray-50 flex gap-4 items-center">
          {" "}
          <form className="relative flex-1 max-w-sm">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />{" "}
            <input type="text" placeholder="بحث..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-gray-50/50" />{" "}
          </form>{" "}
        </div>{" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider">
              {" "}
              <tr>
                {" "}
                <th className="px-5 py-3 w-8">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>{" "}
                <th className="px-5 py-3">اسم دفتر اليومية</th>{" "}
                <th className="px-5 py-3">النوع</th>{" "}
                <th className="px-5 py-3">الكود المختصر</th>{" "}
                <th className="px-5 py-3">حساب الدخل الافتراضي</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {journals.map((journal: any) => {
              const config = typeConfig[journal.type] || typeConfig.general;
              return <tr key={journal.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer">
                    {" "}
                    <td className="px-5 py-3.5">
                      {" "}
                      <input type="checkbox" className="rounded border-gray-300" />{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5 font-bold text-blue-600 text-sm">
                      {" "}
                      <Link href={`/${locale}/accounting/configuration/journals/${journal.id}`} className="hover:underline">
                        {journal.name}
                      </Link>{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5">
                      {" "}
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border", config.color, config.border)}>
                        {" "}
                        {config.label}{" "}
                      </span>{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5 font-mono text-gray-900 font-bold text-sm">
                      {journal.code}
                    </td>{" "}
                    <td className="px-5 py-3.5 text-gray-600 text-sm">
                      {" "}
                      {journal.defaultAccount ? <span>
                          {" "}
                          <span className="font-mono text-gray-400 text-xs ml-1">
                            {journal.defaultAccount.code}
                          </span>{" "}
                          {journal.defaultAccount.name}{" "}
                        </span> : <span className="text-gray-400">-</span>}{" "}
                    </td>{" "}
                  </tr>;
            })}{" "}
              {journals.length === 0 && <tr>
                  {" "}
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    {" "}
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />{" "}
                    <p className="font-bold">لا توجد دفاتر يومية</p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}