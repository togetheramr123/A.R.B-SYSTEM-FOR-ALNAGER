"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { OutstandingCreditsWidget } from "./OutstandingCreditsWidget";
interface InvoiceTabsProps {
  invoice: any;
  locale: string;
}
export function InvoiceTabs({
  invoice,
  locale
}: InvoiceTabsProps) {
  const [activeTab, setActiveTab] = useState<"lines" | "journalItems" | "otherInfo">("lines");
  const hasJournalEntry = !!invoice.journalEntry;
  return <div className="mt-8">
      {" "}
      {/* Tab Headers — Matching Odoo Notebook Tabs */}{" "}
      <div className="border-b border-slate-300 flex text-sm">
        {" "}
        <TabButton label="بنود الفاتورة" active={activeTab === "lines"} onClick={() => setActiveTab("lines")} />{" "}
        <TabButton label="عناصر اليومية" active={activeTab === "journalItems"} onClick={() => setActiveTab("journalItems")} />{" "}
        <TabButton label="معلومات أخرى" active={activeTab === "otherInfo"} onClick={() => setActiveTab("otherInfo")} />{" "}
      </div>{" "}
      {/* Tab Content */}{" "}
      <div className="py-4">
        {" "}
        {activeTab === "lines" && <InvoiceLinesTab invoice={invoice} locale={locale} />}{" "}
        {activeTab === "journalItems" && <JournalItemsTab invoice={invoice} />}{" "}
        {activeTab === "otherInfo" && <OtherInfoTab invoice={invoice} />}{" "}
      </div>{" "}
    </div>;
}
function TabButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return <button onClick={onClick} className={`px-4 py-2 border-b-2 font-medium transition-colors ${active ? "border-sky-600 text-sky-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
      {" "}
      {label}{" "}
    </button>;
} // ─── Tab 1: Invoice Lines — Matching Odoo columns exactly ──────────────
function InvoiceLinesTab({
  invoice,
  locale
}: {
  invoice: any;
  locale: string;
}) {
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const allowHalf = invoice.company?.allowHalfQuantities;
  const formatQty = (q: any) => allowHalf ? Number(q).toFixed(1).replace(/\.0$/, "") : Number(q).toFixed(0);
  useEffect(() => {
    setMounted(true);
  }, []);
  const handleFieldChange = async (lineId: string, updates: any) => {
    try {
      const {
        updateInvoiceLine
      } = await import("@/app/actions/accounting");
      const res = await updateInvoiceLine(lineId, updates);
      if (!res.success) {
        console.error(res.error);
        alert("حدث خطأ أثناء التحديث");
      }
    } catch (e) {
      console.error(e);
    }
  };
  return <>
      {" "}
      <table className="w-full text-right text-sm mb-8" dir="rtl">
        {" "}
        <thead className="text-slate-500 font-medium border-b border-slate-200">
          {" "}
          <tr>
            {" "}
            <th className="py-2 pl-4 font-bold text-slate-700 text-right">
              المنتج
            </th>{" "}
            <th className="py-2 px-2 font-bold text-slate-700 text-right">
              بطاقة عنوان
            </th>{" "}
            <th className="py-2 px-2 font-bold text-slate-700 text-right">
              حساب
            </th>{" "}
            <th className="py-2 px-2 text-center font-bold text-slate-700">
              الكمية
            </th>{" "}
            <th className="py-2 px-2 text-center font-bold text-slate-700">
              وحدة القياس
            </th>{" "}
            <th className="py-2 px-2 text-center font-bold text-slate-700">
              الكمية الثانوية
            </th>{" "}
            <th className="py-2 px-2 text-center font-bold text-slate-700">
              الثانوية UOM.
            </th>{" "}
            <th className="py-2 px-2 text-center font-bold text-slate-700">
              السعر
            </th>{" "}
            <th className="py-2 px-2 text-center font-bold text-slate-700">
              الخصم (%)
            </th>{" "}
            <th className="py-2 px-2 text-center font-bold text-slate-700">
              الضرائب
            </th>{" "}
            <th className="py-2 pr-4 text-left font-bold text-slate-700">
              الناتج الفرعي
            </th>{" "}
          </tr>{" "}
        </thead>{" "}
        <tbody className="divide-y divide-slate-100">
          {" "}
          {invoice.lines.map((line: any, index: number) => {
          if (line.lineType === "section") {
            return <tr key={line.id} className="bg-slate-50">
                  {" "}
                  <td colSpan={10} className="py-2 px-4 font-bold text-slate-800 text-right">
                    {line.name}
                  </td>{" "}
                </tr>;
          }
          if (line.lineType === "note") {
            return <tr key={line.id}>
                  {" "}
                  <td colSpan={10} className="py-2 px-4 text-slate-500 italic text-right">
                    {line.name}
                  </td>{" "}
                </tr>;
          }
          return <tr key={line.id} className={`group border-b border-slate-100 transition-colors ${invoice.state !== "draft" ? "cursor-pointer hover:bg-sky-50" : "hover:bg-slate-50"}`} onClick={() => {
            if (invoice.state !== "draft") {
              setSelectedLine(line);
            }
          }}>
                {" "}
                <td className="py-2.5 pl-4 text-right text-sky-700 font-medium">
                  {" "}
                  {line.product ? <Link href={`/${locale}/inventory/products/${line.product.id}`} className="hover:underline">
                      {" "}
                      {line.product.name}{" "}
                    </Link> : "-"}{" "}
                </td>{" "}
                <td className="py-2.5 px-2 text-right text-slate-600 max-w-[200px] truncate" title={line.name}>
                  {line.name}
                </td>{" "}
                <td className="py-2.5 px-2 text-right text-slate-600 text-xs">
                  {" "}
                  {line.account ? <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                      {" "}
                      <span className="text-slate-500">
                        {line.account.code}
                      </span>{" "}
                      <span className="text-slate-700">
                        {line.account.name}
                      </span>{" "}
                    </span> : "-"}{" "}
                </td>{" "}
                <td className="p-0 m-0 align-middle border-l border-slate-100 focus-within:ring-1 focus-within:ring-[#017E84] focus-within:ring-inset relative bg-white">
                  {" "}
                  {invoice.state === "draft" ? <input type="number" defaultValue={formatQty(line.quantity)} onBlur={e => {
                let val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  val = allowHalf ? Math.round(val * 2) / 2 : Math.round(val);
                  if (val !== Number(line.quantity)) handleFieldChange(line.id, {
                    quantity: val
                  });
                  e.target.value = formatQty(val);
                }
              }} step={allowHalf ? "0.5" : "1"} className="w-full h-full min-h-[36px] bg-transparent text-slate-900 text-center font-bold outline-none border-0 focus:ring-0" /> : <span className="cursor-pointer inline-block w-full py-2 text-center" onClick={() => toast.info("لا يمكن التعديل. الفاتورة ليست مسودة.")}>
                      {" "}
                      {formatQty(line.quantity)}{" "}
                    </span>}{" "}
                </td>{" "}
                <td className="py-2.5 px-2 text-center text-slate-600 text-xs border-l border-slate-100">
                  {line.unitName || "قطعه"}
                </td>{" "}
                <td className="p-0 m-0 align-middle border-l border-slate-100 focus-within:ring-1 focus-within:ring-[#017E84] focus-within:ring-inset relative bg-white">
                  {" "}
                  {invoice.state === "draft" && Number(line.secondaryQuantity || 0) >= 0 ? <input type="number" defaultValue={Number(line.secondaryQuantity || 0).toFixed(0)} onBlur={e => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val !== Number(line.secondaryQuantity)) handleFieldChange(line.id, {
                  secondaryQuantity: val
                });
              }} step="1" className="w-full h-full min-h-[36px] bg-transparent text-slate-900 text-center outline-none border-0 focus:ring-0" /> : <span className="cursor-pointer inline-block w-full py-2 text-center" onClick={() => toast.info("لا يمكن التعديل. الفاتورة ليست مسودة.")}>
                      {" "}
                      {Number(line.secondaryQuantity) > 0 ? Number(line.secondaryQuantity).toFixed(0) : "-"}{" "}
                    </span>}{" "}
                </td>{" "}
                <td className="py-2.5 px-2 text-center text-slate-600 text-xs border-l border-slate-100">
                  {" "}
                  {Number(line.secondaryQuantity) > 0 ? line.secondaryUnit || "-" : "-"}{" "}
                </td>{" "}
                <td className="p-0 m-0 align-middle border-l border-slate-100 focus-within:ring-1 focus-within:ring-[#017E84] focus-within:ring-inset relative bg-white font-bold">
                  {" "}
                  {invoice.state === "draft" ? <input type="number" defaultValue={Number(line.priceUnit).toFixed(2)} onBlur={e => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val !== Number(line.priceUnit)) handleFieldChange(line.id, {
                  priceUnit: val
                });
              }} step="0.01" className="w-full h-full min-h-[36px] bg-transparent text-slate-900 text-center outline-none border-0 focus:ring-0 font-bold" /> : <span className="cursor-pointer inline-block w-full py-2 text-center" onClick={() => toast.info("لا يمكن التعديل. الفاتورة ليست مسودة.")}>
                      {" "}
                      {Number(line.priceUnit).toFixed(2)}{" "}
                    </span>}{" "}
                </td>{" "}
                <td className="p-0 m-0 align-middle border-l border-slate-100 focus-within:ring-1 focus-within:ring-[#017E84] focus-within:ring-inset relative bg-white font-bold">
                  {" "}
                  {invoice.state === "draft" ? <input type="number" defaultValue={Number(line.discount1 || 0).toFixed(2)} onBlur={e => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val !== Number(line.discount1 || 0)) handleFieldChange(line.id, {
                  discount1: val
                });
              }} step="0.01" className="w-full h-full min-h-[36px] bg-transparent text-slate-900 text-center outline-none border-0 focus:ring-0 font-bold" /> : <span className="cursor-pointer inline-block w-full py-2 text-center" onClick={() => toast.info("لا يمكن التعديل. الفاتورة ليست مسودة.")}>
                      {" "}
                      {Number(line.discount1 || 0) > 0 ? Number(line.discount1).toFixed(2) : "-"}{" "}
                    </span>}{" "}
                </td>{" "}
                <td className="py-2.5 px-2 text-center text-slate-500 text-xs border-l border-slate-100">
                  {" "}
                  {line.taxes && line.taxes.length > 0 ? line.taxes.map((t: any) => t.tax?.name || t.taxId).join(", ") : "-"}{" "}
                </td>{" "}
                <td className="py-2.5 pr-4 text-left text-slate-900 font-bold">
                  {Number(line.priceSubtotal).toLocaleString("en-US", {
                minimumFractionDigits: 2
              })}{" "}
                  LE
                </td>{" "}
              </tr>;
        })}{" "}
        </tbody>{" "}
      </table>{" "}
      {/* Totals — Matching Odoo layout */}{" "}
      <div className="flex justify-end mt-4">
        {" "}
        <div className="w-1/3 min-w-[280px] space-y-2 text-sm border-t-2 border-slate-200 pt-4">
          {" "}
          <div className="flex justify-between text-slate-700">
            {" "}
            <span>المبلغ دون الضريبة:</span>{" "}
            <span>
              {Number(invoice.amountUntaxed).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              LE
            </span>{" "}
          </div>{" "}
          {Number(invoice.amountTax) > 0 && <div className="flex justify-between text-slate-700">
              {" "}
              <span>الضريبة:</span>{" "}
              <span>
                {Number(invoice.amountTax).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
                LE
              </span>{" "}
            </div>}{" "}
          <div className="flex justify-between text-slate-900 font-bold text-lg border-t border-slate-300 pt-2">
            {" "}
            <span>الإجمالي:</span>{" "}
            <span>
              {Number(invoice.amountTotal).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              LE
            </span>{" "}
          </div>{" "}
          {(invoice.state === "posted" || invoice.state === "paid" || invoice.state === "partial") && <div className={`flex justify-between font-bold text-md border-t border-slate-300 pt-2 ${Number(invoice.amountResidual) > 0 ? "text-red-600" : "text-green-600"}`}>
              {" "}
              <span>المبلغ المستحق:</span>{" "}
              <span>
                {Number(invoice.amountResidual).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
                LE
              </span>{" "}
            </div>}{" "}
        </div>{" "}
      </div>{" "}
      {invoice.state === "posted" && <div className="flex justify-end mt-2">
          {" "}
          <div className="w-1/3 min-w-[280px]">
            {" "}
            <OutstandingCreditsWidget partnerId={invoice.partnerId} invoiceId={invoice.id} amountResidual={Number(invoice.amountResidual)} invoiceType={invoice.type} />{" "}
          </div>{" "}
        </div>}{" "}
      {/* Odoo Style Modal for viewing line details */}{" "}
      {mounted && selectedLine && createPortal(<div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4 transition-opacity" onClick={() => setSelectedLine(null)}>
            {" "}
            <div className="bg-white rounded shadow-sm w-[650px] max-w-[95vw] flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()} dir="rtl">
              {" "}
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                {" "}
                <h2 className="text-xl font-medium text-slate-800">
                  فتح: بنود الفاتورة
                </h2>{" "}
                <button onClick={() => setSelectedLine(null)} className="text-slate-400 hover:text-slate-600">
                  {" "}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {" "}
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />{" "}
                  </svg>{" "}
                </button>{" "}
              </div>{" "}
              <div className="p-6 overflow-y-auto">
                {" "}
                <div className="mx-auto">
                  {" "}
                  <ModalRow label="المنتج" value={selectedLine.product ? selectedLine.product.name : "-"} className="text-[#017E84] font-medium" />{" "}
                  <ModalRow label="الكمية" value={formatQty(selectedLine.quantity)} />{" "}
                  <ModalRow label="وحدة القياس" value={selectedLine.unitName || "قطعه"} className="text-[#017E84]" />{" "}
                  <ModalRow label="سعر الوحدة" value={Number(selectedLine.priceUnit).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })} />{" "}
                  <ModalRow label="خصم %" value={Number(selectedLine.discount1 || 0).toFixed(2)} />{" "}
                  <ModalRow label="حساب" value={selectedLine.account ? `${selectedLine.account.code} ${selectedLine.account.name}` : "-"} className="text-[#017E84]" />{" "}
                  <ModalRow label="الضرائب" value={selectedLine.taxes && selectedLine.taxes.length > 0 ? selectedLine.taxes.map((t: any) => t.tax?.name || t.taxId).join(", ") : ""} />{" "}
                  <ModalRow label="الوصف" value={selectedLine.name} />{" "}
                  <div className="mt-8 flex justify-between items-center text-sm">
                    {" "}
                    <div className="text-slate-700 font-bold w-[140px] text-right shrink-0">
                      الناتج الفرعي
                    </div>{" "}
                    <div className="text-left flex-grow pl-4">
                      {Number(selectedLine.priceSubtotal).toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
              <div className="flex items-center gap-2 p-4 border-t border-slate-200 bg-slate-50">
                {" "}
                <button onClick={() => setSelectedLine(null)} className="px-5 py-2 bg-[#017E84] text-white hover:bg-[#01686d] rounded-sm text-sm font-medium">
                  {" "}
                  إغلاق{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>, document.body)}{" "}
    </>;
}
function ModalRow({
  label,
  value,
  className = "text-slate-800"
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return <div className="flex items-start py-1.5 text-sm">
      {" "}
      <div className="text-slate-700 font-bold w-[140px] text-right shrink-0">
        {" "}
        {label}{" "}
      </div>{" "}
      <div className={`text-right flex-grow ${className}`}>
        {" "}
        {value || <span className="text-transparent">.</span>}{" "}
      </div>{" "}
    </div>;
} // ─── Tab 2: Journal Items (عناصر اليومية) — Matching Odoo Exactly ────
function JournalItemsTab({
  invoice
}: {
  invoice: any;
}) {
  const items = invoice.journalEntry?.items || [];
  const totalDebit = items.reduce((acc: number, i: any) => acc + Number(i.debit), 0);
  const totalCredit = items.reduce((acc: number, i: any) => acc + Number(i.credit), 0);
  if (!invoice.journalEntry) {
    return <div className="text-center py-12 text-slate-400">
        {" "}
        <p className="text-lg font-medium">لم يتم إنشاء قيود يومية بعد</p>{" "}
        <p className="text-sm mt-1">
          يتم إنشاء القيود تلقائياً عند ترحيل الفاتورة
        </p>{" "}
      </div>;
  }
  return <div>
      {" "}
      <table className="w-full text-right text-sm border-t border-slate-200" dir="rtl">
        {" "}
        <thead className="text-slate-500 font-medium border-b border-slate-200 bg-slate-50">
          {" "}
          <tr>
            {" "}
            <th className="py-2 px-3 font-bold text-slate-700 text-right">
              حساب
            </th>{" "}
            <th className="py-2 px-3 font-bold text-slate-700 text-right">
              Entreprise
            </th>{" "}
            <th className="py-2 px-3 font-bold text-slate-700 text-right">
              بطاقة عنوان
            </th>{" "}
            <th className="py-2 px-3 text-left font-bold text-slate-700">
              المدين
            </th>{" "}
            <th className="py-2 px-3 text-left font-bold text-slate-700">
              الدائن
            </th>{" "}
            <th className="py-2 px-3 text-left font-bold text-slate-700">
              شبكات الضرائب
            </th>{" "}
          </tr>{" "}
        </thead>{" "}
        <tbody className="divide-y divide-slate-100">
          {" "}
          {items.map((item: any) => {
          const debit = Number(item.debit);
          const credit = Number(item.credit);
          return <tr key={item.id} className="hover:bg-slate-50">
                {" "}
                <td className="py-2.5 px-3 text-slate-900 font-medium text-right">
                  {" "}
                  <span className="text-slate-500">
                    {item.account?.code}
                  </span>{" "}
                  {item.account?.name}{" "}
                </td>{" "}
                <td className="py-2.5 px-3 text-slate-600 text-right text-xs">
                  {" "}
                  {invoice.company?.name || "فرع 1"}{" "}
                </td>{" "}
                <td className="py-2.5 px-3 text-slate-600 text-right">
                  {item.name}
                </td>{" "}
                <td className="py-2.5 px-3 text-left text-slate-900">
                  {" "}
                  {debit > 0 ? `${debit.toLocaleString("en-US", {
                minimumFractionDigits: 2
              })} LE` : "0.00 LE"}{" "}
                </td>{" "}
                <td className="py-2.5 px-3 text-left text-slate-900">
                  {" "}
                  {credit > 0 ? `${credit.toLocaleString("en-US", {
                minimumFractionDigits: 2
              })} LE` : "0.00 LE"}{" "}
                </td>{" "}
                <td className="py-2.5 px-3 text-left text-slate-400 text-xs">
                  {" "}
                  {item.taxGrid || "قطع"}{" "}
                </td>{" "}
              </tr>;
        })}{" "}
          {/* Totals row — Odoo shows green bottom bar */}{" "}
          <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-400">
            {" "}
            <td colSpan={3} className="py-2.5 px-3 text-left"></td>{" "}
            <td className="py-2.5 px-3 text-left">
              {" "}
              {totalDebit.toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              LE{" "}
            </td>{" "}
            <td className="py-2.5 px-3 text-left">
              {" "}
              {totalCredit.toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              LE{" "}
            </td>{" "}
            <td className="py-2.5 px-3"></td>{" "}
          </tr>{" "}
        </tbody>{" "}
      </table>{" "}
      {/* Balanced indicator */}{" "}
      <div className="mt-3 flex items-center gap-2 text-sm">
        {" "}
        {Math.abs(totalDebit - totalCredit) < 0.01 ? <span className="text-green-700 bg-green-50 px-3 py-1 rounded-full font-medium">
            ✓ القيد متوازن — مجموع المدين = مجموع الدائن
          </span> : <span className="text-red-700 bg-red-50 px-3 py-1 rounded-full font-medium">
            ⚠ القيد غير متوازن (فرق: {(totalDebit - totalCredit).toFixed(2)})
          </span>}{" "}
      </div>{" "}
    </div>;
} // ─── Tab 3: Other Info — Matching Odoo's 2-section layout ──────────────
function OtherInfoTab({
  invoice
}: {
  invoice: any;
}) {
  return <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
      {" "}
      {/* Section 1: Invoice data */}{" "}
      <div>
        {" "}
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">
          الفاتورة
        </h3>{" "}
        <div className="space-y-2.5">
          {" "}
          <InfoRow label="رقم العميل المرجعي" value={invoice.clientOrderRef} />{" "}
          <InfoRow label="مندوب المبيعات" value={invoice.salesperson?.name || invoice.userId} />{" "}
          <InfoRow label="فريق المبيعات" value={invoice.salesTeam?.name} />{" "}
        </div>{" "}
      </div>{" "}
      {/* Section 2: Accounting data */}{" "}
      <div>
        {" "}
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">
          المحاسبة
        </h3>{" "}
        <div className="space-y-2.5">
          {" "}
          <InfoRow label="البنك المستلم" value={invoice.recipientBank} />{" "}
          <InfoRow label="الوضع المالي" value={invoice.fiscalPosition?.name} />{" "}
          <InfoRow label="الشرط التجاري" value={invoice.incoterm} />{" "}
          <InfoRow label="الترحيل التلقائي" value={invoice.autoPost ? "نعم" : "لا"} />{" "}
          <InfoRow label="للتحقق منه" value={invoice.toCheck ? "✓ نعم" : "لا"} />{" "}
        </div>{" "}
      </div>{" "}
      {/* Source document */}{" "}
      {invoice.invoiceOrigin && <div className="col-span-2 mt-2">
          {" "}
          <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">
            المصدر
          </h3>{" "}
          <div className="space-y-2.5">
            {" "}
            <InfoRow label="مستند المصدر" value={invoice.invoiceOrigin} />{" "}
            <InfoRow label="مرجع الدفع" value={invoice.paymentReference || ""} />{" "}
            <InfoRow label="تاريخ الفاتورة" value={new Date(invoice.dateInvoice).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })} />{" "}
            <InfoRow label="تاريخ الاستحقاق" value={invoice.dateDue ? new Date(invoice.dateDue).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }) : new Date(invoice.dateInvoice).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric"
        })} />{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}
function InfoRow({
  label,
  value
}: {
  label: string;
  value?: string | null;
}) {
  return <div className="flex items-center justify-between py-1">
      {" "}
      <label className="text-slate-700 font-medium">{label}</label>{" "}
      <span className="text-slate-900">
        {value || <span className="text-slate-400">—</span>}
      </span>{" "}
    </div>;
}