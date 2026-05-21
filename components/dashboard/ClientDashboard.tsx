"use client";

import { useEffect, useState } from "react";
import { Headset, FileText, BookOpen, AlertCircle, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { requestAccountStatement, getClientDashboardData } from "@/app/actions/clientDashboard";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function ClientDashboard({ locale }: { locale: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const t = useTranslations("Dashboard");

  useEffect(() => {
    getClientDashboardData().then((res) => {
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleRequestStatement = async () => {
    setRequesting(true);
    const result = await requestAccountStatement();
    setRequesting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("تم إرسال طلب كشف الحساب للإدارة بنجاح");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#017E84] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#017E84] to-teal-500 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">أهلاً بك في منصة العملاء 👋</h1>
          <p className="text-teal-50 text-sm max-w-lg leading-relaxed">
            من هنا يمكنك متابعة طلباتك، فواتيرك، والتواصل المباشر مع فريق الدعم لدينا بكل سهولة.
          </p>
        </div>
        <div className="absolute left-0 top-0 w-64 h-full opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full text-white fill-current">
            <polygon points="0,0 100,0 0,100" />
          </svg>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href={`/${locale}/crm/tickets/new`} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Headset className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">تذكرة دعم جديدة</h3>
            <p className="text-xs text-slate-500 mt-1">تواصل مع الإدارة لحل أي مشكلة</p>
          </div>
        </Link>
        <button onClick={handleRequestStatement} disabled={requesting} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3 disabled:opacity-50">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">طلب كشف حساب</h3>
            <p className="text-xs text-slate-500 mt-1">اطلب تقرير مالي مفصل لعملياتك</p>
          </div>
        </button>
        <Link href={`/${locale}/catalogs`} className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">تصفح الكتالوج</h3>
            <p className="text-xs text-slate-500 mt-1">استكشف أحدث المنتجات والعروض</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tickets */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#017E84]" />
              تذاكر قيد المعالجة
            </h3>
            <Link href={`/${locale}/crm/tickets`} className="text-xs font-bold text-[#017E84] hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {data?.openTickets?.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">لا توجد تذاكر مفتوحة</p>
              </div>
            ) : (
              data?.openTickets?.map((tkt: any) => (
                <Link key={tkt.id} href={`/${locale}/crm/tickets/${tkt.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{tkt.subject}</p>
                    <p className="text-xs text-slate-500 mt-1">{tkt.number}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">قيد المعالجة</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#017E84]" />
              أحدث الفواتير
            </h3>
          </div>
          {!data?.partnerId ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">حسابك غير مربوط بملف مالي حتى الآن.</p>
            </div>
          ) : data?.recentInvoices?.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">لا توجد فواتير معتمدة بعد.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {data?.recentInvoices?.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{inv.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(inv.dateInvoice).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">{inv.amountTotal.toLocaleString()} ج.م</p>
                    {inv.amountResidual > 0 ? (
                      <p className="text-[10px] font-bold text-red-500 mt-1">متبقي: {inv.amountResidual.toLocaleString()}</p>
                    ) : (
                      <p className="text-[10px] font-bold text-emerald-500 mt-1">مسددة بالكامل</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
