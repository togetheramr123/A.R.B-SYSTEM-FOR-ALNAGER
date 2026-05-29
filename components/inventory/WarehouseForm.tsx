"use client";

import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useStatusStore } from "@/store/statusStore";
import { useEffect } from "react";
export function WarehouseForm() {
  const t = useTranslations("Common");
  const tInv = useTranslations("Inventory");
  const {
    register,
    handleSubmit,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm();
  const {
    setFormStatus,
    clearStatus
  } = useStatusStore();
  const onSubmit = async (data: any) => {
    console.log(data);
    toast.success("سيتم حفظ المستودع قريباً!");
  };
  useEffect(() => {
    setFormStatus({
      isSaving: isSubmitting,
      hasUnsavedChanges: isDirty,
      saveTriggerFn: handleSubmit(onSubmit),
      discardTriggerFn: () => window.history.back()
    });
    return () => clearStatus();
  }, [isSubmitting, isDirty, handleSubmit]);
  return <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-sm shadow-sm border border-slate-100 max-w-2xl">
      {" "}
      <div className="grid grid-cols-1 gap-6">
        {" "}
        <div>
          {" "}
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {" "}
            {tInv("warehouseName")}{" "}
          </label>{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register("name")} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="مثال: المستودع الرئيسي" />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {" "}
            {tInv("warehouseCode")}{" "}
          </label>{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register("code")} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase" placeholder="WH-MAIN" />{" "}
          <p className="text-xs text-slate-500 mt-1">
            يستخدم هذا الكود في أرقام الفواتير والحركات (مثال: WH/IN/001)
          </p>{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {" "}
            {tInv("warehouseAddress")}{" "}
          </label>{" "}
          <textarea {...register("address")} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />{" "}
        </div>{" "}
      </div>{" "}
    </form>;
}