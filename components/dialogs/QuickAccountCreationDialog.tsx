'use client';

import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { getSuggestedAccountCode } from '@/app/actions/accounts';
interface QuickAccountCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    code: string;
    name: string;
    type: string;
  }) => Promise<void>;
  initialName?: string;
  initialType?: string;
}
export function QuickAccountCreationDialog({
  isOpen,
  onClose,
  onSave,
  initialName,
  initialType
}: QuickAccountCreationDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: {
      errors
    }
  } = useForm({
    defaultValues: {
      code: '',
      name: initialName || '',
      type: initialType || 'asset'
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setValue('name', initialName || '');
      setValue('type', initialType || 'asset');
      const type = initialType || 'asset';
      getSuggestedAccountCode(type).then(code => {
        setValue('code', code);
      }).catch(console.error);
    }
  }, [isOpen, initialName, initialType, setValue]);
  const selectedType = watch('type');
  useEffect(() => {
    if (isOpen && selectedType) {
      getSuggestedAccountCode(selectedType).then(code => {
        setValue('code', code);
      }).catch(console.error);
    }
  }, [selectedType]);
  const handleFormSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      await onSave(data);
      onClose();
    } catch (error) {
      console.error("Failed to create account", error);
      toast.error("فشل في إنشاء الحساب");
    } finally {
      setIsSaving(false);
    }
  };
  if (!isOpen) return null;
  Arabic;
  const typeLabels: Record<string, string> = {
    asset: 'أصول',
    asset_current: 'أصول متداولة',
    fixed_asset: 'أصول ثابتة',
    liability: 'التزامات',
    current_liability: 'التزامات متداولة',
    equity: 'حقوق الملكية',
    income: 'دخل',
    other_income: 'دخل آخر',
    expense: 'مصروفات',
    cost_of_revenue: 'تكلفة الإيرادات'
  };
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"> <div className="bg-white rounded shadow-sm w-[500px] flex flex-col" dir="rtl"> {} <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200"> <h3 className="text-lg font-bold text-slate-800"> إنشاء حساب جديد </h3> <button onClick={onClose} className="text-slate-500 hover:text-slate-800"> <X className="w-5 h-5" /> </button> </div> {} <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4"> <div className="grid grid-cols-[100px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">الكود</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('code', {
            required: 'Code is required'
          })} className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#2563EB] outline-none" placeholder="مثال: 101000" autoFocus /> </div> {errors.code && <p className="text-red-500 text-xs mr-[116px]">{errors.code.message}</p>} <div className="grid grid-cols-[100px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">اسم الحساب</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('name', {
            required: 'Name is required'
          })} className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#2563EB] outline-none" /> </div> <div className="grid grid-cols-[100px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">النوع</label> <select {...register('type')} className="w-full border border-slate-300 rounded px-3 py-2 focus:ring-2 focus:ring-[#2563EB] outline-none bg-slate-50"> {Object.entries(typeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)} </select> </div> {} <div className="flex justify-start gap-2 pt-4 mt-4 border-t border-slate-200"> <button type="submit" disabled={isSaving} className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded text-sm font-bold transition-colors disabled:opacity-50"> {isSaving ? 'جاري الحفظ...' : 'حفظ وإغلاق'} </button> <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors bg-white font-bold"> إلغاء </button> </div> </form> </div> </div>;
}