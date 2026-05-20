'use client';
import React from "react";

import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FileUploadArea } from '../common/FileUploadArea';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { toast } from 'sonner';
type Props = {
  type: string;
};
export function StockOperationForm({
  type
}: Props) {
  const t = useTranslations('Inventory');
  const tCommon = useTranslations('Common');
  const [status, setStatus] = useState('draft');
  const {
    register,
    control,
    handleSubmit,
    setValue
  } = useForm({
    defaultValues: {
      source: '',
      destination: '',
      lines: [{
        productId: '',
        qty: 1
      }]
    }
  });
  const {
    fields,
    append,
    remove
  } = useFieldArray({
    control,
    name: "lines"
  });
  const onSubmit = (data: any) => {
    console.log(data);
    setStatus('confirmed');
    toast.success("تم حفظ العملية!");
  };
  const onValidate = () => {
    setStatus('done');
    toast.success("تم اعتماد المخزون! (محاكاة)");
  };
  const isReceipt = type === 'receipts';
  const sourceLabel = isReceipt ? 'المورد (Vendor)' : 'من (Source)';
  const destLabel = isReceipt ? 'إلى (Destination)' : 'العميل (Customer)';
  return <div className="space-y-6"> {} <div className="bg-white p-4 rounded-sm shadow-sm border border-slate-200 flex justify-between items-center"> <div className="flex gap-2"> {status === 'draft' && <button onClick={handleSubmit(onSubmit)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"> {t('markAsTodo')} </button>} {status === 'confirmed' && <button onClick={onValidate} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"> <Check className="w-4 h-4" /> {t('validate')} </button>} </div> <div className="flex gap-1 bg-slate-100 p-1 rounded-lg"> {['draft', 'confirmed', 'done'].map(s => <span key={s} className={`px-3 py-1 rounded text-sm font-medium ${status === s ? 'bg-white shadow text-blue-700' : 'text-slate-500'}`}> {t(s)} </span>)} </div> </div> {} <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-200"> <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"> <div> <label className="block text-sm font-medium text-slate-700 mb-2">{sourceLabel}</label> <input {...register('source')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" placeholder={isReceipt ? 'اختر المورد...' : ''} /> </div> <div> <label className="block text-sm font-medium text-slate-700 mb-2">{destLabel}</label> <input {...register('destination')} className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value="WH/Stock" readOnly={isReceipt} /> </div> </div> {} <div className="space-y-4"> <h3 className="font-bold text-slate-800 border-b pb-2">{t('products')}</h3> <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden"> <div className="grid grid-cols-12 gap-4 p-3 bg-slate-100 text-sm font-medium text-slate-600"> <div className="col-span-6">{t('product')}</div> <div className="col-span-3">{t('demand')}</div> <div className="col-span-1"></div> </div> <div className="divide-y divide-slate-200"> {fields.map((field, index) => <div key={field.id} className="grid grid-cols-12 gap-4 p-3 items-center"> <div className="col-span-6"> <input {...register(`lines.${index}.productId`)} className="w-full p-2 rounded border border-slate-300 focus:border-blue-500 outline-none" placeholder="بحث عن منتج..." /> </div> <div className="col-span-3"> <input type="number" {...register(`lines.${index}.qty`, {
                  valueAsNumber: true,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = convertArabicToEnglishNumbers(e.target.value);
                    setValue(`lines.${index}.qty`, val ? parseFloat(val) : 0, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                })} className="w-full p-2 rounded border border-slate-300 focus:border-blue-500 outline-none" /> </div> <div className="col-span-1 text-center"> <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600"> <Trash2 className="w-4 h-4" /> </button> </div> </div>)} </div> </div> <button type="button" onClick={() => append({
          productId: '',
          qty: 1
        })} className="text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"> <Plus className="w-4 h-4" /> {t('addLine')} </button> </div> </div> </div>;
}