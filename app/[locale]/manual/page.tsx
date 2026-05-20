"use client";

import React, { useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { TopPortal } from "@/components/common/TopPortal";
import { BookOpen, ShoppingCart, Package, CreditCard, Users, Settings, ArrowRight, PlayCircle, FileText, ShieldAlert, ChevronLeft } from "lucide-react";
const manualSections = [{
  id: "sales",
  title: "دليل المبيعات الشامل",
  icon: ShoppingCart,
  color: "text-blue-600",
  bg: "bg-blue-50",
  articles: [{
    title: "كيفية إنشاء عرض سعر وتحويله لفاتورة",
    content: "لإنشاء عرض سعر، اذهب إلى المبيعات > عروض الأسعار > إضافة جديد. بعد ملء بيانات العميل والمنتجات، اضغط على حفظ ثم تأكيد. سيتحول العرض إلى أمر بيع."
  }, {
    title: "الأخطاء الشائعة في المبيعات وطرق حلها",
    content: `
💡 **خطأ: "لا يمكنك تأكيد البيع بسبب نقص المخزون"**
- **السبب:** لا يوجد رصيد كافٍ للصنف في المخزن.
- **الحل:** اطلب من مندوب المشتريات مراجعة النواقص، أو (إذا كان لديك صلاحية "البيع بالسالب") يمكنك تفعيلها من الإعدادات لإجبار النظام على البيع. 💡 **خطأ: "العميل تجاوز الحد الائتماني"**
- **السبب:** العميل عليه ديون تتجاوز سقف الائتمان المسموح له.
- **الحل:** توجيه العميل لسداد دفعة من حسابه عبر "سند قبض"، أو طلب استثناء مؤقت من المدير العام.`
  }]
}, {
  id: "purchases",
  title: "دليل المشتريات وحل المشكلات",
  icon: CreditCard,
  color: "text-red-700",
  bg: "bg-rose-50",
  articles: [{
    title: "إنشاء أمر شراء واستلام البضاعة",
    content: "اذهب إلى المشتريات > إنشاء أمر شراء. أضف المورد والمنتجات. عند تأكيد الأمر، سيقوم النظام بإنشاء إذن استلام مخزني آلياً."
  }, {
    title: 'كيف تعمل شاشة "النواقص الذكية"؟',
    content: 'تقرير النواقص يعمل كـ"مندوب مشتريات ذكي". يراقب متوسط مبيعاتك ويقارنه برصيدك. إذا كان صنف سريع الدوران (تم بيع نصفه خلال فترة شرائه)، سيظهر لك كإشعار لسرعة طلبه. يمكنك تحويل السلة لأمر شراء بضغطة زر.'
  }, {
    title: "الأخطاء الشائعة للمشتريات",
    content: `
💡 **خطأ: "تم إغلاق أمر الشراء ولا يمكن التعديل عليه"**
- **السبب:** تم استلام البضاعة فعلياً في المخزن، لذلك قُفل أمر الشراء منياً لمنع التلاعب.
- **الحل:** لعمل أي تعديل، يجب عمل "مرتجع مشتريات" من شاشة المخازن أولاً.`
  }]
}, {
  id: "inventory",
  title: "دليل المخازن والتسويات",
  icon: Package,
  color: "text-teal-700",
  bg: "bg-emerald-50",
  articles: [{
    title: "جرد المخزون وتعديل الأرصدة",
    content: "من خلال شاشة (التسويات المخزنية)، يمكنك تحديد موقع مخزني وإدخال الرصيد الفعلي الموجود على الرف. سيقوم النظام بعمل القيود المحاسبية للفروقات تلقائياً."
  }, {
    title: "أخطاء التقييم المخزني",
    content: `
💡 **المشكلة: "تكلفة البضاعة المباعة تظهر بصفر"**
- **السبب:** تم إدخال الصنف للمخزن بـ (تسوية جردية) بدون وضع "سعر التكلفة"، أو تم استلام البضاعة قبل أن يضع المشتريات السعر.
- **الحل:** يجب الدخول إلى كارت الصنف وتحديث (سعر التكلفة) القياسي ليقوم النظام بحساب التكلفة بأثر رجعي.`
  }]
}, {
  id: "admin",
  title: "دليل الإدارة وخفايا النظام (خاص بالمدير)",
  icon: ShieldAlert,
  color: "text-violet-600",
  bg: "bg-violet-50",
  articles: [{
    title: "مراقبة الحركات المحذوفة والتعديلات",
    content: 'لا يمكن للموظفين العاديين حذف فواتير أو قيود معتمدة، النظام يطبق "عكس القيود" لضمان الشفافية. أي محاولة تعديل تسجل فوراً في سجل تدقيق النظام (Audit Log).'
  }, {
    title: "التحكم في وصول النسخة التجريبية (Beta)",
    content: "من شاشة الصلاحيات والأدوار، يمكنك كمدير عام إعطاء زر (السماح برؤية النسخة التجريبية) للموظفين الموثوقين فقط ليقوموا بتجربة الميزات الجديدة قبل تعميمها."
  }, {
    title: "إشعارات رقابية للمدير العام فقط",
    content: `
توجد حركات خفية تم برمجتها لترسل إشعاراً مباشراً لك (المدير العام) ولا يمكن لأحد إيقافها:
- **سندات الصرف النقدية الكبيرة:** أي منصرف يتجاوز الحد.
- **تعديل أسعار البيع:** إذا قام موظف بتعديل سعر بيع تحت التكلفة.`
  }]
}];
export default function SystemManualPage() {
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState(manualSections[0]);
  return <div className="p-4 md:p-8 font-sans" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <Link href={`/${locale}/dashboard`} className="text-slate-600 hover:bg-slate-100 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 border border-transparent hover:border-slate-200">
            {" "}
            <ArrowRight className="w-4 h-4" /> رجوع للوحة القيادة{" "}
          </Link>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="max-w-6xl mx-auto">
        {" "}
        <div className="flex flex-col items-center text-center mb-8 border-b border-gray-200 pb-8">
          {" "}
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            دليل النظام
          </h1>{" "}
          <p className="text-gray-500 mt-2 max-w-xl text-sm">
            {" "}
            هنا تجد شرحاً لجميع شاشات النظام والعمليات اليومية.{" "}
          </p>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {" "}
          {/* Sidebar */}{" "}
          <div className="md:col-span-1 space-y-1 border-l border-gray-100 pl-4">
            {" "}
            {manualSections.map(section => {
            const Icon = section.icon;
            const isActive = activeSection.id === section.id;
            return <button key={section.id} onClick={() => setActiveSection(section)} className={`w-full flex items-center justify-between p-3 rounded-sm transition-all text-sm ${isActive ? `bg-gray-100 text-gray-900 font-bold` : `bg-transparent text-gray-600 hover:bg-gray-50`}`}>
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#714B67]" : "text-gray-400"}`} />{" "}
                    <span>{section.title}</span>{" "}
                  </div>{" "}
                  <ChevronLeft className={`w-3 h-3 ${isActive ? "text-gray-400" : "text-transparent"}`} />{" "}
                </button>;
          })}{" "}
          </div>{" "}
          {/* Content Area */}{" "}
          <div className="md:col-span-3">
            {" "}
            <div className="bg-white p-6 min-h-[500px]">
              {" "}
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                {" "}
                <activeSection.icon className="w-6 h-6 text-gray-400" />{" "}
                <div>
                  {" "}
                  <h2 className="text-xl font-bold text-gray-800">
                    {activeSection.title}
                  </h2>{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-6">
                {" "}
                {activeSection.articles.map((article, idx) => <div key={idx} className="group">
                    {" "}
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-2">
                      {" "}
                      <FileText className="w-4 h-4 text-gray-400" />{" "}
                      {article.title}{" "}
                    </h3>{" "}
                    <div className="pl-6 pr-6">
                      {" "}
                      <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {" "}
                        {article.content}{" "}
                      </div>{" "}
                      {/* Media placeholders (simulated) */}{" "}
                      <div className="mt-3 flex gap-2">
                        {" "}
                        <button className="flex items-center gap-1.5 text-xs text-[#714B67] hover:underline">
                          {" "}
                          <PlayCircle className="w-4 h-4" /> شرح فيديو{" "}
                        </button>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>)}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}