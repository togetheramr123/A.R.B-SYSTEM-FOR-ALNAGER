"use client";

import { Printer } from "lucide-react";
import React from "react";

export function PartnerStatementPrint({
  statement,
  locale
}: {
  statement: any;
  locale: string;
}) {
  const fmt = (n: number) => {
    const isNegative = n < 0;
    const absVal = Math.abs(n);
    const formatted = new Intl.NumberFormat("ar-EG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(absVal);
    return `LE ${formatted}${isNegative ? "-" : ""}`;
  };

  const fmtDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).replace(/\//g, "-");
  };

  const parseAccountName = (accName: string | any) => {
    if (!accName) return "";
    if (typeof accName === 'string') {
      try {
        const obj = JSON.parse(accName.replace(/'/g, '"'));
        return obj.ar_001 || obj.en_US || accName;
      } catch (e) {
        return accName;
      }
    }
    return accName.ar_001 || accName.en_US || "";
  };

  return (
    <>
      {/* Print Button - Hidden in print */}
      <div className="print:hidden p-4 flex justify-center gap-4 bg-slate-100 border-b">
        <button onClick={() => window.print()} className="bg-indigo-600 text-white px-8 py-2.5 rounded-sm text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2">
          <Printer className="w-4 h-4" /> طباعة كشف الحساب
        </button>
        <button onClick={() => window.history.back()} className="bg-slate-200 text-slate-700 px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-slate-300 transition">
          رجوع
        </button>
      </div>

      {/* Printable Content */}
      <div className="max-w-5xl mx-auto p-10 bg-white min-h-[29.7cm] text-black font-sans print:p-4 print:max-w-none" dir="rtl">
        
        {/* Warning Alert for Unposted Entries */}
        {statement.stateFilter === 'posted' && statement.hasUnpostedEntries && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md flex items-center gap-3 text-sm font-bold shadow-sm print:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            يوجد قيود أو فواتير غير مرحلة (مسودات) لهذا العميل في هذه الفترة لم يتم تضمينها في هذا الكشف.
          </div>
        )}

        {/* Header Area Matching Odoo */}
        <div className="flex justify-between items-start mb-8 text-sm font-bold text-slate-900 border-b-2 border-black pb-4">
          <div className="flex flex-col items-start justify-center h-20 w-1/3">
            {statement.company?.logo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={statement.company.logo} alt="Logo" className="h-12 object-contain" />
            ) : (
              <span className="text-2xl font-black text-indigo-800 tracking-tighter">H&N GROUP</span>
            )}
          </div>

          <div className="flex flex-col items-center justify-end h-20 pb-2 w-1/3">
            <p className="mb-1">الحركات الهدف :</p>
            <p className="font-normal">{statement.stateFilter === 'all' ? 'كافة القيود' : 'كافة القيود المرحلة'}</p>
          </div>

          <div className="flex flex-col items-end justify-center h-20 text-right w-1/3">
            <h1 className="text-2xl font-bold mb-2">دفتر الأستاذ العام للشركاء</h1>
            <p className="font-normal text-xs mb-1">الشركة: {statement.company?.name || "النجار للأدوات الصحية"}</p>
            {statement.from && <p className="font-normal text-xs mb-1">التاريخ من: {fmtDate(statement.from)}</p>}
            {statement.to && <p className="font-normal text-xs">التاريخ لـ: {fmtDate(statement.to)}</p>}
          </div>
        </div>

        {/* Main Ledger Table */}
        <div className="mb-6">
          <table className="w-full text-[11px] font-bold text-slate-900 border-collapse">
            <thead className="border-b-2 border-black">
              <tr>
                <th className="py-2 px-1 text-right w-24">التاريخ</th>
                <th className="py-2 px-1 text-right w-16">JRNL</th>
                <th className="py-2 px-1 text-right w-24">الحساب</th>
                <th className="py-2 px-1 text-right">المرجع</th>
                <th className="py-2 px-1 text-right w-28">المدين</th>
                <th className="py-2 px-1 text-right w-28">تنسب إليه</th>
                <th className="py-2 px-1 text-right w-28">توازن</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-normal">
              
              {/* Partner Row */}
              <tr className="font-bold border-b border-black">
                <td colSpan={4} className="py-2 px-1 text-right">- {statement.partner?.name || "العميل"}</td>
                <td className="py-2 px-1 text-right" dir="ltr">{fmt(statement.totalDebit)}</td>
                <td className="py-2 px-1 text-right" dir="ltr">{fmt(statement.totalCredit)}</td>
                <td className="py-2 px-1 text-right" dir="ltr">{fmt(statement.closingBalance)}</td>
              </tr>

              {/* Opening Balance Row */}
              {statement.openingBalance !== 0 && (
                <tr className="italic text-slate-700 border-b border-slate-200">
                  <td colSpan={4} className="py-2 px-1 text-right pr-4">الرصيد الافتتاحي</td>
                  <td className="py-2 px-1 text-right" dir="ltr">{statement.openingBalance > 0 ? fmt(statement.openingBalance) : fmt(0)}</td>
                  <td className="py-2 px-1 text-right" dir="ltr">{statement.openingBalance < 0 ? fmt(Math.abs(statement.openingBalance)) : fmt(0)}</td>
                  <td className="py-2 px-1 text-right font-bold" dir="ltr">{fmt(statement.openingBalance)}</td>
                </tr>
              )}

              {/* Moves */}
              {statement.lines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    لا توجد حركات
                  </td>
                </tr>
              ) : (
                statement.lines.map((line: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50 border-b border-slate-100">
                    <td className="py-2 px-1 text-right">{fmtDate(line.date)}</td>
                    <td className="py-2 px-1 text-right">{line.journal || "كاش"}</td>
                    <td className="py-2 px-1 text-right" dir="ltr">{parseAccountName(line.account)}</td>
                    <td className="py-2 px-1 text-right max-w-[400px]">
                      {line.ref || "-"} - {line.description || "سداد العميل"} / {statement.partner?.name}
                    </td>
                    <td className="py-2 px-1 text-right" dir="ltr">{line.debit > 0 ? fmt(line.debit) : fmt(0)}</td>
                    <td className="py-2 px-1 text-right" dir="ltr">{line.credit > 0 ? fmt(line.credit) : fmt(0)}</td>
                    <td className="py-2 px-1 text-right font-bold" dir="ltr">{fmt(line.balance)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* End of Statement Marker */}
        <div className="text-center font-bold text-slate-800 mt-8">
          <p>نهاية الكشف</p>
        </div>

      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          nav,
          header,
          .sidebar,
          aside {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </>
  );
}