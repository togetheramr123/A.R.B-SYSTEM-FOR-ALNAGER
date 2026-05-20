'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchProductsForAdjustment, updateAdjustmentLine, validateInventoryAdjustment } from '@/app/actions/inventory-adjustments';
import { toast } from 'sonner';
import { Loader2, DownloadCloud, CheckCircle, Lock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
export function AdjustmentDetailClient({
  initialData,
  categories,
  locale
}: {
  initialData: any;
  categories: any[];
  locale: string;
}) {
  const router = useRouter();
  const [record, setRecord] = useState(initialData);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const isLocked = record.status === 'locked';
  const isGracePeriod = record.status === 'active';
  const canEdit = record.status === 'draft' || isGracePeriod;
  const [loadingLines, setLoadingLines] = useState<Record<string, boolean>>({});
  const handleFetchProducts = async () => {
    setIsFetching(true);
    try {
      await fetchProductsForAdjustment(record.id, selectedCategory || undefined);
      toast.success("تم استدعاء الأصناف بنجاح");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء استدعاء الأصناف");
    } finally {
      setIsFetching(false);
    }
  };
  const handleActualQtyChange = async (lineId: string, value: string) => {
    if (!canEdit) return;
    const numValue = value === '' ? 0 : Number(value);
    setRecord((prev: any) => ({
      ...prev,
      lines: prev.lines.map((l: any) => {
        if (l.id === lineId) {
          return {
            ...l,
            actualQty: numValue,
            diffQty: numValue - Number(l.bookQty)
          };
        }
        return l;
      })
    }));
    setLoadingLines(prev => ({
      ...prev,
      [lineId]: true
    }));
    try {
      await updateAdjustmentLine(lineId, numValue);
    } catch (e: any) {
      toast.error(e.message || "فشل تحديث الكمية");
      router.refresh();
    } finally {
      setLoadingLines(prev => ({
        ...prev,
        [lineId]: false
      }));
    }
  };
  const handleValidate = async () => {
    setIsValidating(true);
    try {
      await validateInventoryAdjustment(record.id);
      toast.success("تم اعتماد محضر الجرد وتحديث المخزون والقيود المحاسبية بنجاح!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "فشل اعتماد المحضر");
    } finally {
      setIsValidating(false);
    }
  };

  const totalLines = record.lines.length;
  const totalChanged = record.lines.filter((l: any) => Number(l.diffQty) !== 0).length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[#017E84]">{record.name}</h1>
          {record.status === 'draft' && <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">مسودة</span>}
          {isGracePeriod && <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5"><RefreshCw className="w-4 h-4 animate-spin-slow" /> مهلة التعديل جارية (1 ساعة)</span>}
          {isLocked && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5"><Lock className="w-4 h-4" /> مقفل</span>}
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border border-slate-300 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:border-[#017E84]">
                <option value="">كل الفئات</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={handleFetchProducts} disabled={isFetching} className="bg-white border border-[#017E84] text-[#017E84] px-4 py-1.5 rounded-sm font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
                {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />} استدعاء المنتجات
              </button>
            </>
          )}
          {record.status === 'draft' && totalLines > 0 && (
            <button onClick={handleValidate} disabled={isValidating} className="bg-[#017E84] text-white px-6 py-1.5 rounded-sm font-bold text-sm flex items-center gap-2 hover:bg-[#006A6F] transition-colors">
              {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} اعتماد (تطبيق الجرد)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm">
          <div className="text-slate-500 text-sm font-medium">إجمالي المنتجات بالمحضر</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{totalLines}</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-sm shadow-sm">
          <div className="text-slate-500 text-sm font-medium">منتجات تم تعديلها</div>
          <div className="text-2xl font-bold text-fuchsia-600 mt-1">{totalChanged}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-right font-bold">المنتج</th>
              <th className="px-4 py-3 text-right font-bold">الموقع</th>
              <th className="px-4 py-3 text-right font-bold">الكمية الدفترية</th>
              <th className="px-4 py-3 text-right font-bold w-40">الكمية الفعلية</th>
              <th className="px-4 py-3 text-center font-bold">العجز / الزيادة</th>
              <th className="px-4 py-3 text-right font-bold">الوحدة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {record.lines.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  لا توجد منتجات. قم باستدعاء المنتجات للبدء بالجرد.
                </td>
              </tr>
            ) : record.lines.map((line: any) => {
              const isChanged = Number(line.diffQty) !== 0;
              return (
                <tr key={line.id} className={cn("transition-colors", isChanged ? "bg-fuchsia-50/30" : "hover:bg-slate-50")}>
                  <td className="px-4 py-3 font-medium text-slate-800">{line.product?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{line.location?.name}</td>
                  <td className="px-4 py-3 font-bold text-slate-700" dir="ltr">{Number(line.bookQty).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="relative flex items-center">
                      <input type="number" disabled={!canEdit} className={cn("w-full border rounded-sm px-2 py-1.5 focus:outline-none focus:ring-1 text-left font-bold transition-colors", isChanged ? "border-fuchsia-400 focus:border-fuchsia-500 focus:ring-fuchsia-500 text-fuchsia-700 bg-white" : "border-slate-300 focus:border-[#017E84] focus:ring-[#017E84]", !canEdit && "bg-slate-100 cursor-not-allowed opacity-80")} dir="ltr" value={line.actualQty} onChange={e => handleActualQtyChange(line.id, e.target.value)} />
                      {loadingLines[line.id] && <Loader2 className="w-3 h-3 animate-spin text-slate-400 absolute left-2" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold" dir="ltr">
                    <span className={cn("inline-block min-w-[60px] text-center rounded-full px-2 py-0.5 text-xs", Number(line.diffQty) > 0 ? "bg-green-100 text-green-700" : Number(line.diffQty) < 0 ? "bg-red-100 text-red-700" : "text-slate-400")}>
                      {Number(line.diffQty) > 0 ? '+' : ''}{Number(line.diffQty).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{line.uom}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}