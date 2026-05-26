"use client";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createInvoiceFromOrder } from "@/app/actions/sales";
interface CreateInvoiceModalProps {
  orderId: string;
  onClose: () => void;
}
export function CreateInvoiceModal({
  orderId,
  onClose
}: CreateInvoiceModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || "ar";
  const [loading, setLoading] = useState(false);
  const [invoiceType, setInvoiceType] = useState<"regular" | "down_payment_percentage" | "down_payment_fixed">("regular");
  const [percentage, setPercentage] = useState(50);
  const [fixedAmount, setFixedAmount] = useState(0);
  const handleCreate = async (navigate: boolean = true) => {
    setLoading(true);
    try {
      const invoice = await createInvoiceFromOrder(orderId, {
        type: invoiceType,
        percentage: percentage,
        fixedAmount: fixedAmount
      });
      if (invoice && invoice.id && navigate) {
        toast.success("تم إنشاء الفاتورة بنجاح");
        /* Navigate to the newly created invoice */
        router.push(`/${locale}/accounting/invoices/${invoice.id}`);
      } else {
        router.refresh();
        onClose();
      }
    } catch (error: any) {
      const msg = error?.message || "خطأ في إنشاء الفاتورة";
      if (msg.includes("لا توجد كميات قابلة للفوترة")) {
        toast.warning("لا توجد كميات قابلة للفوترة. تأكد من تسليم البضاعة أولاً للعميل.");
      } else {
        console.error(error);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
      {" "}
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md border border-slate-200">
        {" "}
        {/* Header */}{" "}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          {" "}
          <h3 className="font-bold text-lg text-slate-900">
            إنشاء الفواتير
          </h3>{" "}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            &times;
          </button>{" "}
        </div>{" "}
        {/* Body */}{" "}
        <div className="p-5 space-y-5">
          {" "}
          <p className="text-sm text-slate-500">
            {" "}
            سيتم إنشاء الفواتير في حالة المسودة لتتمكن من مراجعتها قبل
            تصديقها.{" "}
          </p>{" "}
          <div className="space-y-3">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              إنشاء فاتورة
            </label>{" "}
            <label className="flex items-center gap-3 cursor-pointer group">
              {" "}
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="radio" name="invoiceType" checked={invoiceType === "regular"} onChange={() => setInvoiceType("regular")} className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500" />{" "}
              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                فاتورة دورية
              </span>{" "}
            </label>{" "}
            <label className="flex items-center gap-3 cursor-pointer group">
              {" "}
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="radio" name="invoiceType" checked={invoiceType === "down_payment_percentage"} onChange={() => setInvoiceType("down_payment_percentage")} className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500" />{" "}
              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                دفعة مقدمة (نسبة)
              </span>{" "}
            </label>{" "}
            {invoiceType === "down_payment_percentage" && <div className="mr-7 flex items-center gap-2">
                {" "}
                <label className="text-xs text-slate-500">النسبة:</label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" value={percentage} onChange={e => setPercentage(Number(e.target.value))} min={1} max={100} className="border border-slate-300 rounded px-2 py-1 text-sm w-20 text-center" />{" "}
                <span className="text-xs text-slate-500">%</span>{" "}
              </div>}{" "}
            <label className="flex items-center gap-3 cursor-pointer group">
              {" "}
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="radio" name="invoiceType" checked={invoiceType === "down_payment_fixed"} onChange={() => setInvoiceType("down_payment_fixed")} className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500" />{" "}
              <span className="text-sm text-slate-700 group-hover:text-slate-900">
                دفعة مقدمة (مبلغ ثابت)
              </span>{" "}
            </label>{" "}
            {invoiceType === "down_payment_fixed" && <div className="mr-7 flex items-center gap-2">
                {" "}
                <label className="text-xs text-slate-500">المبلغ:</label>{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" value={fixedAmount} onChange={e => setFixedAmount(Number(e.target.value))} min={0} className="border border-slate-300 rounded px-2 py-1 text-sm w-24 text-center" />{" "}
                <span className="text-xs text-slate-500">ج.م</span>{" "}
              </div>}{" "}
          </div>{" "}
        </div>{" "}
        {/* Footer */}{" "}
        <div className="p-4 border-t border-slate-100 flex justify-start gap-2 bg-slate-50 rounded-b-lg">
          {" "}
          <button onClick={() => handleCreate(true)} disabled={loading} className="bg-sky-600 text-white px-4 py-2 rounded-sm text-sm font-bold hover:bg-sky-700 disabled:opacity-50">
            {" "}
            {loading ? "جاري الإنشاء..." : "إنشاء و عرض الفاتورة"}{" "}
          </button>{" "}
          <button onClick={() => handleCreate(false)} disabled={loading} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-sm text-sm font-medium hover:bg-slate-50 disabled:opacity-50">
            {" "}
            إنشاء فاتورة{" "}
          </button>{" "}
          <button onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700 px-4 py-2">
            {" "}
            إلغاء{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}