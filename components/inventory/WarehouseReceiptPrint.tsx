"use client";

import { forwardRef } from "react";
interface ReceiptLine {
  name: string;
  quantity: number;
  uom: string;
  secondaryQuantity?: number;
  secondaryUom?: string;
}
interface WarehouseReceiptProps {
  type: "incoming" | "outgoing";
  /* استلام أو صرف */
  documentName: string; /* WH/IN/P00012 partnerName: string; // اسم المورد أو العميل date: string; // تاريخ العملية lines: ReceiptLine[]; warehouseName?: string; notes?: string; */
} /** * إيصال استلام / صرف المخزن — A4 Print Template * لا يحتوي على أي أسعار (لأمين المخزن فقط). */
export const WarehouseReceiptPrint = forwardRef<HTMLDivElement, WarehouseReceiptProps>(({
  type,
  documentName,
  partnerName,
  date,
  lines,
  warehouseName,
  notes
}, ref) => {
  const isIncoming = type === "incoming";
  const title = isIncoming ? "إيصال استلام بضاعة" : "إيصال صرف بضاعة";
  const partnerLabel = isIncoming ? "المورد" : "العميل";
  return <div ref={ref} className="print-receipt bg-white p-10 max-w-[210mm] mx-auto font-arabic" dir="rtl">
        {" "}
        {/* Print-only styles */}{" "}
        <style>{` @media print { body * { visibility: hidden; } .print-receipt, .print-receipt * { visibility: visible; } .print-receipt { position: absolute; top: 0; left: 0; right: 0; width: 210mm; padding: 15mm; font-size: 12pt; } @page { size: A4; margin: 10mm; } } `}</style>{" "}
        {/* Header */}{" "}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          {" "}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>{" "}
          <p className="text-sm text-gray-600 mt-1">
            {warehouseName || "المخزن الرئيسي"}
          </p>{" "}
        </div>{" "}
        {/* Document Info */}{" "}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          {" "}
          <div className="flex gap-2">
            {" "}
            <span className="font-bold text-gray-700">رقم المستند:</span>{" "}
            <span className="text-gray-900">{documentName}</span>{" "}
          </div>{" "}
          <div className="flex gap-2">
            {" "}
            <span className="font-bold text-gray-700">التاريخ:</span>{" "}
            <span className="text-gray-900">{date}</span>{" "}
          </div>{" "}
          <div className="flex gap-2 col-span-2">
            {" "}
            <span className="font-bold text-gray-700">
              {partnerLabel}:
            </span>{" "}
            <span className="text-gray-900 font-semibold">
              {partnerName}
            </span>{" "}
          </div>{" "}
        </div>{" "}
        {/* Items Table */}{" "}
        <table className="w-full border-collapse mb-8">
          {" "}
          <thead>
            {" "}
            <tr className="bg-gray-100">
              {" "}
              <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold w-12">
                #
              </th>{" "}
              <th className="border border-gray-400 px-3 py-2 text-right text-sm font-bold">
                الصنف
              </th>{" "}
              <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-24">
                الكمية
              </th>{" "}
              <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-24">
                الوحدة
              </th>{" "}
              <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-24">
                الكمية الثانوية
              </th>{" "}
              <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-24">
                الوحدة الثانوية
              </th>{" "}
              <th className="border border-gray-400 px-3 py-2 text-center text-sm font-bold w-20">
                ملاحظات
              </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody>
            {" "}
            {lines.map((line, i) => <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {" "}
                <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                  {i + 1}
                </td>{" "}
                <td className="border border-gray-300 px-3 py-2 text-sm font-medium">
                  {line.name}
                </td>{" "}
                <td className="border border-gray-300 px-3 py-2 text-center text-sm font-bold">
                  {line.quantity}
                </td>{" "}
                <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                  {line.uom}
                </td>{" "}
                <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                  {" "}
                  {line.secondaryQuantity ? line.secondaryQuantity : "-"}{" "}
                </td>{" "}
                <td className="border border-gray-300 px-3 py-2 text-center text-sm">
                  {" "}
                  {line.secondaryUom || "-"}{" "}
                </td>{" "}
                <td className="border border-gray-300 px-3 py-2 text-center text-sm"></td>{" "}
              </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
        {/* Notes */}{" "}
        {notes && <div className="mb-8 text-sm">
            {" "}
            <span className="font-bold text-gray-700">ملاحظات: </span>{" "}
            <span className="text-gray-600">{notes}</span>{" "}
          </div>}{" "}
        {/* Signatures */}{" "}
        <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-gray-300">
          {" "}
          <div className="text-center">
            {" "}
            <div className="border-b border-gray-400 pb-12 mb-2"></div>{" "}
            <p className="text-sm font-bold text-gray-700">
              {isIncoming ? "المُسلّم (المورد)" : "المُستلم (العميل)"}
            </p>{" "}
          </div>{" "}
          <div className="text-center">
            {" "}
            <div className="border-b border-gray-400 pb-12 mb-2"></div>{" "}
            <p className="text-sm font-bold text-gray-700">أمين المخزن</p>{" "}
          </div>{" "}
          <div className="text-center">
            {" "}
            <div className="border-b border-gray-400 pb-12 mb-2"></div>{" "}
            <p className="text-sm font-bold text-gray-700">
              المدير المسؤول
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Footer */}{" "}
        <div className="mt-8 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          {" "}
          <p>
            تم إنشاء هذا المستند بواسطة نظام ERP —{" "}
            {new Date().toLocaleDateString("ar-EG")}
          </p>{" "}
        </div>{" "}
      </div>;
});
WarehouseReceiptPrint.displayName = "WarehouseReceiptPrint";