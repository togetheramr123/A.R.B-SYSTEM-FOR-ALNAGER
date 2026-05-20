"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "danger",
  onConfirm,
  onCancel,
  loading = false
}: ConfirmDialogProps) {
  if (!open) return null;
  const variantStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700 text-white border-transparent"
    },
    warning: {
      button: "bg-amber-600 hover:bg-amber-700 text-white border-transparent"
    },
    default: {
      button: "bg-[#017E84] hover:bg-[#01686c] text-white border-transparent"
    }
  };
  const style = variantStyles[variant];
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center" dir="rtl">
      {" "}
      {/* Backdrop */}{" "}
      <div className="absolute inset-0 bg-slate-900/40 transition-opacity" onClick={onCancel} />{" "}
      {/* Dialog */}{" "}
      <div className="relative bg-white shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        {" "}
        {/* Header */}{" "}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {title}
          </h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {" "}
        {/* Body */}{" "}
        <div className="px-6 py-6 text-slate-600 text-[15px] leading-relaxed">
          {message}
        </div>
        {" "}
        {/* Footer */}{" "}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 justify-end">
          <button id="confirm-dialog-confirm-btn" onClick={onConfirm} disabled={loading} className={`px-5 py-2 text-sm font-medium transition-colors border shadow-sm ${style.button} disabled:opacity-50 min-w-[90px]`}>
            {loading ? "جاري التنفيذ..." : confirmLabel}
          </button>
          <button onClick={onCancel} disabled={loading} className="px-5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50">
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>;
}