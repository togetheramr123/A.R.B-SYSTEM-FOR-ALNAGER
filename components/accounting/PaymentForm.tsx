'use client';
import React from "react";

import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPayment, confirmPayment } from '@/app/actions/payments';
import { Check, CloudUpload, RotateCcw } from 'lucide-react';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { useStatusStore } from '@/store/statusStore';
import { Chatter } from '@/components/chatter/Chatter';
import { AttachmentPanel } from '@/components/common/AttachmentPanel';

type Props = {
  initialData: any;
  partners: any[];
  journals: any[];
  locale?: string;
};
export function PaymentForm({
  initialData,
  partners,
  journals,
  locale
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const {
    setFormStatus,
    clearStatus
  } = useStatusStore();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: {
      isDirty,
      isSubmitting
    }
  } = useForm({
    defaultValues: initialData || {
      paymentType: searchParams.get('paymentType') || 'inbound',
      partnerType: searchParams.get('partnerType') || 'customer',
      partnerId: searchParams.get('partnerId') || '',
      amount: parseFloat(searchParams.get('amount') || '0'),
      date: new Date().toISOString().split('T')[0],
      journalId: '',
      ref: searchParams.get('ref') ? `Payment for ${searchParams.get('ref')}` : ''
    }
  });
  const state = initialData?.state || 'draft';
  const isPosted = state === 'posted';
  const paymentType = watch('paymentType');
  const saveData = async (data: any, silent = false) => {
    if (!silent) setLoading(true);
    try {
      if (initialData?.id) {
        // update needed;
      } else {
        const newPay = await createPayment(data);
        if (newPay && 'success' in newPay && newPay.success && newPay.data?.id) {
          if (!silent) {
            router.push(`/${locale}/accounting/payments/${newPay.data.id}`);
            return;
          }
        } else if (newPay && 'id' in newPay) {
          if (!silent) {
            router.push(`/${locale}/accounting/payments/${(newPay as any).id}`);
            return;
          }
        }
      }
      if (!silent) router.refresh();
    } catch (e) {
      console.error(e);
      if (!silent) toast.error('خطأ في حفظ الدفعة');
    } finally {
      if (!silent) setLoading(false);
    }
  };
  const onSubmit = async (data: any) => saveData(data, false);
  useEffect(() => {
    const subscription = watch((value, {
      name,
      type: changeType
    }) => {
      if (changeType === 'change') {
        if (!initialData?.id) {
          // Do not auto-save new records to prevent duplicate creation errors
          return;
        } else if (initialData?.id && !isPosted) {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = setTimeout(() => handleSubmit(d => saveData(d, true))(), 1500);
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
  }, [watch, initialData?.id, isPosted, handleSubmit]);
  useEffect(() => {
    setFormStatus({
      isSaving: isSubmitting || loading,
      hasUnsavedChanges: isDirty,
      saveTriggerFn: handleSubmit(onSubmit),
      discardTriggerFn: () => router.push(`/${locale}/accounting/payments`)
    });
    return () => clearStatus();
  }, [isSubmitting, loading, isDirty, router, locale, handleSubmit]);
  const handleConfirm = async () => {
    if (!initialData?.id) return;
    try {
      await confirmPayment(initialData.id);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-white border border-slate-300 shadow-sm w-full rounded-sm min-h-[600px] relative">
      <div className="border-b border-slate-200 p-3 flex justify-between items-center bg-white sticky top-0 z-10">
        <div className="flex gap-2 items-center">
          {!isPosted && (
            <>
              {initialData?.id && (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="bg-[#017E84] text-white px-3 py-1.5 rounded-sm hover:bg-indigo-700 text-sm font-medium flex items-center gap-2"
                >
                  <Check className="w-4 h-4" /> تأكيد
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex bg-white border border-slate-300 rounded-sm overflow-hidden text-xs font-bold">
          <div className={`px-3 py-1.5 ${state === 'draft' ? 'bg-[#017E84] text-white' : 'bg-slate-50 text-slate-500'}`}>مسودة</div>
          <div className={`px-3 py-1.5 ${state === 'posted' ? 'bg-[#017E84] text-white' : 'bg-slate-50 text-slate-500 border-r'}`}>مرحل</div>
        </div>
      </div>
      
      <div className="p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {initialData?.name || (paymentType === 'inbound' ? 'استلام نقدية' : 'دفع نقدية')}
            </h1>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="inbound"
                  {...register('paymentType')}
                  disabled={isPosted}
                  className="accent-indigo-600"
                  onChange={() => setValue('partnerType', 'customer')}
                />
                <span className="text-sm font-bold">استلام (قبض)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="outbound"
                  {...register('paymentType')}
                  disabled={isPosted}
                  className="accent-indigo-600"
                  onChange={() => setValue('partnerType', 'supplier')}
                />
                <span className="text-sm font-bold">إرسال (دفع)</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">نوع الشريك</label>
              <select
                {...register('partnerType')}
                disabled={isPosted}
                className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500"
              >
                <option value="customer">عميل</option>
                <option value="supplier">مورد</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">الشريك</label>
              <select
                {...register('partnerId')}
                disabled={isPosted}
                className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500"
              >
                <option value="">(اختر شريك)</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">المبلغ</label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', {
                    required: true,
                    valueAsNumber: true,
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = convertArabicToEnglishNumbers(e.target.value);
                      setValue('amount', val ? parseFloat(val) : 0, {
                        shouldValidate: true,
                        shouldDirty: true
                      });
                    }
                  })}
                  disabled={isPosted}
                  className="w-full text-xl font-bold border-b border-slate-300 py-1 bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500"
                />
                <span className="ml-2 font-bold text-slate-500">EGP</span>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700">التاريخ</label>
              <input
                type="date"
                {...register('date')}
                disabled={isPosted}
                className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">الدفتر (Journal)</label>
              <select
                {...register('journalId', { required: true })}
                disabled={isPosted}
                className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500"
              >
                <option value="">(اختر الدفتر)</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.name} ({j.type})</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">يجب أن يكون دفتراً بنكياً أو نقدياً.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">بيان / مرجع</label>
              <input
                type="text"
                {...register('ref')}
                disabled={isPosted}
                className="w-full border-b border-slate-300 py-1 text-sm bg-transparent outline-none focus:border-[#017E84] disabled:text-slate-500"
                placeholder="Memo"
              />
            </div>
          </div>
        </div>
      </div>
      
      {initialData?.id && (
        <div className="mt-6">
          <Chatter model="payment" id={initialData.id} />
        </div>
      )}

      {/* Attachments */}
      {initialData?.id && (
        <div className="mt-4">
          <AttachmentPanel model="payment" recordId={initialData.id} />
        </div>
      )}
      
    </div>
  );
}