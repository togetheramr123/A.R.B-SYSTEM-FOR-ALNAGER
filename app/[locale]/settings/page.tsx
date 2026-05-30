"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getCompanySettings } from "@/app/actions/settings";
import { toast } from "sonner";
import { Settings, Link2, Users, Building2, Globe, CreditCard, ChevronLeft, Save, X, Shield, Bell, Database, Palette, Languages, Mail, Phone, MapPin, Calendar, Clock, DollarSign, Printer, FileText, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TopPortal } from "@/components/common/TopPortal";
import { enableMaintenanceMode, disableMaintenanceMode, getMaintenanceStatus } from "@/app/actions/maintenance";
export default function SettingsPage() {
  const settingSections = [{
    title: "الإعدادات العامة",
    icon: Settings,
    key: "general",
    active: true
  }, {
    title: "التكاملات",
    icon: Link2,
    key: "integrations",
    active: false
  }, {
    title: "المستخدمين والصلاحيات",
    icon: Users,
    key: "users",
    active: false
  }, {
    title: "المحاسبة",
    icon: CreditCard,
    key: "accounting",
    active: false
  }, {
    title: "المخزون",
    icon: Database,
    key: "inventory",
    active: false
  }, {
    title: "الطباعة",
    icon: Printer,
    key: "printing",
    active: false
  }];
  const [allowHalfQuantities, setAllowHalfQuantities] = useState(false);
  const [demoPin, setDemoPin] = useState("3000");
  const [isLoading, setIsLoading] = useState(true);
  
  // Maintenance Mode State
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMinutes, setMaintenanceMinutes] = useState(1);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');
  const [isTogglingMaintenance, setIsTogglingMaintenance] = useState(false);

  useEffect(() => {
    getCompanySettings().then(res => {
      if (res) {
        setAllowHalfQuantities(res.allowHalfQuantities);
        setDemoPin(res.demoPin || "3000");
      }
      setIsLoading(false);
    });
    getMaintenanceStatus().then(res => {
      setMaintenanceEnabled(res.enabled);
    });
  }, []);
  const handleSave = async () => {
    // We'll create a server action for this
    const {
      updateCompanySettings
    } = await import("@/app/actions/company");
    const res = await updateCompanySettings({
      allowHalfQuantities,
      demoPin
    });
    if (res.success) {
      toast.success("تم حفظ الإعدادات بنجاح");
    } else {
      toast.error("حدث خطأ أثناء الحفظ");
    }
  };
  return <div className="flex flex-col h-full">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex gap-2">
          {" "}
          <button onClick={handleSave} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
            {" "}
            <Save className="w-3.5 h-3.5" /> حفظ{" "}
          </button>{" "}
          <button className="text-slate-600 hover:bg-slate-100 rounded-sm px-3 py-1 text-xs font-medium transition-colors">
            {" "}
            تراجع{" "}
          </button>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="flex flex-1 overflow-hidden">
        {" "}
        {/* Left Sidebar */}{" "}
        <aside className="w-56 bg-white border-l overflow-y-auto hidden md:block shadow-sm">
          {" "}
          <div className="p-3 space-y-0.5">
            {" "}
            {settingSections.map((section, idx) => <button key={idx} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-right", section.active ? "bg-sky-50 text-sky-700 border border-sky-100" : "text-slate-600 hover:bg-slate-50")}>
                {" "}
                <section.icon className={cn("w-4 h-4", section.active ? "text-sky-600" : "text-slate-400")} />{" "}
                {section.title}{" "}
              </button>)}{" "}
          </div>{" "}
        </aside>{" "}
        {/* Main Content */}{" "}
        <main className="flex-1 overflow-y-auto p-6">
          {" "}
          <div className="max-w-4xl mx-auto space-y-6">
            {" "}
            {/* Section: Company Info */}{" "}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
              {" "}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                {" "}
                <Building2 className="w-4 h-4 text-slate-500" />{" "}
                <h2 className="font-bold text-sm text-slate-800">
                  بيانات الشركة
                </h2>{" "}
              </div>{" "}
              <div className="p-5 grid grid-cols-2 gap-5">
                {" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    اسم الشركة
                  </label>{" "}
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" defaultValue="نظام 2026 للمؤسسات" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    الرقم الضريبي
                  </label>{" "}
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" placeholder="أدخل الرقم الضريبي..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    البريد الإلكتروني
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="email" placeholder="info@company.com" className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />{" "}
                  </div>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    رقم الهاتف
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="tel" placeholder="+20 123 456 7890" className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none" />{" "}
                  </div>{" "}
                </div>{" "}
                <div className="col-span-2">
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    عنوان الشركة
                  </label>{" "}
                  <div className="relative">
                    {" "}
                    <MapPin className="absolute right-3 top-3 w-4 h-4 text-slate-400" />{" "}
                    <textarea rows={2} placeholder="عنوان الشركة الكامل..." className="w-full pr-10 pl-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none" />{" "}
                  </div>{" "}
                </div>{" "}
                
                <div className="col-span-2 bg-blue-50/50 p-4 border border-blue-100 rounded-lg mt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-slate-800">إعدادات النسخة التجريبية (Demo)</h3>
                  </div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    الرقم السري لدخول النسخة التجريبية
                  </label>
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                    type="text" 
                    value={demoPin} 
                    onChange={e => setDemoPin(e.target.value)} 
                    placeholder="3000" 
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono tracking-widest" 
                    dir="ltr"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    هذا الرقم مطلوب للوصول إلى نسخة التدريب للموظفين الجدد (رقم افتراضي: 3000)
                  </p>
                </div>
              </div>{" "}
            </div>{" "}
            {/* Section: Inventory Operations Settings */}{" "}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
              {" "}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                {" "}
                <Database className="w-4 h-4 text-slate-500" />{" "}
                <h2 className="font-bold text-sm text-slate-800">
                  إعدادات المخزون والعمليات
                </h2>{" "}
              </div>{" "}
              <div className="p-5">
                {" "}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  {" "}
                  <div>
                    {" "}
                    <h3 className="text-sm font-bold text-slate-800">
                      السماح بالكميات النصفية (الكسور)
                    </h3>{" "}
                    <p className="text-xs text-slate-500 mt-1">
                      تفعيل صرف الكميات بأجزاء نصفية (مثل 1.5 أو 2.5) في كل
                      النظام (المبيعات، المشتريات، المخازن). إذا تم إيقافها،
                      سيتم إلزام إدخال أرقام صحيحة فقط.
                    </p>{" "}
                  </div>{" "}
                  <label className="relative inline-flex items-center cursor-pointer">
                    {" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="sr-only peer" checked={allowHalfQuantities} onChange={e => setAllowHalfQuantities(e.target.checked)} disabled={isLoading} />{" "}
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>{" "}
                  </label>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Section: Language & Currency */}{" "}
            <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
              {" "}
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                {" "}
                <Globe className="w-4 h-4 text-slate-500" />{" "}
                <h2 className="font-bold text-sm text-slate-800">
                  اللغة والعملة
                </h2>{" "}
              </div>{" "}
              <div className="p-5 grid grid-cols-2 gap-5">
                {" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    اللغة الافتراضية
                  </label>{" "}
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                    {" "}
                    <option value="ar">العربية</option>{" "}
                    <option value="en">English</option>{" "}
                  </select>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    العملة الرئيسية
                  </label>{" "}
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                    {" "}
                    <option value="EGP">الجنيه المصري (ج.م)</option>{" "}
                    <option value="SAR">الريال السعودي (ر.س)</option>{" "}
                    <option value="USD">الدولار الأمريكي ($)</option>{" "}
                    <option value="EUR">اليورو (€)</option>{" "}
                  </select>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    المنطقة الزمنية
                  </label>{" "}
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                    {" "}
                    <option value="Africa/Cairo">القاهرة (UTC+2)</option>{" "}
                    <option value="Asia/Riyadh">الرياض (UTC+3)</option>{" "}
                  </select>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">
                    تنسيق التاريخ
                  </label>{" "}
                  <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none bg-white">
                    {" "}
                    <option value="dd/MM/yyyy">
                      يوم/شهر/سنة (31/12/2026)
                    </option>{" "}
                    <option value="yyyy-MM-dd">
                      سنة-شهر-يوم (2026-12-31)
                    </option>{" "}
                  </select>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Section: Links */}{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              {/* Integrations */}{" "}
              <Link href="/ar/settings/integrations" className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group block">
                {" "}
                <div className="flex items-center gap-3 mb-3">
                  {" "}
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    {" "}
                    <Link2 className="w-5 h-5 text-blue-600" />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="font-bold text-slate-900 text-sm">
                      التكاملات
                    </h3>{" "}
                    <p className="text-[11px] text-slate-400">
                      Google، فودافون كاش، APIs
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <p className="text-xs text-slate-500 leading-relaxed">
                  إدارة مفاتيح API والربط مع الخدمات الخارجية مثل بوابات الدفع
                  وخدمات التخزين السحابي.
                </p>{" "}
              </Link>{" "}
              {/* Users & Roles */}{" "}
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
                {" "}
                <div className="flex items-center gap-3 mb-3">
                  {" "}
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                    {" "}
                    <Shield className="w-5 h-5 text-violet-600" />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="font-bold text-slate-900 text-sm">
                      المستخدمين والصلاحيات
                    </h3>{" "}
                    <p className="text-[11px] text-slate-400">
                      إدارة الوصول والأدوار
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Link href="/ar/settings/users" className="flex items-center justify-between py-1.5 border-b border-dashed border-slate-100 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                    {" "}
                    <span className="font-medium">إدارة المستخدمين</span>{" "}
                    <ChevronLeft className="w-4 h-4 text-slate-300" />{" "}
                  </Link>{" "}
                  <Link href="/ar/settings/groups" className="flex items-center justify-between py-1.5 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                    {" "}
                    <span className="font-medium">
                      إدارة الأدوار (صلاحيات الوصول)
                    </span>{" "}
                    <ChevronLeft className="w-4 h-4 text-slate-300" />{" "}
                  </Link>{" "}
                </div>{" "}
              </div>{" "}
              {/* Accounting */}{" "}
              <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-5">
                {" "}
                <div className="flex items-center gap-3 mb-3">
                  {" "}
                  <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                    {" "}
                    <CreditCard className="w-5 h-5 text-teal-700" />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="font-bold text-slate-900 text-sm">
                      إعدادات المحاسبة
                    </h3>{" "}
                    <p className="text-[11px] text-slate-400">
                      السنوات المالية والضرائب
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <button onClick={() => toast.info("السنوات المالية ستتاح في التحديث القادم")} className="w-full flex items-center justify-between py-1.5 border-b border-dashed border-slate-100 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                    {" "}
                    <span className="font-medium">السنوات المالية</span>{" "}
                    <ChevronLeft className="w-4 h-4 text-slate-300" />{" "}
                  </button>{" "}
                  <button onClick={() => toast.info("إعدادات الضرائب ستتاح في التحديث القادم")} className="w-full flex items-center justify-between py-1.5 border-b border-dashed border-slate-100 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                    {" "}
                    <span className="font-medium">إعدادات الضرائب</span>{" "}
                    <ChevronLeft className="w-4 h-4 text-slate-300" />{" "}
                  </button>{" "}
                  <button onClick={() => toast.info("العملات ستتاح في التحديث القادم")} className="w-full flex items-center justify-between py-1.5 text-sm text-slate-600 hover:text-sky-600 transition-colors">
                    {" "}
                    <span className="font-medium">العملات</span>{" "}
                    <ChevronLeft className="w-4 h-4 text-slate-300" />{" "}
                  </button>{" "}
                </div>{" "}
              </div>{" "}
              {/* Notifications */}{" "}
              <Link href="/ar/settings/notifications" className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group block">
                {" "}
                <div className="flex items-center gap-3 mb-3">
                  {" "}
                  <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                    {" "}
                    <Bell className="w-5 h-5 text-amber-600" />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h3 className="font-bold text-slate-900 text-sm">
                      الإشعارات
                    </h3>{" "}
                    <p className="text-[11px] text-slate-400">
                      البريد الإلكتروني والتنبيهات
                    </p>{" "}
                  </div>{" "}
                </div>{" "}
                <p className="text-xs text-slate-500 leading-relaxed">
                  تخصيص إعدادات الإشعارات عبر البريد الإلكتروني والتنبيهات
                  الداخلية للأحداث المهمة.
                </p>{" "}
              </Link>{" "}
              {/* Database Management & Archiving */}
              <Link href="/ar/settings/database-archiving" className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <Database className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      إدارة قاعدة البيانات
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      تقليص الحجم والأرشفة
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  أرشفة و تفريغ بيانات السنوات القديمة لتقليل مساحة السيستم مع الاحتفاظ بالأرصدة الافتتاحية والمرفقات.
                </p>
              </Link>

              {/* Import Basic Data */}
              <Link href="/ar/settings/import" className="bg-white border border-slate-200 rounded-sm shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer group block">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                    <Database className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      استيراد البيانات الأساسية
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      استيراد من Excel أو CSV
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  استيراد المنتجات وأرصدتها الافتتاحية من ملف Excel لتهيئة النظام بشكل سريع.
                </p>
              </Link>
            </div>{" "}

            {/* Section: Maintenance Mode */}
            <div className="bg-white border border-amber-200 rounded-sm shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="font-bold text-sm text-slate-800">
                  وضع الصيانة (قبل التحديث)
                </h2>
                {maintenanceEnabled && (
                  <span className="mr-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold animate-pulse">مفعّل الآن</span>
                )}
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  عند تفعيل وضع الصيانة، سيظهر إشعار تحذيري لكل المستخدمين في الشريط العلوي
                  يطلب منهم حفظ عملهم الحالي. بعد انتهاء العد التنازلي، تظهر شاشة كاملة &quot;جاري التحديث&quot;
                  تمنع أي عمليات حتى يتم إعادة التحميل بعد التحديث.
                </p>

                {!maintenanceEnabled ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">وقت التنبيه (بالدقائق)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={maintenanceMinutes}
                          onChange={e => setMaintenanceMinutes(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none text-center font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1.5">رسالة مخصصة (اختياري)</label>
                        <input
                          type="text"
                          value={maintenanceMsg}
                          onChange={e => setMaintenanceMsg(e.target.value)}
                          placeholder="جاري تحديث النظام..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        setIsTogglingMaintenance(true);
                        const res = await enableMaintenanceMode(maintenanceMinutes, maintenanceMsg || undefined);
                        if (res.success) {
                          setMaintenanceEnabled(true);
                          toast.success(`تم تفعيل وضع الصيانة — التحديث بعد ${maintenanceMinutes} دقيقة`);
                        } else {
                          toast.error(res.error || 'حدث خطأ');
                        }
                        setIsTogglingMaintenance(false);
                      }}
                      disabled={isTogglingMaintenance}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isTogglingMaintenance ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      تفعيل وضع الصيانة وإشعار المستخدمين
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <RefreshCw className="w-8 h-8 text-red-500 mx-auto mb-2 animate-spin" style={{ animationDuration: '3s' }} />
                      <p className="text-sm font-bold text-red-700">وضع الصيانة مفعّل</p>
                      <p className="text-xs text-red-500 mt-1">كل المستخدمين يشاهدون إشعار التحذير الآن</p>
                    </div>
                    <button
                      onClick={async () => {
                        setIsTogglingMaintenance(true);
                        const res = await disableMaintenanceMode();
                        if (res.success) {
                          setMaintenanceEnabled(false);
                          toast.success('تم إلغاء وضع الصيانة');
                        } else {
                          toast.error(res.error || 'حدث خطأ');
                        }
                        setIsTogglingMaintenance(false);
                      }}
                      disabled={isTogglingMaintenance}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {isTogglingMaintenance ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      إلغاء وضع الصيانة (النظام يعمل)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>{" "}
        </main>{" "}
      </div>{" "}
    </div>;
}