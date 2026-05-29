import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, Search, FileText, RotateCcw, ArrowLeftRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { cn } from "@/lib/utils";
export default async function CreditNotesPage(props: {
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
  const {
    page: pageStr,
    search,
    type: typeFilter
  } = await props.searchParams;
  const page = parseInt(pageStr || "1");
  const perPage = 20;
  /* Credit notes = out_refund, Debit notes = in_refund */
  const activeType = typeFilter || "out_refund";
  const where: any = {
    type: {
      in: ["out_refund", "in_refund"]
    },
    ...(activeType !== "all" ? {
      type: activeType
    } : {}),
    ...(search ? {
      OR: [{
        name: {
          contains: search
        }
      }, {
        partner: {
          name: {
            contains: search
          }
        }
      }, {
        invoiceOrigin: {
          contains: search
        }
      }]
    } : {})
  };
  const [invoices, total] = await Promise.all([prisma.invoice.findMany({
    where,
    include: {
      partner: true
    },
    orderBy: {
      dateInvoice: "desc"
    },
    skip: (page - 1) * perPage,
    take: perPage
  }), prisma.invoice.count({
    where
  })]);
  const totalPages = Math.ceil(total / perPage);
  const getStateLabel = (state: string) => {
    const labels: Record<string, {
      text: string;
      color: string;
    }> = {
      draft: {
        text: "مسودة",
        color: "bg-slate-100 text-slate-700"
      },
      posted: {
        text: "مُرحّلة",
        color: "bg-blue-100 text-blue-700"
      },
      paid: {
        text: "مدفوعة",
        color: "bg-green-100 text-green-700"
      },
      cancelled: {
        text: "ملغاة",
        color: "bg-red-100 text-red-700"
      }
    };
    return labels[state] || {
      text: state,
      color: "bg-slate-100 text-slate-600"
    };
  };
  return <div className="flex flex-col h-full bg-[#F9FAFB]" dir="rtl">
      {" "}
      {/* Header */}{" "}
      <div className="border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <h1 className="text-lg font-semibold text-slate-800">
            {" "}
            <RotateCcw className="w-5 h-5 inline ml-2 text-slate-500" />{" "}
            المرتجعات{" "}
          </h1>{" "}
          {/* Type Tabs */}{" "}
          <div className="flex gap-1 bg-slate-100 rounded-md p-0.5">
            {" "}
            <Link href={`/${locale}/accounting/returns?type=out_refund`} className={cn("px-3 py-1 text-sm rounded-md transition-colors", activeType === "out_refund" ? "bg-white shadow-sm text-sky-700 font-medium" : "text-slate-600 hover:text-slate-800")}>
              {" "}
              مرتجع بيع (إشعار دائن){" "}
            </Link>{" "}
            <Link href={`/${locale}/accounting/returns?type=in_refund`} className={cn("px-3 py-1 text-sm rounded-md transition-colors", activeType === "in_refund" ? "bg-white shadow-sm text-orange-700 font-medium" : "text-slate-600 hover:text-slate-800")}>
              {" "}
              مرتجع شراء (إشعار مدين){" "}
            </Link>{" "}
            <Link href={`/${locale}/accounting/returns?type=all`} className={cn("px-3 py-1 text-sm rounded-md transition-colors", activeType === "all" ? "bg-white shadow-sm text-slate-700 font-medium" : "text-slate-600 hover:text-slate-800")}>
              {" "}
              الكل{" "}
            </Link>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <form className="flex items-center gap-2" method="GET">
            {" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="hidden" name="type" value={activeType} />{" "}
            <div className="relative">
              {" "}
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
              <input autoComplete="off" autoCorrect="off" spellCheck={false} name="search" defaultValue={search || ""} placeholder="بحث..." className="pl-3 pr-9 py-1.5 text-sm border border-slate-300 rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-sky-500" />{" "}
            </div>{" "}
          </form>{" "}
          <Link href={`/${locale}/accounting/invoices/new?type=${activeType}`} className="flex items-center gap-1 px-3 py-1.5 bg-sky-600 text-white text-sm rounded-md hover:bg-sky-700 transition-colors">
            {" "}
            <Plus className="w-4 h-4" /> جديد{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
      {/* Table */}{" "}
      <div className="flex-1 overflow-auto">
        {" "}
        {invoices.length === 0 ? <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            {" "}
            <RotateCcw className="w-12 h-12 mb-4 text-slate-300" />{" "}
            <p className="text-lg">لا توجد مرتجعات</p>{" "}
            <p className="text-sm mt-1">أنشئ إشعار دائن أو مدين جديد</p>{" "}
          </div> : <table className="w-full text-sm">
            {" "}
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
              {" "}
              <tr>
                {" "}
                <th className="py-2.5 px-4 text-right font-medium">
                  الرقم
                </th>{" "}
                <th className="py-2.5 px-4 text-right font-medium">
                  {activeType === "out_refund" ? "العميل" : "المورد"}
                </th>{" "}
                <th className="py-2.5 px-4 text-right font-medium">التاريخ</th>{" "}
                <th className="py-2.5 px-4 text-right font-medium">المصدر</th>{" "}
                <th className="py-2.5 px-4 text-left font-medium">الإجمالي</th>{" "}
                <th className="py-2.5 px-4 text-left font-medium">المتبقي</th>{" "}
                <th className="py-2.5 px-4 text-center font-medium">الحالة</th>{" "}
                <th className="py-2.5 px-4 text-center font-medium">
                  النوع
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {invoices.map((inv: any) => {
            const state = getStateLabel(inv.state);
            return <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    {" "}
                    <td className="py-2.5 px-4">
                      {" "}
                      <Link href={`/${locale}/accounting/invoices/${inv.id}`} className="text-sky-700 hover:text-sky-600 font-medium">
                        {" "}
                        {inv.name}{" "}
                      </Link>{" "}
                    </td>{" "}
                    <td className="py-2.5 px-4 text-slate-700">
                      {inv.partner?.name}
                    </td>{" "}
                    <td className="py-2.5 px-4 text-slate-600">
                      {" "}
                      {new Date(inv.dateInvoice).toLocaleDateString("en-CA")}{" "}
                    </td>{" "}
                    <td className="py-2.5 px-4 text-slate-500">
                      {inv.invoiceOrigin || "-"}
                    </td>{" "}
                    <td className="py-2.5 px-4 text-left font-medium text-slate-900">
                      {" "}
                      {Number(inv.amountTotal).toFixed(2)}{" "}
                    </td>{" "}
                    <td className={cn("py-2.5 px-4 text-left font-medium", Number(inv.amountResidual) > 0 ? "text-red-600" : "text-green-600")}>
                      {" "}
                      {Number(inv.amountResidual).toFixed(2)}{" "}
                    </td>{" "}
                    <td className="py-2.5 px-4 text-center">
                      {" "}
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", state.color)}>
                        {" "}
                        {state.text}{" "}
                      </span>{" "}
                    </td>{" "}
                    <td className="py-2.5 px-4 text-center">
                      {" "}
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", inv.type === "out_refund" ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-700")}>
                        {" "}
                        {inv.type === "out_refund" ? "إشعار دائن" : "إشعار مدين"}{" "}
                      </span>{" "}
                    </td>{" "}
                  </tr>;
          })}{" "}
            </tbody>{" "}
          </table>}{" "}
      </div>{" "}
      {/* Pagination */}{" "}
      {totalPages > 1 && <div className="border-t border-slate-200 bg-white px-4 py-2 flex items-center justify-between text-sm text-slate-600">
          {" "}
          <span>{total} مرتجع</span>{" "}
          <div className="flex gap-1">
            {" "}
            {page > 1 && <Link href={`/${locale}/accounting/returns?type=${activeType}&page=${page - 1}`} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200">
                السابق
              </Link>}{" "}
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>{" "}
            {page < totalPages && <Link href={`/${locale}/accounting/returns?type=${activeType}&page=${page + 1}`} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200">
                التالي
              </Link>}{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}