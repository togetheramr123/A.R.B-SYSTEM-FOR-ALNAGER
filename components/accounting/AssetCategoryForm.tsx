"use client";
import React from "react";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { createAssetCategory, updateAssetCategory, deleteAssetCategory } from "@/app/actions/assets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OdooCombobox } from "@/components/ui/OdooCombobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trash2, LayoutGrid, CloudUpload } from "lucide-react";
import Link from "next/link";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
interface AssetCategoryFormProps {
  initialData?: any;
  accounts: {
    value: string;
    label: string;
  }[];
  journals: {
    value: string;
    label: string;
  }[];
}
export function AssetCategoryForm({
  initialData,
  accounts,
  journals
}: AssetCategoryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: {
      errors,
      isDirty
    }
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      method: initialData?.method || "linear",
      duration: initialData?.duration || 5,
      accountAssetId: initialData?.accountAssetId || "",
      accountDeprId: initialData?.accountDeprId || "",
      accountExpenseId: initialData?.accountExpenseId || "",
      journalId: initialData?.journalId || ""
    }
  });
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateAssetCategory(initialData.id, data);
      } else {
        await createAssetCategory(data);
      }
      router.push("/accounting/configuration/asset_categories");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ. يرجى المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه الفئة؟")) return;
    setLoading(true);
    try {
      await deleteAssetCategory(initialData.id);
      router.push("/accounting/configuration/asset_categories");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("فشل في الحذف.");
    } finally {
      setLoading(false);
    }
  };
  return <div className="bg-slate-50 min-h-screen pb-10">
      {" "}
      {/* Header */}{" "}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm h-16">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <Link href="/accounting/configuration/asset_categories" className="text-sm text-[#017E84] hover:underline font-medium">
            {" "}
            فئات الأصول{" "}
          </Link>{" "}
          <span className="text-slate-400">/</span>{" "}
          <h1 className="text-lg font-bold text-slate-800">
            {" "}
            {initialData?.id ? `تعديل فئة: ${initialData.name}` : "فئة أصول جديدة"}{" "}
          </h1>{" "}
        </div>{" "}
        <div className="flex gap-2 items-center">
          {" "}
          <button onClick={handleSubmit(onSubmit)} disabled={loading} title="حفظ" className="bg-[#017E84] text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 disabled:opacity-50">
            {" "}
            <CloudUpload className="w-5 h-5" /> <span>حفظ</span>{" "}
          </button>{" "}
          {initialData?.id && <button onClick={handleDelete} disabled={loading} title="حذف" className="p-1.5 text-slate-400 hover:text-red-600 rounded-sm hover:bg-red-50 transition-colors">
              {" "}
              <Trash2 className="w-5 h-5" />{" "}
            </button>}{" "}
        </div>{" "}
      </div>{" "}
      {/* Form Content */}{" "}
      <div className="max-w-4xl mx-auto mt-8 px-4">
        {" "}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {" "}
            {/* Left Column: Configuration */}{" "}
            <div className="space-y-6">
              {" "}
              <div className="flex items-center gap-2 mb-4 border-b pb-2">
                {" "}
                <LayoutGrid className="w-5 h-5 text-[#017E84]" />{" "}
                <h2 className="text-lg font-semibold text-slate-800">
                  الإعدادات
                </h2>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    اسم الفئة
                  </label>{" "}
                  <Input {...register("name", {
                  required: true
                })} placeholder="مثل: أجهزة كمبيوتر" />{" "}
                  {errors.name && <span className="text-xs text-red-500">مطلوب</span>}{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    طريقة الإهلاك
                  </label>{" "}
                  <Controller name="method" control={control} render={({
                  field
                }) => <Select onValueChange={field.onChange} defaultValue={field.value}>
                        {" "}
                        <SelectTrigger>
                          {" "}
                          <SelectValue placeholder="اختر الطريقة" />{" "}
                        </SelectTrigger>{" "}
                        <SelectContent>
                          {" "}
                          <SelectItem value="linear">قسط ثابت</SelectItem>{" "}
                          <SelectItem value="degressive">
                            قسط متناقص
                          </SelectItem>{" "}
                        </SelectContent>{" "}
                      </Select>} />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    المدة (سنوات)
                  </label>{" "}
                  <Input type="number" {...register("duration", {
                  required: true,
                  min: 1,
                  valueAsNumber: true,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = convertArabicToEnglishNumbers(e.target.value);
                    setValue("duration", val ? parseInt(val) : 0, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                })} />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Right Column: Accounting */}{" "}
            <div className="space-y-6">
              {" "}
              <div className="flex items-center gap-2 mb-4 border-b pb-2 text-[#017E84]">
                {" "}
                <h2 className="text-lg font-semibold text-slate-800">
                  المحاسبة
                </h2>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    الدفتر
                  </label>{" "}
                  <Controller name="journalId" control={control} rules={{
                  required: true
                }} render={({
                  field
                }) => <OdooCombobox options={journals} value={field.value} onChange={field.onChange} placeholder="اختر الدفتر..." searchable />} />{" "}
                  {errors.journalId && <span className="text-xs text-red-500">مطلوب</span>}{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    حساب الأصل
                  </label>{" "}
                  <Controller name="accountAssetId" control={control} rules={{
                  required: true
                }} render={({
                  field
                }) => <OdooCombobox options={accounts} value={field.value} onChange={field.onChange} placeholder="اختر حساب الأصل..." searchable />} />{" "}
                  <span className="text-xs text-slate-500">
                    قيمة الأصل المعترف بها
                  </span>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    حساب الإهلاك
                  </label>{" "}
                  <Controller name="accountDeprId" control={control} rules={{
                  required: true
                }} render={({
                  field
                }) => <OdooCombobox options={accounts} value={field.value} onChange={field.onChange} placeholder="اختر حساب الإهلاك..." searchable />} />{" "}
                  <span className="text-xs text-slate-500">
                    مجمع الإهلاك
                  </span>{" "}
                </div>{" "}
                <div>
                  {" "}
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    حساب المصروف
                  </label>{" "}
                  <Controller name="accountExpenseId" control={control} rules={{
                  required: true
                }} render={({
                  field
                }) => <OdooCombobox options={accounts} value={field.value} onChange={field.onChange} placeholder="اختر حساب المصروف..." searchable />} />{" "}
                  <span className="text-xs text-slate-500">
                    مصروف الإهلاك
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}