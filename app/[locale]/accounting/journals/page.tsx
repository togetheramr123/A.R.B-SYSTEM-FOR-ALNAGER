import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Plus, Search, Book, Download, ChevronLeft, ChevronRight, Filter, Settings2, Calendar, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
export default async function JournalsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const currentPage = parseInt(searchParams?.page || "1");
  const search = searchParams?.search;
  const typeFilter = searchParams?.type;
  const pageSize = 20;
  const skip = (currentPage - 1) * pageSize;
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) redirect(`/${locale}`);
  const where: any = {
    companyId,
    ...(typeFilter ? {
      type: typeFilter
    } : {}),
    ...(search ? {
      OR: [{
        name: {
          contains: search
        }
      }, {
        code: {
          contains: search
        }
      }]
    } : {})
  };
  const [journals, totalCount] = await Promise.all([prisma.journal.findMany({
    where,
    include: {
      defaultAccount: true,
      _count: {
        select: {
          entries: true
        }
      },
      entries: {
        orderBy: {
          date: "desc"
        },
        take: 1,
        select: {
          date: true,
          items: {
            select: {
              debit: true
            }
          }
        }
      }
    },
    orderBy: {
      code: "asc"
    },
    skip,
    take: pageSize
  }), prisma.journal.count({
    where
  })]);
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = skip + 1;
  const endRecord = Math.min(skip + pageSize, totalCount);
  const typeLabels: Record<string, string> = {
    sale: "مبيعات",
    purchase: "مشتريات",
    cash: "نقدي",
    bank: "بنك",
    general: "عام"
  };
  const typeBadgeStyles: Record<string, string> = {
    sale: "bg-blue-50 text-blue-700 border-blue-100",
    purchase: "bg-amber-50 text-amber-700 border-amber-100",
    cash: "bg-emerald-50 text-emerald-700 border-emerald-100",
    bank: "bg-teal-50 text-teal-700 border-teal-100",
    general: "bg-slate-50 text-slate-700 border-slate-100"
  };
  const typeIconColors: Record<string, string> = {
    sale: " ",
    purchase: " ",
    cash: " ",
    bank: " ",
    general: " "
  }; // Process journals to include last entry date and total debit
  const processedJournals = journals.map((j: any) => {
    const lastEntry = j.entries?.[0];
    const lastEntryDate = lastEntry?.date ? new Date(lastEntry.date).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).split("/").reverse().join("/") : null;
    return {
      ...j,
      lastEntryDate
    };
  });
  return <div className="p-6 space-y-5">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="w-9 h-9 bg-[#714B67] rounded-sm flex items-center justify-center shadow-md ">
            {" "}
            <Book className="w-5 h-5 text-white" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h1 className="text-xl font-bold text-gray-900">الدفاتر</h1>{" "}
            <p className="text-xs text-gray-400 font-medium">
              إدارة دفاتر اليومية المحاسبية
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex gap-3 items-center">
          {" "}
          <span className="text-sm text-gray-500 font-medium">
            {" "}
            {startRecord}-{endRecord} / {totalCount}{" "}
          </span>{" "}
          <Link href={`/${locale}/accounting/configuration/journals/new`} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold shadow-sm">
            {" "}
            <Plus className="w-4 h-4" /> دفتر جديد{" "}
          </Link>{" "}
          <button className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium border border-gray-200">
            {" "}
            <Download className="w-4 h-4" /> تصدير{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Filter Tabs */}{" "}
      <div className="flex gap-2 flex-wrap items-center">
        {" "}
        <Filter className="w-4 h-4 text-gray-400" />{" "}
        <Link href={`/${locale}/accounting/journals`} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors", !typeFilter ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          {" "}
          الكل ({totalCount}){" "}
        </Link>{" "}
        {Object.entries(typeLabels).map(([key, label]) => <Link key={key} href={`/${locale}/accounting/journals?type=${key}`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors", typeFilter === key ? typeBadgeStyles[key] || "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
            {" "}
            {label}{" "}
          </Link>)}{" "}
      </div>{" "}
      {/* Table */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="p-4 border-b border-gray-50 flex gap-4 items-center justify-between">
          {" "}
          <form className="relative flex-1 max-w-sm">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" name="search" defaultValue={search} placeholder="بحث بالكود أو الاسم..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-gray-50/50" />{" "}
          </form>{" "}
          <div className="flex items-center gap-1">
            {" "}
            {currentPage > 1 && <Link href={`/${locale}/accounting/journals?page=${currentPage - 1}${search ? `&search=${search}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
                {" "}
                <ChevronRight className="w-4 h-4 text-gray-500" />{" "}
              </Link>}{" "}
            <span className="text-xs text-gray-500 px-2">
              صفحة {currentPage} من {totalPages || 1}
            </span>{" "}
            {currentPage < totalPages && <Link href={`/${locale}/accounting/journals?page=${currentPage + 1}${search ? `&search=${search}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
                {" "}
                <ChevronLeft className="w-4 h-4 text-gray-500" />{" "}
              </Link>}{" "}
          </div>{" "}
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
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="rounded border-gray-300" />
                </th>{" "}
                <th className="px-5 py-3">الكود</th>{" "}
                <th className="px-5 py-3">اسم الدفتر</th>{" "}
                <th className="px-5 py-3">النوع</th>{" "}
                <th className="px-5 py-3">الحساب الافتراضي</th>{" "}
                <th className="px-5 py-3 text-center">عدد القيود</th>{" "}
                <th className="px-5 py-3">آخر قيد</th>{" "}
                <th className="px-5 py-3">إعدادات</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {processedJournals.map((j: any) => <tr key={j.id} className="hover:bg-blue-50/30 transition-colors group">
                  {" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="rounded border-gray-300" />{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <span className={cn("inline-flex items-center gap-1.5 font-mono text-sm font-bold text-gray-900")}>
                      {" "}
                      <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", typeIconColors[j.type] || " ")} />{" "}
                      {j.code}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <Link href={`/${locale}/accounting/configuration/journals/${j.id}`} className="flex items-center gap-2 group/name">
                      {" "}
                      <Book className="w-4 h-4 text-gray-300 group-hover/name:text-blue-500 transition-colors" />{" "}
                      <span className="font-bold text-blue-600 text-sm hover:underline">
                        {j.name}
                      </span>{" "}
                    </Link>{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border", typeBadgeStyles[j.type] || "bg-gray-100 text-gray-500 border-gray-200")}>
                      {" "}
                      {typeLabels[j.type] || j.type}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5 text-gray-600 text-sm font-medium">
                    {" "}
                    {j.defaultAccount ? <span>
                        {" "}
                        <span className="text-gray-400 font-mono text-xs ml-1">
                          {j.defaultAccount.code}
                        </span>{" "}
                        {j.defaultAccount.name}{" "}
                      </span> : <span className="text-gray-400 italic">—</span>}{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5 text-center">
                    {" "}
                    <span className={cn("inline-flex items-center justify-center min-w-[28px] h-7 rounded-full text-xs font-bold", j._count.entries > 0 ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-400")}>
                      {" "}
                      {j._count.entries}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5 text-sm">
                    {" "}
                    {j.lastEntryDate ? <span className="text-gray-500 flex items-center gap-1.5">
                        {" "}
                        <Calendar className="w-3.5 h-3.5 text-gray-300" />{" "}
                        {j.lastEntryDate}{" "}
                      </span> : <span className="text-gray-300 text-xs">لا قيود</span>}{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <Link href={`/${locale}/accounting/configuration/journals/${j.id}`} className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                      {" "}
                      <Settings2 className="w-4 h-4" />{" "}
                    </Link>{" "}
                  </td>{" "}
                </tr>)}{" "}
              {journals.length === 0 && <tr>
                  {" "}
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    {" "}
                    <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />{" "}
                    <p className="font-bold">لا توجد دفاتر</p>{" "}
                    <p className="text-xs mt-1">
                      أنشئ دفتر يومية جديد للبدء
                    </p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}