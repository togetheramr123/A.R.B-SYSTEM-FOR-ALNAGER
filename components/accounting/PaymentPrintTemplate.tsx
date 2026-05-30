"use client";

import React from "react";
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
    if (!date) return "";
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const typeLabel = isReceipt ? "سند قبض" : "سند صرف";
  const typeSubtitle = isReceipt ? "Receipt Voucher" : "Payment Voucher";
  const partnerLabel = isReceipt ? "استلمنا من السيد/ة" : "صرفنا إلى السيد/ة";

  return (
    <div className="bg-white text-black font-sans relative" dir="rtl" style={{ width: '21cm', minHeight: '29.7cm', maxHeight: '29.7cm', padding: '1.2cm 1.5cm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* Header Area */}
      <div className="flex justify-between items-start mb-6 pb-3 border-b-2 border-slate-300">
        <div className="text-right">
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{payment.company?.name || "النجار للأدوات الصحية"}</h1>
          <h2 className="text-xl font-bold text-slate-700 mt-1">{typeLabel}</h2>
          <p className="text-sm text-slate-500 font-medium">{typeSubtitle}</p>
        </div>
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={payment.company?.logo || '/hsn-logo.png'} alt="HSN GROUP" className="h-12 object-contain" />
        </div>
      </div>

      {/* Meta Info Row */}
      <div className="flex justify-between items-center mb-6 text-[13px] font-bold text-slate-800 bg-slate-50 p-3 border border-slate-200">
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
      <div className="mb-8 text-lg leading-loose">
        <div className="flex gap-4">
          <span className="font-bold text-slate-800 w-44">{partnerLabel} :</span>
          <span className="border-b-2 border-slate-400 border-dotted flex-1 font-bold text-slate-900 px-4">{payment.partner?.name || "-"}</span>
        </div>
        <div className="flex gap-4 mt-5">
          <span className="font-bold text-slate-800 w-44">مبلغا وقدره :</span>
          <span className="border-b-2 border-slate-400 border-dotted flex-1 font-bold text-slate-900 px-4">{tafqeet(payment.amount)}</span>
        </div>
        <div className="flex gap-4 mt-5">
          <span className="font-bold text-slate-800 w-44">وذلك عن (البيان) :</span>
          <span className="border-b-2 border-slate-400 border-dotted flex-1 font-medium text-slate-800 px-4">{payment.ref || "..................................................."}</span>
        </div>
      </div>

      {/* Amount Box */}
      <div className="flex justify-end mb-12">
        <div className="border-4 border-slate-800 px-8 py-4 flex flex-col items-center justify-center min-w-[220px]">
          <span className="text-sm font-bold text-slate-500 mb-2">المبلغ (ج.م)</span>
          <span className="text-3xl font-bold text-slate-900">{Number(payment.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-3 gap-8 mt-16 border-t-2 border-slate-800 pt-6">
        <div className="text-center">
          <p className="font-bold text-slate-800 mb-16">المُستلم</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 mb-16">المحاسب</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 mb-16">المدير المالي / الاعتماد</p>
          <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto"></div>
        </div>
      </div>

      {/* Page Number Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-slate-400 font-bold" style={{ bottom: '1cm' }}>
        الصفحة: 1/1
      </div>
    </div>
  );
}