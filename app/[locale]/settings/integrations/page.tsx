"use client";

import { useTranslations } from "next-intl";
import { Key, Globe, Link2, Plus, Copy, Trash2, ShieldCheck, Zap, Settings2, CheckCircle2, MessageSquare, CreditCard } from "lucide-react";
import { useState } from "react";
export default function IntegrationsPage() {
  const t = useTranslations("Integrations");
  const [activeTab, setActiveTab] = useState("keys");
  /* 'keys', 'mapping', 'webhooks' */
  const apiKeys = [{
    id: 1,
    name: "تطبيق متجر التجار (Shopify)",
    key: "sk_live_51M...",
    status: "active",
    lastUsed: "2025-12-30"
  }];
  const dataFields = [{
    id: "p_name",
    category: "المنتجات",
    label: "اسم المنتج",
    enabled: true
  }, {
    id: "p_price",
    category: "المنتجات",
    label: "السعر",
    enabled: true
  }, {
    id: "p_stock",
    category: "المنتجات",
    label: "كمية المخزون",
    enabled: true
  }, {
    id: "o_id",
    category: "الطلبات",
    label: "رقم الطلب",
    enabled: true
  }, {
    id: "o_status",
    category: "الطلبات",
    label: "حالة الدفع",
    enabled: false
  }, {
    id: "c_name",
    category: "العملاء",
    label: "اسم العميل",
    enabled: false
  }];
  return <div className="space-y-8 pb-12">
      {" "}
      <div className="flex justify-between items-end">
        {" "}
        <div>
          {" "}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {t("title")}
          </h1>{" "}
          <p className="text-slate-500 mt-1 font-medium italic">
            تحكم في البيانات التي يمكن للتطبيقات الخارجية سحبها من نظامك.
          </p>{" "}
        </div>{" "}
        <div className="flex bg-slate-100 p-1 rounded-sm">
          {" "}
          {[{
          id: "keys",
          label: "مفاتيح الربط",
          icon: Key
        }, {
          id: "mapping",
          label: "تحديد البيانات (Mapping)",
          icon: Settings2
        }, {
          id: "webhooks",
          label: "التنبيهات",
          icon: Zap
        }, {
          id: "external_services",
          label: "الخدمات الخارجية (APIs)",
          icon: Globe
        }].map((tab: any) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? "bg-white shadow text-blue-600" : "text-slate-500 hover:text-slate-700"}`}>
              {" "}
              <tab.icon className="w-4 h-4" /> {tab.label}{" "}
            </button>)}{" "}
        </div>{" "}
      </div>{" "}
      {activeTab === "keys" && <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {" "}
          <div className="lg:col-span-2 bg-white rounded-sm shadow-sm border border-slate-100 overflow-hidden text-right">
            {" "}
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              {" "}
              <h2 className="text-xl font-bold text-slate-800">
                مفاتيح الدخول النشطة
              </h2>{" "}
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm ring-2 ring-blue-50">
                {" "}
                {t("generateKey")}{" "}
              </button>{" "}
            </div>{" "}
            <div className="divide-y divide-slate-100">
              {" "}
              {apiKeys.map((key: any) => <div key={key.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  {" "}
                  <div className="space-y-1">
                    {" "}
                    <h3 className="font-bold text-slate-900">
                      {key.name}
                    </h3>{" "}
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">
                      {key.key}
                    </code>{" "}
                  </div>{" "}
                  <button className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-5 h-5" />
                  </button>{" "}
                </div>)}{" "}
            </div>{" "}
          </div>{" "}
          <div className="bg-blue-600 rounded-sm p-8 text-white">
            {" "}
            <ShieldCheck className="w-12 h-12 mb-4 opacity-50" />{" "}
            <h3 className="text-xl font-bold mb-2">أمان الربط</h3>{" "}
            <p className="text-blue-100 text-sm leading-relaxed">
              تأكد من إعطاء الصلاحيات المطلوبة فقط لكل تطبيق. يمكنك مراجعة سجل
              العمليات (Logs) لكل مفتاح لمعرفة ما تم سحبه.
            </p>{" "}
          </div>{" "}
        </div>}{" "}
      {activeTab === "mapping" && <div className="bg-white rounded-sm shadow-sm border border-slate-100 overflow-hidden text-right">
          {" "}
          <div className="p-8 bg-slate-50 border-b border-slate-100">
            {" "}
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              تخصيص البيانات المسحوبة
            </h2>{" "}
            <p className="text-slate-500">
              حدد ما هي "الحقول" (Fields) التي يسمح للتطبيقات الخارجية (مثل
              تطبيق التاجر) بالوصول إليها.
            </p>{" "}
          </div>{" "}
          <div className="p-8">
            {" "}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {" "}
              {["المنتجات", "الطلبات", "العملاء"].map((cat: any) => <div key={cat} className="space-y-4">
                  {" "}
                  <h3 className="font-bold text-blue-600 border-b pb-2 flex items-center gap-2">
                    {" "}
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />{" "}
                    {cat}{" "}
                  </h3>{" "}
                  {dataFields.filter((f: any) => f.category === cat).map((field: any) => <label key={field.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white border border-transparent hover:border-blue-200 rounded-sm cursor-pointer transition-all">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <div className={`w-2 h-2 rounded-full ${field.enabled ? "bg-green-500" : "bg-slate-300"}`} />{" "}
                          <span className={`font-bold ${field.enabled ? "text-slate-800" : "text-slate-400"}`}>
                            {field.label}
                          </span>{" "}
                        </div>{" "}
                        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" defaultChecked={field.enabled} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />{" "}
                      </label>)}{" "}
                </div>)}{" "}
            </div>{" "}
            <div className="mt-12 flex justify-end gap-3 border-t pt-8">
              {" "}
              <button className="px-6 py-2 rounded-sm text-slate-500 font-bold hover:bg-slate-100 transition-all">
                إلغاء التغييرات
              </button>{" "}
              <button className="bg-slate-900 text-white px-8 py-3 rounded-sm font-bold shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                {" "}
                <CheckCircle2 className="w-5 h-5" /> حفظ إعدادات الربط{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>}{" "}
      {activeTab === "webhooks" && <div className="bg-white rounded-sm p-8 shadow-sm border border-slate-100 text-center space-y-4">
          {" "}
          <Zap className="w-16 h-16 text-orange-400 mx-auto" strokeWidth={1} />{" "}
          <h2 className="text-2xl font-bold text-slate-800">
            التنبيهات الفورية (Webhooks)
          </h2>{" "}
          <p className="text-slate-500 max-w-lg mx-auto leading-relaxed">
            هنا يمكنك إضافة روابط لاستلام إشعارات حية ومباشرة عند حدوث أي عملية
            (مثل بيع منتج أو نقص مخزون) ليتم إبلاغ تطبيق التاجر فوراً.
          </p>{" "}
          <button className="bg-orange-50 text-orange-600 px-6 py-2 rounded-sm font-bold border border-orange-100 hover:bg-orange-100 transition-colors">
            إضافة رابط تنبيه جديد
          </button>{" "}
        </div>}{" "}
      {activeTab === "external_services" && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {" "}
          {/* WhatsApp Integration */}{" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-100 p-6 relative overflow-hidden text-right">
            {" "}
            <div className="absolute top-0 right-0 w-2 h-full bg-[#25D366]"></div>{" "}
            <div className="flex justify-between items-start mb-4">
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className="bg-green-50 p-2 rounded-md">
                  {" "}
                  <MessageSquare className="w-6 h-6 text-[#25D366]" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h3 className="font-bold text-lg text-slate-800">
                    WhatsApp Business
                  </h3>{" "}
                  <p className="text-sm text-slate-500">
                    إرسال تنبيهات (المُوجّه الذكي) للمديرين والفواتير للعملاء.
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <span className="flex items-center gap-1 text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                {" "}
                غير متصل{" "}
              </span>{" "}
            </div>{" "}
            <div className="space-y-4 my-6">
              {" "}
              <div>
                {" "}
                <label className="text-sm font-bold text-slate-700 block mb-1">
                  API Token
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="password" placeholder="••••••••••••••••••••••••" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-left" dir="ltr" />{" "}
              </div>{" "}
            </div>{" "}
            <button onClick={() => alert("تم حفظ الإعدادات وسيتم إرسال رسالة تجريبية لمدير النظام.")} className="bg-[#25D366] text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors w-full shadow-md ">
              {" "}
              حفظ وتجربة الربط{" "}
            </button>{" "}
          </div>{" "}
          {/* Vodafone Cash */}{" "}
          <div className="bg-white rounded-sm shadow-sm border border-slate-100 p-6 relative overflow-hidden text-right">
            {" "}
            <div className="absolute top-0 right-0 w-2 h-full bg-red-600"></div>{" "}
            <div className="flex justify-between items-start mb-4">
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className="bg-red-50 p-2 rounded-md">
                  {" "}
                  <CreditCard className="w-6 h-6 text-red-600" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h3 className="font-bold text-lg text-slate-800">
                    بوابات الدفع (VfCash)
                  </h3>{" "}
                  <p className="text-sm text-slate-500">
                    تحصيل الفواتير إلكترونياً من العملاء.
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <span className="flex items-center gap-1 text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
                {" "}
                غير متصل{" "}
              </span>{" "}
            </div>{" "}
            <div className="space-y-4 my-6">
              {" "}
              <div>
                {" "}
                <label className="text-sm font-bold text-slate-700 block mb-1">
                  Merchant API Key
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="password" placeholder="••••••••••••••••••••••••" className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-left" dir="ltr" />{" "}
              </div>{" "}
            </div>{" "}
            <button onClick={() => alert("تم حفظ إعدادات بوابات الدفع بنجاح.")} className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors w-full shadow-md ">
              {" "}
              تفعيل بوابة الدفع{" "}
            </button>{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}