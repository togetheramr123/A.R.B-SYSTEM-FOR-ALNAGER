"use client";

import React from "react";
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
  mode: _mode = "detailed",
  design = "1",
}: InvoicePrintTemplateProps) {
  const formatDate = (date: Date | string) => {
    if (!date) return "";
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const invoiceType = invoice.moveType || invoice.type;
  const isSales =
    invoiceType === "out_invoice" || invoiceType === "out_refund";
  const isRefund =
    invoiceType === "out_refund" || invoiceType === "in_refund";

  let invoiceTypeLabel = isSales ? "دفتر/المبيعات" : "دفتر/المشتريات";
  if (isRefund) invoiceTypeLabel += " (مرتجع)";

  const partnerLabel = isSales ? "أسم العميل" : "أسم المورد";
  const salesperson =
    invoice.user?.name || invoice.salesperson?.name || "عبدالعزيز";

  const totalDiscount = invoice.lines.reduce((sum: number, line: any) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.priceUnit) || 0;
    const discPercentage =
      Number(line.discount1) || Number(line.discount) || 0;
    const discountValue = (qty * price * discPercentage) / 100;
    return sum + discountValue;
  }, 0);

  const amountUntaxed = Number(invoice.amountUntaxed) || 0;
  const amountTax = Number(invoice.amountTax) || 0;
  const amountTotal = Number(invoice.amountTotal) || 0;
  const totalBeforeDiscount = amountUntaxed + totalDiscount;

  return (
    <div
      className="bg-white text-black font-sans relative flex flex-col"
      dir="rtl"
      style={{
        width: "21cm",
        minHeight: "29.7cm",
        maxHeight: "29.7cm",
        padding: "1.2cm 1.5cm",
        overflow: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-slate-800">
        {/* Right: Company name */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {invoice.company?.name || "النجار للأدوات الصحية"}
          </h1>
        </div>
        {/* Left: Logo */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={invoice.company?.logo || "/hsn-logo.png"}
            alt="HSN GROUP"
            className="h-12 object-contain"
          />
        </div>
      </div>

      {/* ── Meta Row 1 ── */}
      <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-800">
        <div>
          <span>رقم الفاتورة : {invoice.name}</span>
        </div>
        <div className="text-center">
          <span>تحريرا في : {formatDate(invoice.dateInvoice)}</span>
        </div>
        <div>
          <span>نوع الفاتورة : {invoiceTypeLabel}</span>
        </div>
      </div>

      {/* ── Meta Row 2 ── */}
      <div className="flex justify-between items-center mb-6 text-base font-bold text-slate-900">
        <div>
          <span>
            {partnerLabel} : {invoice.partner?.name || "-"}
          </span>
        </div>
        <div>
          <span>مسئول البيع : {salesperson}</span>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="border-2 border-slate-800 mb-4 flex-1">
        <table className="w-full text-sm text-center">
          <thead className="bg-slate-50 border-b-2 border-slate-800 font-bold text-slate-900">
            <tr>
              <th className="py-2 px-1 border-l border-slate-400 w-10">
                م.
              </th>
              <th className="py-2 px-1 border-l border-slate-400">
                اسم الصنف
              </th>
              <th className="py-2 px-1 border-l border-slate-400 w-16">
                الكمية
              </th>
              <th className="py-2 px-1 border-l border-slate-400 w-16">
                الوحدة
              </th>
              <th className="py-2 px-1 border-l border-slate-400 w-20">
                سعر الوحدة
              </th>
              <th className="py-2 px-1 border-l border-slate-400 w-20">
                {design === "2" ? "الخصم %" : "قيمة الخصم"}
              </th>
              <th className="py-2 px-1 border-l border-slate-400 w-24">
                الاجمالي
              </th>
              <th className="py-2 px-1 w-24">الكمية الثانوية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {invoice.lines.map((line: any, index: number) => {
              const qty = Number(line.quantity) || 0;
              const price = Number(line.priceUnit) || 0;
              const discPercentage =
                Number(line.discount1) || Number(line.discount) || 0;
              const discountValue = (qty * price * discPercentage) / 100;
              const subtotal = Number(line.priceSubtotal) || 0;
              const secondaryQty = Number(line.secondaryQuantity) || 0;
              const secondaryUomName =
                line.product?.secondaryUom?.name || "";

              return (
                <tr key={line.id}>
                  <td className="py-2 px-1 border-l border-slate-400">
                    {index + 1}
                  </td>
                  <td className="py-2 px-1 border-l border-slate-400 text-right">
                    {line.product?.name || line.name}
                  </td>
                  <td className="py-2 px-1 border-l border-slate-400">
                    {qty.toFixed(1)}
                  </td>
                  <td className="py-2 px-1 border-l border-slate-400">
                    {line.product?.uom?.name || "قطعه"}
                  </td>
                  <td className="py-2 px-1 border-l border-slate-400">
                    {price.toFixed(2)}
                  </td>
                  <td className="py-2 px-1 border-l border-slate-400">
                    {design === "2"
                      ? `${discPercentage.toFixed(0)}%`
                      : discountValue.toFixed(2)}
                  </td>
                  <td className="py-2 px-1 border-l border-slate-400">
                    {subtotal.toFixed(2)}
                  </td>
                  <td className="py-2 px-1 font-semibold">
                    {secondaryQty > 0
                      ? `${secondaryUomName} / ${secondaryQty.toFixed(1)}`
                      : "0.0"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div className="border-2 border-slate-800 mb-4">
        <table className="w-full text-sm text-center font-bold text-slate-800">
          <tbody className="divide-y divide-slate-400">
            <tr>
              <td className="py-2 w-3/4 text-right pr-6">
                الإجمالي قبل الخصم
              </td>
              <td className="py-2 w-1/4 border-r border-slate-400 text-left pl-6">
                {totalBeforeDiscount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-right pr-6">الخصم</td>
              <td className="py-2 border-r border-slate-400 text-left pl-6">
                {totalDiscount.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-right pr-6">الضريبة</td>
              <td className="py-2 border-r border-slate-400 text-left pl-6">
                {amountTax.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-right pr-6 text-base">
                الصافي بعد الخصم
              </td>
              <td className="py-2 border-r border-slate-400 text-base text-left pl-6">
                {amountTotal.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Tafqeet ── */}
      <div className="text-right mb-4">
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          اجمالي الفاتورة : {amountTotal.toFixed(2)} فقط لا غير
        </h3>
        <p className="text-base font-bold text-slate-800">
          {tafqeet(amountTotal)}
        </p>
      </div>

      {/* ── Page Footer ── */}
      <div className="mt-auto text-center text-xs text-slate-500 pt-2 border-t border-slate-300">
        الصفحة: 1/1
      </div>
    </div>
  );
}