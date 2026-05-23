"use client";

import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useRouter } from "next/navigation";
import { deleteJournal } from "@/app/actions/journals";
import { saveJournalDetails } from "@/app/actions/accounting";
import { Trash2, CloudUpload, RotateCcw, ListTree, Plus, X } from "lucide-react";
import Link from "next/link";
import { useStatusStore } from "@/store/statusStore";
import { TopPortal } from "@/components/common/TopPortal";
import { Loader2 } from "lucide-react";
type Props = {
  initialData: any;
  accounts: any[];
  paymentMethods: any[];
  locale: string;
};
export function JournalForm({
  initialData,
  accounts,
  paymentMethods,
  locale
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("entries");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setFormStatus,
    clearStatus
  } = useStatusStore();
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      type: initialData?.type || "cash",
      code: initialData?.code || "",
      defaultAccountId: initialData?.defaultAccountId || "",
      suspenseAccountId: initialData?.suspenseAccountId || "",
      profitAccountId: initialData?.profitAccountId || "",
      lossAccountId: initialData?.lossAccountId || "",
      dedicatedPaymentSequence: initialData?.dedicatedPaymentSequence || false,
      inboundPaymentMethods: initialData?.inboundPaymentMethods?.map((m: any) => m.id) || [],
      outboundPaymentMethods: initialData?.outboundPaymentMethods?.map((m: any) => m.id) || []
    }
  });
  const type = watch("type");
  const inboundMethods = watch("inboundPaymentMethods");
  const outboundMethods = watch("outboundPaymentMethods");
  const saveData = async (data: any, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await saveJournalDetails(initialData?.id || "new", data);
      if (!initialData?.id && result && !silent) {
        router.push(`/${locale}/accounting/configuration/journals/${result.id}`);
      }
      if (!silent) {
        //
        toast.success("تم الحفظ بنجاح");
        router.refresh();
      }
    } catch (e: any) {
      console.error(e);
      if (!silent) toast.error(`خطأ: ${e?.message || "في حفظ اليومية"}`);
    } finally {
      if (!silent) setLoading(false);
    }
  };
  const onSubmit = async (data: any) => saveData(data, false); // Auto-Save Effect
  useEffect(() => {
    const subscription = watch((value, {
      name,
      type: changeType
    }) => {
      if (changeType === "change") {
        if (!initialData?.id) {
          // Do not auto-save new records to prevent duplicate creation errors
          return;
        }
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => handleSubmit(d => saveData(d, true))(), 1500);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [watch, initialData?.id, handleSubmit]);
  useEffect(() => {
    setFormStatus({
      isSaving: isSubmitting || loading,
      hasUnsavedChanges: isDirty,
      saveTriggerFn: handleSubmit(onSubmit),
      discardTriggerFn: () => router.push(`/${locale}/accounting/configuration/journals`)
    });
    return () => clearStatus();
  }, [isSubmitting, loading, isDirty, router, locale, handleSubmit]);
  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الدفتر؟")) return;
    setLoading(true);
    try {
      await deleteJournal(initialData.id);
      router.push(`/${locale}/accounting/configuration/journals`);
    } catch (e) {
      toast.error("لا يمكن حذف يومية تحتوي على قيود.");
    } finally {
      setLoading(false);
    }
  };
  const togglePaymentMethod = (methodId: string, isOutbound: boolean) => {
    const current = isOutbound ? outboundMethods : inboundMethods;
    const fieldName = isOutbound ? "outboundPaymentMethods" : "inboundPaymentMethods";
    if (current.includes(methodId)) {
      setValue(fieldName, current.filter((id: string) => id !== methodId), {
        shouldDirty: true
      });
    } else {
      setValue(fieldName, [...current, methodId], {
        shouldDirty: true
      });
    }
  };
  const isCashOrBank = type === "cash" || type === "bank";
  return <div className="bg-white border border-slate-300 shadow-sm w-full rounded-sm min-h-[600px] relative" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse" dir="rtl">
          {" "}
          {isDirty && <>
              {" "}
              <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || loading} className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-sm font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2 h-8">
                {" "}
                {isSubmitting || loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}{" "}
                حفظ يدوي{" "}
              </button>{" "}
              <button onClick={() => router.push(`/${locale}/accounting/configuration/journals`)} disabled={isSubmitting || loading} className="bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-sm text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 h-8">
                {" "}
                <RotateCcw className="w-4 h-4" /> تجاهل{" "}
              </button>{" "}
            </>}{" "}
          <button type="button" onClick={() => router.push(`/${locale}/accounting/configuration/journals/new`)} className="bg-white border border-[#017E84] text-[#017E84] px-3 py-1.5 rounded-sm text-sm font-bold hover:bg-[#017E84] hover:text-white transition-colors h-8 flex items-center justify-center min-w-[60px]">
            {" "}
            جديد{" "}
          </button>{" "}
        </div>{" "}
      </TopPortal>{" "}
      {/* Control Bar */}{" "}
      <div className="border-b border-slate-200 p-3 flex justify-between items-center bg-white sticky top-0 z-10">
        {" "}
        <div className="flex gap-2 items-center">
          {" "}
          {/* Placeholder for left side elements if needed */}{" "}
          {initialData?.id && <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-600 rounded-sm hover:bg-red-50 transition-colors" title="حذف">
              {" "}
              <Trash2 className="w-5 h-5" />{" "}
            </button>}{" "}
        </div>{" "}
        {/* Smart Button */}{" "}
        {initialData?.id && <div className="flex items-center gap-4">
            {" "}
            <Link href={`/${locale}/accounting/journal-items?journal=${initialData.type}`} className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-[#017E84]/10/50 rounded px-4 py-1.5 cursor-pointer transition-all group">
              {" "}
              <ListTree className="w-5 h-5 text-indigo-400 group-hover:text-[#017E84] transition-colors" />{" "}
              <div className="flex flex-col items-start">
                {" "}
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#017E84] uppercase tracking-widest leading-none mb-0.5">
                  قيود اليومية
                </span>{" "}
                <span className="text-lg font-bold text-[#017E84] leading-none">
                  {" "}
                  {initialData._count?.entries || 0}{" "}
                </span>{" "}
              </div>{" "}
            </Link>{" "}
          </div>}{" "}
      </div>{" "}
      <div className="p-8">
        {" "}
        {/* Header Section */}{" "}
        <div className="flex justify-between items-start mb-8">
          {" "}
          <div className="w-2/3">
            {" "}
            <label className="block text-xs font-bold text-slate-500 mb-1">
              اسم دفتر اليومية
            </label>{" "}
            <input {...register("name", {
            required: true
          })} autoComplete="off" className="text-3xl font-bold text-slate-900 border-b border-slate-300 focus:border-[#017E84] outline-none w-full bg-transparent placeholder-slate-300 pb-1" placeholder="مثال: فودافون كاش" />{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-2 gap-12 mb-8">
          {" "}
          <div className="space-y-6">
            {" "}
            <div className="flex items-center border-b border-slate-300 pb-1">
              {" "}
              <label className="text-sm font-bold text-slate-700 w-1/3">
                النوع
              </label>{" "}
              <select {...register("type")} className="w-2/3 text-sm bg-transparent outline-none focus:text-[#017E84]">
                {" "}
                <option value="sale">المبيعات</option>{" "}
                <option value="purchase">المشتريات</option>{" "}
                <option value="cash">نقدي</option>{" "}
                <option value="bank">البنك</option>{" "}
                <option value="general">منوعات</option>{" "}
              </select>{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-6"></div>{" "}
        </div>{" "}
        {/* Tabs */}{" "}
        <div className="border-b border-slate-200 flex gap-6 mt-4">
          {" "}
          <button onClick={() => setActiveTab("entries")} className={`pb-2 text-sm font-bold transition-colors border-b-2 ${activeTab === "entries" ? "border-[#017E84] text-[#017E84]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {" "}
            قيود اليومية{" "}
          </button>{" "}
          {isCashOrBank && <>
              {" "}
              <button onClick={() => setActiveTab("inbound")} className={`pb-2 text-sm font-bold transition-colors border-b-2 ${activeTab === "inbound" ? "border-[#017E84] text-[#017E84]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                {" "}
                الدفعات الواردة{" "}
              </button>{" "}
              <button onClick={() => setActiveTab("outbound")} className={`pb-2 text-sm font-bold transition-colors border-b-2 ${activeTab === "outbound" ? "border-[#017E84] text-[#017E84]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
                {" "}
                الدفعات الصادرة{" "}
              </button>{" "}
            </>}{" "}
          <button onClick={() => setActiveTab("advanced")} className={`pb-2 text-sm font-bold transition-colors border-b-2 ${activeTab === "advanced" ? "border-[#017E84] text-[#017E84]" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            {" "}
            إعدادات متقدمة{" "}
          </button>{" "}
        </div>{" "}
        {/* Tab Content */}{" "}
        <div className="pt-6">
          {" "}
          {/* Tab 1: قيود اليومية */}{" "}
          {activeTab === "entries" && <div className="grid grid-cols-2 gap-12">
              {" "}
              <div className="space-y-4">
                {" "}
                <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">
                  المعلومات المحاسبية
                </h3>{" "}
                {isCashOrBank ? <>
                    {" "}
                    <div className="flex items-center border-b border-slate-200 pb-1">
                      {" "}
                      <label className="text-sm font-medium text-slate-700 w-1/3">
                        حساب نقدي/بنك
                      </label>{" "}
                      <select {...register("defaultAccountId")} className="w-2/3 text-sm bg-transparent outline-none">
                        {" "}
                        <option value="">(اختر الحساب)</option>{" "}
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>
                            {acc.code} {acc.name}
                          </option>)}{" "}
                      </select>{" "}
                    </div>{" "}
                    <div className="flex items-center border-b border-slate-200 pb-1">
                      {" "}
                      <label className="text-sm font-medium text-slate-700 w-1/3 text-indigo-700 relative">
                        {" "}
                        حساب معلّق{" "}
                        <span className="absolute -top-1 -right-2 text-[10px] bg-[#017E84]/20 text-indigo-700 px-1 rounded">
                          ?
                        </span>{" "}
                      </label>{" "}
                      <select {...register("suspenseAccountId")} className="w-2/3 text-sm bg-transparent outline-none">
                        {" "}
                        <option value="">(اختر حساب معلق)</option>{" "}
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>
                            {acc.code} {acc.name}
                          </option>)}{" "}
                      </select>{" "}
                    </div>{" "}
                    <div className="flex items-center border-b border-slate-200 pb-1 mt-4">
                      {" "}
                      <label className="text-sm font-medium text-slate-700 w-1/3 text-indigo-700 relative">
                        حساب الربح
                      </label>{" "}
                      <select {...register("profitAccountId")} className="w-2/3 text-sm bg-transparent outline-none">
                        {" "}
                        <option value="">(اختياري)</option>{" "}
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>
                            {acc.code} {acc.name}
                          </option>)}{" "}
                      </select>{" "}
                    </div>{" "}
                    <div className="flex items-center border-b border-slate-200 pb-1">
                      {" "}
                      <label className="text-sm font-medium text-slate-700 w-1/3 text-indigo-700 relative">
                        حساب الخسائر
                      </label>{" "}
                      <select {...register("lossAccountId")} className="w-2/3 text-sm bg-transparent outline-none">
                        {" "}
                        <option value="">(اختياري)</option>{" "}
                        {accounts.map(acc => <option key={acc.id} value={acc.id}>
                            {acc.code} {acc.name}
                          </option>)}{" "}
                      </select>{" "}
                    </div>{" "}
                  </> : (type === "sale" || type === "purchase") ? <div className="flex items-center border-b border-slate-200 pb-1">
                    {" "}
                    <label className="text-sm font-medium text-slate-700 w-1/3">
                      حساب الدخل/المصروف
                    </label>{" "}
                    <select {...register("defaultAccountId")} className="w-2/3 text-sm bg-transparent outline-none">
                      {" "}
                      <option value="">(افتراضي من المنتج)</option>{" "}
                      {accounts.map(acc => <option key={acc.id} value={acc.id}>
                          {acc.code} {acc.name}
                        </option>)}{" "}
                    </select>{" "}
                  </div> : null}{" "}
                  <div className="flex items-center border-b border-slate-200 pb-1 mt-4">
                    {" "}
                    <label className="text-sm font-medium text-slate-700 w-1/3">
                      الكود المختصر
                    </label>{" "}
                    <input {...register("code", {
                      required: true
                    })} autoComplete="off" className="w-2/3 text-sm bg-transparent outline-none uppercase font-mono" placeholder="مثال: INV" />{" "}
                  </div>{" "}
              </div>{" "}
              <div className="space-y-4 mt-8">
                {" "}
                {isCashOrBank && <div className="flex items-center justify-between pb-1 pt-4">
                    {" "}
                    <label className="text-sm font-medium text-slate-700">
                      تسلسل دفع مخصص
                    </label>{" "}
                    <input type="checkbox" {...register("dedicatedPaymentSequence")} className="w-4 h-4 text-[#017E84] rounded border-slate-300 focus:ring-[#017E84]" />{" "}
                  </div>}{" "}

              </div>{" "}
            </div>}{" "}
          {/* Tab 2: الدفعات الواردة */}{" "}
          {activeTab === "inbound" && isCashOrBank && <div>
              {" "}
              <table className="w-full text-sm text-right">
                {" "}
                <thead>
                  {" "}
                  <tr className="border-b-2 border-slate-200">
                    {" "}
                    <th className="py-2 text-slate-500 font-bold w-12">
                      تفعيل
                    </th>{" "}
                    <th className="py-2 text-slate-500 font-bold">
                      طريقة الدفع
                    </th>{" "}
                    <th className="py-2 text-slate-500 font-bold">
                      الاسم (طريقة الدفع)
                    </th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {paymentMethods.filter(pm => pm.type === "inbound" || pm.type === "both").map(method => <tr key={method.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        {" "}
                        <td className="py-3 px-2">
                          {" "}
                          <input type="checkbox" checked={inboundMethods.includes(method.id)} onChange={() => togglePaymentMethod(method.id, false)} className="rounded border-slate-300 text-[#017E84]" />{" "}
                        </td>{" "}
                        <td className="py-3 font-medium text-slate-700">
                          {method.name}
                        </td>{" "}
                        <td className="py-3 text-slate-500 text-xs font-mono">
                          {method.code}
                        </td>{" "}
                      </tr>)}{" "}
                </tbody>{" "}
              </table>{" "}
              {inboundMethods.length === 0 && <div className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded border border-amber-100">
                  {" "}
                  يجب تفعيل طريقة دفع واحدة على الأقل لاستلام الأموال في هذا
                  الدفتر.{" "}
                </div>}{" "}
            </div>}{" "}
          {/* Tab 3: الدفعات الصادرة */}{" "}
          {activeTab === "outbound" && isCashOrBank && <div>
              {" "}
              <table className="w-full text-sm text-right">
                {" "}
                <thead>
                  {" "}
                  <tr className="border-b-2 border-slate-200">
                    {" "}
                    <th className="py-2 text-slate-500 font-bold w-12">
                      تفعيل
                    </th>{" "}
                    <th className="py-2 text-slate-500 font-bold">
                      طريقة الدفع
                    </th>{" "}
                    <th className="py-2 text-slate-500 font-bold">
                      الاسم (طريقة الدفع)
                    </th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {paymentMethods.filter(pm => pm.type === "outbound" || pm.type === "both").map(method => <tr key={method.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        {" "}
                        <td className="py-3 px-2">
                          {" "}
                          <input type="checkbox" checked={outboundMethods.includes(method.id)} onChange={() => togglePaymentMethod(method.id, true)} className="rounded border-slate-300 text-[#017E84]" />{" "}
                        </td>{" "}
                        <td className="py-3 font-medium text-slate-700">
                          {method.name}
                        </td>{" "}
                        <td className="py-3 text-slate-500 text-xs font-mono">
                          {method.code}
                        </td>{" "}
                      </tr>)}{" "}
                </tbody>{" "}
              </table>{" "}
              {outboundMethods.length === 0 && <div className="text-sm text-amber-600 mt-4 bg-amber-50 p-3 rounded border border-amber-100">
                  {" "}
                  يجب تفعيل طريقة دفع واحدة على الأقل لإصدار الأموال من هذا
                  الدفتر.{" "}
                </div>}{" "}
            </div>}{" "}
          {/* Tab 4: إعدادات متقدمة */}{" "}
          {activeTab === "advanced" && <div className="text-center py-12 text-slate-400">
              {" "}
              لا توجد إعدادات متقدمة مخصصة لهذا الدفتر في الوقت الحالي.{" "}
            </div>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}