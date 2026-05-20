"use client";

import { useState } from "react";
import { applyInventoryAdjustment } from "@/app/actions/inventory";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, Plus, Save, X, History, Check, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import NotifyButton from "@/components/common/NotifyButton";
interface QuantData {
  id: string;
  locationId: string;
  locationName: string;
  productName: string;
  onHand: number;
  uom: string;
  countedQty: number | null;
}
export function ProductQuantsClient({
  initialData,
  productId,
  productName
}: {
  initialData: QuantData[];
  productId: string;
  productName: string;
}) {
  const [quants, setQuants] = useState<QuantData[]>(initialData);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({});
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    location: true,
    product: true,
    lastCountDate: true,
    onHand: true,
    qtyInHand: true,
    countedQty: true,
    uom: true,
    accountingDate: false,
    diff: true
  });
  const router = useRouter();
  const handleCountChange = (id: string, value: string) => {
    setQuants(prev => prev.map(q => {
      if (q.id === id) {
        return {
          ...q,
          countedQty: value === "" ? null : Number(value)
        };
      }
      return q;
    }));
  };
  const handleAssign = (id: string, onHand: number) => {
    setQuants(prev => prev.map(q => q.id === id ? {
      ...q,
      countedQty: onHand
    } : q));
    setEditingRows(prev => ({
      ...prev,
      [id]: true
    }));
  };
  const handleClear = (id: string) => {
    setQuants(prev => prev.map(q => q.id === id ? {
      ...q,
      countedQty: null
    } : q));
    setEditingRows(prev => ({
      ...prev,
      [id]: false
    }));
  };
  const handleApply = async (id: string) => {
    const quant = quants.find(q => q.id === id);
    if (!quant || quant.countedQty === null) return;
    setLoadingMap(prev => ({
      ...prev,
      [id]: true
    }));
    try {
      const res = await applyInventoryAdjustment(id, quant.countedQty);
      if ("error" in res && res.error) throw new Error(res.error as string);
      toast.success("تم تحديث الكمية بنجاح وتسجيل قيد اليومية");
      setQuants(prev => prev.map(q => {
        if (q.id === id) {
          return {
            ...q,
            onHand: quant.countedQty as number,
            countedQty: null
          };
        }
        return q;
      }));
      setEditingRows(prev => ({
        ...prev,
        [id]: false
      }));
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء التحديث");
    } finally {
      setLoadingMap(prev => ({
        ...prev,
        [id]: false
      }));
    }
  };
  const hasAnyEdits = Object.values(editingRows).some(Boolean);
  return <div className="flex flex-col h-full bg-white rounded shadow-sm border border-slate-200 text-sm rtl" dir="rtl">
      {" "}
      {/* Odoo Style Top Bar */}{" "}
      <div className="p-3 border-b border-slate-200 flex flex-col gap-3">
        {" "}
        <div className="flex justify-between items-center">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            {hasAnyEdits ? <>
                {" "}
                <button className="bg-[#017E84] hover:bg-[#006A6F] text-white px-3 py-1.5 rounded-sm font-medium transition-colors shadow-sm text-[13px]">
                  {" "}
                  حفظ{" "}
                </button>{" "}
                <button className="text-slate-600 hover:text-slate-800 px-3 py-1.5 rounded-sm font-medium transition-colors text-[13px]" onClick={() => {
              setEditingRows({});
              setQuants(initialData);
            }}>
                  {" "}
                  تجاهل{" "}
                </button>{" "}
              </> : <>
                {" "}
                <button className="bg-[#017E84] hover:bg-[#006A6F] text-white px-3 py-1.5 rounded-sm font-medium transition-colors shadow-sm text-[13px]">
                  {" "}
                  جديد{" "}
                </button>{" "}
                <button className="text-[#017E84] font-medium text-[13px] hover:bg-slate-50 px-2 py-1.5 rounded-sm transition-colors">
                  {" "}
                  تطبيق الكل{" "}
                </button>{" "}
                <NotifyButton resourceModel="Product" resourceId={productId} resourceName={productName} />{" "}
              </>}{" "}
          </div>{" "}
          <div className="flex items-center gap-2 relative">
            {" "}
            <div className="relative">
              {" "}
              <button onClick={() => setShowColumnsMenu(!showColumnsMenu)} className="text-slate-500 hover:text-slate-800 p-1.5 rounded transition-colors">
                {" "}
                <SlidersHorizontal className="w-4 h-4" />{" "}
              </button>{" "}
              {showColumnsMenu && <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-sm rounded-sm py-1.5 w-56 z-50">
                  {" "}
                  {[{
                id: "location",
                label: "الموقع",
                hiddenToggle: true
              }, {
                id: "product",
                label: "المنتج"
              }, {
                id: "lastCountDate",
                label: "تاريخ آخر احتساب"
              }, {
                id: "onHand",
                label: "الكمية المتوفرة"
              }, {
                id: "qtyInHand",
                label: "الكمية في اليد"
              }, {
                id: "countedQty",
                label: "حساب الكمية بالوحدة",
                hiddenToggle: true
              }, {
                id: "uom",
                label: "وحدة القياس",
                hiddenToggle: true
              }, {
                id: "accountingDate",
                label: "تاريخ المحاسبة"
              }, {
                id: "diff",
                label: "الفرق",
                hiddenToggle: true
              }].map(col => {
                if (col.hiddenToggle) return null;
                return <label key={col.id} className="flex items-center gap-2 px-4 py-1.5 hover:bg-slate-50 cursor-pointer">
                        {" "}
                        <input type="checkbox" checked={visibleColumns[col.id as keyof typeof visibleColumns]} onChange={e => setVisibleColumns(prev => ({
                    ...prev,
                    [col.id]: e.target.checked
                  }))} className="rounded border-slate-300 text-[#017E84] focus:ring-[#017E84]" />{" "}
                        <span className="text-[13px] text-slate-700">
                          {col.label}
                        </span>{" "}
                      </label>;
              })}{" "}
                </div>}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Odoo Style Table */}{" "}
      <div className="overflow-x-auto min-h-[400px]">
        {" "}
        <table className="w-full text-right whitespace-nowrap">
          {" "}
          <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
            {" "}
            <tr>
              {" "}
              <th className="px-3 py-2.5 font-bold w-10 text-center">
                {" "}
                <input type="checkbox" className="rounded border-slate-300 text-[#017E84] focus:ring-[#017E84]" />{" "}
              </th>{" "}
              <th className="px-3 py-2.5 font-bold">الموقع</th>{" "}
              {visibleColumns.product && <th className="px-3 py-2.5 font-bold">المنتج</th>}{" "}
              {visibleColumns.lastCountDate && <th className="px-3 py-2.5 font-bold">تاريخ آخر احتساب</th>}{" "}
              {visibleColumns.onHand && <th className="px-3 py-2.5 font-bold text-left">
                  الكمية المتوفرة
                </th>}{" "}
              {visibleColumns.qtyInHand && <th className="px-3 py-2.5 font-bold text-left">
                  الكمية في اليد
                </th>}{" "}
              <th className="px-3 py-2.5 font-bold text-left w-40">
                حساب الكمية بالوحدة
              </th>{" "}
              <th className="px-3 py-2.5 font-bold">وحدة القياس</th>{" "}
              {visibleColumns.accountingDate && <th className="px-3 py-2.5 font-bold">تاريخ المحاسبة</th>}{" "}
              <th className="px-3 py-2.5 font-bold text-left">الفرق</th>{" "}
              <th className="px-3 py-2.5 font-bold text-left w-64"></th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {quants.length === 0 ? <tr>
                {" "}
                <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                  لا توجد مواقع مسجلة لهذا المنتج
                </td>{" "}
              </tr> : quants.map(quant => {
            const isEditing = editingRows[quant.id];
            const diff = quant.countedQty !== null ? quant.countedQty - quant.onHand : 0;
            const isRowLoading = loadingMap[quant.id];
            return <tr key={quant.id} className="hover:bg-slate-50/50 transition-colors group h-10">
                    {" "}
                    <td className="px-3 py-1.5 text-center">
                      {" "}
                      <input type="checkbox" className="rounded border-slate-300 text-[#017E84] focus:ring-[#017E84] opacity-0 group-hover:opacity-100 transition-opacity" />{" "}
                    </td>{" "}
                    <td className="px-3 py-1.5 text-slate-800 font-medium">
                      {quant.locationName}
                    </td>{" "}
                    {visibleColumns.product && <td className="px-3 py-1.5 text-slate-700 truncate max-w-[200px]">
                        {productName}
                      </td>}{" "}
                    {visibleColumns.lastCountDate && <td className="px-3 py-1.5 text-slate-500"></td>}{" "}
                    {visibleColumns.onHand && <td className="px-3 py-1.5 text-left text-slate-700" dir="ltr">
                        {quant.onHand.toFixed(3)}
                      </td>}{" "}
                    {visibleColumns.qtyInHand && <td className="px-3 py-1.5 text-left text-slate-700" dir="ltr">
                        {quant.onHand.toFixed(3)}
                      </td>}{" "}
                    <td className="px-3 py-1 text-left relative">
                      {" "}
                      {isEditing ? <input type="number" className="w-full bg-fuchsia-50/50 border border-fuchsia-300 text-fuchsia-800 rounded-sm px-2 py-1 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 text-left font-medium" dir="ltr" value={quant.countedQty !== null ? quant.countedQty : ""} onChange={e => handleCountChange(quant.id, e.target.value)} disabled={isRowLoading} autoFocus /> : <div className="w-full px-2 py-1 text-left cursor-pointer hover:bg-slate-100 rounded border border-transparent hover:border-slate-300 transition-colors min-h-[28px]" onClick={() => handleAssign(quant.id, quant.onHand)}>
                          {" "}
                          {quant.countedQty !== null ? quant.countedQty.toFixed(3) : ""}{" "}
                        </div>}{" "}
                      {isRowLoading && <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-fuchsia-600" />}{" "}
                    </td>{" "}
                    <td className="px-3 py-1.5 text-slate-600">{quant.uom}</td>{" "}
                    {visibleColumns.accountingDate && <td className="px-3 py-1.5 text-slate-500"></td>}{" "}
                    <td className="px-3 py-1.5 text-left font-medium" dir="ltr">
                      {" "}
                      {isEditing && quant.countedQty !== null ? <span className={diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-slate-400"}>
                          {" "}
                          {diff > 0 ? "+" : ""}
                          {diff.toFixed(2)}{" "}
                        </span> : <span className="text-slate-400">0.00</span>}{" "}
                    </td>{" "}
                    <td className="px-3 py-1.5 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {" "}
                      <button className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[13px] font-medium">
                        {" "}
                        <History className="w-3.5 h-3.5" /> السجل{" "}
                      </button>{" "}
                      {isEditing ? <>
                          {" "}
                          <button onClick={() => handleApply(quant.id)} disabled={isRowLoading} className="text-[#017E84] hover:text-[#006A6F] flex items-center gap-1 text-[13px] font-medium">
                            {" "}
                            <Check className="w-3.5 h-3.5" /> تطبيق{" "}
                          </button>{" "}
                          <button onClick={() => handleClear(quant.id)} disabled={isRowLoading} className="text-slate-500 hover:text-red-600 flex items-center gap-1 text-[13px] font-medium">
                            {" "}
                            <X className="w-3.5 h-3.5" /> مسح{" "}
                          </button>{" "}
                        </> : <button onClick={() => handleAssign(quant.id, quant.onHand)} className="text-[#017E84] hover:text-[#006A6F] text-[13px] font-medium flex items-center gap-1">
                          {" "}
                          <div className="w-4 h-4 border border-current rounded-full flex items-center justify-center text-[10px]">
                            !
                          </div>{" "}
                          تعيين{" "}
                        </button>}{" "}
                    </td>{" "}
                  </tr>;
          })}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}