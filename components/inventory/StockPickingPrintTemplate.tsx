"use client";

import React from "react";
import { Barcode } from "lucide-react";

interface StockPickingPrintTemplateProps {
  picking: any;
  locale: string;
}

export default function StockPickingPrintTemplate({
  picking,
  locale: _locale
}: StockPickingPrintTemplateProps) {
  const isIncoming = picking.pickingType === "INCOMING";
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const totalSecondaryQty = picking.moves.reduce((sum: number, move: any) => sum + (move.secondaryQuantity || 0), 0);

  return (
    <div className="p-10 bg-white text-slate-800 min-h-[29.7cm] font-sans" dir="rtl">
      
      {/* Header Area */}
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-200">
        <div className="flex flex-col gap-2">
          {picking.company?.logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={picking.company.logo} alt="Logo" className="h-16 object-contain" />
          ) : (
            <div className="h-16 flex items-center">
              <span className="text-2xl font-black text-indigo-900 tracking-tighter">H&N GROUP</span>
            </div>
          )}
          <h2 className="font-bold text-xl text-slate-900">النجار للأدوات الصحية</h2>
          <p className="text-sm text-slate-500">مصر</p>
        </div>

        <div className="text-left flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">
              {isIncoming ? "إيصال التوصيل" : "إذن صرف"}
            </h1>
          </div>
          <div className="flex items-center text-slate-500 gap-2 mt-2">
            <span className="font-mono text-sm tracking-widest">{picking.name}</span>
            <Barcode className="w-12 h-8" />
          </div>
        </div>
      </div>

      {/* Address Block */}
      <div className="grid grid-cols-2 gap-12 mb-10 text-sm">
        <div className="space-y-1">
          <h3 className="font-bold text-slate-400 mb-3">{isIncoming ? "عنوان المورّد:" : "عنوان التوصيل:"}</h3>
          {picking.partner ? (
            <>
              <p className="font-bold text-slate-800 text-base">{picking.partner.name}</p>
              <p className="text-slate-600">{picking.partner.street || "العنوان غير مسجل"}</p>
              <p className="text-slate-600">{picking.partner.city ? `${picking.partner.city}, ` : ''}{picking.partner.country || "مصر"}</p>
              <p className="text-slate-600 dir-ltr text-right mt-1">{picking.partner.phone}</p>
            </>
          ) : (
            <p className="text-slate-400 italic">غير محدد</p>
          )}
        </div>
        
        <div className="space-y-1">
          <h3 className="font-bold text-slate-400 mb-3">عنوان المستودع:</h3>
          <p className="font-bold text-slate-800 text-base">{picking.company?.name || "النجار للأدوات الصحية"}</p>
          <p className="text-slate-600">{picking.company?.street || "مصر"}</p>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-red-700">
          {isIncoming ? "وارد الى" : "خارج من المخزن"} / {picking.locationDest?.name || "MAIN"} / {picking.name.split('/').pop() || picking.name}
        </h2>
      </div>

      {/* Meta Info */}
      <div className="flex justify-between items-center mb-6 text-sm font-bold">
        <div>
          <span className="text-slate-500 ml-2">تاريخ الشحن:</span>
          <span className="text-slate-800">{picking.scheduledDate ? formatDate(picking.scheduledDate) : "-"}</span>
        </div>
        <div>
          <span className="text-slate-500 ml-2">الطلب:</span>
          <span className="text-slate-800 uppercase">{picking.origin || "-"}</span>
        </div>
      </div>

      {/* Modern Clean Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            <tr>
              <th className="py-4 px-4 text-center w-16">المسلسل</th>
              <th className="py-4 px-4 text-right">المنتج</th>
              <th className="py-4 px-4 text-center w-48">الكمية التي قد تم توصيلها</th>
              <th className="py-4 px-4 text-center w-48">الثانوية تم القيام بها</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {picking.moves.map((move: any, index: number) => (
              <tr key={move.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-4 text-center text-slate-400">{index + 1}</td>
                <td className="py-4 px-4 text-slate-800 font-medium">{move.product?.name}</td>
                <td className="py-4 px-4 text-center text-slate-700">
                  {move.quantityDone} {move.product?.uom?.name || "قطعه"}
                </td>
                <td className="py-4 px-4 text-center text-slate-700">
                  {move.secondaryQuantity || 0} {move.product?.secondaryUom?.name || ""}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
            <tr>
              <td colSpan={3} className="py-4 px-4 text-center text-slate-800 text-base">الإجمالي</td>
              <td className="py-4 px-4 text-center text-slate-800 text-base">{totalSecondaryQty}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Signature Section */}
      <div className="mt-20 flex justify-center">
        <div className="text-center w-64">
          <p className="font-bold text-slate-800 mb-16">امضاء المستلم</p>
          <div className="border-b border-slate-800 w-full"></div>
        </div>
      </div>

    </div>
  );
}