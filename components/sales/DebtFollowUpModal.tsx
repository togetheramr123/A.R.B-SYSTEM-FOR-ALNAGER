"use client";
import React from "react";

import { useState, useEffect } from "react";
import { createFollowUp } from "@/app/actions/followup";
import { toast } from "sonner";
import { Calendar, Users, FileText, CheckCircle2, X, SkipForward } from "lucide-react";
import { getUsers } from "@/app/actions/settings";
/* Needed to fetch users for Admin */
interface DebtFollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partnerId: string;
  saleOrderId?: string;
  invoiceId?: string;
  isAdmin: boolean;
  currentUserId: string;
  onSuccess?: (date: Date) => void;
  onSkip?: () => void;
}
export function DebtFollowUpModal({
  open,
  onOpenChange,
  partnerId,
  saleOrderId,
  invoiceId,
  isAdmin,
  currentUserId,
  onSuccess,
  onSkip
}: DebtFollowUpModalProps) {
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [assignedUserId, setAssignedUserId] = useState(currentUserId);
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (open && isAdmin && users.length === 0) {
      getUsers().then(data => setUsers(data));
    }
  }, [open, isAdmin]);
  if (!open) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpDate) return toast.error("يرجى تحديد تاريخ المتابعة");
    setIsSubmitting(true);
    try {
      await createFollowUp({
        partnerId,
        assignedUserId,
        followUpDate: new Date(followUpDate),
        notes,
        saleOrderId,
        invoiceId
      });
      toast.success("تم تفعيل متابعة مديونية العميل بنجاح");
      if (onSuccess) {
        onSuccess(new Date(followUpDate));
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ المتابعة");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] rtl p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />

      {/* Modal — Odoo 17 Style */}
      <div className="bg-white rounded shadow-xl w-full max-w-[560px] flex flex-col overflow-hidden relative z-10 border border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white">
          <h2 className="text-base font-semibold text-slate-800">
            جدولة متابعة تحصيل
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Assigned User */}
          <div className="grid grid-cols-[130px_1fr] items-center gap-3">
            <label className="text-sm font-medium text-slate-700 text-right">
              المسؤول عن المتابعة
            </label>
            {isAdmin ? (
              <select
                value={assignedUserId}
                onChange={e => setAssignedUserId(e.target.value)}
                className="w-full border-b border-slate-300 focus:border-slate-800 outline-none py-1.5 text-sm bg-transparent transition-colors"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-slate-600 py-1.5 border-b border-slate-200">
                سيتم التعيين لك تلقائياً
              </div>
            )}
          </div>

          {/* Follow-up Date */}
          <div className="grid grid-cols-[130px_1fr] items-center gap-3">
            <label className="text-sm font-medium text-slate-700 text-right">
              تاريخ المتابعة
            </label>
            <input autoComplete="off" autoCorrect="off" spellCheck={false}
              type="datetime-local"
              required
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="w-full border-b border-slate-300 focus:border-slate-800 outline-none py-1.5 text-sm bg-transparent transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="grid grid-cols-[130px_1fr] items-start gap-3">
            <label className="text-sm font-medium text-slate-700 text-right pt-1.5">
              ملاحظات
            </label>
            <textarea
              rows={2}
              placeholder="مثال: وعد بالسداد يوم الأحد القادم..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded focus:border-slate-500 outline-none px-2.5 py-1.5 text-sm bg-transparent transition-colors resize-none"
            />
          </div>

          {/* Info */}
          <div className="bg-sky-50 text-sky-800 text-xs p-2.5 rounded border border-sky-200 flex items-start gap-2">
            <span className="shrink-0 mt-0.5">💡</span>
            <span>سيقوم النظام بمتابعة رصيد العميل تلقائياً وإلغاء المهمة عند سداد الرصيد بالكامل.</span>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center gap-2 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#017E84] hover:bg-[#015e63] text-white px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isSubmitting ? "جاري الحفظ..." : "تأكيد وترحيل"}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                تخطي وتأكيد مباشرة
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="text-slate-500 hover:text-slate-700 px-3 py-2 text-sm font-medium transition-colors mr-auto"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}