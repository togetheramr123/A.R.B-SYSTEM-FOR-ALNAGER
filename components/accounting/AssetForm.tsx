'use client';
import React from "react";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { createAsset, updateAsset, computeDepreciation, postAssetLine } from '@/app/actions/assets';
import { RefreshCw, CloudUpload } from 'lucide-react';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { toast } from 'sonner';
type Props = {
  initialData: any;
  categories: any[];
  locale: string;
};
export function AssetForm({
  initialData,
  categories,
  locale
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState
  } = useForm({
    defaultValues: initialData || {
      name: '',
      originalValue: 0,
      date: new Date().toISOString().split('T')[0],
      categoryId: '',
      duration: 5
    }
  });
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (!initialData?.id) {
        const newAsset = await createAsset(data);
        if (newAsset) router.push(`/${locale}/accounting/assets/${newAsset.id}`);
      } else {
        await updateAsset(initialData.id, data);
        reset(data);
      }
      router.refresh();
    } catch (e) {
      toast.error('خطأ في حفظ الأصل');
    } finally {
      setLoading(false);
    }
  };
  const handleCompute = async () => {
    setLoading(true);
    try {
      await computeDepreciation(initialData.id);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  const handlePostLine = async (lineId: string) => {
    if (confirm('هل أنت متأكد من ترحيل قيد الإهلاك؟')) {
      setLoading(true);
      try {
        await postAssetLine(lineId);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
  };
  const state = initialData?.state || 'draft';
  const { isDirty } = formState;

  return <div className="bg-white border border-slate-300 shadow-sm w-full max-w-5xl rounded-sm min-h-[600px] relative"> <div className="border-b border-slate-200 p-3 flex justify-between items-center bg-white sticky top-0 z-10"> <div className="flex gap-2"> {(!initialData?.id || isDirty) && <button onClick={handleSubmit(onSubmit)} disabled={loading} title="حفظ" className="p-1.5 text-slate-400 hover:text-[#017E84] rounded-sm hover:bg-[#017E84]/10 transition-colors"> <CloudUpload className="w-5 h-5" /> </button>} {initialData?.id && state !== 'closed' && <button onClick={handleCompute} disabled={loading} className="bg-teal-600 text-white px-3 py-1.5 rounded-sm hover:bg-teal-700 text-sm font-medium flex items-center gap-2"> <RefreshCw className="w-4 h-4" /> حساب الإهلاك </button>} </div> {} <div className="flex bg-white border border-slate-300 rounded-sm overflow-hidden text-xs font-bold"> <div className={`px-3 py-1.5 ${state === 'draft' ? 'bg-[#017E84] text-white' : 'bg-slate-50 text-slate-500'}`}>مسودة</div> <div className={`px-3 py-1.5 ${state === 'open' ? 'bg-[#017E84] text-white' : 'bg-slate-50 text-slate-500 border-r'}`}>جاري</div> <div className={`px-3 py-1.5 ${state === 'closed' ? 'bg-[#017E84] text-white' : 'bg-slate-50 text-slate-500 border-r'}`}>مغلق</div> </div> </div> <div className="p-8"> <div className="flex justify-between items-start mb-8"> <div> <h1 className="text-2xl font-bold text-slate-800 mb-2"> {initialData?.name || 'أصل جديد'} </h1> </div> </div> <div className="grid grid-cols-2 gap-12 mb-8"> <div className="space-y-6"> <div> <label className="block text-sm font-bold text-slate-700">اسم الأصل</label> <input type="text" {...register('name', {
              required: true
            })} disabled={state !== 'draft'} className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500" /> </div> <div> <label className="block text-sm font-bold text-slate-700">الفئة</label> <select {...register('categoryId')} disabled={state !== 'draft'} className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500"> <option value="">(اختر الفئة)</option> {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} </select> </div> <div> <label className="block text-sm font-bold text-slate-700">القيمة الأصلية</label> <input type="number" {...register('originalValue', {
              required: true,
              valueAsNumber: true,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = convertArabicToEnglishNumbers(e.target.value);
                setValue('originalValue', val ? parseFloat(val) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }
            })} disabled={state !== 'draft'} className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500" /> </div> </div> <div className="space-y-6"> <div> <label className="block text-sm font-bold text-slate-700">تاريخ الشراء</label> <input type="date" {...register('date')} disabled={state !== 'draft'} className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500" /> </div> <div> <label className="block text-sm font-bold text-slate-700">مدة الإهلاك (سنوات)</label> <input type="number" {...register('duration', {
              valueAsNumber: true,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                const val = convertArabicToEnglishNumbers(e.target.value);
                setValue('duration', val ? parseInt(val) : 0, {
                  shouldValidate: true,
                  shouldDirty: true
                });
              }
            })} disabled={state !== 'draft'} className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500" /> </div> </div> </div> {} {initialData?.details && initialData.details.length > 0 && <div className="mt-8"> <h3 className="text-lg font-bold text-slate-800 mb-4">جدول الإهلاك (Depreciation Board)</h3> <table className="w-full text-right text-sm border-t border-slate-200"> <thead className="bg-slate-50 text-slate-500 font-medium"> <tr> <th className="py-2 px-2">التاريخ</th> <th className="py-2 px-2">مبلغ الإهلاك</th> <th className="py-2 px-2">الإهلاك المتراكم</th> <th className="py-2 px-2">القيمة المتبقية</th> <th className="py-2 px-2">قيد اليومية</th> <th className="py-2 px-2">إجراء</th> </tr> </thead> <tbody className="divide-y divide-slate-100"> {initialData.details.map((line: any) => <tr key={line.id}> <td className="py-2 px-2">{new Date(line.date).toLocaleDateString()}</td> <td className="py-2 px-2">{line.amount.toLocaleString()}</td> <td className="py-2 px-2">{line.depreciated.toLocaleString()}</td> <td className="py-2 px-2">{line.remaining > 0 ? line.remaining.toLocaleString() : '0'}</td> <td className="py-2 px-2"> {line.move ? <span className="text-[#017E84] font-mono">{line.move.name}</span> : '-'} </td> <td className="py-2 px-2"> {!line.posted && <button onClick={() => handlePostLine(line.id)} className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs hover:bg-orange-600"> ترحيل القيد </button>} {line.posted && <span className="text-green-600 text-xs font-bold">تم الترحيل</span>} </td> </tr>)} </tbody> </table> </div>} </div> </div>;
}