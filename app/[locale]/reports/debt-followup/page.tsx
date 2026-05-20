"use client";

import { useState, useEffect } from "react";
import { getAllFollowUpsReport, escalateToUser } from "@/app/actions/followup";
import { getPartnerLedgerWidgetData } from "@/app/actions/accounting";
import { AlertCircle, Clock, CheckCircle2, User as UserIcon, Send, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
export default function DebtFollowupReportPage() {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [search, setSearch] = useState("");
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "ar";
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllFollowUpsReport();
      setFollowUps(data || []); // Fetch balances for all partners in the report
      const uniquePartnerIds = Array.from(new Set(data.map((f: any) => f.partnerId)));
      const balancesMap: Record<string, number> = {};
      await Promise.all(uniquePartnerIds.map(async (partnerId: string) => {
        try {
          const res = await getPartnerLedgerWidgetData(partnerId);
          balancesMap[partnerId] = res.totalBalance ?? 0;
        } catch {
          balancesMap[partnerId] = 0;
        }
      }));
      setBalances(balancesMap);
    } catch (error) {
      console.error(error);
      toast.error("خطأ في جلب التقرير");
    } finally {
      setLoading(false);
    }
  };
  const handleEscalate = async (followUp: any) => {
    const reason = window.prompt(`توجيه رسالة توبيخ/تذكير للموظف: ${followUp.assignedUser.name}\nبخصوص العميل: ${followUp.partner.name}`);
    if (!reason) return;
    setEscalatingId(followUp.id);
    try {
      await escalateToUser(followUp.id, followUp.assignedUserId, reason);
      toast.success("تم إرسال التوجيه الإداري للموظف بنجاح");
      fetchData(); // Refresh history
    } catch (e: any) {
      toast.error(e.message || "فشل إرسال التوجيه");
    } finally {
      setEscalatingId(null);
    }
  };
  const filteredFollowUps = followUps.filter(f => {
    if (filter !== "all" && f.status !== filter) return false;
    if (search && !f.partner.name.toLowerCase().includes(search.toLowerCase()) && !f.assignedUser.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return <div className="p-6 max-w-7xl mx-auto rtl space-y-6">
      {" "}
      <div className="flex justify-between items-center bg-white p-6 rounded-sm shadow-sm border border-slate-200">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            {" "}
            <AlertCircle className="w-8 h-8 text-amber-600" /> تقرير متابعة ديون
            العملاء (الآجل){" "}
          </h1>{" "}
          <p className="text-slate-500 mt-2 text-sm">
            متابعة دقيقة لتحركات الموظفين في تحصيل مديونيات العملاء.
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
        {" "}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          {" "}
          <div className="flex gap-2">
            {" "}
            <button onClick={() => setFilter("pending")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "pending" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {" "}
              جاري المتابعة{" "}
            </button>{" "}
            <button onClick={() => setFilter("completed")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "completed" ? "bg-teal-50 text-emerald-800 border border-emerald-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {" "}
              تم الإغلاق{" "}
            </button>{" "}
            <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${filter === "all" ? "bg-slate-800 text-white border border-slate-800" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {" "}
              الكل{" "}
            </button>{" "}
          </div>{" "}
          <div className="relative w-64">
            {" "}
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />{" "}
            <input type="text" placeholder="بحث بعميل أو موظف..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none" />{" "}
          </div>{" "}
        </div>{" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right text-sm">
            {" "}
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              {" "}
              <tr>
                {" "}
                <th className="p-4">العميل</th>{" "}
                <th className="p-4">الرصيد الفعلي</th>{" "}
                <th className="p-4">الموظف المسؤول</th>{" "}
                <th className="p-4">تاريخ المتابعة</th>{" "}
                <th className="p-4">آخر ملاحظة مسجلة</th>{" "}
                <th className="p-4 text-center">الحالة</th>{" "}
                <th className="p-4 text-center">إجراءات المدير</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {loading ? <tr>
                  {" "}
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    جاري التحميل...
                  </td>{" "}
                </tr> : filteredFollowUps.length === 0 ? <tr>
                  {" "}
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد سجلات مطابقة.
                  </td>{" "}
                </tr> : filteredFollowUps.map(f => {
              const balance = balances[f.partnerId] || 0;
              const isOverdue = f.status === "pending" && new Date(f.nextFollowUpDate) < new Date();
              return <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      {" "}
                      <td className="p-4 font-bold text-indigo-700">
                        {" "}
                        <Link href={`/${locale}/contacts/${f.partnerId}`} className="hover:underline">
                          {" "}
                          {f.partner.name}{" "}
                        </Link>{" "}
                      </td>{" "}
                      <td className="p-4 font-numbers font-bold text-red-600">
                        {" "}
                        {balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{" "}
                        ج.م{" "}
                      </td>{" "}
                      <td className="p-4">
                        {" "}
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          {" "}
                          <UserIcon className="w-4 h-4 text-slate-400" />{" "}
                          {f.assignedUser.name}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="p-4">
                        {" "}
                        <div className={`flex items-center gap-2 font-medium ${isOverdue ? "text-red-600 bg-red-50 py-1 px-2 rounded w-max" : "text-slate-600"}`}>
                          {" "}
                          <Clock className="w-4 h-4" />{" "}
                          {new Date(f.nextFollowUpDate).toLocaleDateString("ar-EG", {
                      weekday: "long",
                      year: "numeric",
                      month: "numeric",
                      day: "numeric"
                    })}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="p-4">
                        {" "}
                        <div className="max-w-[250px] truncate text-slate-600" title={f.notes}>
                          {" "}
                          {f.notes || "-"}{" "}
                        </div>{" "}
                        {f.history && f.history.length > 0 && <div className="text-[10px] text-slate-400 mt-1">
                            {" "}
                            آخر تحديث: {f.history[0].user.name}{" "}
                          </div>}{" "}
                      </td>{" "}
                      <td className="p-4 text-center">
                        {" "}
                        {f.status === "completed" ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-emerald-800">
                            {" "}
                            <CheckCircle2 className="w-3.5 h-3.5" /> مغلق{" "}
                          </span> : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            {" "}
                            <Clock className="w-3.5 h-3.5" /> جاري المتابعة{" "}
                          </span>}{" "}
                      </td>{" "}
                      <td className="p-4 text-center">
                        {" "}
                        {f.status === "pending" && <button onClick={() => handleEscalate(f)} disabled={escalatingId === f.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors disabled:opacity-50" title="توجيه توبيخ للموظف لعدم المتابعة">
                            {" "}
                            <Send className="w-3.5 h-3.5" /> توجيه إداري
                            (Ping){" "}
                          </button>}{" "}
                      </td>{" "}
                    </tr>;
            })}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}