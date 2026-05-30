"use client";

import React, { useMemo } from "react";
import { tafqeet } from "@/lib/utils/tafqeet";

interface InvoicePrintTemplateProps {
  invoice: any;
  locale: string;
  mode?: "simple" | "detailed";
  design?: "1" | "2";
}

export default function InvoicePrintTemplate({
  invoice,
  locale: _locale,
  mode = "detailed",
  design = "1"
}: InvoicePrintTemplateProps) {
  
  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const isSales = invoice.type === "out_invoice" || invoice.type === "out_refund";
  const isRefund = invoice.type === "out_refund" || invoice.type === "in_refund";

  let invoiceTypeLabel = "دفتر / ";
  if (isSales) {
    invoiceTypeLabel += "المبيعات";
  } else {
    invoiceTypeLabel += "المشتريات";
  }
  
  if (isRefund) {
    invoiceTypeLabel += " (مرتجع)";
  }

  const partnerLabel = isSales ? "أسم العميل" : "أسم المورد";
  const salesperson = invoice.user?.name || invoice.salesperson?.name || "عبدالعزيز"; // Fallback as in design

  const totalDiscount = invoice.lines.reduce((sum: number, line: any) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.priceUnit) || 0;
    const discPercentage = Number(line.discount1) || Number(line.discount) || 0;
    const discountValue = (qty * price * discPercentage) / 100;
    return sum + discountValue;
  }, 0);

  const amountUntaxed = Number(invoice.amountUntaxed) || 0;
  const amountTax = Number(invoice.amountTax) || 0;
  const amountTotal = Number(invoice.amountTotal) || 0;
  // Calculate total before discount (amountUntaxed + totalDiscount)
  const totalBeforeDiscount = amountUntaxed + totalDiscount;

  return (
    <div className="p-10 bg-white text-black min-h-[29.7cm] font-sans" dir="rtl">
      
      {/* Header Area */}
      <div className="flex justify-between items-center mb-10 pb-4 border-b border-slate-200">
        <div className="flex flex-col gap-1 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={invoice.company?.logo || '/hsn-logo.png'} alt="HSN GROUP" className="h-16 object-contain" />
        </div>

        <div className="text-left">
          <h1 className="text-3xl font-bold text-slate-900">{invoice.company?.name || "النجار للأدوات الصحية"}</h1>
        </div>
      </div>

      {/* Meta Info Row 1 */}
      <div className="flex justify-between items-center mb-8 text-sm font-bold text-slate-800">
        <div>
          <span>نوع الفاتورة : {invoiceTypeLabel}</span>
        </div>
        <div className="text-center">
          <span>تحريرا في : {formatDate(invoice.dateInvoice)}</span>
        </div>
        <div>
          <span>رقم الفاتورة : {invoice.name}</span>
        </div>
      </div>

      {/* Meta Info Row 2 */}
      <div className="flex justify-between items-center mb-6 text-lg font-bold text-slate-900">
        <div>
          <span>مسئول البيع : {salesperson}</span>
        </div>
        <div>
          <span>{partnerLabel} : {invoice.partner?.name || "-"}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="border-2 border-slate-800 mb-6">
        <table className="w-full text-sm text-center">
          <thead className="bg-slate-50 border-b-2 border-slate-800 font-bold text-slate-900">
            <tr>
              <th className="py-2 px-2 border-l border-slate-400 w-12">م.</th>
              <th className="py-2 px-2 border-l border-slate-400">اسم الصنف</th>
              <th className="py-2 px-2 border-l border-slate-400 w-24">الكمية</th>
              <th className="py-2 px-2 border-l border-slate-400 w-20">الوحدة</th>
              <th className="py-2 px-2 border-l border-slate-400 w-24">سعر الوحدة</th>
              <th className="py-2 px-2 border-l border-slate-400 w-24">{design === "2" ? "الخصم %" : "قيمة الخصم"}</th>
              <th className="py-2 px-2 border-l border-slate-400 w-28">الاجمالي</th>
              <th className="py-2 px-2 w-32">ك. ثانوية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {invoice.lines.map((line: any, index: number) => {
              const qty = Number(line.quantity) || 0;
              const price = Number(line.priceUnit) || 0;
              const discPercentage = Number(line.discount1) || Number(line.discount) || 0;
              const discountValue = (qty * price * discPercentage) / 100;
              const subtotal = Number(line.priceSubtotal) || 0;
              const secondaryQty = Number(line.secondaryQuantity) || 0;
              const secondaryUomName = line.product?.secondaryUom?.name || "";

              return (
                <tr key={line.id}>
                  <td className="py-3 px-2 border-l border-slate-400">{index + 1}</td>
                  <td className="py-3 px-2 border-l border-slate-400 text-right">{line.product?.name || line.name}</td>
                  <td className="py-3 px-2 border-l border-slate-400">{qty.toFixed(1)}</td>
                  <td className="py-3 px-2 border-l border-slate-400">{line.product?.uom?.name || "قطعه"}</td>
                  <td className="py-3 px-2 border-l border-slate-400">{price.toFixed(2)}</td>
                  <td className="py-3 px-2 border-l border-slate-400">{design === "2" ? `${discPercentage.toFixed(0)}%` : discountValue.toFixed(2)}</td>
                  <td className="py-3 px-2 border-l border-slate-400">{subtotal.toFixed(2)}</td>
                  <td className="py-3 px-2 font-semibold">
                    {secondaryQty > 0 ? (
                       `${secondaryUomName} / ${secondaryQty.toFixed(1)}`
                    ) : (
                      "0.0"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Totals Table */}
      <div className="border-2 border-slate-800 mb-8">
        <table className="w-full text-sm text-center font-bold text-slate-800">
          <tbody className="divide-y divide-slate-400">
            <tr>
              <td className="py-3 w-3/4 text-right pr-6">الإجمالي قبل الخصم</td>
              <td className="py-3 w-1/4 border-r border-slate-400 text-left pl-6">{totalBeforeDiscount.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-3 text-right pr-6">الخصم</td>
              <td className="py-3 border-r border-slate-400 text-left pl-6">{totalDiscount.toFixed(2)}</td>
            </tr>
            {design === "2" && (
              <tr>
                <td className="py-3 text-right pr-6">السعر بعد الخصم</td>
                <td className="py-3 border-r border-slate-400 text-left pl-6">{amountUntaxed.toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td className="py-3 text-right pr-6">الضريبة</td>
              <td className="py-3 border-r border-slate-400 text-left pl-6">{amountTax.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-3 text-right pr-6 text-lg">الصافي بعد الخصم</td>
              <td className="py-3 border-r border-slate-400 text-lg text-left pl-6">{amountTotal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Tafqeet Section */}
      <div className="text-right">
        <h3 className="text-xl font-bold text-slate-900 mb-2">اجمالي الفاتورة : {amountTotal.toFixed(2)} فقط لا غير</h3>
        <p className="text-lg font-bold text-slate-800">{tafqeet(amountTotal)}</p>
      </div>

    </div>
  );
}