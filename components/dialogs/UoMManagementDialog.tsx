import React, { useState, useEffect } from "react";
import { X, Save, HelpCircle, ExternalLink, Plus, Trash2, ChevronRight } from "lucide-react";
import { createUom, updateUom, deleteUom } from "@/app/actions/inventory";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
import { toast } from "sonner";
/* In a real app, this would be a server action or API call. For this demo, we'll pass the new UoM back to the parent. */
interface UoMFormData {
  name: string;
  categoryId: string;
  type: "reference" | "bigger" | "smaller";
  ratio: number;
  rounding: number;
}
export interface UoM {
  id: string;
  name: string;
  categoryId?: string;
  type: "reference" | "bigger" | "smaller";
  ratio: number;
  rounding: number;
  active: boolean;
}
interface UoMManagementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (uom: any) => void;
  initialName?: string; /* New props for state management units: UoM[]; uomCategories?: any[]; */
}
export function UoMManagementDialog({
  isOpen,
  onClose,
  onSave,
  initialName = "",
  units,
  uomCategories = []
}: UoMManagementDialogProps) {
  /* State for Global Save */const [draftUnits, setDraftUnits] = useState<UoM[]>([]);
  const [deletedUnitIds, setDeletedUnitIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  
  const isDirty = React.useMemo(() => {
    if (deletedUnitIds.size > 0) return true;
    if (draftUnits.length !== units.length) return true;
    for (let i = 0; i < draftUnits.length; i++) {
      const d = draftUnits[i];
      const u = units.find(unit => unit.id === d.id);
      if (!u || d.name !== u.name || String(d.ratio) !== String(u.ratio) || String(d.rounding) !== String(u.rounding) || d.active !== u.active || d.type !== u.type) {
        return true;
      }
    }
    return false;
  }, [draftUnits, deletedUnitIds, units]);

  useEffect(() => {
    if (isOpen) {
      if (initialName && !units.some(u => u.name.toLowerCase() === initialName.toLowerCase())) {
        const newId = `new_${Date.now()}`;
        setDraftUnits([...units, {
          id: newId,
          name: initialName,
          categoryId: uomCategories[0]?.id || "",
          type: "bigger",
          ratio: 1.0,
          rounding: 0.01,
          active: true
        }]);
      } else {
        setDraftUnits(units);
      }
      setDeletedUnitIds(new Set());
    }
  }, [isOpen, units, initialName, uomCategories]);
  const handleAddLineClick = () => {
    const newId = `new_${Date.now()}`;
    setDraftUnits([...draftUnits, {
      id: newId,
      name: "",
      categoryId: uomCategories[0]?.id || "",
      type: "bigger",
      ratio: 1.0,
      rounding: 0.01,
      active: true
    }]);
  };
  const handleUpdateDraft = (id: string, field: keyof UoM, value: any) => {
    setDraftUnits(draftUnits.map(u => u.id === id ? {
      ...u,
      [field]: value
    } : u));
  };
  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id.startsWith("new_")) {
      setDeletedUnitIds(prev => new Set(prev).add(id));
    }
    setDraftUnits(draftUnits.filter(u => u.id !== id));
  };
  const handleGlobalSave = async () => {
    setIsSaving(true);
    let hasErrors = false;
    try {
      /* 1. Delete removed items */for (const id of Array.from(deletedUnitIds)) {
        try {
          await deleteUom(id);
        } catch (err) {
          hasErrors = true;
          toast.error("لا يمكن حذف الوحدة لأنها قيد الاستخدام");
        }
      }
      /* 2. Add or Update existing items */
      for (const draft of draftUnits) {
        const processedDraft = {
          ...draft
        };
        if (draft.id.startsWith("new_")) {
          if (draft.name.trim()) await createUom({
            ...processedDraft,
            ratio: parseInt(processedDraft.ratio as any, 10) || 1,
            rounding: parseFloat(processedDraft.rounding as any) || 0.01
          } as any);
        } else {
          const original = units.find(u => u.id === draft.id);
          if (original && JSON.stringify(original) !== JSON.stringify(draft)) {
            await updateUom(processedDraft.id, {
              ...processedDraft,
              ratio: parseInt(processedDraft.ratio as any, 10) || 1,
              rounding: parseFloat(processedDraft.rounding as any) || 0.01
            } as any);
          }
        }
      }
      /* Trigger refresh/re-selection in parent */
      if (!hasErrors) {
        onSave({});
      }
    } catch (e) {
      console.error("Save error", e);
      toast.error("حدث خطأ أثناء حفظ التعديلات");
    } finally {
      setIsSaving(false);
    }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {" "}
      <div className="bg-white shadow-2xl w-full h-full sm:w-[98vw] sm:h-[98vh] sm:rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col" dir="rtl">
        {" "}
        {/* Odoo-style Header */}{" "}
        <div className="bg-white border-b border-[#dadce0] px-4 py-2 flex justify-between items-center shadow-sm shrink-0">
          {" "}
          <div className="flex flex-col">
            {" "}
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              {" "}
              <span>AR</span> <span>/</span>{" "}
              <span className="hover:underline cursor-pointer">
                فئات وحدات القياس
              </span>{" "}
              <span>/</span>{" "}
              <span className="text-[#2563EB] font-bold">الوحدة</span>{" "}
            </div>{" "}
            <h3 className="text-xl font-normal text-slate-800">
              وحدات القياس
            </h3>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
              {" "}
              <X className="w-5 h-5" />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Control Panel / Search (Visual) */}{" "}
        <div className="px-4 py-2 border-b border-[#dadce0] flex justify-between items-center bg-slate-50/50 shrink-0">
          {" "}
          <div className="flex gap-2 min-h-[32px]">
            {" "}
            {isDirty && (
              <>
                <button onClick={handleGlobalSave} disabled={isSaving} className="bg-[#00a09d] text-white hover:bg-[#008784] px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm disabled:opacity-50">
                  {" "}
                  {isSaving ? "جارِ الحفظ..." : "حفظ التعديلات"}{" "}
                </button>{" "}
                <button onClick={() => {
                  setDraftUnits(units);
                  setDeletedUnitIds(new Set());
                }} className="bg-white border border-[#dadce0] hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm">
                  {" "}
                  تجاهل{" "}
                </button>{" "}
              </>
            )}
          </div>{" "}
          <div className="relative w-64">
            {" "}
            <input type="text" placeholder="بحث..." className="w-full border-b border-slate-300 bg-transparent py-1 text-sm outline-none focus:border-[#2563EB]" />{" "}
          </div>{" "}
        </div>{" "}
        {/* Body - LIST VIEW WITH INLINE EDIT */}{" "}
        {/* Body - LIST VIEW WITH INLINE EDIT */}{" "}
        <div className="flex-1 overflow-auto bg-white p-4">
          {" "}
          {/* Breadcrumb Context Title inside body */}{" "}
          <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm">
            {" "}
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />{" "}
            <span>
              {draftUnits.length} / {draftUnits.length}
            </span>{" "}
          </div>{" "}
          {/* Table */}{" "}
          <div className="border border-[#dadce0] rounded-sm overflow-hidden">
            {" "}
            <table className="w-full text-right text-sm">
              {" "}
              <thead className="bg-white text-slate-600 font-semibold text-sm border-b-2 border-slate-200">
                {" "}
                <tr>
                  {" "}
                  <th className="w-10 px-3 py-2"></th>{" "}
                  <th className="px-3 py-2 text-right">
                    {" "}
                    وحدة القياس{" "}
                  </th>{" "}
                  <th className="px-3 py-2 text-right">
                    {" "}
                    النوع{" "}
                  </th>{" "}
                  <th className="px-3 py-2 text-center">
                    {" "}
                    النسبة{" "}
                  </th>{" "}
                  <th className="px-3 py-2 text-center">
                    نشط
                  </th>{" "}
                  <th className="px-3 py-2 text-center">
                    {" "}
                    دقة التقريب{" "}
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-[#dadce0]">
                {" "}
                {draftUnits.map(u => {
                return <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                      {" "}
                      <td className="px-3 py-1.5 text-center">
                        {" "}
                        <button onClick={e => handleDelete(u.id, e)} className="text-slate-400 hover:text-slate-700 transition-colors tooltip flex items-center justify-center p-1 rounded" title="حذف">
                          {" "}
                          <Trash2 className="w-4 h-4" />{" "}
                        </button>{" "}
                      </td>{" "}
                      <td className="px-3 py-1.5">
                        {" "}
                        <input className="w-full border-b border-transparent focus:border-sky-500 bg-transparent outline-none font-semibold text-slate-800 focus:bg-white px-1 py-1" value={u.name} onChange={e => handleUpdateDraft(u.id, "name", e.target.value)} placeholder="اسم الوحدة" />{" "}
                      </td>{" "}
                      <td className="px-3 py-1.5">
                        {" "}
                        <select className="w-full border-b border-transparent focus:border-sky-500 outline-none bg-transparent focus:bg-white px-1 py-1 text-slate-700" value={u.type} onChange={e => handleUpdateDraft(u.id, "type", e.target.value)}>
                          {" "}
                          <option value="reference">
                            وحدة القياس المرجعية لهذه الفئة
                          </option>{" "}
                          <option value="bigger">أكبر من وحدة القياس المرجعية</option>{" "}
                          <option value="smaller">أصغر من وحدة القياس المرجعية</option>{" "}
                        </select>{" "}
                      </td>{" "}
                      <td className="px-3 py-1.5 text-center">
                        {" "}
                        <input type="number" step="1" className="w-24 border-b border-transparent focus:border-sky-500 bg-transparent outline-none text-center focus:bg-white px-1 py-1 font-mono dir-ltr [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-slate-700" value={u.ratio} onChange={e => {
                      const val = convertArabicToEnglishNumbers(e.target.value);
                      handleUpdateDraft(u.id, "ratio", val || "");
                    }} dir="ltr" />{" "}
                      </td>{" "}
                      <td className="px-3 py-1.5 text-center">
                        {" "}
                        <input type="checkbox" checked={u.active} onChange={e => handleUpdateDraft(u.id, "active", e.target.checked)} className="w-4 h-4 rounded-sm border-slate-300 text-[#017e84] focus:ring-[#017e84] cursor-pointer" />{" "}
                      </td>{" "}
                      <td className="px-3 py-1.5">
                        {" "}
                        <input type="number" step="0.00001" className="w-24 border-b border-transparent focus:border-sky-500 bg-transparent outline-none focus:bg-white px-1 py-1 text-center font-mono dir-ltr text-slate-700" value={u.rounding} onChange={e => {
                      const val = convertArabicToEnglishNumbers(e.target.value);
                      handleUpdateDraft(u.id, "rounding", val || "");
                    }} dir="ltr" />{" "}
                      </td>{" "}
                    </tr>;
              })}{" "}
                {/* "Add a Line" Button Row */}{" "}
                <tr className="border-t border-transparent hover:border-[#dadce0]">
                  {" "}
                  <td colSpan={6} className="px-4 py-2 text-right">
                    {" "}
                    <button onClick={handleAddLineClick} className="text-[#2563EB] hover:text-[#1d4ed8] font-medium text-sm transition-colors py-1 px-2 rounded hover:bg-blue-50/50">
                      {" "}
                      إضافة بند{" "}
                    </button>{" "}
                  </td>{" "}
                </tr>{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}