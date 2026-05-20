import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TopPortal } from "@/components/common/TopPortal";
import { redirect } from "next/navigation";
import { Plus, Search, ChartPie, FolderTree, ArrowRight, Hash, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
export default async function AnalyticAccountsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) redirect(`/${locale}`);
  const accounts = await prisma.analyticAccount.findMany({
    include: {
      parent: true,
      children: true,
      journalItems: {
        select: {
          debit: true,
          credit: true
        }
      },
      budgetLines: {
        select: {
          plannedAmount: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
  const serialized = accounts.map(acc => ({
    ...acc,
    totalDebit: acc.journalItems.reduce((s, ji) => s + Number(ji.debit || 0), 0),
    totalCredit: acc.journalItems.reduce((s, ji) => s + Number(ji.credit || 0), 0),
    balance: acc.journalItems.reduce((s, ji) => s + Number(ji.debit || 0) - Number(ji.credit || 0), 0),
    budgetTotal: acc.budgetLines.reduce((s, bl) => s + Number(bl.plannedAmount || 0), 0),
    childrenCount: acc.children.length,
    journalItemsCount: acc.journalItems.length
  }));
  const totalBalance = serialized.reduce((s, a) => s + a.balance, 0);
  return <div className="p-4" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <Link href={`/${locale}/accounting/analytic/new`} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
          {" "}
          <Plus className="w-3.5 h-3.5" /> جديد{" "}
        </Link>{" "}
      </TopPortal>{" "}
      <div className="max-w-6xl mx-auto space-y-6">
        {" "}
        {/* Summary Cards */}{" "}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {" "}
          <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-5">
            {" "}
            <div className="flex items-center gap-3 mb-2">
              {" "}
              <div className="p-2 bg-blue-50 rounded-lg">
                {" "}
                <FolderTree className="w-4 h-4 text-blue-600" />{" "}
              </div>{" "}
              <span className="text-xs font-bold text-gray-400 uppercase">
                إجمالي الحسابات
              </span>{" "}
            </div>{" "}
            <p className="text-2xl font-bold text-gray-900">
              {serialized.length}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-5">
            {" "}
            <div className="flex items-center gap-3 mb-2">
              {" "}
              <div className="p-2 bg-emerald-50 rounded-lg">
                {" "}
                <Hash className="w-4 h-4 text-teal-700" />{" "}
              </div>{" "}
              <span className="text-xs font-bold text-gray-400 uppercase">
                إجمالي القيود
              </span>{" "}
            </div>{" "}
            <p className="text-2xl font-bold text-gray-900">
              {" "}
              {serialized.reduce((s, a) => s + a.journalItemsCount, 0)}{" "}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-5">
            {" "}
            <div className="flex items-center gap-3 mb-2">
              {" "}
              <div className="p-2 bg-amber-50 rounded-lg">
                {" "}
                <Building2 className="w-4 h-4 text-amber-600" />{" "}
              </div>{" "}
              <span className="text-xs font-bold text-gray-400 uppercase">
                صافي الرصيد
              </span>{" "}
            </div>{" "}
            <p className={cn("text-2xl font-bold", totalBalance >= 0 ? "text-teal-700" : "text-red-600")}>
              {" "}
              {totalBalance.toLocaleString("en-US")}{" "}
              <span className="text-sm text-gray-400">ج.م</span>{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Accounts Table */}{" "}
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/80">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-4 text-right">الكود</th>{" "}
                <th className="px-6 py-4 text-right">اسم الحساب التحليلي</th>{" "}
                <th className="px-6 py-4 text-right">الحساب الأب</th>{" "}
                <th className="px-6 py-4 text-right">الفروع</th>{" "}
                <th className="px-6 py-4 text-right">عدد القيود</th>{" "}
                <th className="px-6 py-4 text-right">المدين</th>{" "}
                <th className="px-6 py-4 text-right">الدائن</th>{" "}
                <th className="px-6 py-4 text-right">الرصيد</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {serialized.map(acc => <tr key={acc.id} className="hover:bg-blue-50/30 transition-all cursor-pointer group">
                  {" "}
                  <td className="px-6 py-4 text-sm font-mono text-gray-500">
                    {acc.code || "—"}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {" "}
                      {acc.name}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {acc.parent?.name || "—"}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {acc.childrenCount > 0 ? acc.childrenCount : "—"}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">
                      {" "}
                      {acc.journalItemsCount}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">
                    {acc.totalDebit.toLocaleString("en-US")}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm font-bold text-gray-700">
                    {acc.totalCredit.toLocaleString("en-US")}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <span className={cn("text-sm font-bold", acc.balance > 0 ? "text-teal-700" : acc.balance < 0 ? "text-red-600" : "text-gray-400")}>
                      {" "}
                      {acc.balance.toLocaleString("en-US")}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
              {serialized.length === 0 && <tr>
                  {" "}
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    {" "}
                    <ChartPie className="w-12 h-12 mx-auto mb-3 text-gray-200" />{" "}
                    <p className="font-bold">لا توجد حسابات تحليلية</p>{" "}
                    <p className="text-xs mt-1">
                      أنشئ حسابات تحليلية لتتبع مراكز التكلفة والمشاريع
                    </p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
            {serialized.length > 0 && <tfoot className="bg-gray-50/80 border-t-2 border-gray-200">
                {" "}
                <tr className="font-bold text-sm">
                  {" "}
                  <td className="px-6 py-4" colSpan={5}>
                    الإجمالي
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-900">
                    {" "}
                    {serialized.reduce((s, a) => s + a.totalDebit, 0).toLocaleString("en-US")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-gray-900">
                    {" "}
                    {serialized.reduce((s, a) => s + a.totalCredit, 0).toLocaleString("en-US")}{" "}
                  </td>{" "}
                  <td className={cn("px-6 py-4", totalBalance >= 0 ? "text-teal-700" : "text-red-600")}>
                    {" "}
                    {totalBalance.toLocaleString("en-US")}{" "}
                  </td>{" "}
                </tr>{" "}
              </tfoot>}{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}