import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, Search, Filter, MoreHorizontal, FileText, Download, Upload } from "lucide-react";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
export default async function RefundsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    q
  } = await props.searchParams;
  const t = await getTranslations("Accounting");
  const where: any = {
    type: "in_refund"
  };
  if (q) {
    where.OR = [{
      name: {
        contains: q
      }
    }, {
      partner: {
        name: {
          contains: q
        }
      }
    }];
  }
  const refunds = await prisma.invoice.findMany({
    where,
    include: {
      partner: true
    },
    orderBy: {
      dateInvoice: "desc"
    },
    take: 50
  });
  return <div className="space-y-6">
      {" "}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <h1 className="text-2xl font-bold text-slate-800">
            الاستردادات (إشعارات دائنة)
          </h1>{" "}
          {/* Breadcrumbs or extra info can go here */}{" "}
        </div>{" "}
        <div className="flex gap-2">
          {" "}
          <Link href="./refunds/create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm">
            {" "}
            <Plus className="w-5 h-5" /> <span>جديد</span>{" "}
          </Link>{" "}
          <button className="bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm" title="رفع">
            {" "}
            <Upload className="w-5 h-5" />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
        {" "}
        {/* Search & Filter - Matching Screenshot Style roughly */}{" "}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          {" "}
          <div className="relative flex-1 max-w-2xl w-full">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />{" "}
            <input type="text" placeholder="بحث..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" defaultValue={q} />{" "}
          </div>{" "}
          <div className="flex gap-2 text-sm">
            {" "}
            <div className="flex items-center gap-1 text-slate-600 cursor-pointer hover:text-indigo-600 px-2 py-1">
              {" "}
              <Filter className="w-4 h-4" /> <span>عوامل التصفية</span>{" "}
            </div>{" "}
            <div className="flex items-center gap-1 text-slate-600 cursor-pointer hover:text-indigo-600 px-2 py-1">
              {" "}
              <MoreHorizontal className="w-4 h-4" />{" "}
              {/* Replacing Group By icon */} <span>التجميع حسب</span>{" "}
            </div>{" "}
            <div className="flex items-center gap-1 text-slate-600 cursor-pointer hover:text-indigo-600 px-2 py-1">
              {" "}
              <span>★ المفضلة</span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right text-sm">
            {" "}
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              {" "}
              <tr>
                {" "}
                <th className="px-4 py-3 w-10">
                  {" "}
                  <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />{" "}
                </th>{" "}
                <th className="px-4 py-3">العدد</th>{" "}
                <th className="px-4 py-3">المورد</th>{" "}
                <th className="px-4 py-3">تاريخ الفاتورة</th>{" "}
                <th className="px-4 py-3">تاريخ الاستحقاق</th>{" "}
                <th className="px-4 py-3">المرجع</th>{" "}
                <th className="px-4 py-3">الأنشطة</th>{" "}
                <th className="px-4 py-3">غير شامل الضريبة</th>{" "}
                <th className="px-4 py-3">الإجمالي</th>{" "}
                <th className="px-4 py-3">حالة الدفع</th>{" "}
                <th className="px-4 py-3">الحالة</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {refunds.map((refund: any) => <tr key={refund.id} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  {" "}
                  <td className="px-4 py-3">
                    {" "}
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />{" "}
                  </td>{" "}
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {" "}
                    <Link href={`/${locale}/accounting/bills/${refund.id}`} className="hover:underline">
                      {" "}
                      {refund.name}{" "}
                    </Link>{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {" "}
                    {refund.partner?.name}{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-slate-600 font-mono">
                    {" "}
                    {refund.dateInvoice ? format(new Date(refund.dateInvoice), "dd MMM yyyy") : "-"}{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-red-500 font-mono text-xs">
                    {" "}
                    {/* Mocking Due Date Logic / Logic from Odoo */}{" "}
                    {refund.dateDue ? format(new Date(refund.dateDue), "dd MMM yyyy") : "فورًا"}{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]" title={refund.invoiceOrigin || ""}>
                    {" "}
                    {refund.invoiceOrigin || refund.narration || "-"}{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-center">
                    {" "}
                    <div className="w-4 h-4 rounded-full border border-slate-300 mx-auto text-slate-300 hover:text-indigo-500 hover:border-indigo-500 transition-colors">
                      {" "}
                      <span className="sr-only">Schedule Activity</span>{" "}
                      {/* Clock Icon Placeholder */}{" "}
                      <svg className="w-full h-full p-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>{" "}
                    </div>{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-slate-700 font-mono">
                    {" "}
                    {refund.amountUntaxed.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}{" "}
                    LE{" "}
                  </td>{" "}
                  <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                    {" "}
                    {refund.amountTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}{" "}
                    LE{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-center">
                    {" "}
                    {/* Payment Status Badge */}{" "}
                    <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${refund.amountResidual === 0 ? "bg-green-500" : "bg-red-500"} `}>
                      {" "}
                      {refund.amountResidual === 0 ? "مدفوع" : "غير مسدد"}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-4 py-3 text-center">
                    {" "}
                    {/* State Badge */}{" "}
                    <span className={`px-2 py-1 rounded-full text-xs font-bold text-white ${refund.state === "posted" ? "bg-green-600" : "bg-blue-400"} `}>
                      {" "}
                      {refund.state === "posted" ? "تم الترحيل" : "مسودة"}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
              {refunds.length === 0 && <tr>
                  {" "}
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    {" "}
                    <div className="flex flex-col items-center gap-2">
                      {" "}
                      <FileText className="w-8 h-8 opacity-20" />{" "}
                      <p>لا توجد استردادات مطابقة للبحث</p>{" "}
                    </div>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
            <tfoot className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
              {" "}
              <tr>
                {" "}
                <td colSpan={7}></td>{" "}
                <td className="px-4 py-2">
                  {" "}
                  {/* Mock Total Untaxed Sum could go here if calculated */}{" "}
                </td>{" "}
                <td className="px-4 py-2">
                  {" "}
                  {/* Mock Total Sum */}{" "}
                  {refunds.reduce((acc: number, r: any) => acc + r.amountTotal, 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2
                })}{" "}
                  LE{" "}
                </td>{" "}
                <td colSpan={2}></td>{" "}
              </tr>{" "}
            </tfoot>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}