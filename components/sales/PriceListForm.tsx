'use client';

import { toast } from 'sonner';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { createPriceList, updatePriceList, deletePriceListItem, deletePriceList } from '@/app/actions/pricelists';
import { RotateCcw, Settings2, CloudUpload, Search, Filter, X, Download, PackageOpen, UserPlus, Users, Trash2, ChevronDown, Percent } from 'lucide-react';
import { OdooCombobox } from '@/components/ui/OdooCombobox';
import { cn } from '@/lib/utils';
import { Chatter } from '@/components/chatter/Chatter';

type Props = {
  initialData: any;
  products: any[];
  partners: any[];
  categories: any[];
  locale: string;
};

export function PriceListForm({
  initialData,
  products,
  partners,
  categories,
  locale
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'items' | 'info'>('items');
  const isNew = !initialData?.id;

  const partnerOptions = partners.map((p: any) => ({
    value: p.id,
    label: p.name
  }));

  const categoryOptions = categories.map((c: any) => ({
    value: c.id,
    label: c.name
  }));

  const defaults = {
    name: '',
    active: true,
    type: 'sale',
    partnerId: '',
    partnerIds: [] as string[],
    producingCompany: '',
    arCode: '',
    startDate: '',
    endDate: '',
    items: [] as any[],
    categoryId: '',
    discount1: 0,
    discount2: 0,
    discount3: 0,
    addition: 0,
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue
  } = useForm({
    defaultValues: initialData?.id ? {
      ...defaults,
      ...initialData,
      partnerIds: initialData.partners?.map((p: any) => p.id) || [],
      startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      items: initialData.items?.map((it: any) => ({
        ...it,
        startDate: it.startDate ? new Date(it.startDate).toISOString().split('T')[0] : '',
        endDate: it.endDate ? new Date(it.endDate).toISOString().split('T')[0] : ''
      })) || [],
      discount1: initialData.discount1 ?? 0,
      discount2: initialData.discount2 ?? 0,
      discount3: initialData.discount3 ?? 0,
      addition: initialData.addition ?? 0,
    } : {
      ...defaults,
      ...(initialData || {})
    }
  });

  const {
    fields,
    append,
    remove
  } = useFieldArray({
    control,
    name: "items"
  });

  const items = watch('items') || [];
  const currentType = watch('type');
  const selectedCategoryId = watch('categoryId') || '';
  const partnerIds: string[] = watch('partnerIds') || [];
  const isActive = watch('active');

  const [partnerSearchOpen, setPartnerSearchOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const partnerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => setShowActionMenu(false);
    if (showActionMenu) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [showActionMenu]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (partnerDropdownRef.current && !partnerDropdownRef.current.contains(e.target as Node)) {
        setPartnerSearchOpen(false);
      }
    };
    if (partnerSearchOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [partnerSearchOpen]);

  const addPartner = (pid: string) => {
    if (!partnerIds.includes(pid)) {
      setValue('partnerIds', [...partnerIds, pid]);
    }
    setPartnerSearch('');
    setPartnerSearchOpen(false);
  };

  const removePartner = (pid: string) => {
    setValue('partnerIds', partnerIds.filter(id => id !== pid));
  };

  const filteredPartners = partnerSearch
    ? partnerOptions.filter((p: any) => p.label.toLowerCase().includes(partnerSearch.toLowerCase()) && !partnerIds.includes(p.value))
    : partnerOptions.filter((p: any) => !partnerIds.includes(p.value));

  const handleFetchCategoryProducts = () => {
    if (!selectedCategoryId) {
      toast.error('الرجاء اختيار فئة المنتج أولاً');
      return;
    }
    const categoryProducts = products.filter(p => p.categoryId === selectedCategoryId || p.category?.id === selectedCategoryId);
    if (categoryProducts.length === 0) {
      toast.error('لا توجد منتجات في هذه الفئة');
      return;
    }
    let addedCount = 0;
    categoryProducts.forEach(prod => {
      if (!items.find((it: any) => it.productId === prod.id)) {
        append({
          id: 'new_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
          appliedOn: '1_product',
          productId: prod.id,
          computePrice: 'fixed'
        });
        addedCount++;
      }
    });
    if (addedCount > 0) {
      toast.success(`تم سحب ${addedCount} صنف بنجاح`);
    } else {
      toast.info('جميع منتجات هذه الفئة مسحوبة بالفعل في الاتفاقية');
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload = { ...data };
      if (payload.partnerId === '') payload.partnerId = null;
      if (isNew) {
        const response: any = await createPriceList(payload);
        if (response?.error) {
          toast.error(response.error);
        } else if (response?.success) {
          toast.success('تم إنشاء الاتفاقية بنجاح');
          router.push(`/${locale}/sales/pricelists/${response.list.id}`);
        }
      } else {
        const response: any = await updatePriceList(initialData.id, payload);
        if (response?.error) {
          toast.error(response.error);
        } else if (response?.success) {
          toast.success('تم تحديث الاتفاقية بنجاح');
          router.refresh();
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'خطأ في الحفظ');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (index: number, id?: string) => {
    if (id && !id.startsWith('new_')) {
      if (confirm('هل أنت متأكد من إزالة هذا الصنف من الاتفاقية؟')) {
        await deletePriceListItem(id);
        remove(index);
      }
    } else {
      remove(index);
    }
  };

  return (
    <div className="bg-[#f0f2f5] min-h-screen font-sans" dir="rtl">
      {/* ─── Sticky Header Bar ─── */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            className="bg-[#017E84] hover:bg-[#01656a] text-white px-5 py-1.5 rounded-[4px] text-[13px] font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 active:scale-[0.97]"
          >
            {loading ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            حفظ
          </button>

          {/* Discard Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors"
          >
            تجاهل
          </button>

          {/* Delete Button (only in edit mode) */}
          {!isNew && (
            <button
              type="button"
              onClick={async () => {
                if (confirm('هل أنت متأكد من حذف الاتفاقية بأكملها؟ هذا الإجراء لا يمكن التراجع عنه.')) {
                  try {
                    await deletePriceList(initialData.id);
                    toast.success('تم حذف الاتفاقية بنجاح');
                    router.push(`/${locale}/sales/pricelists`);
                  } catch (e: any) {
                    toast.error(e.message || 'خطأ في حذف الاتفاقية');
                  }
                }
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-[4px] text-[13px] font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </button>
          )}
        </div>

        {/* Right side: Items count badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-200 rounded-[4px] bg-white text-[12px] font-bold overflow-hidden">
            <button className="px-3 py-1.5 hover:bg-gray-50 border-l border-gray-200 flex items-center gap-2">
              <PackageOpen className="w-3.5 h-3.5 text-[#017E84]" />
              أصناف الاتفاقية
            </button>
            <div className="px-3 py-1.5 text-[#017E84] bg-teal-50/50">
              {fields.length} منتج
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="max-w-[1400px] mx-auto mt-6 px-4 pb-12">
        <div className="bg-white rounded-[2px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-gray-200 overflow-hidden">
          {/* ─── Status Bar ─── */}
          <div className="bg-[#f8f9fa] border-b border-gray-200 px-6 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full ring-2 ring-offset-1",
                isActive
                  ? "bg-green-500 ring-green-200"
                  : "bg-gray-400 ring-gray-200"
              )} />
              <span className="text-[11px] font-bold uppercase text-gray-500 tracking-wider">
                {isActive ? 'نشط وقيد التطبيق' : 'غير نشط'}
              </span>
            </div>
            <div className="text-[11px] font-medium text-gray-400">
              {isNew ? 'مسودة اتفاقية جديدة' : `رقم الاتفاقية: ${initialData.id}`}
            </div>
          </div>

          {/* ─── Form Body ─── */}
          <div className="p-8">
            {/* ─── Two-Column Header Fields ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8 border-b pb-8 border-gray-100">
              {/* Right Column */}
              <div className="space-y-6">
                {/* Name Field - Large */}
                <div>
                  <label className="text-[11px] font-bold uppercase text-[#017E84] mb-1.5 block tracking-wider">
                    اسم الاتفاقية / القائمة
                  </label>
                  <input
                    {...register('name', { required: true })}
                    autoComplete="new-password"
                    className="w-full text-[32px] font-bold text-gray-900 bg-transparent outline-none placeholder:text-gray-200 transition-all border-b-2 border-transparent focus:border-[#017E84] hover:border-slate-300 pb-1"
                    placeholder="مثلاً: اتفاقية تسعير جملة مورّدين"
                  />
                </div>

                {/* Type & Partners */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Type Dropdown */}
                  <div className="group">
                    <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-2 block">
                      نوع الاتفاقية
                    </label>
                    <select
                      {...register('type')}
                      className="w-full bg-transparent border-b border-gray-200 focus:border-[#017E84] hover:border-slate-300 outline-none py-1.5 text-[14px] font-bold cursor-pointer transition-colors"
                    >
                      <option value="purchase">اتفاقية شراء (Purchases)</option>
                      <option value="sale">اتفاقية مبيعات (Sales)</option>
                    </select>
                  </div>

                  {/* Partners / Scope */}
                  <div className="group" ref={partnerDropdownRef}>
                    <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      نطاق التطبيق
                    </label>

                    {/* Partner chips */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setValue('partnerIds', [])}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold border transition-all",
                          partnerIds.length === 0
                            ? "bg-[#017E84] text-white border-[#017E84] shadow-sm"
                            : "bg-white text-gray-400 border-gray-200 hover:border-[#017E84] hover:text-[#017E84]"
                        )}
                      >
                        <Users className="w-3.5 h-3.5" />
                        الكل
                      </button>
                      {partnerIds.map((pid: string) => {
                        const p = partnerOptions.find((o: any) => o.value === pid);
                        return (
                          <span
                            key={pid}
                            className="inline-flex items-center gap-1 bg-teal-50 text-[#017E84] border border-teal-200 rounded-full px-2.5 py-1 text-[12px] font-bold"
                          >
                            {p?.label || pid}
                            <button
                              type="button"
                              onClick={() => removePartner(pid)}
                              className="hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>

                    {/* Partner search input */}
                    <div className="relative">
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={partnerSearch}
                          onChange={e => {
                            setPartnerSearch(e.target.value);
                            setPartnerSearchOpen(true);
                          }}
                          onFocus={() => setPartnerSearchOpen(true)}
                          placeholder="ابحث وأضف شخص..."
                          autoComplete="new-password"
                          className="flex-1 bg-transparent border-b border-gray-200 focus:border-[#017E84] hover:border-slate-300 outline-none py-1 text-[13px] placeholder:text-gray-300 transition-colors"
                        />
                        <UserPlus className="w-4 h-4 text-gray-300" />
                      </div>
                      {partnerSearchOpen && filteredPartners.length > 0 && (
                        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded border border-gray-200 bg-white shadow-lg py-1 text-right">
                          {filteredPartners.slice(0, 15).map((p: any) => (
                            <div
                              key={p.value}
                              className="cursor-pointer px-4 py-2 text-[13px] hover:bg-teal-50 hover:text-[#017E84] font-medium transition-colors"
                              onMouseDown={e => {
                                e.preventDefault();
                                addPartner(p.value);
                              }}
                            >
                              {p.label}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Column */}
              <div className="space-y-6">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-2 block">
                      تاريخ البدء
                    </label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className="w-full bg-transparent border-b border-gray-200 hover:border-slate-300 focus:border-[#017E84] outline-none px-1 py-1.5 text-[13px] transition-colors cursor-pointer"
                    />
                  </div>
                  <div className="group">
                    <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-2 block">
                      تاريخ الانتهاء
                    </label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className="w-full bg-transparent border-b border-gray-200 hover:border-slate-300 focus:border-[#017E84] outline-none px-1 py-1.5 text-[13px] transition-colors cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-gray-400 italic mt-1.5 block">
                      في حال تُرك فارغاً تصبح سارية المفعول إلى الأبد
                    </span>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded border transition-colors",
                  isActive
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
                )}>
                  <input
                    type="checkbox"
                    id="activeToggle"
                    {...register('active')}
                    className="w-4 h-4 accent-[#017E84] cursor-pointer"
                  />
                  <label
                    htmlFor="activeToggle"
                    className={cn(
                      "text-[13px] font-bold cursor-pointer",
                      isActive ? "text-green-800" : "text-gray-500"
                    )}
                  >
                    تفعيل القائمة لتبدأ في التسجيل على النظام
                  </label>
                </div>
              </div>
            </div>

            {/* ─── Discount Card (Pricelist Level) ─── */}
            <div className="mb-8 bg-gradient-to-l from-teal-50/60 to-white border border-teal-200/60 rounded-lg p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-md bg-[#017E84] flex items-center justify-center">
                  <Percent className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-[14px] font-bold text-gray-800">
                  نسب الخصم على مستوى الاتفاقية
                </h3>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Discount 1 */}
                <div className="group">
                  <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-1.5 block">
                    خصم 1 %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register('discount1', { valueAsNumber: true })}
                      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-[15px] font-bold text-[#017E84] outline-none focus:border-[#017E84] focus:ring-2 focus:ring-teal-100 transition-all text-center"
                      placeholder="0"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Discount 2 */}
                <div className="group">
                  <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-1.5 block">
                    خصم 2 %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register('discount2', { valueAsNumber: true })}
                      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-[15px] font-bold text-[#017E84] outline-none focus:border-[#017E84] focus:ring-2 focus:ring-teal-100 transition-all text-center"
                      placeholder="0"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Discount 3 */}
                <div className="group">
                  <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-1.5 block">
                    خصم 3 %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register('discount3', { valueAsNumber: true })}
                      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-[15px] font-bold text-[#017E84] outline-none focus:border-[#017E84] focus:ring-2 focus:ring-teal-100 transition-all text-center"
                      placeholder="0"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">%</span>
                  </div>
                </div>

                {/* Addition */}
                <div className="group">
                  <label className="text-[12px] font-bold text-slate-600 group-hover:text-[#017E84] transition-colors mb-1.5 block">
                    إضافة (علاوة) %
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      {...register('addition', { valueAsNumber: true })}
                      className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-[15px] font-bold text-amber-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all text-center"
                      placeholder="0"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-gray-400">%</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 mt-3 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1 h-1 rounded-full bg-[#017E84]" />
                هذه النسب تُطبق على جميع أصناف هذه الاتفاقية
              </p>
            </div>

            {/* ─── Tabs ─── */}
            <div className="border-b border-gray-200 mb-0">
              <div className="flex gap-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('items')}
                  className={cn(
                    "px-5 py-2.5 text-[13px] font-bold transition-all border-b-2 -mb-[1px]",
                    activeTab === 'items'
                      ? "text-[#017E84] border-[#017E84]"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  أصناف الاتفاقية
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={cn(
                    "px-5 py-2.5 text-[13px] font-bold transition-all border-b-2 -mb-[1px]",
                    activeTab === 'info'
                      ? "text-[#017E84] border-[#017E84]"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  )}
                >
                  معلومات إضافية
                </button>
              </div>
            </div>

            {/* ─── Tab: Items ─── */}
            {activeTab === 'items' && (
              <div className="pt-6">
                {/* Category Bulk-Add Section */}
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-5 mb-6 flex flex-wrap items-end gap-6">
                  <div className="flex-1 min-w-[300px]">
                    <label className="text-[12px] font-bold text-slate-600 mb-2 flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#017E84]" />
                      اختيار فئة منتجات لإدراج منتجاتها بالاتفاقية
                    </label>
                    <OdooCombobox
                      options={categoryOptions}
                      value={selectedCategoryId}
                      onChange={val => setValue('categoryId', val || '')}
                      placeholder="اختر فئة (مثال: مستلزمات طبية)..."
                      searchable={true}
                      className="w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchCategoryProducts}
                    className="bg-[#017E84] hover:bg-[#01656a] text-white px-6 py-[9px] rounded-[4px] text-[13px] font-bold transition-all flex items-center gap-2 shadow-sm hover:shadow active:scale-[0.97] border border-[#01656a]"
                  >
                    <Download className="w-4 h-4" />
                    إعتماد الفئة وسحب كافة الأصناف
                  </button>
                  <div className="border-r border-gray-300 h-10 hidden lg:block" />
                  <div className="flex-1 min-w-[250px] relative">
                    <label className="text-[11px] font-bold text-gray-400 mb-2 block uppercase tracking-wider">
                      بحث في المودرجات
                    </label>
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded px-10 py-[7px] text-[13px] outline-none focus:border-[#017E84] focus:ring-2 focus:ring-teal-100 transition-all font-medium"
                        placeholder="بحث عن منتج معين في الجدول..."
                      />
                    </div>
                  </div>
                </div>

                {/* ─── Items Table ─── */}
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[400px]">
                  <table className="w-full text-right text-[13px]">
                    <thead className="bg-[#f0f2f5] border-b border-gray-300 text-gray-700">
                      <tr>
                        <th className="px-4 py-3 font-bold w-[35%] border-l border-gray-200">المنتج / الوصف</th>
                        <th className="px-3 py-3 font-bold w-[12%] text-center border-l border-gray-200">لشراء أقل كمية</th>
                        <th className="px-3 py-3 font-bold w-[15%] text-center border-l border-gray-200">طريقة احتساب السعر</th>
                        {currentType === 'purchase' && (
                          <th className="px-6 py-3 font-bold w-[20%] text-center border-l border-gray-200 bg-red-50/70 text-red-900">
                            سعر الشراء المتفق عليه
                          </th>
                        )}
                        {currentType === 'sale' && (
                          <th className="px-6 py-3 font-bold w-[20%] text-center border-l border-gray-200 bg-green-50/70 text-green-900">
                            سعر البيع المتفق عليه
                          </th>
                        )}
                        <th className="w-[5%]" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fields.map((field: any, index) => {
                        const prodInfo = products.find(p => p.id === watch(`items.${index}.productId`));
                        if (productSearch && prodInfo && !prodInfo.name?.toLowerCase().includes(productSearch.toLowerCase())) {
                          return null;
                        }
                        return (
                          <tr key={field.id} className="hover:bg-blue-50/30 group transition-colors">
                            {/* Product Name */}
                            <td className="px-4 py-3 border-l border-gray-100">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-[#017E84] font-bold text-[13px] shrink-0 border border-teal-100">
                                  {prodInfo?.name?.charAt(0) || 'P'}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900">{prodInfo?.name || 'صنف غير محدد'}</span>
                                  <span className="text-[11px] text-gray-400 mt-0.5">{prodInfo?.category?.name || 'بدون فئة'}</span>
                                </div>
                              </div>
                            </td>
                            {/* Min Quantity */}
                            <td className="px-3 py-3 text-center border-l border-gray-100">
                              <input
                                type="number"
                                {...register(`items.${index}.minQuantity`, { valueAsNumber: true })}
                                className="w-16 bg-white border border-gray-200 rounded px-2 py-1.5 outline-none text-center text-[13px] font-bold focus:border-[#017E84] focus:ring-1 focus:ring-teal-200 hover:border-slate-300 transition-colors mx-auto"
                              />
                            </td>
                            {/* Compute Price */}
                            <td className="px-3 py-3 text-center border-l border-gray-100">
                              <select
                                {...register(`items.${index}.computePrice`)}
                                className="w-full max-w-[120px] bg-gray-50 border border-gray-200 rounded outline-none text-[12px] font-bold py-1.5 focus:border-[#017E84] hover:border-slate-300 mx-auto text-center transition-colors cursor-pointer"
                              >
                                <option value="fixed">سعر ثابت</option>
                                <option value="percentage">نسبة مئوية (%)</option>
                              </select>
                            </td>
                            {/* Price Field */}
                            <td className={cn(
                              "px-6 py-3 text-center border-l border-gray-100",
                              currentType === 'purchase' ? 'bg-red-50/10' : 'bg-green-50/10'
                            )}>
                              <div className="flex items-center justify-center gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  {...register(
                                    watch(`items.${index}.computePrice`) === 'fixed'
                                      ? currentType === 'purchase'
                                        ? `items.${index}.buyPrice`
                                        : `items.${index}.price`
                                      : `items.${index}.percentPrice`,
                                    { valueAsNumber: true }
                                  )}
                                  className="w-28 bg-white border border-gray-200 rounded px-3 py-1.5 outline-none text-center text-[15px] font-bold text-[#017E84] focus:border-[#017E84] focus:ring-2 focus:ring-teal-200 hover:border-slate-300 transition-colors"
                                />
                                <span className="text-gray-500 font-bold text-[13px]">
                                  {watch(`items.${index}.computePrice`) === 'fixed' ? 'ج.م' : '%'}
                                </span>
                              </div>
                            </td>
                            {/* Remove Button */}
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index, field.id)}
                                title="إزالة من الاتفاقية"
                                className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Empty state */}
                      {fields.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-24 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-500 gap-4">
                              <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center border border-gray-200 border-dashed">
                                <PackageOpen className="w-8 h-8 opacity-40 text-gray-600" />
                              </div>
                              <div className="text-center">
                                <span className="block font-bold text-gray-700 text-lg mb-1">
                                  الجدول فارغ ولا تنطبق على أي صنف حالياً
                                </span>
                                <span className="text-[13px] text-gray-400">
                                  لإنشاء الاتفاقية، قم باختيار &quot;فئة محصول/منتج&quot; من الأعلى،
                                  <br />
                                  واضغط على زر سحب لعرض كافة منتجاتها وبدء تسعيرها.
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── Tab: Additional Info ─── */}
            {activeTab === 'info' && (
              <div className="pt-6">
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-8 text-center text-gray-400">
                  <Settings2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-[14px] font-bold text-gray-500 mb-1">معلومات إضافية</p>
                  <p className="text-[13px]">يمكن إضافة حقول إضافية هنا مستقبلاً مثل ملاحظات الاتفاقية والشروط والأحكام.</p>
                </div>
              </div>
            )}
          </div>
          {initialData?.id && <div className="mt-8 px-8 pb-8 border-t pt-8"><Chatter model="priceList" id={initialData.id} /></div>}
        </div>
      </div>
    </div>
  );
}