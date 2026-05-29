'use client';

import { useState, useTransition, useRef } from 'react';
import { confirmInvoice, resetToDraftInvoice, registerPayment, createRefund, requestZeroPriceInvoiceApproval, cancelInvoice, notifyManagerInvoiceComplete } from '@/app/actions/accounting';
import { CreditCard, ShieldCheck, RefreshCcw, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, Calendar } from 'lucide-react';
import { DebtFollowUpModal } from '@/components/sales/DebtFollowUpModal';
import { getCurrentUserInfo } from '@/app/actions/followup';
interface InvoiceActionButtonsProps {
  invoiceId: string;
  invoiceName?: string;
  state: string;
  type: string;
  amountResidual: number;
  amountTotal: number;
  partnerName: string;
  partnerId?: string;
  approvalStatus?: string;
  hasZeroPriceItem?: boolean;
  paymentJournals?: any[];
  onTriggerSave?: () => Promise<boolean>;
}
export default function InvoiceActionButtons({
  invoiceId,
  invoiceName,
  state,
  type,
  amountResidual,
  amountTotal,
  partnerName,
  partnerId,
  approvalStatus = 'none',
  hasZeroPriceItem = false,
  paymentJournals = [],
  onTriggerSave
}: InvoiceActionButtonsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDebtFollowUpModal, setShowDebtFollowUpModal] = useState(false);
  const [hasSetFollowUp, setHasSetFollowUp] = useState(false);
  const hasSetFollowUpRef = useRef(false);
  const [userInfo, setUserInfo] = useState({ userId: '', isAdmin: false });
  const [paymentAmount, setPaymentAmount] = useState<number>(amountResidual);

  // Helper to run async actions with loading state
  const runAction = async (fn: () => Promise<void>) => {
    setIsLoading(true);
    try {
      await fn();
    } finally {
      setIsLoading(false);
    }
  };
  
  useState(() => {
    getCurrentUserInfo().then(setUserInfo);
  });
  const isCustomer = type === 'out_invoice' || type === 'out_refund';
  const isInbound = type === 'out_invoice';
  const paymentLabel = isInbound ? "استلام دفعة" : "دفع للمورد";
  const onConfirm = async () => {
    if (type === 'out_invoice' && partnerId && !hasSetFollowUpRef.current) {
      setShowDebtFollowUpModal(true);
      return;
    }
    
    // Removed native confirm() dialog to prevent silent failures if browser blocks dialogs
    
    // If there's a form save trigger, save first
    if (onTriggerSave) {
      try {
        const saved = await onTriggerSave();
        if (!saved) return;
      } catch (e) {
        toast.error('خطأ أثناء الحفظ قبل الترحيل');
        return;
      }
    }
    
    runAction(async () => {
      toast.loading('جاري ترحيل الفاتورة...', { id: 'confirm-invoice' });
      try {
        await confirmInvoice(invoiceId);
        toast.success('تم ترحيل الفاتورة بنجاح', { id: 'confirm-invoice' });
        router.refresh();
      } catch (e: any) {
        toast.error('خطأ أثناء الترحيل: ' + (e.message || 'خطأ غير معروف'), { id: 'confirm-invoice' });
      }
    });
  };
  const onRequestApproval = async () => {
    if (onTriggerSave) {
      try {
        const saved = await onTriggerSave();
        if (!saved) return;
      } catch (e) {
        toast.error('خطأ أثناء الحفظ قبل الترحيل');
        return;
      }
    }
    runAction(async () => {
      try {
        const result = await requestZeroPriceInvoiceApproval(invoiceId);
        if (result.success) {
          toast.success('تم إرسال طلب الموافقة للمدير بنجاح');
          router.refresh();
        } else {
          toast.error((result as any).error || 'حدث خطأ');
        }
      } catch (e: any) {
        toast.error(e.message || 'حدث خطأ');
      }
    });
  };
  const onReset = () => {
    runAction(async () => {
      try {
        await resetToDraftInvoice(invoiceId);
        router.refresh();
      } catch (e: any) {
        toast.error('خطأ أثناء إعادة التعيين: ' + e.message);
      }
    });
  };
  const onCancel = () => {
    runAction(async () => {
      toast.loading('جاري إلغاء الفاتورة...', { id: 'cancel-invoice' });
      try {
        const result = await cancelInvoice(invoiceId);
        if (result?.success) {
          toast.success('تم إلغاء الفاتورة بنجاح', { id: 'cancel-invoice' });
          router.refresh();
        } else {
          toast.error((result as any)?.error || 'حدث خطأ أثناء الإلغاء', { id: 'cancel-invoice' });
        }
      } catch (e: any) {
        toast.error('خطأ أثناء الإلغاء: ' + (e.message || 'خطأ غير معروف'), { id: 'cancel-invoice' });
      }
    });
  };
  const onCreateRefund = () => {
    const label = type === 'out_invoice' ? 'إشعار دائن (Credit Note)' : 'إشعار مدين (Debit Note)';
    runAction(async () => {
      try {
        const result = await createRefund(invoiceId);
        if (result.success && result.id) {
          toast.success(`تم إنشاء ${label} بنجاح`);
          const path = type === 'out_invoice' ? `/ar/accounting/invoices/${result.id}` : `/ar/accounting/bills/${result.id}`;
          router.push(path);
        } else {
          toast.error(result.error || 'خطأ في إنشاء الإشعار');
        }
      } catch (e: any) {
        toast.error('خطأ أثناء إنشاء الإشعار: ' + e.message);
      }
    });
  };
  const handleRegisterPayment = async () => {
    if (paymentAmount <= 0) {
      toast.warning("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }
    {
      try {
        const result = await registerPayment(invoiceId, paymentAmount);
        if (result?.success) {
          setShowPaymentDialog(false);
          router.refresh();
          toast.success('تم تسجيل الدفعة بنجاح', {
            duration: 10000
          });
        } else {
          toast.error(result?.error || 'حدث خطأ غير معروف');
        }
      } catch (e: any) {
        toast.error('خطأ أثناء تسجيل الدفعة: ' + e.message);
      }
    }
    ;
  };
  return <> <div className="flex gap-1.5"> {state === 'draft' && <> {hasZeroPriceItem && approvalStatus !== 'approved' ? <button onClick={onRequestApproval} disabled={isLoading || approvalStatus === 'pending'} className="bg-sky-100 text-sky-800 border border-sky-300 px-3 py-1.5 rounded-sm hover:bg-sky-200 text-sm font-medium disabled:opacity-50"> {isLoading ? 'جاري العمل...' : approvalStatus === 'pending' ? 'قيد انتظار الموافقة' : 'طلب موافقة الإدارة (سعر 0)'} </button> : <button onClick={onConfirm} disabled={isLoading} className="bg-sky-600 text-white px-3 py-1.5 rounded-sm hover:bg-sky-700 text-sm font-medium disabled:opacity-50"> {isLoading ? 'جاري العمل...' : 'تأكيد'} </button>} </>} {(state === 'posted' || state === 'partial') && <> <button onClick={() => {
          setPaymentAmount(amountResidual);
          setShowPaymentDialog(true);
        }} className="bg-sky-600 text-white px-3 py-1.5 rounded-sm hover:bg-sky-700 text-sm font-medium flex items-center gap-1"> تسجيل الدفع </button> <button onClick={onCreateRefund} disabled={isLoading} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium flex items-center gap-1 disabled:opacity-50"> {type === 'out_invoice' ? 'إضافة إشعار دائن' : 'إضافة إشعار مدين'} </button> </>} {(state === 'cancel' || state === 'posted' || state === 'partial') && <button onClick={onReset} disabled={isLoading} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium disabled:opacity-50"> إعادة التعيين كمسودة </button>} {(state === 'posted' || state === 'partial') && <button onClick={() => {
        runAction(async () => {
          try {
            const result = await notifyManagerInvoiceComplete(invoiceId);
            if (result.success) {
              toast.success('تم إرسال إشعار للمدير بإتمام الفاتورة');
            }
          } catch (e: any) {
            toast.error(e.message || 'حدث خطأ');
          }
        });
      }} disabled={isLoading} className="bg-white border border-blue-300 text-blue-700 px-3 py-1.5 rounded-sm hover:bg-blue-50 text-sm font-medium flex items-center gap-1 disabled:opacity-50" title="إشعار المدير بإتمام الفاتورة"> <Bell className="w-3.5 h-3.5" /> إبلاغ المدير </button>} {state !== 'paid' && state !== 'cancel' && <button onClick={onCancel} className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-sm hover:bg-slate-50 text-sm font-medium"> إلغاء </button>} </div> {} {showPaymentDialog && <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50 transition-opacity" onClick={() => setShowPaymentDialog(false)}> <div className="bg-white rounded shadow-sm w-[900px] max-w-[95vw] flex flex-col" onClick={e => e.stopPropagation()}> {} <div className="flex items-center justify-between p-4 border-b border-slate-200"> <h2 className="text-xl font-medium text-slate-800">تسجيل الدفع</h2> <button onClick={() => setShowPaymentDialog(false)} className="text-slate-400 hover:text-slate-600"> <X className="w-5 h-5" /> </button> </div> {} <div className="p-6"> <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6"> {} <div className="space-y-6"> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-800 text-right">دفتر اليومية</label> <select className="w-full border-b border-slate-300 focus:border-slate-800 outline-none pb-1 bg-transparent text-sm"> {paymentJournals.length > 0 ? paymentJournals.map((pj: any) => <option key={pj.id} value={pj.id}>{pj.name}</option>) : <> <option value="bank">البنك / ( CIP ) حساب شخصى</option> <option value="cash">الصندوق (نقدي)</option> </>} </select> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-800 text-right">Branch</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" disabled value="فرع 1" className="w-full border-b border-slate-300 outline-none pb-1 bg-transparent text-sm text-slate-500 cursor-not-allowed text-left" dir="ltr" /> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-800 text-right flex items-center gap-1"> طريقة الدفع <span className="text-blue-500 cursor-help" title="طريقة الدفع المختارة">?</span> </label> <select className="w-full border-b border-slate-300 focus:border-slate-800 outline-none pb-1 bg-transparent text-sm"> <option value="manual">يدوي</option> <option value="check">شيك</option> </select> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-800 text-right">الحساب البنكي المستلم</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" disabled className="w-full border-b border-slate-300 outline-none pb-1 bg-transparent text-sm text-slate-500 cursor-not-allowed" /> </div> </div> {} <div className="space-y-6 lg:pl-4"> <div className="grid grid-cols-[100px_1fr] items-center gap-2"> <label className="text-sm font-bold text-slate-800 text-right">المبلغ</label> <div className="flex gap-2 relative border-b border-slate-300 focus-within:border-slate-800 pb-1"> <div className="text-sm font-semibold flex items-center"> <select className="bg-transparent outline-none text-blue-600 appearance-none font-bold pr-1"> <option>EGP</option> </select> </div> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" value={paymentAmount} onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)} className="w-full outline-none text-sm text-right bg-transparent placeholder-slate-400" dir="ltr" step="0.01" /> </div> {paymentAmount > amountResidual && <div className="col-start-2 mt-1 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200"> المبلغ يتجاوز قيمة الفاتورة ({amountResidual}). سيتم تسوية الفاتورة بالكامل وحفظ باقي المبلغ كرصيد في حساب العميل لترحيله لفواتير أخرى. </div>} </div> <div className="grid grid-cols-[100px_1fr] items-center gap-2"> <label className="text-sm font-bold text-slate-800 text-right">تاريخ الدفع</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border-b border-slate-300 focus:border-slate-800 outline-none pb-1 bg-transparent text-sm text-left" dir="ltr" /> </div> <div className="grid grid-cols-[100px_1fr] items-center gap-2"> <label className="text-sm font-bold text-slate-800 text-right">بيان</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" defaultValue={invoiceName || ''} placeholder="ملاحظة (اختياري)..." className="w-full border-b border-slate-300 focus:border-slate-800 outline-none pb-1 bg-transparent text-sm text-left" dir="ltr" /> </div> </div> </div> </div> <div className="flex items-center gap-3 p-4 border-t border-slate-200"> <button onClick={handleRegisterPayment} disabled={isLoading} className="px-5 py-2 bg-[#017E84] text-white hover:bg-[#5c3d54] rounded-sm text-sm font-medium disabled:opacity-50 min-w-[120px]"> {isLoading ? 'جاري التسجيل...' : 'إنشاء عملية الدفع'} </button> <button onClick={() => setShowPaymentDialog(false)} className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-sm text-sm font-medium"> إلغاء </button> </div> </div> </div>} {showDebtFollowUpModal && partnerId && ( <DebtFollowUpModal open={showDebtFollowUpModal} onOpenChange={setShowDebtFollowUpModal} partnerId={partnerId} invoiceId={invoiceId} isAdmin={userInfo.isAdmin} currentUserId={userInfo.userId} onSuccess={() => { setHasSetFollowUp(true); toast.success("يرجى الآن النقر على 'تأكيد' مرة أخرى لترحيل الفاتورة."); }} onSkip={async () => { 
      hasSetFollowUpRef.current = true; 
      setHasSetFollowUp(true); 
      setShowDebtFollowUpModal(false); 
      
      // If there's a form save trigger, save first
      if (onTriggerSave) {
        try {
          const saved = await onTriggerSave();
          if (!saved) return;
        } catch (e) {
          toast.error('خطأ أثناء الحفظ قبل الترحيل');
          return;
        }
      }
      
      // Confirm directly without another dialog
      runAction(async () => {
        toast.loading('جاري ترحيل الفاتورة...', { id: 'confirm-invoice' });
        try {
          await confirmInvoice(invoiceId);
          toast.success('تم ترحيل الفاتورة بنجاح', { id: 'confirm-invoice' });
          router.refresh();
        } catch (e: any) {
          toast.error('خطأ أثناء الترحيل: ' + (e.message || 'خطأ غير معروف'), { id: 'confirm-invoice' });
        }
      });
    }} /> )} </>;
}