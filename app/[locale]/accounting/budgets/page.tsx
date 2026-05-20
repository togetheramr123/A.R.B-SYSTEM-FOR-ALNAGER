import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopPortal } from "@/components/common/TopPortal";
import { Plus, PiggyBank, TrendingUp, Calendar, Target, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { serializeDecimal } from "@/lib/serialize";
export default async function BudgetsPage(props: {
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
  const budgets = await prisma.budget.findMany({
    include: {
      lines: {
        include: {
          analyticAccount: true,
          generalAccount: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
  const serialized = serializeDecimal(budgets);
  const stateStyles: Record<string, {
    label: string;
    bg: string;
    icon: any;
  }> = {
    draft: {
      label: "مسودة",
      bg: "bg-gray-100 text-gray-600",
      icon: Clock
    },
    confirmed: {
      label: "مؤكدة",
      bg: "bg-blue-50 text-blue-700",
      icon: CheckCircle2
    },
    done: {
      label: "منتهية",
      bg: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2
    },
    cancelled: {
      label: "ملغية",
      bg: "bg-red-50 text-red-600",
      icon: AlertTriangle
    }
  };
  const totalPlanned = serialized.reduce((s: number, b: any) => s + b.lines.reduce((ls: number, l: any) => ls + Number(l.plannedAmount || 0), 0), 0);
  const totalPractical = serialized.reduce((s: number, b: any) => s + b.lines.reduce((ls: number, l: any) => ls + Number(l.practicalAmount || 0), 0), 0);
  return <div className="p-4" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <Link href={`/${locale}/accounting/budgets/new`} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
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
                <Target className="w-4 h-4 text-blue-600" />{" "}
              </div>{" "}
              <span className="text-xs font-bold text-gray-400 uppercase">
                الميزانيات
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
                <TrendingUp className="w-4 h-4 text-teal-700" />{" "}
              </div>{" "}
              <span className="text-xs font-bold text-gray-400 uppercase">
                إجمالي المخطط
              </span>{" "}
            </div>{" "}
            <p className="text-2xl font-bold text-teal-700">
              {" "}
              {totalPlanned.toLocaleString("en-US")}{" "}
              <span className="text-sm text-gray-400">ج.م</span>{" "}
            </p>{" "}
          </div>{" "}
          <div className="bg-white rounded-sm border border-gray-100 shadow-sm p-5">
            {" "}
            <div className="flex items-center gap-3 mb-2">
              {" "}
              <div className="p-2 bg-amber-50 rounded-lg">
                {" "}
                <PiggyBank className="w-4 h-4 text-amber-600" />{" "}
              </div>{" "}
              <span className="text-xs font-bold text-gray-400 uppercase">
                إجمالي الفعلي
              </span>{" "}
            </div>{" "}
            <p className={cn("text-2xl font-bold", totalPractical <= totalPlanned ? "text-blue-600" : "text-red-600")}>
              {" "}
              {totalPractical.toLocaleString("en-US")}{" "}
              <span className="text-sm text-gray-400">ج.م</span>{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Budgets List */}{" "}
        <div className="space-y-4">
          {" "}
          {serialized.map((budget: any) => {
          const planned = budget.lines.reduce((s: number, l: any) => s + Number(l.plannedAmount || 0), 0);
          const practical = budget.lines.reduce((s: number, l: any) => s + Number(l.practicalAmount || 0), 0);
          const pct = planned > 0 ? Math.min(100, practical / planned * 100) : 0;
          const stateInfo = stateStyles[budget.state] || stateStyles.draft;
          const StateIcon = stateInfo.icon;
          return <div key={budget.id} className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {" "}
                <div className="p-6">
                  {" "}
                  <div className="flex items-start justify-between mb-4">
                    {" "}
                    <div>
                      {" "}
                      <h3 className="text-base font-bold text-gray-900">
                        {budget.name}
                      </h3>{" "}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        {" "}
                        <span className="flex items-center gap-1">
                          {" "}
                          <Calendar className="w-3.5 h-3.5" />{" "}
                          {new Date(budget.dateFrom).toLocaleDateString("en-CA")}{" "}
                          →{" "}
                          {new Date(budget.dateTo).toLocaleDateString("en-CA")}{" "}
                        </span>{" "}
                        <span className="flex items-center gap-1">
                          {" "}
                          {budget.lines.length} بنود{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                    <span className={cn("text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1", stateInfo.bg)}>
                      {" "}
                      <StateIcon className="w-3 h-3" /> {stateInfo.label}{" "}
                    </span>{" "}
                  </div>{" "}
                  {/* Progress Bar */}{" "}
                  <div className="mb-3">
                    {" "}
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      {" "}
                      <span className="text-gray-500">الاستهلاك</span>{" "}
                      <span className={pct > 90 ? "text-red-600" : pct > 70 ? "text-amber-600" : "text-teal-700"}>
                        {" "}
                        {pct.toFixed(0)}%{" "}
                      </span>{" "}
                    </div>{" "}
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      {" "}
                      <div className={cn("h-2.5 rounded-full transition-all", pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-emerald-500")} style={{
                    width: `${pct}%`
                  }} />{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center justify-between text-sm">
                    {" "}
                    <div className="flex gap-6">
                      {" "}
                      <div>
                        {" "}
                        <span className="text-xs text-gray-400 block">
                          المخطط
                        </span>{" "}
                        <span className="font-bold text-gray-900">
                          {planned.toLocaleString("en-US")} ج.م
                        </span>{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <span className="text-xs text-gray-400 block">
                          الفعلي
                        </span>{" "}
                        <span className={cn("font-bold", practical > planned ? "text-red-600" : "text-blue-600")}>
                          {" "}
                          {practical.toLocaleString("en-US")} ج.م{" "}
                        </span>{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <span className="text-xs text-gray-400 block">
                          المتبقي
                        </span>{" "}
                        <span className={cn("font-bold", planned - practical >= 0 ? "text-teal-700" : "text-red-600")}>
                          {" "}
                          {(planned - practical).toLocaleString("en-US")}{" "}
                          ج.م{" "}
                        </span>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                {/* Budget Lines Summary */}{" "}
                {budget.lines.length > 0 && <div className="border-t border-gray-50 px-6 py-3 bg-gray-50/50">
                    {" "}
                    <table className="w-full text-xs text-right">
                      {" "}
                      <thead>
                        {" "}
                        <tr className="text-gray-400 font-bold">
                          {" "}
                          <th className="py-1.5 text-right">الحساب</th>{" "}
                          <th className="py-1.5 text-right">الحساب التحليلي</th>{" "}
                          <th className="py-1.5 text-right">المخطط</th>{" "}
                          <th className="py-1.5 text-right">الفعلي</th>{" "}
                          <th className="py-1.5 text-right">%</th>{" "}
                        </tr>{" "}
                      </thead>{" "}
                      <tbody>
                        {" "}
                        {budget.lines.slice(0, 5).map((line: any) => {
                    const linePct = Number(line.plannedAmount || 0) > 0 ? Number(line.practicalAmount || 0) / Number(line.plannedAmount || 0) * 100 : 0;
                    return <tr key={line.id} className="border-t border-gray-100/50">
                              {" "}
                              <td className="py-1.5 font-medium text-gray-700">
                                {" "}
                                {line.generalAccount?.name || "—"}{" "}
                              </td>{" "}
                              <td className="py-1.5 text-gray-500">
                                {" "}
                                {line.analyticAccount?.name || "—"}{" "}
                              </td>{" "}
                              <td className="py-1.5 font-bold text-gray-700">
                                {" "}
                                {Number(line.plannedAmount || 0).toLocaleString("en-US")}{" "}
                              </td>{" "}
                              <td className="py-1.5 font-bold text-gray-700">
                                {" "}
                                {Number(line.practicalAmount || 0).toLocaleString("en-US")}{" "}
                              </td>{" "}
                              <td className={cn("py-1.5 font-bold", linePct > 90 ? "text-red-600" : "text-gray-600")}>
                                {" "}
                                {linePct.toFixed(0)}%{" "}
                              </td>{" "}
                            </tr>;
                  })}{" "}
                      </tbody>{" "}
                    </table>{" "}
                  </div>}{" "}
              </div>;
        })}{" "}
          {serialized.length === 0 && <div className="bg-white rounded-sm shadow-sm border border-gray-100 p-12 text-center">
              {" "}
              <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-200" />{" "}
              <p className="font-bold text-gray-400 text-lg">
                لا توجد ميزانيات
              </p>{" "}
              <p className="text-sm text-gray-400 mt-1">
                أنشئ ميزانية جديدة لتخطيط ومراقبة المصروفات
              </p>{" "}
            </div>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}