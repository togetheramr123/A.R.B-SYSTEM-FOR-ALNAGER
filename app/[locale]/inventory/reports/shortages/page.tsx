"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { getInventoryShortagesReport, createPoFromShortages } from "@/app/actions/inventory_reports";
import { AlertCircle, Download, Printer, ArrowRight, ShoppingCart, Calculator, HelpCircle, FilePlus2, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
export default function ShortagesReportPage() {
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [forecastMonths, setForecastMonths] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [creatingPo, setCreatingPo] = useState(false);
  const router = useRouter();
  useEffect(() => {
    loadData();
  }, [forecastMonths]);
  const loadData = async () => {
    setLoading(true);
    try {
      const report = await getInventoryShortagesReport(forecastMonths);
      setData(report);
    } catch (e) {
      toast.error("حدث خطأ أثناء تحميل التقرير");
    } finally {
      setLoading(false);
    }
  };
  const handlePrint = () => {
    window.print();
  };
  const handleExportExcel = () => {
    const headers = ["الكود", "المنتج", "الرصيد الحالي", "متوسط السحب الشهري", `المطلوب لـ ${forecastMonths} أشهر`, "العجز المتوقع", "القاعدة / السبب"];
    const csvRows = [headers.join(","), ...data.map(row => [row.code, `"${row.name}"`, row.currentStock, row.avgMonthlySales, row.forecastedConsumption, row.shortage, `"${row.ruleApplied}"`].join(","))];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shortages_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleCreateMasterPO = async () => {
    if (data.length === 0) {
      toast.error("لا توجد نواقص لإنشاء أمر شراء");
      return;
    }
    setCreatingPo(true);
    try {
      // Create the PO with all shortage items
      const payload = data.map(item => ({
        productId: item.id,
        quantity: item.shortage,
        priceUnit: 0 // Will be fetched/updated from product cost in backend
      }));
      const result = await createPoFromShortages(payload);
      toast.success("تم إنشاء أمر الشراء بنجاح");
      router.push(`/${locale}/purchases/orders/${result.id}`);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء إنشاء أمر الشراء");
      setCreatingPo(false);
    }
  };
  return <div className="p-4 print:p-0 print:bg-white print:text-black">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-2 print:hidden">
          {" "}
          <button onClick={handlePrint} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-1.5 rounded-sm text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
            {" "}
            <Printer className="w-4 h-4" /> طباعة{" "}
          </button>{" "}
          <button onClick={handleExportExcel} className="bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 px-4 py-1.5 rounded-sm text-xs font-medium flex items-center gap-2 transition-colors">
            {" "}
            <Download className="w-4 h-4" /> تصدير Excel{" "}
          </button>{" "}
          <button onClick={handleCreateMasterPO} disabled={creatingPo || data.length === 0} className="bg-[#714B67] text-white hover:bg-[#5a3b52] px-4 py-1.5 rounded-sm text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
            {" "}
            {creatingPo ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FilePlus2 className="w-4 h-4" />}{" "}
            {creatingPo ? "جاري الإنشاء..." : "إنشاء أمر شراء بالنواقص"}{" "}
          </button>{" "}
          <Link href={`/${locale}/dashboard`} className="text-slate-600 hover:bg-slate-100 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 border border-transparent hover:border-slate-200">
            {" "}
            <ArrowRight className="w-4 h-4" /> رجوع للوحة القيادة{" "}
          </Link>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {" "}
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden print:border-none print:shadow-none">
          {" "}
          <div className="border-b border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between print:border-b-2">
            {" "}
            <div className="flex items-center gap-4">
              {" "}
              <div>
                {" "}
                <div className="flex items-center gap-3">
                  {" "}
                  <h1 className="text-xl font-bold text-gray-800 tracking-tight">
                    تقرير النواقص الذكي
                  </h1>{" "}
                  <button onClick={() => setShowHelp(true)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 border border-gray-200 rounded-sm px-2 py-0.5 text-[10px] font-bold print:hidden" title="كيف يعمل التقرير؟">
                    {" "}
                    طريقة العمل ؟{" "}
                  </button>{" "}
                </div>{" "}
                <p className="text-sm text-gray-500 mt-1">
                  عرض وحساب النواقص بناءً على التنبؤ الاستهلاكي أو سرعة الدوران.
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-sm border border-gray-200 print:hidden">
              {" "}
              <span className="text-xs font-medium text-gray-600">
                فترة التنبؤ:
              </span>{" "}
              <select value={forecastMonths} onChange={e => setForecastMonths(Number(e.target.value))} className="text-sm font-medium bg-transparent border-none outline-none text-[#714B67] cursor-pointer">
                {" "}
                <option value={0}>بدون تنبؤ (نواقص فعلية)</option>{" "}
                <option value={1}>شهر واحد (1 Month)</option>{" "}
                <option value={2}>شهران (2 Months)</option>{" "}
                <option value={3}>3 أشهر (3 Months)</option>{" "}
                <option value={6}>6 أشهر (6 Months)</option>{" "}
              </select>{" "}
            </div>{" "}
          </div>{" "}
          <div className="p-0 overflow-x-auto">
            {" "}
            <table className="w-full text-right border-collapse">
              {" "}
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs font-bold print:bg-gray-100 print:text-black">
                {" "}
                <tr>
                  {" "}
                  <th className="px-6 py-3 font-medium">الكود</th>{" "}
                  <th className="px-6 py-3 font-medium">المنتج</th>{" "}
                  <th className="px-6 py-3 font-medium text-center">
                    الرصيد الفعلي
                  </th>{" "}
                  <th className="px-6 py-3 font-medium text-center">
                    متوسط السحب
                  </th>{" "}
                  <th className="px-6 py-3 font-medium text-center">
                    الاستهلاك المتوقع
                  </th>{" "}
                  <th className="px-6 py-3 font-medium text-center">
                    العجز (وحدة)
                  </th>{" "}
                  <th className="px-6 py-3 font-medium text-center">
                    العجز (كرتونة)
                  </th>{" "}
                  <th className="px-6 py-3 font-medium">القاعدة المطبقة</th>{" "}
                  <th className="px-6 py-3 font-medium text-center print:hidden">
                    إجراء
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-gray-100 text-sm">
                {" "}
                {loading ? <tr>
                    {" "}
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                      جاري تحميل البيانات...
                    </td>{" "}
                  </tr> : data.length === 0 ? <tr>
                    {" "}
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      {" "}
                      لا توجد نواقص متوقعة لهذه الفترة.{" "}
                    </td>{" "}
                  </tr> : data.map(row => <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {" "}
                      <td className="px-6 py-3 text-gray-500">
                        {row.code}
                      </td>{" "}
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {row.name}
                      </td>{" "}
                      <td className="px-6 py-3 text-center text-gray-700">
                        {row.currentStock}
                      </td>{" "}
                      <td className="px-6 py-3 text-center text-gray-700">
                        {row.avgMonthlySales}
                      </td>{" "}
                      <td className="px-6 py-3 text-center text-gray-700">
                        {row.forecastedConsumption}
                      </td>{" "}
                      <td className="px-6 py-3 text-center font-bold text-gray-800">
                        {" "}
                        {row.shortage}{" "}
                      </td>{" "}
                      <td className="px-6 py-3 text-center font-bold text-gray-800">
                        {" "}
                        {row.shortageCartons}{" "}
                        <span className="text-xs text-gray-400 font-normal">
                          {row.secondaryUom}
                        </span>{" "}
                      </td>{" "}
                      <td className="px-6 py-3 text-xs text-gray-500">
                        {" "}
                        {row.ruleApplied}{" "}
                      </td>{" "}
                      <td className="px-6 py-3 text-center print:hidden">
                        {" "}
                        <Link href={`/${locale}/purchases/new?product=${row.id}&qty=${row.shortage}`} className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-[#714B67] transition-colors">
                          {" "}
                          <ShoppingCart className="w-4 h-4" />{" "}
                        </Link>{" "}
                      </td>{" "}
                    </tr>)}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Help Modal */}{" "}
      {showHelp && <div className="fixed inset-0 z-[9999] bg-gray-900/40 flex items-center justify-center p-4">
          {" "}
          <div className="bg-white rounded-sm shadow-sm max-w-2xl w-full p-6 animate-in zoom-in-95 font-sans" dir="rtl">
            {" "}
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              {" "}
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {" "}
                <HelpCircle className="w-5 h-5 text-gray-500" /> شرح آلية تقرير
                النواقص{" "}
              </h2>{" "}
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                {" "}
                <X className="w-5 h-5" />{" "}
              </button>{" "}
            </div>{" "}
            <div className="space-y-4 text-gray-700 text-sm">
              {" "}
              <p>
                يعتمد التقرير على طريقتين لمراقبة المخزون وتحديد النواقص:
              </p>{" "}
              <div className="border border-gray-200 p-4 rounded-sm bg-gray-50/50">
                {" "}
                <h3 className="font-bold text-gray-800 mb-1">
                  1. استهلاك بناءً على التنبؤ (الافتراضي)
                </h3>{" "}
                <p className="text-gray-600">
                  يتم حساب متوسط السحب الشهري للصنف، ثم يُضرب في الفترة
                  المختارة. إذا كان الرصيد الفعلي أقل من الكمية المطلوبة لتغطية
                  الفترة، يُدرج الصنف في التقرير.
                </p>{" "}
              </div>{" "}
              <div className="border border-gray-200 p-4 rounded-sm bg-gray-50/50">
                {" "}
                <h3 className="font-bold text-gray-800 mb-1">
                  2. استهلاك بناءً على سرعة الدوران
                </h3>{" "}
                <p className="text-gray-600">
                  يقارن النظام إجمالي المشتريات بإجمالي المبيعات لنفس الفترة
                  المحددة. إذا كانت نسبة المبيعات تتجاوز 50% من إجمالي
                  المشتريات، يُدرج الصنف كصنف سريع السحب يتطلب إعادة الشراء.
                </p>{" "}
              </div>{" "}
              <div className="flex items-center gap-2 mt-4 text-gray-500 text-xs border-t pt-4">
                {" "}
                <FilePlus2 className="w-4 h-4" />{" "}
                <span>
                  استخدم خيار "إنشاء أمر شراء بالنواقص" لتحويل القائمة بالكامل
                  إلى مسودة أمر شراء.
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-6 flex justify-end">
              {" "}
              <button onClick={() => setShowHelp(false)} className="bg-[#714B67] text-white px-5 py-1.5 rounded-sm text-sm font-medium hover:bg-[#5a3b52] transition-colors">
                {" "}
                إغلاق{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>}{" "}
      {/* Print Styles */}{" "}
      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            background: white;
          }
          nav,
          header,
          footer {
            display: none !important;
          }
        }
      `}</style>{" "}
    </div>;
}