"use client";
import React from "react";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { X, Save, Plus, Trash2, Edit } from "lucide-react";
import { OdooCombobox } from "@/components/ui/OdooCombobox";
import { getUoms, createUom, updateUom, deleteUom, getUomCategories, createUomCategory } from "@/app/actions/inventory";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
import { toast } from "sonner";
interface UomManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (uomName: string) => void;
}
export function UomManagementDialog({
  isOpen,
  onClose,
  onSelect
}: UomManagementDialogProps) {
  const [view, setView] = useState<"list" | "form">("list");
  const [uomList, setUomList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue
  } = useForm({
    defaultValues: {
      name: "",
      categoryId: "",
      type: "consu" /* default, will map to reference ratio: 1.0, rounding: 0.01, active: true */
    }
  });
  const categoryId = watch("categoryId");
  const type = watch("type");
  useEffect(() => {
    if (isOpen) {
      loadData();
      setView("list");
    }
  }, [isOpen]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [uoms, cats] = await Promise.all([getUoms(), getUomCategories()]);
      setUomList(uoms || []);
      setCategories(cats || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const handleCreateCategory = async (name: string) => {
    if (!confirm(`إنشاء فئة وحدة قياس جديدة: ${name}؟`)) return;
    try {
      const newCat = await createUomCategory(name);
      if (newCat) {
        setCategories(prev => [...prev, newCat]);
        setValue("categoryId", newCat.id);
      }
    } catch (e) {
      toast.error("فشل في إنشاء الفئة");
    }
  };
  const handleEdit = (uom: any) => {
    setEditingId(uom.id);
    reset({
      name: uom.name,
      categoryId: uom.categoryId,
      type: uom.type,
      ratio: uom.ratio,
      rounding: uom.rounding,
      active: uom.active
    });
    setView("form");
  };
  const handleNew = () => {
    setEditingId(null);
    reset({
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : "",
      type: "reference",
      ratio: 1.0,
      rounding: 0.01,
      active: true
    });
    setView("form");
  };
  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
        await updateUom(editingId, data);
      } else {
        await createUom(data);
      }
      await loadData();
      setView("list");
      if (onSelect && !editingId) {
        onSelect(data.name);
        onClose();
      }
    } catch (e) {
      toast.error("فشل في حفظ الوحدة");
    }
  };
  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    try {
      await deleteUom(id);
      loadData();
    } catch (e) {
      toast.error("لا يمكن حذف وحدة قيد الاستخدام");
    }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      {" "}
      <div className="bg-white rounded-sm shadow-sm w-[800px] flex flex-col max-h-[90vh]">
        {" "}
        {/* Header */}{" "}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          {" "}
          <h3 className="text-xl text-slate-800 font-bold">
            {" "}
            {view === "list" ? "إدارة وحدات القياس" : editingId ? "تعديل وحدة" : "إنشاء وحدة جديدة"}{" "}
          </h3>{" "}
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
            {" "}
            <X className="w-5 h-5" />{" "}
          </button>{" "}
        </div>{" "}
        {/* Content */}{" "}
        <div className="flex-1 overflow-y-auto p-6" dir="rtl">
          {" "}
          {loading ? <div className="text-center py-10">جاري التحميل...</div> : view === "list" ? <div className="space-y-4">
              {" "}
              <div className="flex justify-between items-center">
                {" "}
                <button onClick={handleNew} className="bg-[#2563EB] text-white px-4 py-2 rounded text-sm flex items-center gap-2">
                  {" "}
                  <Plus className="w-4 h-4" /> جديد{" "}
                </button>{" "}
              </div>{" "}
              <table className="w-full text-right text-sm border border-slate-200">
                {" "}
                <thead className="bg-slate-50 font-bold text-slate-700">
                  {" "}
                  <tr>
                    {" "}
                    <th className="px-4 py-2 border-b">الوحدة</th>{" "}
                    <th className="px-4 py-2 border-b">الفئة</th>{" "}
                    <th className="px-4 py-2 border-b">النوع</th>{" "}
                    <th className="px-4 py-2 border-b">المعامل</th>{" "}
                    <th className="px-4 py-2 border-b w-[100px]"></th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {uomList.map(uom => <tr key={uom.id} className="hover:bg-slate-50 border-b last:border-0 group">
                      {" "}
                      <td className="px-4 py-2 font-medium">{uom.name}</td>{" "}
                      <td className="px-4 py-2">{uom.category?.name}</td>{" "}
                      <td className="px-4 py-2">
                        {" "}
                        {uom.type === "reference" ? "مرجع" : uom.type === "bigger" ? "أكبر" : "أصغر"}{" "}
                      </td>{" "}
                      <td className="px-4 py-2">{uom.ratio}</td>{" "}
                      <td className="px-4 py-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {" "}
                        <button onClick={() => handleEdit(uom)} className="text-slate-500 hover:text-[#2563EB]">
                          {" "}
                          <Edit className="w-4 h-4" />{" "}
                        </button>{" "}
                        <button onClick={() => handleDelete(uom.id)} className="text-slate-500 hover:text-red-600">
                          {" "}
                          <Trash2 className="w-4 h-4" />{" "}
                        </button>{" "}
                      </td>{" "}
                    </tr>)}{" "}
                </tbody>{" "}
              </table>{" "}
            </div> : <div className="space-y-6 max-w-lg mx-auto">
              {" "}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                {" "}
                <label className="font-bold text-slate-700">
                  اسم الوحدة
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register("name", {
              required: true
            })} className="border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 bg-transparent" placeholder="مثال: دزينة" />{" "}
              </div>{" "}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                {" "}
                <label className="font-bold text-slate-700">الفئة</label>{" "}
                <Controller name="categoryId" control={control} rules={{
              required: true
            }} render={({
              field
            }) => <OdooCombobox options={categories.map(c => ({
              value: c.id,
              label: c.name
            }))} value={field.value} onChange={field.onChange} onCreate={handleCreateCategory} placeholder="اختر فئة..." />} />{" "}
              </div>{" "}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                {" "}
                <label className="font-bold text-slate-700">النوع</label>{" "}
                <select {...register("type")} className="border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 bg-transparent">
                  {" "}
                  <option value="reference">وحدة مرجعية</option>{" "}
                  <option value="bigger">أكبر من الوحدة المرجعية</option>{" "}
                  <option value="smaller">أصغر من الوحدة المرجعية</option>{" "}
                </select>{" "}
              </div>{" "}
              {type !== "reference" && <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                  {" "}
                  <label className="font-bold text-slate-700">
                    المعامل (النسبة)
                  </label>{" "}
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" step="0.0001" {...register("ratio", {
              valueAsNumber: true,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = convertArabicToEnglishNumbers(e.target.value);
                setValue("ratio", val ? parseFloat(val) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }
            })} className="border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 bg-transparent" />{" "}
                </div>}{" "}
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                {" "}
                <label className="font-bold text-slate-700">
                  دقة التقريب
                </label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" step="0.001" {...register("rounding", {
              valueAsNumber: true,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = convertArabicToEnglishNumbers(e.target.value);
                setValue("rounding", val ? parseFloat(val) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }
            })} className="border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 bg-transparent" />{" "}
              </div>{" "}
            </div>}{" "}
        </div>{" "}
        {/* Footer */}{" "}
        <div className="p-4 bg-slate-50 border-t flex justify-start gap-2 rounded-b-sm" dir="rtl">
          {" "}
          {view === "form" ? <>
              {" "}
              <button onClick={handleSubmit(onSubmit)} className="bg-[#2563EB] text-white px-6 py-2 rounded text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
                {" "}
                حفظ{" "}
              </button>{" "}
              <button onClick={() => setView("list")} className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded text-sm shadow-sm hover:bg-slate-50 transition-colors">
                {" "}
                إلغاء{" "}
              </button>{" "}
            </> : <button onClick={onClose} className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded text-sm shadow-sm hover:bg-slate-50 transition-colors">
              {" "}
              إغلاق{" "}
            </button>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}