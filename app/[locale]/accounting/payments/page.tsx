import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Plus, Search, Wallet, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
export default async function PaymentsListPage(props: {
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
  const search = searchParams?.search;
  const typeFilter = searchParams?.type;
  const currentPage = parseInt(searchParams?.page || "1");
  const pageSize = 20;
  const skip = (currentPage - 1) * pageSize;
  const session = await getSession();
  const companyId = session?.companyId;
  const canCreateFreeVouchers = session?.canCreateFreeVouchers ?? true;
  if (!companyId) redirect(`/${locale}`);
  const where: any = {
    ...(typeFilter === "inbound" ? {
      paymentType: "inbound"
    } : {}),
    ...(typeFilter === "outbound" ? {
      paymentType: "outbound"
    } : {}),
    ...(search ? {
      OR: [{
        name: {
          contains: search
        }
      }, {
        ref: {
          contains: search
        }
      }, {
        partner: {
          name: {
            contains: search
          }
        }
      }]
    } : {})
  };
  const [payments, totalCount] = await Promise.all([prisma.payment.findMany({
    where,
    include: {
      partner: true,
      journal: true
    },
    orderBy: {
      date: "desc"
    },
    skip,
    take: pageSize
  }), prisma.payment.count({
    where
  })]);
  const totalPages = Math.ceil(totalCount / pageSize);
  const startRecord = skip + 1;
  const endRecord = Math.min(skip + pageSize, totalCount);
  const filterTabs = [{
    key: "all",
    label: "الكل"
  }, {
    key: "inbound",
    label: "مدفوعات العميل"
  }, {
    key: "outbound",
    label: "مدفوعات المورد"
  }];
  const buildUrl = (params: Record<string, string>) => {
    const base = `/${locale}/accounting/payments`;
    const parts = Object.entries(params).filter(([_, v]) => v && v !== "all");
    return parts.length > 0 ? `${base}?${parts.map(([k, v]) => `${k}=${v}`).join("&")}` : base;
  };
  return <div className="p-6 space-y-5">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-xl font-bold text-gray-900">الدفعات</h1>{" "}
        <div className="flex gap-3 items-center">
          {" "}
          <span className="text-sm text-gray-500 font-medium">
            {" "}
            {totalCount > 0 ? `${startRecord}-${endRecord} / ${totalCount}` : "0 دفعة"}{" "}
          </span>{" "}
          {canCreateFreeVouchers && (
            <Link href={`/${locale}/accounting/payments/new`} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold shadow-sm">
              {" "}
              <Plus className="w-4 h-4" /> جديد{" "}
            </Link>
          )}
        </div>{" "}
      </div>{" "}
      {/* Filter Tabs */}{" "}
      <div className="flex gap-2 flex-wrap items-center">
        {" "}
        <Filter className="w-4 h-4 text-gray-400" />{" "}
        {filterTabs.map(tab => <Link key={tab.key} href={buildUrl({
        type: tab.key
      })} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors", !typeFilter && tab.key === "all" || typeFilter === tab.key ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
            {" "}
            {tab.label}{" "}
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
            <input type="text" name="search" defaultValue={search} placeholder="بحث بالاسم أو المرجع..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-gray-50/50" />{" "}
          </form>{" "}
          <div className="flex items-center gap-1">
            {" "}
            {currentPage > 1 && <Link href={buildUrl({
            page: String(currentPage - 1),
            ...(search ? {
              search
            } : {}),
            ...(typeFilter ? {
              type: typeFilter
            } : {})
          })} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
                {" "}
                <ChevronRight className="w-4 h-4 text-gray-500" />{" "}
              </Link>}{" "}
            <span className="text-xs text-gray-500 px-2">
              صفحة {currentPage} من {totalPages || 1}
            </span>{" "}
            {currentPage < totalPages && <Link href={buildUrl({
            page: String(currentPage + 1),
            ...(search ? {
              search
            } : {}),
            ...(typeFilter ? {
              type: typeFilter
            } : {})
          })} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
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
                  {" "}
                  <input type="checkbox" className="rounded border-gray-300" />{" "}
                </th>{" "}
                <th className="px-5 py-3">التاريخ</th>{" "}
                <th className="px-5 py-3">العدد</th>{" "}
                <th className="px-5 py-3">دفتر اليومية</th>{" "}
                <th className="px-5 py-3">النوع</th>{" "}
                <th className="px-5 py-3">العميل / المورد</th>{" "}
                <th className="px-5 py-3">المبلغ</th>{" "}
                <th className="px-5 py-3">الحالة</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {payments.map((pay: any) => <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                  {" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <input type="checkbox" className="rounded border-gray-300" />{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5 text-gray-500 text-sm">
                    {" "}
                    {new Date(pay.date).toLocaleDateString("en-GB", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit"
                }).split("/").reverse().join("/")}{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5 font-bold text-blue-600 text-sm">
                    {" "}
                    <Link href={`/${locale}/accounting/payments/${pay.id}`} className="hover:underline">
                      {pay.name}
                    </Link>{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5 text-gray-700 text-sm font-medium">
                    {pay.journal?.name || "-"}
                  </td>{" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border", pay.paymentType === "inbound" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100")}>
                      {" "}
                      {pay.paymentType === "inbound" ? "سند قبض" : "سند صرف"}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5 text-gray-800 text-sm font-medium">
                    {pay.partner?.name || "-"}
                  </td>{" "}
                  <td className="px-5 py-3.5 font-bold text-gray-900 text-sm">
                    {" "}
                    {Number(pay.amount || 0).toLocaleString("en-US")}{" "}
                    <span className="text-[10px] text-gray-400">ج.م</span>{" "}
                  </td>{" "}
                  <td className="px-5 py-3.5">
                    {" "}
                    <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border", pay.state === "posted" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-100 text-gray-500 border-gray-200")}>
                      {" "}
                      {pay.state === "posted" ? "تم الترحيل" : "مسودة"}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
              {payments.length === 0 && <tr>
                  {" "}
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    {" "}
                    <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />{" "}
                    <p className="font-bold">لا توجد دفعات</p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}