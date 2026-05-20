"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Save, Loader2, RotateCcw, AlertCircle, ArrowLeftRight } from "lucide-react";
import { TopPortal } from "@/components/common/TopPortal";
import { ActionMenu } from "@/components/common/ActionMenu";
import { parsePrismaError } from "@/lib/utils/errorHandler";
import { toast } from "sonner";
interface PutawayFormProps {
  initialData?: any;
  locations: any[];
  products: any[];
  categories: any[];
}
export function PutawayForm({
  initialData,
  locations,
  products,
  categories
}: PutawayFormProps) {
  const router = useRouter();
  const isNew = !initialData?.id;
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: {
      isDirty
    }
  } = useForm({
    defaultValues: {
      productId: initialData?.productId || "",
      categoryId: initialData?.categoryId || "",
      inLocationId: initialData?.inLocationId || "",
      outLocationId: initialData?.outLocationId || "",
      sequence: initialData?.sequence || 10
    }
  });
  const onSubmit = async (data: any) => {
    setIsSaving(true);
    setPageError(null);
    try {
      const payload = {
        productId: data.productId || null,
        categoryId: data.categoryId || null,
        inLocationId: data.inLocationId,
        outLocationId: data.outLocationId,
        sequence: data.sequence
      };
      const {
        createPutawayRule,
        updatePutawayRule
      } = await import("@/app/actions/inventoryConfig");
      if (isNew) {
        const res = await createPutawayRule(payload); //
        toast.success("تم الحفظ بنجاح");
        router.push(`/ar/inventory/config/putaway/${res.id}`);
      } else {
        await updatePutawayRule(initialData.id, payload); //
        toast.success("تم التعديل بنجاح");
        router.refresh();
      }
    } catch (e: any) {
      console.error(e);
      let message = parsePrismaError(e) || "حدث خطأ أثناء الحفظ";
      setPageError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }; // Auto-save logic
  useEffect(() => {
    const subscription = watch((value, {
      type
    }) => {
      if (type === "change" && !isNew) {
        const timeoutId = setTimeout(() => {
          handleSubmit(async data => {
            try {
              const {
                updatePutawayRule
              } = await import("@/app/actions/inventoryConfig");
              const payload = {
                productId: data.productId || null,
                categoryId: data.categoryId || null,
                inLocationId: data.inLocationId,
                outLocationId: data.outLocationId,
                sequence: data.sequence
              };
              await updatePutawayRule(initialData.id, payload);
            } catch (error) {
              console.error("Auto-save error:", error);
            }
          })();
        }, 1500);
        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, isNew, handleSubmit, initialData?.id]);
  return <form onSubmit={handleSubmit(onSubmit)} className={`bg-white border border-slate-300 shadow-sm rounded-sm pb-8 ${isSaving ? "pointer-events-none opacity-60" : ""}`}>
      {" "}
      {/* Top Control Bar via Portal */}{" "}
      <TopPortal>
        {" "}
        <div className="flex gap-2 items-center shrink-0 rtl:flex-row-reverse" dir="rtl">
          {" "}
          <button type="button" onClick={() => router.push(`/ar/inventory/config/putaway/new`)} className="bg-white text-slate-700 border border-slate-300 px-3 py-1.5 rounded-sm text-sm hover:bg-slate-50 transition-colors font-bold whitespace-nowrap">
            {" "}
            جديد{" "}
          </button>{" "}
          <div className="relative ml-2 border-r border-slate-200 pr-3">
            {" "}
            <ActionMenu onDelete={() => toast.info("حذف القاعدة غير مفعل حالياً")} />{" "}
          </div>{" "}
          {(isDirty || isNew) && <div className="flex items-center">
              {" "}
              <button type="button" onClick={() => {
            router.push("/ar/inventory/config/putaway");
          }} className="p-1.5 text-slate-400 hover:text-red-600 rounded-sm hover:bg-red-50 transition-colors ml-1">
                {" "}
                <RotateCcw className="w-4 h-4" />{" "}
              </button>{" "}
              <button type="submit" disabled={isSaving} className="bg-[#017E84] text-white px-3 py-1.5 rounded-sm text-sm font-bold hover:bg-[#016f74] transition-colors flex items-center gap-1.5 disabled:opacity-50 ml-2">
                {" "}
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
                <span>حفظ</span>{" "}
              </button>{" "}
            </div>}{" "}
        </div>{" "}
      </TopPortal>{" "}
      {pageError && <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-3">
          {" "}
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />{" "}
          <div>
            {" "}
            <h3 className="text-sm font-bold text-red-800">تعذر الحفظ</h3>{" "}
            <p className="text-sm text-red-600 mt-1 whitespace-pre-wrap">
              {pageError}
            </p>{" "}
          </div>{" "}
        </div>}{" "}
      <div className="p-6">
        {" "}
        <div className="mb-8 border-b border-slate-200 pb-4 flex items-center gap-3">
          {" "}
          <div className="w-10 h-10 bg-[#017E84]/20 rounded-lg flex items-center justify-center">
            {" "}
            <ArrowLeftRight className="w-5 h-5 text-indigo-700" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              قاعدة تخزين جديدة
            </h1>{" "}
            <p className="text-sm text-slate-500">
              توجيه المنتجات تلقائياً من موقع الاستلام إلى موقع التخزين النهائي.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {" "}
          <div className="space-y-4">
            {" "}
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              تفاصيل القاعدة
            </h3>{" "}
            <div className="grid grid-cols-[140px_1fr] items-center">
              {" "}
              <label className="text-sm font-bold text-slate-700">
                تطبق على (المنتج)
              </label>{" "}
              <select {...register("productId")} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent">
                {" "}
                <option value="">(جميع المنتجات)</option>{" "}
                {products.map(p => <option key={p.id} value={p.id}>
                    {p.name}
                  </option>)}{" "}
              </select>{" "}
            </div>{" "}
            <div className="grid grid-cols-[140px_1fr] items-center">
              {" "}
              <label className="text-sm font-bold text-slate-700">
                أو (فئة المنتجات)
              </label>{" "}
              <select {...register("categoryId")} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent">
                {" "}
                <option value="">(اختياري)</option>{" "}
                {categories.map(c => <option key={c.id} value={c.id}>
                    {c.name}
                  </option>)}{" "}
              </select>{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-4">
            {" "}
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
              مواقع ومسارات
            </h3>{" "}
            <div className="grid grid-cols-[140px_1fr] items-center">
              {" "}
              <label className="text-sm font-bold text-indigo-700">
                عند الوصول إلى
              </label>{" "}
              <select {...register("inLocationId", {
              required: "مطلوب"
            })} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent font-bold">
                {" "}
                <option value="">- حدد موقع الاستلام -</option>{" "}
                {locations.map(l => <option key={l.id} value={l.id}>
                    {l.name}
                  </option>)}{" "}
              </select>{" "}
            </div>{" "}
            <div className="grid grid-cols-[140px_1fr] items-center">
              {" "}
              <label className="text-sm font-bold text-green-700 mt-2">
                خزّن في الوجهة
              </label>{" "}
              <div className="relative mt-2">
                {" "}
                <select {...register("outLocationId", {
                required: "مطلوب"
              })} className="w-full border-b border-slate-300 focus:border-green-600 outline-none py-1 text-sm bg-transparent font-bold">
                  {" "}
                  <option value="">- حدد موقع التخزين النهائي -</option>{" "}
                  {locations.map(l => <option key={l.id} value={l.id}>
                      {l.name}
                    </option>)}{" "}
                </select>{" "}
              </div>{" "}
            </div>{" "}
            <div className="grid grid-cols-[140px_1fr] items-center mt-4">
              {" "}
              <label className="text-sm font-bold text-slate-700">
                التسلسل
              </label>{" "}
              <input type="number" {...register("sequence", {
              valueAsNumber: true
            })} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent placeholder:text-slate-400" />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </form>;
}