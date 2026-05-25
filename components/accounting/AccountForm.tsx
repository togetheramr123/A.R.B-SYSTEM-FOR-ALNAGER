'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { createAccount, updateAccount, deleteAccount, getSuggestedAccountCode } from '@/app/actions/accounts';
import { Save, Trash2, CloudUpload, RotateCcw, Menu, Download, Loader2, Settings, ChevronDown, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useFormDraft } from '@/hooks/useFormDraft';
import { useStatusStore } from '@/store/statusStore';
import { TopPortal } from '@/components/common/TopPortal';
type Props = {
  initialData: any;
  locale: string;
  balance?: {
    debit: number;
    credit: number;
    balance: number;
  };
  availableTags?: any[];
  availableTaxes?: any[];
  availableJournals?: any[];
};
const accountTypeLabels: Record<string, string> = {
  receivable: 'المدين',
  bank: 'البنك والنقد',
  asset: 'الأصول المتداولة',
  asset_current: 'الأصول المتداولة',
  current_assets: 'الأصول المتداولة',
  non_current_asset: 'الأصول غير المتداولة',
  prepayments: 'المدفوعات المسددة مقدماً',
  fixed_asset: 'أصول ثابتة',
  payable: 'الدائن',
  credit_card: 'البطاقة الائتمانية',
  current_liability: 'الالتزامات الجارية',
  non_current_liability: 'الالتزامات غير الجارية',
  equity: 'رأس المال',
  current_year_earnings: 'أرباح السنة الجارية',
  income: 'الدخل',
  other_income: 'دخل آخر',
  expense: 'النفقات',
  depreciation: 'إهلاك',
  cost_of_revenue: 'تكاليف الإيرادات',
  off_balance: 'خارج الميزانية العمومية',
  other: 'أخرى'
};
function formatNumber(num: number | string | null | undefined) {
  const n = Number(num || 0);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' LE';
}
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
export function AccountForm({
  initialData,
  locale,
  balance,
  availableTags,
  availableTaxes,
  availableJournals
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'info'>('items');
  const isNewRecord = !initialData?.id;
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const {
    saveDraft,
    loadDraft,
    clearDraft
  } = useFormDraft('account_new', isNewRecord);
  const {
    setFormStatus,
    clearStatus
  } = useStatusStore();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      type: (initialData.type === 'asset' || initialData.type === 'current_assets') ? 'asset_current' : (initialData.type || 'asset_current'),
      tags: initialData.tags?.map((t: any) => t.id) || [],
      defaultTaxes: initialData.defaultTaxes?.map((t: any) => t.id) || [],
      allowedJournals: initialData.allowedJournals?.map((j: any) => j.id) || []
    } : {
      code: '',
      name: '',
      type: 'asset_current',
      companyId: '',
      deprecated: false,
      tags: [],
      defaultTaxes: [],
      allowedJournals: []
    }
  });
  const accountType = watch('type');
  const [isActionOpen, setIsActionOpen] = useState(false);
  useEffect(() => {
    if (isNewRecord && accountType) {
      getSuggestedAccountCode(accountType).then(code => {
        const currentCode = watch('code');
        if (!currentCode) {
          setValue('code', code);
        }
      }).catch(console.error);
    }
  }, [accountType, isNewRecord]);
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateAccount(initialData.id, data);
        reset(data);
        toast.success('تم تحديث الحساب بنجاح');
      } else {
        const newAcc = await createAccount(data);
        clearDraft();
        toast.success('تم إنشاء الحساب بنجاح');
        if (newAcc) {
          router.push(`/${locale}/accounting/chart-of-accounts/${newAcc.id}`);
          return;
        }
      }
      router.refresh();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message?.includes('Unique') ? 'كود الحساب مستخدم بالفعل' : 'حدث خطأ أثناء حفظ الحساب');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const subscription = watch((value, {
      name,
      type
    }) => {
      if (type === 'change') {
        if (isNewRecord) {
          // Do not auto-save new records to prevent duplicate creation errors
          return;
        } else {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = setTimeout(() => {
            handleSubmit(async data => {
              try {
                await updateAccount(initialData.id, data);
              } catch (error) {
                console.error('Auto-save error:', error);
              }
            })();
          }, 1500);
        }
      }
    });
    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [watch, isNewRecord, handleSubmit, initialData?.id]);
  useEffect(() => {
    setFormStatus({
      isSaving: isSubmitting || loading,
      hasUnsavedChanges: isDirty,
      saveTriggerFn: handleSubmit(onSubmit),
      discardTriggerFn: () => router.push(`/${locale}/accounting/chart-of-accounts`)
    });
    return () => clearStatus();
  }, [isSubmitting, loading, isDirty, router, locale, handleSubmit]);
  const handleDuplicate = async () => {
    if (!initialData?.id) return;
    setIsActionOpen(false);
    setLoading(true);
    try {
      const currentData = getValues();
      const {
        id,
        code,
        ...rest
      } = currentData;
      const newCode = await getSuggestedAccountCode(currentData.type || 'asset');
      const newAcc = await createAccount({
        ...rest,
        code: newCode,
        name: `${currentData.name} (نسخة)`
      });
      toast.success('تم إنشاء نسخة مطابقة بنجاح');
      if (newAcc) {
        router.push(`/${locale}/accounting/chart-of-accounts/${newAcc.id}`);
        return;
      }
    } catch (e: any) {
      console.error('Duplicate error:', e);
      toast.error(`خطأ: ${e?.message || 'حدث خطأ أثناء إنشاء النسخة المطابقة'}`);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!confirm('هل تريد حذف هذا الحساب؟')) return;
    setLoading(true);
    try {
      await deleteAccount(initialData.id);
      router.push(`/${locale}/accounting/chart-of-accounts`);
    } catch (e) {
      toast.error('لا يمكن حذف حساب يحتوي على قيود.');
    } finally {
      setLoading(false);
    }
  };
  const journalItems = initialData?.journalItems || [];
  const totalItems = initialData?._count?.journalItems || 0;
  return <div className="bg-white shadow-sm w-full max-w-[1400px] rounded-sm min-h-[600px] relative" dir="rtl">
      <TopPortal>
        <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse" dir="rtl">
          {initialData?.id && (
            <div className="flex items-center pr-2 mr-2 border-r border-gray-200">
              <span className="text-xs text-gray-500 mx-2 ml-4">1 / 1</span>
              <button type="button" className="p-1.5 rounded-sm transition-colors text-gray-300 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button type="button" className="p-1.5 rounded-sm transition-colors text-gray-300 cursor-not-allowed">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {initialData?.id && (
            <div className="relative">
              <button
                onClick={() => setIsActionOpen(!isActionOpen)}
                type="button"
                className="flex items-center gap-1.5 bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-sm text-[11px] hover:bg-gray-50 transition-colors font-semibold"
              >
                <Settings className="w-3.5 h-3.5 text-gray-400" /> إجراء
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
              {isActionOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsActionOpen(false)}></div>
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-md py-1 z-50 overflow-hidden text-right" dir="rtl">
                    <button onClick={handleDuplicate} type="button" className="w-full text-right px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-gray-400" /> إنشاء نسخة مطابقة
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button onClick={handleDelete} type="button" className="w-full text-right px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" /> حذف نهائي
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <button type="button" onClick={() => router.push(`/${locale}/accounting/chart-of-accounts/new`)} className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-gray-50 transition-colors">
            جديد
          </button>
          {isDirty && <>
            <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting || loading} className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2">
              {isSubmitting || loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
              حفظ يدوي
            </button>
            <button onClick={() => router.push(`/${locale}/accounting/chart-of-accounts`)} disabled={isSubmitting || loading} className="bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> تجاهل
            </button>
          </>}
        </div>
      </TopPortal>
      <div className="border-b border-slate-200 p-3 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex gap-2 items-center"></div>
        <div className="flex items-center gap-4">
          <button type="button" className="flex items-center gap-2 px-3 py-1.5 text-[14px] font-medium text-slate-700 hover:bg-slate-100 rounded transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg> طباعة
          </button>
          {initialData?.id && balance && (
            <Link href={`/${locale}/accounting/journal-items?account=${initialData.id}`} className="flex items-center gap-3 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-[#017E84]/10/50 rounded px-4 py-1.5 cursor-pointer transition-all group">
              <Menu className="w-5 h-5 text-indigo-400 group-hover:text-[#017E84] transition-colors" />
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#017E84] uppercase tracking-widest leading-none mb-0.5">الرصيد</span>
                <span className="text-lg font-bold text-[#017E84] leading-none">{formatNumber(balance.balance)}</span>
              </div>
            </Link>
          )}
        </div>
      </div>
      <div className="p-4 bg-white mt-4 mx-4 shadow-sm border border-slate-200">
        <div className="mb-4 pr-4">
          <div className="w-1/2 mb-4">
            <label className="block text-[13px] text-slate-600 text-right mb-0.5 font-medium">الكود</label>
            <input {...register('code', {
            required: true
          })} autoComplete="new-password" className="text-[22px] text-slate-900 border-b border-slate-300 focus:border-slate-800 outline-none w-full bg-transparent pb-0.5 text-right font-medium" placeholder="101000" /> </div> <div className="w-1/2"> <label className="block text-[13px] text-slate-600 text-right mb-0.5 font-medium">اسم الحساب</label> <input {...register('name', {
            required: true
          })} autoComplete="new-password" className="text-[26px] text-slate-900 border-b border-slate-300 focus:border-slate-800 outline-none w-full bg-transparent pb-0.5 text-right font-medium" placeholder="اسم الحساب" /> </div> </div> {} <div className="flex gap-6 mt-8 border-b border-slate-200 px-4"> <button className="pb-2 text-[14px] text-slate-800 transition-colors border-b-2 border-[#017E84] font-medium"> المحاسبة </button> </div> {} <div className="pt-6 px-4"> <div className="grid grid-cols-2 gap-x-16 gap-y-2"> {} <div className="space-y-4"> <div className="flex items-start"> <label className="text-[13px] text-slate-700 w-1/3 text-right pt-1 pl-2 font-medium">النوع <span className="text-[10px] text-blue-500 font-bold ml-1 cursor-help">?</span></label> <div className="w-2/3 border-b border-slate-300"> <select {...register('type')} className="w-full text-[13px] text-slate-900 bg-transparent outline-none pb-1 appearance-none cursor-pointer"> <optgroup label="الميزانية العمومية"></optgroup> <optgroup label="أصول"> <option value="receivable">المدين</option> <option value="bank">البنك والنقد</option> <option value="asset_current">الأصول المتداولة</option> <option value="non_current_asset">الأصول غير المتداولة</option> <option value="prepayments">المدفوعات المسددة مقدماً</option> <option value="fixed_asset">أصول ثابتة</option> </optgroup> <optgroup label="الالتزامات"> <option value="payable">الدائن</option> <option value="credit_card">البطاقة الائتمانية</option> <option value="current_liability">الالتزامات الجارية</option> <option value="non_current_liability">الالتزامات غير الجارية</option> </optgroup> <optgroup label="رأس المال"> <option value="equity">رأس المال</option> <option value="current_year_earnings">أرباح السنة الجارية</option> </optgroup> <optgroup label="الربح والخسارة"></optgroup> <optgroup label="الدخل"> <option value="income">الدخل</option> <option value="other_income">دخل آخر</option> </optgroup> <optgroup label="النفقة"> <option value="expense">النفقات</option> <option value="depreciation">إهلاك</option> <option value="cost_of_revenue">تكاليف الإيرادات</option> </optgroup> <optgroup label="غير ذلك"> <option value="off_balance">خارج الميزانية العمومية</option> </optgroup> </select> </div> </div> <div className="flex items-start"> <label className="text-[13px] text-slate-700 w-1/3 text-right pt-1 pl-2 font-medium">انواع متابعة الكاش</label> <div className="w-2/3 border-b border-slate-300"> <input className="w-full text-[13px] text-slate-900 bg-transparent outline-none pb-1" /> </div> </div> <div className="flex items-start"> <label className="text-[13px] text-slate-700 w-1/3 text-right pt-1 pl-2 font-medium">ضرائب افتراضية</label> <div className="w-2/3 border-b border-slate-300"> <div className="flex flex-wrap gap-1 pb-1 items-center min-h-[24px]"> {watch('defaultTaxes')?.map((id: string) => {
                    const tax = availableTaxes?.find(t => t.id === id);
                    return tax ? <span key={id} className="text-slate-800 text-[13px] ml-1 flex items-center gap-1 group"> {tax.name} <button type="button" onClick={() => setValue('defaultTaxes', watch('defaultTaxes').filter((x: string) => x !== id), {
                        shouldDirty: true
                      })} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 font-bold px-1 transition-all">×</button> </span> : null;
                  })} <select {...register('defaultTaxes')} className="flex-1 min-w-[20px] text-[13px] text-transparent focus:text-slate-900 outline-none bg-transparent appearance-none"> <option value="" className="text-slate-400"></option> {availableTaxes?.filter(t => !watch('defaultTaxes')?.includes(t.id)).map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name} ({t.amount}%)</option>)} </select> </div> </div> </div> <div className="flex items-start"> <label className="text-[13px] text-slate-700 w-1/3 text-right pt-1 pl-2 font-medium">علامات التصنيف <span className="text-[10px] text-blue-500 font-bold ml-1 cursor-help">?</span></label> <div className="w-2/3 border-b border-slate-300"> <div className="flex flex-wrap gap-1 pb-1 items-center min-h-[24px]"> {watch('tags')?.map((id: string) => {
                    const tag = availableTags?.find(t => t.id === id);
                    return tag ? <span key={id} className="text-slate-800 text-[13px] ml-1 flex items-center gap-1 group"> {tag.name} <button type="button" onClick={() => setValue('tags', watch('tags').filter((x: string) => x !== id), {
                        shouldDirty: true
                      })} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 font-bold px-1 transition-all">×</button> </span> : null;
                  })} <select {...register('tags')} className="flex-1 min-w-[20px] text-[13px] text-transparent focus:text-slate-900 outline-none bg-transparent appearance-none"> <option value="" className="text-slate-400"></option> {availableTags?.filter(t => !watch('tags')?.includes(t.id)).map(t => <option key={t.id} value={t.id} className="text-slate-900">{t.name}</option>)} </select> </div> </div> </div> <div className="flex items-start"> <label className="text-[13px] text-slate-700 w-1/3 text-right pt-1 pl-2 font-medium">اليوميات المسموح بها <span className="text-[10px] text-blue-500 font-bold ml-1 cursor-help">?</span></label> <div className="w-2/3 border-b border-slate-300"> <div className="flex flex-wrap gap-1 pb-1 items-center min-h-[24px]"> {watch('allowedJournals')?.map((id: string) => {
                    const journal = availableJournals?.find(j => j.id === id);
                    return journal ? <span key={id} className="text-slate-800 text-[13px] ml-1 flex items-center gap-1 group"> {journal.name} <button type="button" onClick={() => setValue('allowedJournals', watch('allowedJournals').filter((x: string) => x !== id), {
                        shouldDirty: true
                      })} className="text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500 font-bold px-1 transition-all">×</button> </span> : null;
                  })} <select {...register('allowedJournals')} className="flex-1 min-w-[20px] text-[13px] text-transparent focus:text-slate-900 outline-none bg-transparent appearance-none"> <option value="" className="text-slate-400"></option> {availableJournals?.filter(j => !watch('allowedJournals')?.includes(j.id)).map(j => <option key={j.id} value={j.id} className="text-slate-900">{j.name}</option>)} </select> </div> </div> </div> </div> {} <div className="space-y-4"> <div className="flex items-start"> <label className="text-[13px] text-slate-700 w-1/3 text-right pt-1 pl-2 font-medium">مهمل</label> <div className="w-2/3 flex items-center pt-1"> <input type="checkbox" {...register('deprecated')} className="w-4 h-4 text-[#017E84] rounded border-slate-300" /> </div> </div> <div className="flex items-start"> <label className="text-[13px] text-slate-700 w-1/3 text-right pt-1 pl-2 font-medium">المجموعة <span className="text-[10px] text-blue-500 font-bold ml-1 cursor-help">?</span></label> <div className="w-2/3 border-b border-slate-300"> <input disabled className="w-full text-[13px] bg-transparent outline-none text-slate-400 pb-1" /> </div> </div> </div> </div> </div> </div> {} </div>;
}