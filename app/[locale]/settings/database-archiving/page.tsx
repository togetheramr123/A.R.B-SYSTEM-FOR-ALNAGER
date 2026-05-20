"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Database, AlertCircle, CheckCircle2, ChevronRight, Archive, Download, Trash2, Loader2, Info } from "lucide-react";
import { getDatabaseStatsByYear, mockArchiveYear, YearStats } from "@/app/actions/archiving";
import { SystemStorageSize } from "@/components/settings/SystemStorageSize";
import { toast } from "sonner";
export default function DatabaseArchivingPage() {
  const router = useRouter();
  const tCommon = useTranslations("Common");
  const [stats, setStats] = useState<YearStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchiving, setIsArchiving] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  useEffect(() => {
    loadStats();
  }, []);
  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await getDatabaseStatsByYear();
      setStats(data);
    } catch (error) {
      toast.error("فشل في جلب إحصائيات قاعدة البيانات");
    } finally {
      setIsLoading(false);
    }
  };
  const handleArchive = async (year: number) => {
    if (!confirm(`تحذير خطير: هل أنت متأكد من مسح بيانات سنة ${year} بالكامل؟ (بناءاً على سياسات المحاسبة سيتم ترحيل الأرصدة كقيد افتتاحي للعام القادم، ومسح هذه البيانات نهائياً وتفريغ المساحة). هذا الإجراء لا رجعة فيه!`)) {
      return;
    }
    setIsArchiving(true);
    setSelectedYear(year);
    try {
      // Mock Download Zip capability
      toast.info(`جاري ضغط وتجهيز مرفقات ${year} كملف ZIP...`);
      await new Promise(r => setTimeout(r, 2000));
      toast.success(`تم تحميل المرفقات بنجاح.`);
      const res = await mockArchiveYear(year);
      toast.success(res.message);
      await loadStats(); // Reload to reflect changes
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء عملية الأرشفة");
    } finally {
      setIsArchiving(false);
      setSelectedYear(null);
    }
  };
  return <div className="flex flex-col h-full bg-slate-50 min-h-screen" dir="rtl">
      {" "}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <button onClick={() => router.push("/ar/settings")} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
            {" "}
            <ChevronRight className="w-5 h-5 rtl:scale-x-[-1]" />{" "}
          </button>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <Database className="w-5 h-5 text-red-600" />{" "}
            <h1 className="text-xl font-bold text-slate-800">
              أرشفة و تفريغ قاعدة البيانات
            </h1>{" "}
          </div>{" "}
        </div>{" "}
      </header>{" "}
      <main className="p-6 max-w-5xl mx-auto w-full">
        {" "}
        <SystemStorageSize /> {/* Information Banner */}{" "}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          {" "}
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />{" "}
          <div className="text-sm text-blue-800 tracking-wide leading-relaxed">
            {" "}
            <h4 className="font-bold mb-1">سياسة الأرشفة المحاسبية</h4>{" "}
            <p>
              تسمح لك هذه الشاشة بتقليص حجم قاعدة البيانات عن طريق مسح بيانات
              السنوات السابقة تدريجياً لتقليل الضغط على السيرفر (Data Retention
              Policy). <strong>يجب الالتزام بالآتي:</strong>
            </p>{" "}
            <ul className="list-disc pr-5 mt-2 space-y-1">
              {" "}
              <li>
                لا يمكن فرمتة البيانات إلا بترتيب زمني من الأقدم للأحدث (مثلاً
                تمسح 2020 قبل 2021).
              </li>{" "}
              <li>
                يجب إغلاق كافة الفواتير (تكون مدفوعة) والحركات المخزنية
                (المنتهية) بالسنة المُراد مسحها.
              </li>{" "}
              <li>
                سوف يقوم النظام بجمع الأرصدة النهائية وإضافتها كـ "قيد افتتاحي"
                آلي للسنة التالية.
              </li>{" "}
              <li>
                سيتم استخراج ملف (ZIP) يحتوي على صور ومرفقات السنة قبل مسحها.
              </li>{" "}
            </ul>{" "}
          </div>{" "}
        </div>{" "}
        {isLoading ? <div className="flex items-center justify-center p-20">
            {" "}
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />{" "}
          </div> : <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
            {" "}
            <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-right text-sm">
                {" "}
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  {" "}
                  <tr>
                    {" "}
                    <th className="px-5 py-4">السنة</th>{" "}
                    <th className="px-5 py-4 text-center">القيود والفواتير</th>{" "}
                    <th className="px-5 py-4 text-center">شراء / بيع</th>{" "}
                    <th className="px-5 py-4 text-center">حركات مخزنية</th>{" "}
                    <th className="px-5 py-4">حالة السنة</th>{" "}
                    <th className="px-5 py-4 text-center">
                      إجراء الأرشفة
                    </th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-slate-100 font-medium">
                  {" "}
                  {stats.map(stat => <tr key={stat.year} className="hover:bg-slate-50/50 transition-colors">
                      {" "}
                      <td className="px-5 py-4">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <span className="text-lg font-bold text-slate-800 font-numbers">
                            {stat.year}
                          </span>{" "}
                          {stat.isOldest && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                              الأقدم
                            </span>}{" "}
                        </div>{" "}
                      </td>{" "}
                      <td className="px-5 py-4 text-center font-numbers text-slate-600">
                        {" "}
                        {stat.invoicesCount} سجل{" "}
                      </td>{" "}
                      <td className="px-5 py-4 text-center font-numbers text-slate-600">
                        {" "}
                        {stat.purchasesCount} / {stat.salesCount}{" "}
                      </td>{" "}
                      <td className="px-5 py-4 text-center font-numbers text-slate-600">
                        {" "}
                        {stat.stockMovesCount} سجل{" "}
                      </td>{" "}
                      <td className="px-5 py-4">
                        {" "}
                        {stat.openInvoicesCount > 0 || stat.openStockMovesCount > 0 ? <div className="flex items-center gap-1.5 text-red-600 text-xs font-bold">
                            {" "}
                            <AlertCircle className="w-4 h-4" /> يوجد (
                            {stat.openInvoicesCount}) قيود مفتوحة و (
                            {stat.openStockMovesCount}) حركات معلقة{" "}
                          </div> : <div className="flex items-center gap-1.5 text-teal-700 text-xs font-bold">
                            {" "}
                            <CheckCircle2 className="w-4 h-4" /> السنة مغلقة
                            بالكامل جاهزة للترحيل{" "}
                          </div>}{" "}
                      </td>{" "}
                      <td className="px-5 py-4 text-center">
                        {" "}
                        {!stat.isOldest ? <div className="text-xs text-slate-400">
                            يجب مسح السنوات الأقدم أولاً
                          </div> : <button onClick={() => handleArchive(stat.year)} disabled={!stat.canArchive || isArchiving} className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 w-full transition-colors ${stat.canArchive ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 cursor-pointer shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
                            {" "}
                            {isArchiving && selectedYear === stat.year ? <>
                                {" "}
                                <Loader2 className="w-4 h-4 animate-spin" />{" "}
                                جاري الأرشفة...{" "}
                              </> : <>
                                {" "}
                                <Archive className="w-4 h-4" /> أرشفة ومسح{" "}
                                {stat.year}{" "}
                              </>}{" "}
                          </button>}{" "}
                      </td>{" "}
                    </tr>)}{" "}
                  {stats.length === 0 && <tr>
                      {" "}
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                        {" "}
                        لا توجد حركات مالية أو مخزنية مسجلة بقاعدة
                        البيانات.{" "}
                      </td>{" "}
                    </tr>}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>{" "}
          </div>}{" "}
      </main>{" "}
    </div>;
}