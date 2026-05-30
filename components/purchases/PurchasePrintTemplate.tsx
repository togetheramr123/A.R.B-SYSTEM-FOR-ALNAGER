"use client";

import React from "react";
import { tafqeet } from "@/lib/utils/tafqeet";

interface PurchasePrintTemplateProps {
  order: any;
  locale: string;
  design?: "1" | "2";
}

export default function PurchasePrintTemplate({
  order,
  locale: _locale,
  design = "1"
}: PurchasePrintTemplateProps) {
  
  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const isQuotation = order.status === "draft" || order.status === "sent";
  const orderTypeLabel = isQuotation ? "طلب عرض سعر" : "أمر شراء";
  const buyer = order.user?.name || "عبدالعزيز"; 

  const amountUntaxed = Number(order.amountUntaxed) || 0;
  const amountTax = Number(order.amountTax) || 0;
  const amountTotal = Number(order.amountTotal) || 0;

  const totalDiscount = order.lines.reduce((sum: number, line: any) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.priceUnit) || 0;
    const discPercentage = Number(line.discount1) || Number(line.discount) || 0;
    const discountValue = (qty * price * discPercentage) / 100;
    return sum + discountValue;
  }, 0);

  const totalBeforeDiscount = amountUntaxed + totalDiscount;

  return (
    <div className="bg-white text-black font-sans relative" dir="rtl" style={{ width: '21cm', minHeight: '29.7cm', maxHeight: '29.7cm', padding: '1.2cm 1.5cm', boxSizing: 'border-box', overflow: 'hidden' }}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-3 border-b-2 border-slate-300">
        <div className="text-right">
          <h1 className="text-2xl font-black text-slate-900 leading-tight">{order.company?.name || "النجار للأدوات الصحية"}</h1>
        </div>
        <div className="flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.company?.logo || '/hsn-logo.png'} alt="HSN GROUP" className="h-12 object-contain" />
        </div>
      </div>

      {/* Meta Info Row 1 */}
      <div className="flex justify-between items-center mb-3 text-[13px] font-bold text-slate-800">
        <div>
          <span>رقم {orderTypeLabel} : {order.name}</span>
        </div>
        <div className="text-center">
          <span>تحريرا في : {formatDate(order.dateOrder)}</span>
        </div>
        <div>
          <span>نوع الفاتورة : دفتر / المشتريات</span>
        </div>
      </div>

      {/* Meta Info Row 2 */}
      <div className="flex justify-between items-center mb-5 text-[15px] font-bold text-slate-900">
        <div>
          <span>أسم العميل : {order.partner?.name || "-"}</span>
        </div>
        <div>
          <span>مسئول البيع : {buyer}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="border border-slate-500 mb-4">
        <table className="w-full text-[12px] text-center border-collapse">
          <thead className="bg-slate-100 font-bold text-slate-900">
            <tr>
              <th className="py-1.5 px-1 border border-slate-400 w-8">م.</th>
              <th className="py-1.5 px-1 border border-slate-400">اسم الصنف</th>
              <th className="py-1.5 px-1 border border-slate-400 w-16">الكمية</th>
              <th className="py-1.5 px-1 border border-slate-400 w-14">الوحدة</th>
              <th className="py-1.5 px-1 border border-slate-400 w-20">سعر الوحدة</th>
              <th className="py-1.5 px-1 border border-slate-400 w-16">{design === "2" ? "الخصم %" : "قيمة الخصم"}</th>
              <th className="py-1.5 px-1 border border-slate-400 w-20">الاجمالي</th>
              <th className="py-1.5 px-1 border border-slate-400 w-24">الكمية الثانوية</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line: any, index: number) => {
              const qty = Number(line.quantity) || 0;
              const price = Number(line.priceUnit) || 0;
              const discPercentage = Number(line.discount1) || Number(line.discount) || 0;
              const discountValue = (qty * price * discPercentage) / 100;
              const subtotal = Number(line.priceSubtotal) || 0;
              const secondaryQty = Number(line.secondaryQuantity) || 0;
              const secondaryUomName = line.product?.secondaryUom || "";

              return (
                <tr key={line.id} className="border-b border-slate-300">
                  <td className="py-2 px-1 border-l border-slate-400">{index + 1}</td>
                  <td className="py-2 px-2 border-l border-slate-400 text-right text-[12px] font-semibold">{line.product?.name || line.name || "-"}</td>
                  <td className="py-2 px-1 border-l border-slate-400">{qty.toFixed(1)}</td>
                  <td className="py-2 px-1 border-l border-slate-400">{line.product?.uom || "قطعه"}</td>
                  <td className="py-2 px-1 border-l border-slate-400">{price.toFixed(2)}</td>
                  <td className="py-2 px-1 border-l border-slate-400">{design === "2" ? `${discPercentage.toFixed(0)}%` : discountValue.toFixed(1)}</td>
                  <td className="py-2 px-1 border-l border-slate-400">{subtotal.toFixed(1)}</td>
                  <td className="py-2 px-1 font-semibold">
                    {secondaryQty > 0 ? `${secondaryUomName} / ${secondaryQty.toFixed(0)}` : "0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Table */}
      <div className="border border-slate-500 mb-4 w-full">
        <table className="w-full text-[13px] text-center font-bold text-slate-800 border-collapse">
          <tbody>
            <tr className="border-b border-slate-400">
              <td className="py-2 text-right pr-4 w-2/3">الإجمالي قبل الخصم</td>
              <td className="py-2 border-r border-slate-400 text-left pl-4 w-1/3">{totalBeforeDiscount.toFixed(1)}</td>
            </tr>
            <tr className="border-b border-slate-400">
              <td className="py-2 text-right pr-4">الخصم</td>
              <td className="py-2 border-r border-slate-400 text-left pl-4">{totalDiscount.toFixed(1)}</td>
            </tr>
            <tr className="border-b border-slate-400">
              <td className="py-2 text-right pr-4">الضريبة</td>
              <td className="py-2 border-r border-slate-400 text-left pl-4">{amountTax.toFixed(1)}</td>
            </tr>
            <tr>
              <td className="py-2 text-right pr-4 text-[15px]">الصافي بعد الخصم</td>
              <td className="py-2 border-r border-slate-400 text-[15px] text-left pl-4">{amountTotal.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tafqeet Section */}
      <div className="text-right mb-4">
        <h3 className="text-[15px] font-bold text-slate-900 mb-1">اجمالي {orderTypeLabel} : {Math.round(amountTotal)} فقط لا غير</h3>
        <p className="text-[13px] font-bold text-slate-700">{tafqeet(amountTotal)}</p>
      </div>
      
      {/* Notes */}
      {order.note && (
        <div className="text-right border-t border-slate-400 pt-2 mt-2">
          <h4 className="font-bold text-slate-900 text-[13px] mb-1">ملاحظات:</h4>
          <p className="text-[12px] text-slate-700 whitespace-pre-wrap">{order.note}</p>
        </div>
      )}

      {/* Page Number Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-slate-400 font-bold" style={{ bottom: '1cm' }}>
        الصفحة: 1/1
      </div>
    </div>
  );
}
