"use client";
import React from "react";

import { useState, useEffect } from 'react';
import { processFollowUpAction } from '@/app/actions/followup';
import { getPartnerLedgerWidgetData } from '@/app/actions/accounting';
import { toast } from 'sonner';
import { Calendar, Wallet, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
interface DebtFollowUpActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUp: any;
  id: string;
  partner: {
    id: string;
    name: string;
  };
  notes: string;
  nextFollowUpDate: string;
}
export function DebtFollowUpActionModal({
  open,
  onOpenChange,
  followUp
}: DebtFollowUpActionModalProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextDate, setNextDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'ar';
  useEffect(() => {
    if (open && followUp?.partnerId) {
      setLoading(true);
      getPartnerLedgerWidgetData(followUp.partnerId).then(res => {
        setBalance(res.totalBalance ?? 0);
        setLoading(false);
      }).catch(() => {
        setBalance(0);
        setLoading(false);
      });
    }
  }, [open, followUp]);
  if (!open || !followUp) return null;
  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await processFollowUpAction(followUp.id, 'complete', newNotes || 'تم إنهاء المتابعة.');
      toast.success("تم إغلاق المتابعة بنجاح");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "خطأ أثناء الإغلاق");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSnooze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextDate) return toast.error("يرجى تحديد تاريخ المتابعة القادم");
    setIsSubmitting(true);
    try {
      await processFollowUpAction(followUp.id, 'snooze', newNotes, new Date(nextDate));
      toast.success("تم تحديث وجدولة المتابعة القادمة");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "خطأ أثناء التحديث");
    } finally {
      setIsSubmitting(false);
    }
  };
  const isZeroBalance = balance !== null && balance <= 0;
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center rtl p-4 transition-opacity duration-300"> <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => onOpenChange(false)}></div> <div className="bg-white rounded-sm shadow-sm max-w-lg w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"> <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex items-center gap-3"> <AlertCircle className="w-6 h-6 text-amber-600" /> <h2 className="text-xl font-bold text-amber-900">متابعة مديونية متأخرة</h2> </div> <div className="p-6 space-y-5"> {} <div className="bg-slate-50 p-4 rounded-sm border border-slate-200"> <div className="flex justify-between items-start mb-3"> <div> <h3 className="font-bold text-slate-800 text-lg">{followUp.partner.name}</h3> <Link href={`/${locale}/contacts/${followUp.partnerId}`} className="text-[#017E84] text-sm hover:underline" onClick={() => onOpenChange(false)}> عرض ملف العميل </Link> </div> <div className="text-left"> <div className="text-xs text-slate-500 font-bold mb-1">الرصيد الحالي</div> {loading ? <div className="h-6 w-24 bg-slate-200 animate-pulse rounded"></div> : <div className={`text-xl font-bold font-numbers ${isZeroBalance ? 'text-teal-700' : 'text-red-600'}`}> {balance?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ج.م </div>} </div> </div> <div className="border-t border-slate-200 pt-3 mt-3"> <div className="text-xs text-slate-500 font-bold mb-1">الملاحظات السابقة:</div> <p className="text-sm text-slate-700 bg-white p-2 rounded border border-slate-100">{followUp.notes || "لا توجد ملاحظات سابقة"}</p> </div> </div> {isZeroBalance && !loading ? <div className="bg-emerald-50 text-emerald-800 p-4 rounded-sm border border-emerald-200 flex items-start gap-3"> <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /> <div> <h4 className="font-bold">تم سداد الرصيد بالكامل! 🎉</h4> <p className="text-sm mt-1">العميل ليس عليه أي ديون حالياً. يمكنك إنهاء المتابعة الآن.</p> <button onClick={handleComplete} disabled={isSubmitting} className="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm font-bold text-sm hover:bg-emerald-700 transition-colors"> {isSubmitting ? 'جاري الإنهاء...' : 'إنهاء المتابعة وإغلاق'} </button> </div> </div> : <form onSubmit={handleSnooze} className="space-y-4"> <div> <label className="block text-sm font-bold text-slate-700 mb-1">تحديث الملاحظات (ماذا حدث بعد التواصل؟)</label> <textarea required rows={3} value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="مثال: تم الاتصال وطلب مهلة ليوم الخميس القادم..." className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"></textarea> </div> <div> <label className="block text-sm font-bold text-slate-700 mb-1">تاريخ المتابعة القادم</label> <input type="datetime-local" required value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" /> </div> <div className="pt-2 flex justify-end gap-3"> <button type="button" onClick={() => onOpenChange(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"> تأجيل لاحقاً (إغلاق) </button> <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"> <Clock className="w-4 h-4" /> {isSubmitting ? 'جاري الحفظ...' : 'حفظ الملاحظة وجدولة الموعد القادم'} </button> </div> </form>} </div> </div> </div>;
}