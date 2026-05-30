"use client";

import { useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createRoute, updateRoute } from "@/app/actions/inventoryConfig";
import { toast } from "sonner";
import { Save, AlertCircle, RefreshCw, CloudUpload } from "lucide-react";
import { TopPortal } from '@/components/common/TopPortal';
import { useStatusStore } from "@/store/statusStore";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
export function RouteForm({
  initialData = null
}: {
  initialData?: any;
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
    sequence: initialData?.sequence || 10,
    active: initialData?.active ?? true
  });
  const isDirty = initialData ? form.name !== initialData.name || form.sequence !== initialData.sequence || form.active !== initialData.active : form.name.length > 0;
  const handleSave = async () => {
    if (!form.name) {
      toast.error("اسم المسار مطلوب");
      return;
    }
    setSaving(true);
    try {
      const dataToSave = {
        name: form.name,
        sequence: Number(form.sequence),
        active: form.active
      };
      if (initialData?.id) {
        await updateRoute(initialData.id, dataToSave); //
        toast.success("تم الحفظ بنجاح");
      } else {
        const newRoute = await createRoute(dataToSave);
        toast.success("تم إنشاء المسار بنجاح");
        router.push(`/${locale}/inventory/config/routes/${newRoute.id}`);
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
      discardTriggerFn: () => router.push(`/${locale}/inventory/config/routes`)
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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
      {" "}
      {/* Form Body */}{" "}
      <div className="p-6 md:p-8 flex-1 grid md:grid-cols-2 gap-x-12 gap-y-8">
        {" "}
        <div className="space-y-6">
          {" "}
          <div className="space-y-2">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              اسم المسار (Route Name)
            </label>{" "}
            <Input value={form.name} onChange={e => setForm({
            ...form,
            name: e.target.value
          })} placeholder="مثال: استلام في خطوة واحدة..." className="bg-slate-50/50 focus-visible:ring-indigo-500 border-slate-300" />{" "}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              التسلسل (Sequence)
            </label>{" "}
            <Input type="number" value={form.sequence} onChange={e => setForm({
            ...form,
            sequence: e.target.value
          })} className="bg-slate-50/50 focus-visible:ring-indigo-500 border-slate-300" />{" "}
            <p className="text-xs text-slate-500">
              يستخدم لتحديد أولوية تنفيذ المسار مقارنة بالمسارات الأخرى.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="space-y-6">
          {" "}
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 flex items-start justify-between">
            {" "}
            <div>
              {" "}
              <label className="text-sm font-bold text-slate-700 mb-1 block">
                نشط (Active)
              </label>{" "}
              <p className="text-xs text-slate-500 max-w-[200px]">
                إذا تم إلغاء التنشيط، سيتم إخفاء المسار ولن ينطبق على العمليات
                الجديدة.
              </p>{" "}
            </div>{" "}
            <Switch checked={form.active} onCheckedChange={checked => setForm({
            ...form,
            active: checked
          })} className="data-[state=checked]:bg-emerald-500" />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Context/Hint - Auto improvement mindset! */}{" "}
      <div className="bg-blue-50/50 p-4 border-t border-blue-100 text-xs text-blue-800 flex gap-2">
        {" "}
        <span className="font-bold">ملاحظة:</span> المسار هو تجميع لعدة قواعد
        (Rules). بعد إنشاء المسار، تأكد من إضافة القواعد المنظمة له عبر شاشة
        규칙 الحركة لتوجيه المنتجات بشكل صحيح.{" "}
      </div>{" "}
    </div>
    </>;
}