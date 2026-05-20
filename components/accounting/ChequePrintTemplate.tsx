"use client";

import React from "react";
import { tafqeet } from "@/lib/utils/tafqeet";

interface ChequePrintTemplateProps {
  cheque: any;
  locale: string;
}

export default function ChequePrintTemplate({
  cheque,
  locale
}: ChequePrintTemplateProps) {

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  return (
    <div className="bg-white text-black print-container relative w-full h-[10cm] border border-gray-200 shadow-sm print:border-0 print:shadow-none font-sans overflow-hidden" dir="rtl">
      
      {/* Control Bar (No Print) */}
      <div className="absolute top-2 left-2 flex gap-2 no-print z-10">
        <button onClick={() => window.print()} className="bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-700 transition text-sm" title="Print">
          طباعة الشيك
        </button>
      </div>

      {/* Simulated Cheque Dimensions & Layout Note: Real cheque printing usually requires exact absolute positioning. Here we provide a standardized layout that matches typical bank cheques. */}
      <div className="relative w-full h-full p-8 text-lg font-bold text-slate-800">
        
        {/* Date */}
        <div className="absolute top-[2.5cm] left-[3cm] tracking-widest text-xl">
          {formatDate(cheque.dueDate)}
        </div>

        {/* Payee Name */}
        <div className="absolute top-[4cm] right-[5cm] whitespace-nowrap overflow-hidden max-w-[12cm]">
          {cheque.partner?.name || "__________________________"}
        </div>

        {/* Amount in Numbers */}
        <div className="absolute top-[4.5cm] left-[2.5cm] border-2 border-slate-800 px-4 py-1 rounded text-2xl tracking-wider">
          **
          {Number(cheque.amount).toLocaleString("en-US", {
            minimumFractionDigits: 2
          })}
          **
        </div>

        {/* Amount in Words */}
        <div className="absolute top-[5.5cm] right-[3.5cm] leading-relaxed max-w-[13cm]">
          {tafqeet(cheque.amount)}
        </div>

        {/* Optional Memo / Notes */}
        {cheque.notes && (
          <div className="absolute bottom-[1.5cm] right-[1cm] text-sm text-slate-500 font-normal">
            ملاحظات: {cheque.notes}
          </div>
        )}

        {/* Signature Placeholder */}
        <div className="absolute bottom-[1.5cm] left-[3cm] border-b border-dashed border-slate-400 w-[4cm] text-center text-xs text-slate-300 font-normal pb-1">
          التوقيع
        </div>

      </div>

    </div>
  );
}