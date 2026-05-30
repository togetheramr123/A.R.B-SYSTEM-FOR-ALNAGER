"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createRule, updateRule } from "@/app/actions/inventoryConfig";
import { toast } from "sonner";
import { Save, RefreshCw, AlertCircle, CloudUpload } from "lucide-react";
import { TopPortal } from '@/components/common/TopPortal';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useStatusStore } from "@/store/statusStore";
import { useEffect } from "react";
export function RuleForm({
  initialData = null,
  routes = [],
  locations = [],
  operationTypes = []
}: {
  initialData?: any;
  routes: any[];
  locations: any[];
  operationTypes: any[];
}) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || "ar";
  const [saving, setSaving] = useState(false);
  const {
    setFormStatus,
    clearStatus
  } = useStatusStore();
  const [form, setForm] = useState({
    name: initialData?.name || "",
    action: initialData?.action || "pull",
    routeId: initialData?.routeId || "",
    sourceLocId: initialData?.sourceLocId || "",
    destLocId: initialData?.destLocId || "",
    pickingTypeId: initialData?.pickingTypeId || "",
    sequence: initialData?.sequence || 10
  });
  const isDirty = initialData ? form.name !== initialData.name || form.action !== initialData.action || form.routeId !== initialData.routeId || form.sourceLocId !== initialData.sourceLocId || form.destLocId !== initialData.destLocId || form.pickingTypeId !== initialData.pickingTypeId || form.sequence !== initialData.sequence : form.name.length > 0;
  const handleSave = async () => {
    if (!form.name || !form.routeId || !form.action) {
      toast.error("يرجى ملء الحقول الإجبارية (الاسم، المسار، الإجراء)");
      return;
    }
    setSaving(true);
    try {
      const dataToSave = {
        name: form.name,
        action: form.action,
        sequence: Number(form.sequence),
        routeId: form.routeId,
        sourceLocId: form.sourceLocId || null,
        destLocId: form.destLocId || null,
        pickingTypeId: form.pickingTypeId || null
      };
      if (initialData?.id) {
        await updateRule(initialData.id, dataToSave);
        toast.success("تم تحديث القاعدة بنجاح");
      } else {
        const newRule = await createRule(dataToSave);
        toast.success("تم إنشاء القاعدة بنجاح");
        router.push(`/${locale}/inventory/config/rules/${newRule.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    setFormStatus({
      isSaving: saving,
      hasUnsavedChanges: isDirty,
      saveTriggerFn: handleSave,
      discardTriggerFn: () => router.push(`/${locale}/inventory/config/rules`)
    });
    return () => clearStatus();
  }, [saving, isDirty, router, locale]);
  return <>
    <TopPortal>
      <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse" dir="rtl">
        <button onClick={handleSave} disabled={saving}
          className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-sm font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2 h-8">
          <CloudUpload className="w-4 h-4" />
          حفظ
        </button>
      </div>
    </TopPortal>
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
      {" "}
      <div className="p-6 md:p-8 flex-1 grid md:grid-cols-2 gap-x-12 gap-y-6">
        {" "}
        {/* Left Column */}{" "}
        <div className="space-y-6">
          {" "}
          <div className="space-y-2">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              اسم القاعدة <span className="text-red-500">*</span>
            </label>{" "}
            <Input value={form.name} onChange={e => setForm({
            ...form,
            name: e.target.value
          })} placeholder="مثال: من المخزن الرئيسي إلى منطقة الشحن" className="bg-slate-50/50" />{" "}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              الإجراء (Action) <span className="text-red-500">*</span>
            </label>{" "}
            <select value={form.action} onChange={e => setForm({
            ...form,
            action: e.target.value
          })} className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              {" "}
              <option value="pull">سحب (Pull From)</option>{" "}
              <option value="push">دفع (Push To)</option>{" "}
              <option value="buy">شراء (Buy)</option>{" "}
              <option value="manufacture">تصنيع (Manufacture)</option>{" "}
            </select>{" "}
            <p className="text-[11px] text-slate-500">
              السحب: جلب منتجات عند الحاجة. الدفع: نقل منتجات تلقائياً بعد
              استلامها.
            </p>{" "}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              التسلسل
            </label>{" "}
            <Input type="number" value={form.sequence} onChange={e => setForm({
            ...form,
            sequence: e.target.value
          })} className="bg-slate-50/50" />{" "}
          </div>{" "}
        </div>{" "}
        {/* Right Column */}{" "}
        <div className="space-y-6">
          {" "}
          <div className="space-y-2">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              تطبيق على المسار (Route) <span className="text-red-500">*</span>
            </label>{" "}
            <select value={form.routeId} onChange={e => setForm({
            ...form,
            routeId: e.target.value
          })} className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {" "}
              <option value="">
                (اختر المسار الذي تنتمي إليه القاعدة)
              </option>{" "}
              {routes.map(r => <option key={r.id} value={r.id}>
                  {r.name}
                </option>)}{" "}
            </select>{" "}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              نوع العملية (Operation Type)
            </label>{" "}
            <select value={form.pickingTypeId} onChange={e => setForm({
            ...form,
            pickingTypeId: e.target.value
          })} className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {" "}
              <option value="">(اختياري)</option>{" "}
              {operationTypes.map(ot => <option key={ot.id} value={ot.id}>
                  {ot.name}
                </option>)}{" "}
            </select>{" "}
            <p className="text-[11px] text-slate-500">
              نوع المستند الذي سيتم إنشاؤه أوتوماتيكياً (مثل: أذون تسليم،
              إيصالات استلام).
            </p>{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <div className="space-y-2">
              {" "}
              <label className="text-sm font-bold text-slate-700">
                من موقع (Source)
              </label>{" "}
              <select value={form.sourceLocId} onChange={e => setForm({
              ...form,
              sourceLocId: e.target.value
            })} className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {" "}
                <option value="">(اختياري)</option>{" "}
                {locations.map(l => <option key={l.id} value={l.id}>
                    {l.name}
                  </option>)}{" "}
              </select>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <label className="text-sm font-bold text-slate-700">
                إلى موقع (Destination)
              </label>{" "}
              <select value={form.destLocId} onChange={e => setForm({
              ...form,
              destLocId: e.target.value
            })} className="w-full h-10 px-3 py-2 rounded-md border border-slate-300 bg-slate-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {" "}
                <option value="">(اختياري)</option>{" "}
                {locations.map(l => <option key={l.id} value={l.id}>
                    {l.name}
                  </option>)}{" "}
              </select>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>
    </>;
}