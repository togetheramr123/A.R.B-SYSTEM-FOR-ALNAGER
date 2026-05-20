"use client";

import React, { useMemo } from "react";
import { tafqeet } from "@/lib/utils/tafqeet";

interface PaymentPrintTemplateProps {
  payment: any;
  locale: string;
}

export default function PaymentPrintTemplate({
  payment,
  locale: _locale
}: PaymentPrintTemplateProps) {
  const isReceipt = payment.paymentType === "inbound";

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const typeLabel = isReceipt ? "سند قبض" : "سند صرف";
  const typeSubtitle = isReceipt ? "Receipt Voucher" : "Payment Voucher";
  const partnerLabel = isReceipt ? "استلمنا من السيد/ة" : "صرفنا إلى السيد/ة";

  return (
    <div className="p-10 bg-white text-black min-h-[29.7cm] font-sans" dir="rtl">
      
      {/* Header Area */}
      <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-200">
        <div className="flex flex-col gap-1 items-start">
          {payment.company?.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={payment.company.logo} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="h-16 flex items-center">
              <span className="text-3xl font-black text-indigo-800 tracking-tighter">H&N GROUP</span>
            </div>
          )}
        </div>

        <div className="text-left flex flex-col items-end">
          <h1 className="text-2xl font-bold text-slate-900">{payment.company?.name || "النجار للأدوات الصحية"}</h1>
          <h2 className="text-xl font-bold text-slate-700 mt-1">{typeLabel}</h2>
          <p className="text-slate-500 font-medium">{typeSubtitle}</p>
        </div>
      </div>

      {/* Meta Info Row */}
      <div className="flex justify-between items-center mb-8 text-sm font-bold text-slate-800 bg-slate-50 p-4 border border-slate-200">
        <div>
          <span>رقم السند : {payment.name || "-"}</span>
        </div>
        <div className="text-center">
          <span>تحريرا في : {formatDate(payment.date)}</span>
        </div>
        <div>
          <span>طريقة الدفع : {payment.journal?.name || "صندوق / بنك"}</span>
        </div>
      </div>

      {/* Partner Info */}
      <div className="mb-10 text-xl leading-loose">
        <div className="flex gap-4">
          <span className="font-bold text-slate-800 w-48">{partnerLabel} :</span>
          <span className="border-b-2 border-slate-400 border-dotted flex-1 font-bold text-slate-900 px-4">{payment.partner?.name || "-"}</span>
        </div>
        <div className="flex gap-4 mt-6">
          <span className="font-bold text-slate-800 w-48">مبلغا وقدره :</span>
          <span className="border-b-2 border-slate-400 border-dotted flex-1 font-bold text-slate-900 px-4">{tafqeet(payment.amount)}</span>
        </div>
        <div className="flex gap-4 mt-6">
          <span className="font-bold text-slate-800 w-48">وذلك عن (البيان) :</span>
          <span className="border-b-2 border-slate-400 border-dotted flex-1 font-medium text-slate-800 px-4">{payment.ref || "..................................................."}</span>
        </div>
      </div>

      {/* Amount Box */}
      <div className="flex justify-end mb-16">
        <div className="border-4 border-slate-800 px-8 py-4 flex flex-col items-center justify-center min-w-[250px]">
          <span className="text-sm font-bold text-slate-500 mb-2">المبلغ (ج.م)</span>
          <span className="text-4xl font-bold text-slate-900">{Number(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-24 border-t-2 border-slate-800 pt-8">
        <div className="text-center">
          <p className="font-bold text-slate-800 mb-20">المُستلم</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 mb-20">المحاسب</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 mb-20">المدير المالي / الاعتماد</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
        </div>
      </div>

    </div>
  );
}