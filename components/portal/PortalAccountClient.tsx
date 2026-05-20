'use client';
import React from "react";

import { useState } from 'react';
import { FileText, Clock, CheckCircle2, FileDown, Plus, Loader2 } from 'lucide-react';
import { requestAccountStatement } from '@/app/actions/portalAccount';
type StatementRequest = {
  id: string;
  status: string;
  notes: string | null;
  responseNote: string | null;
  responseFile: string | null;
  createdAt: string;
};
export default function PortalAccountClient({
  initialStatements
}: {
  initialStatements: StatementRequest[];
}) {
  const [statements, setStatements] = useState(initialStatements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await requestAccountStatement(notes);
    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      setNotes('');
      new Date().toISOString();
    }
  };
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'جاري المراجعة',
          icon: Clock,
          color: 'text-amber-500',
          bg: 'bg-amber-50'
        };
      case 'completed':
        return {
          label: 'مكتمل',
          icon: CheckCircle2,
          color: 'text-emerald-500',
          bg: 'bg-emerald-50'
        };
      default:
        return {
          label: status,
          icon: Clock,
          color: 'text-slate-500',
          bg: 'bg-slate-50'
        };
    }
  };
  
  const handleDownload = (fileDataUrl: string, date: string) => {
    const a = document.createElement('a');
    a.href = fileDataUrl;
    a.download = `كشف_حساب_${new Date(date).toLocaleDateString('ar-EG').replace(/\//g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">سجل كشوفات الحساب</h2>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-sm hover:bg-slate-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> طلب جديد
        </button>
      </div>

      {statements.length > 0 ? (
        <div className="space-y-4">
          {statements.map(req => {
            const statusInfo = getStatusInfo(req.status);
            const StatusIcon = statusInfo.icon;
            return (
              <div key={req.id} className="bg-white rounded-sm border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${statusInfo.bg} ${statusInfo.color}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800"> طلب كشف حساب </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" /> {statusInfo.label}
                  </span>
                </div>
                {req.notes && (
                  <div className="bg-slate-50 rounded-sm p-3 mb-3 border border-slate-100">
                    <p className="text-xs text-slate-600"><span className="font-bold text-slate-800">ملاحظتك:</span> {req.notes}</p>
                  </div>
                )}
                {req.status === 'completed' && req.responseFile && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    {req.responseNote && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-sm border border-emerald-100">
                        <span className="font-bold">رد المحاسب:</span> {req.responseNote}
                      </p>
                    )}
                    <button onClick={() => handleDownload(req.responseFile!, req.createdAt)} className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-sm shadow-sm transition-colors">
                      <FileDown className="w-5 h-5" /> تحميل كشف الحساب (PDF)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-sm border border-slate-100 border-dashed">
          <FileText className="w-16 h-16 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500 font-medium">لم تطلب أي كشف حساب بعد</p>
          <p className="text-xs text-slate-400 mt-1">اضغط على زر طلب جديد لتحديد الفترة المطلوبة</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-sm w-full max-w-sm overflow-hidden shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">طلب كشف حساب</h3>
              <p className="text-xs text-slate-500 mb-6">سيتم إرسال طلبك للمحاسب المختص لإصدار كشف الحساب ورفعه لك هنا بصيغة PDF.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">ملاحظات للمحاسب (اختياري)</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: أحتاج كشف حساب عن الربع الأول من العام أو شهر مارس فقط..." className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-sm text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none resize-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-sm transition-colors"> إلغاء </button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-sm transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70">
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال الطلب'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}