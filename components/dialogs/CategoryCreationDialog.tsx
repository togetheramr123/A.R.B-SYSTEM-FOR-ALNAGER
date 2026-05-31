'use client';

import { toast } from 'sonner';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { X, HelpCircle } from 'lucide-react';
import { OdooCombobox } from '@/components/ui/OdooCombobox';
import { getChartOfAccounts, getJournals, createAccount } from '@/app/actions/accounting';
import { getProductCategories, getCategory } from '@/app/actions/inventory';
import { QuickAccountCreationDialog } from './QuickAccountCreationDialog';
interface CategoryCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialName?: string;
  categories?: any[];
  categoryId?: string;
}
export function CategoryCreationDialog({
  isOpen,
  onClose,
  onSave,
  initialName,
  categories,
  categoryId
}: CategoryCreationDialogProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || 'ar';
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset
  } = useForm({
    defaultValues: {
      name: initialName || '',
      parentId: '',
      costingMethod: 'avco',
      valuation: 'real_time',
      propertyStockAccountId: '',
      propertyStockJournalId: '',
      propertyStockAccountInputId: '',
      propertyStockAccountOutputId: '',
      propertyAccountIncomeId: '',
      propertyAccountExpenseId: '',
      propertyAccountDifferenceId: '',
      removalStrategy: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parentOptions, setParentOptions] = useState<any[]>(categories || []);
  const [accountOptions, setAccountOptions] = useState<{
    asset: any[];
    income: any[];
    expense: any[];
    liability: any[];
    journal: any[];
  }>({
    asset: [],
    income: [],
    expense: [],
    liability: [],
    journal: []
  });
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [pendingAccountName, setPendingAccountName] = useState('');
  const [pendingAccountType, setPendingAccountType] = useState<string>('asset');
  const [activeAccountField, setActiveAccountField] = useState<string>('');
  const valuation = watch('valuation');
  useEffect(() => {
    if (isOpen) {
      loadData();
      if (categoryId) {
        setIsLoading(true);
        getCategory(categoryId).then(cat => {
          if (cat) {
            reset({
              name: cat.name,
              parentId: cat.parentId || '',
              costingMethod: cat.costingMethod,
              valuation: cat.valuation,
              propertyStockAccountId: cat.propertyStockAccountId || '',
              propertyStockJournalId: cat.propertyStockJournalId || '',
              propertyStockAccountInputId: cat.propertyStockAccountInputId || '',
              propertyStockAccountOutputId: cat.propertyStockAccountOutputId || '',
              propertyAccountIncomeId: cat.propertyAccountIncomeId || '',
              propertyAccountExpenseId: cat.propertyAccountExpenseId || '',
              propertyAccountDifferenceId: ''
            });
          }
          setIsLoading(false);
        });
      } else {
        reset({
          name: initialName || '',
          parentId: '',
          costingMethod: 'avco',
          valuation: 'real_time',
          propertyStockAccountId: '',
          propertyStockJournalId: '',
          propertyStockAccountInputId: '',
          propertyStockAccountOutputId: '',
          propertyAccountIncomeId: '',
          propertyAccountExpenseId: '',
          propertyAccountDifferenceId: '',
          removalStrategy: ''
        });
      }
    }
  }, [isOpen, initialName, categoryId, reset]);
  const loadData = async () => {
    try {
      const accounts = await getChartOfAccounts();
      const journals = await getJournals();
      if (accounts) {
        const allAccounts = accounts.map((a: any) => ({
          value: a.id,
          label: `${a.code} ${a.name}`,
          code: a.code
        }));
        setAccountOptions({
          asset: allAccounts,
          income: allAccounts,
          expense: allAccounts,
          liability: allAccounts,
          journal: journals || []
        });
        if (!categoryId) {
          const defaultIncome = allAccounts.find((a: any) => a.code === '500001')?.value || '';
          const defaultExpense = allAccounts.find((a: any) => a.code === '400002')?.value || '';
          const defaultStockVal = allAccounts.find((a: any) => a.code === '103029')?.value || '';
          const defaultStockIn = allAccounts.find((a: any) => a.code === '103039')?.value || '';
          const defaultStockOut = allAccounts.find((a: any) => a.code === '103049')?.value || '';
          
          if(defaultIncome) setValue('propertyAccountIncomeId', defaultIncome);
          if(defaultExpense) setValue('propertyAccountExpenseId', defaultExpense);
          if(defaultStockVal) setValue('propertyStockAccountId', defaultStockVal);
          if(defaultStockIn) setValue('propertyStockAccountInputId', defaultStockIn);
          if(defaultStockOut) setValue('propertyStockAccountOutputId', defaultStockOut);
          
          const defaultJournal = journals?.find((j: any) => j.name?.includes('مخزون') || j.code?.includes('INV') || j.code?.includes('STJ'))?.id || '';
          if(defaultJournal) setValue('propertyStockJournalId', defaultJournal);
        }
      }
      if (parentOptions.length === 0) {
        const cats = await getProductCategories();
        if (cats) {
          setParentOptions(cats.map((c: any) => ({
            value: c.id,
            label: c.name
          })));
        }
      }
    } catch (error) {
      console.error("Failed to load data", error);
    }
  };
  const handleCreateAccountTrigger = (name: string, type: 'asset' | 'income' | 'expense' | 'liability', fieldName: string) => {
    setPendingAccountName(name);
    setPendingAccountType(type);
    setActiveAccountField(fieldName);
    setShowAccountDialog(true);
  };
  const handleAccountCreated = async (data: {
    code: string;
    name: string;
    type: string;
  }) => {
    const newAccount = await createAccount(data);
    if (newAccount && newAccount.success !== false && 'account' in newAccount && newAccount.account) {
      const acct = newAccount.account;
      const newOption = {
        value: acct.id,
        label: `${acct.code} ${acct.name}`
      };
      let targetKey: keyof typeof accountOptions = 'asset';
      if (['income', 'other_income'].includes(data.type)) targetKey = 'income';else if (['expense', 'cost_of_revenue'].includes(data.type)) targetKey = 'expense';else if (['liability', 'current_liability'].includes(data.type)) targetKey = 'liability';
      setAccountOptions(prev => ({
        ...prev,
        [targetKey]: [...prev[targetKey], newOption]
      }));
      if (activeAccountField) {
        setValue(activeAccountField as any, acct.id, {
          shouldDirty: true
        });
      }
    }
    setShowAccountDialog(false);
  };
  const handleFormSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      const isDuplicate = parentOptions.some(option => option.value !== categoryId && (option.label || "").trim().toLowerCase() === data.name.trim().toLowerCase());
      if (isDuplicate) {
        toast.warning('هذه الفئة موجودة بالفعل!');
        setIsSaving(false);
        return;
      }
      await onSave(data);
      onClose();
    } catch (error) {
      console.error(error);
      toast.error('فشل في حفظ الفئة');
    } finally {
      setIsSaving(false);
    }
  };
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center bg-white"> <QuickAccountCreationDialog isOpen={showAccountDialog} onClose={() => setShowAccountDialog(false)} onSave={handleAccountCreated} initialName={pendingAccountName} initialType={pendingAccountType} /> <div className="w-full h-full flex flex-col bg-white"> {} <div className="bg-white border-b border-slate-200"> <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100"> <div className="flex items-center gap-2"> <div className="flex items-center text-xl text-slate-700 bg-white"> <span className="text-slate-500 hover:text-slate-900 cursor-pointer" onClick={() => router.push(`/${locale}/inventory`)}> المخزون </span> <span className="mx-2 text-slate-400">/</span> <span className="text-slate-500 hover:text-slate-900 cursor-pointer" onClick={() => router.push(`/${locale}/inventory/products`)}> المنتجات </span> <span className="mx-2 text-slate-400">/</span> <span className="font-bold text-slate-800"> {isLoading ? "جاري التحميل..." : categoryId ? watch('name') || 'تعديل الفئة' : watch('name') || 'فئة منتج جديدة'} </span> </div> </div> <button onClick={onClose} className="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100 transition-colors" title="إغلاق و العودة"> <X className="w-5 h-5" /> </button> </div> {} <div className="flex items-center gap-2 px-4 py-2 bg-white" dir="rtl"> <button onClick={handleSubmit(handleFormSubmit)} disabled={isSaving} className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-3 py-1.5 rounded-sm text-sm font-medium transition-colors disabled:opacity-50"> {isSaving ? 'جاري الحفظ...' : 'حفظ'} </button> <button onClick={onClose} className="px-3 py-1.5 rounded-sm text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"> تجاهل </button> </div> </div> {} <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8" dir="rtl"> <div className="max-w-6xl mx-auto bg-white border border-slate-200 shadow-sm p-8 min-h-[500px]"> {} <div className="grid grid-cols-[100px_1fr] items-center gap-4 mb-8"> <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200"></div> <div className="space-y-4"> <div className="grid grid-cols-[100px_1fr] items-center"> <label className="text-sm text-[#2563EB] font-bold text-left pl-4">اسم الفئة</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('name')} className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-2xl bg-transparent" placeholder="مثال: مشروبات" /> </div> <div className="grid grid-cols-[100px_1fr] items-center"> <label className="text-sm text-slate-700 font-bold text-left pl-4">الفئة الرئيسية</label> <Controller name="parentId" control={control} render={({ field }) => <OdooCombobox options={[{ value: '', label: 'بدون فئة أم' }, ...parentOptions]} value={field.value} onChange={field.onChange} placeholder="بدون فئة أم" searchable={true} className="font-medium !border-b !border-slate-300 focus-within:!border-[#2563EB]" />} /> </div> </div> </div> <div className="grid grid-cols-2 gap-x-16 gap-y-8"> {} <div className="space-y-8"> <div> <h4 className="border-b border-slate-300 pb-1 mb-4 text-[#2563EB] font-bold text-sm">تقييم المخزون</h4> <div className="space-y-3"> <div className="grid grid-cols-[160px_1fr] items-center group"> <div className="flex items-center justify-between pl-2"> <label className="text-sm text-slate-700 font-bold">طريقة حساب التكاليف</label> </div> <select {...register('costingMethod')} className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent font-medium"> <option value="avco">متوسط التكلفة (AVCO)</option> <option value="standard">السعر القياسي</option> <option value="fifo">الوارد أولاً يخرج أولاً (FIFO)</option> </select> </div> <div className="grid grid-cols-[160px_1fr] items-center group"> <div className="flex items-center justify-between pl-2"> <label className="text-sm text-slate-700 font-bold">تقييم المخزون</label> </div> <select {...register('valuation')} className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent font-medium"> <option value="real_time">آلي (مؤتمت)</option> <option value="manual_periodic">يدوي (دوري)</option> </select> </div> </div> </div> <div className={valuation !== 'real_time' ? 'opacity-50 grayscale pointer-events-none' : ''}> <h4 className="border-b border-slate-300 pb-1 mb-4 text-[#2563EB] font-bold text-sm">خصائص حساب المخزون</h4> <div className="space-y-3"> <div className="grid grid-cols-[160px_1fr] items-center group"> <label className="text-sm text-slate-700 font-bold pl-2">حساب تقييم المخزون</label> <Controller name="propertyStockAccountId" control={control} render={({
                      field
                    }) => <OdooCombobox options={accountOptions.asset} value={field.value} onChange={field.onChange} onCreate={val => handleCreateAccountTrigger(val, 'asset', 'propertyStockAccountId')} disabled={valuation !== 'real_time'} searchable={true} alwaysShowCreate={true} className="font-medium" />} /> </div> <div className="grid grid-cols-[160px_1fr] items-center group"> <label className="text-sm text-slate-700 font-bold pl-2">حساب دفعات المخزون (الوارد)</label> <Controller name="propertyStockAccountInputId" control={control} render={({
                      field
                    }) => <OdooCombobox options={accountOptions.asset} value={field.value} onChange={field.onChange} onCreate={val => handleCreateAccountTrigger(val, 'asset', 'propertyStockAccountInputId')} disabled={valuation !== 'real_time'} searchable={true} alwaysShowCreate={true} className="font-medium" />} /> </div> <div className="grid grid-cols-[160px_1fr] items-center group"> <label className="text-sm text-slate-700 font-bold pl-2">حساب دفعات المخزون (الصادر)</label> <Controller name="propertyStockAccountOutputId" control={control} render={({
                      field
                    }) => <OdooCombobox options={accountOptions.asset} value={field.value} onChange={field.onChange} onCreate={val => handleCreateAccountTrigger(val, 'asset', 'propertyStockAccountOutputId')} disabled={valuation !== 'real_time'} searchable={true} alwaysShowCreate={true} className="font-medium" />} /> </div> <div className="grid grid-cols-[160px_1fr] items-center group"> <label className="text-sm text-slate-700 font-bold pl-2">دفتر يومية تقييم المخزون</label> <Controller name="propertyStockJournalId" control={control} render={({
                      field
                    }) => <OdooCombobox options={accountOptions.journal.map((j: any) => ({
                      value: j.id,
                      label: j.name
                    }))} value={field.value} onChange={field.onChange} disabled={valuation !== 'real_time'} searchable={true} className="font-medium" />} /> </div> {} </div> </div> </div> {} <div className="space-y-8"> <div> <h4 className="border-b border-slate-300 pb-1 mb-4 text-[#2563EB] font-bold text-sm">خصائص الحساب</h4> <div className="space-y-3"> <div className="grid grid-cols-[160px_1fr] items-center group"> <label className="text-sm text-slate-700 font-bold pl-2">حساب الدخل</label> <Controller name="propertyAccountIncomeId" control={control} render={({
                      field
                    }) => <OdooCombobox options={accountOptions.income} value={field.value} onChange={field.onChange} onCreate={val => handleCreateAccountTrigger(val, 'income', 'propertyAccountIncomeId')} searchable={true} alwaysShowCreate={true} className="font-medium" />} /> </div> <div className="grid grid-cols-[160px_1fr] items-center group"> <label className="text-sm text-slate-700 font-bold pl-2">حساب النفقات</label> <Controller name="propertyAccountExpenseId" control={control} render={({
                      field
                    }) => <OdooCombobox options={accountOptions.expense} value={field.value} onChange={field.onChange} onCreate={val => handleCreateAccountTrigger(val, 'expense', 'propertyAccountExpenseId')} searchable={true} alwaysShowCreate={true} className="font-medium" />} /> </div> </div> </div> </div> </div> </div> </div> </div> </div>;
}