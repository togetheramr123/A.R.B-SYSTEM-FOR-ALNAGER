"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Loader2, CheckCircle2 } from "lucide-react";
import { getOutstandingPayments, applyOutstandingPayment } from "@/app/actions/accounting";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
interface OutstandingPaymentsProps {
  invoiceId: string;
  partnerId: string;
  invoiceType: "out_invoice" | "in_invoice" | "out_refund" | "in_refund";
  invoiceState: string;
  amountResidual: number;
}
interface OutstandingPayment {
  id: string;
  name: string;
  amount: number;
  date: string;
  journalName: string;
  journalCode: string;
  ref: string;
  remainingAmount: number;
}
export function OutstandingPayments({
  invoiceId,
  partnerId,
  invoiceType,
  invoiceState,
  amountResidual
}: OutstandingPaymentsProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<OutstandingPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState<string | null>(null); // Only show for posted invoices with remaining balance
  const shouldShow = invoiceState === "posted" && amountResidual > 0;
  useEffect(() => {
    if (shouldShow && partnerId) {
      setLoading(true);
      getOutstandingPayments(partnerId, invoiceType).then(setPayments).finally(() => setLoading(false));
    }
  }, [shouldShow, partnerId, invoiceType]);
  const handleApply = async (paymentId: string) => {
    setApplying(paymentId);
    try {
      const result = (await applyOutstandingPayment(invoiceId, paymentId)) as any;
      if (result.success) {
        toast.success(result.invoicePaid ? "✅ تم تسديد الفاتورة بالكامل" : `تم تطبيق ${result.appliedAmount?.toLocaleString("en-US", {
          minimumFractionDigits: 2
        })} ج.م — المتبقي: ${result.newResidual?.toLocaleString("en-US", {
          minimumFractionDigits: 2
        })} ج.م`);
        // Remove the applied payment from the list
        setPayments(prev => prev.filter(p => p.id !== paymentId));
        router.refresh();
      } else {
        toast.error(result.error || "حدث خطأ أثناء تطبيق الدفعة");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع");
    } finally {
      setApplying(null);
    }
  };
  if (!shouldShow) return null;
  return <div className="mt-6 border border-teal-200 rounded-lg bg-teal-50/40 overflow-hidden">
      {" "}
      {/* Header */}{" "}
      <div className="flex items-center justify-between px-4 py-2.5 bg-teal-100/50 border-b border-teal-200">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <CreditCard className="w-4 h-4 text-teal-700" />{" "}
          <span className="text-sm font-bold text-teal-800">
            {" "}
            {invoiceType === "out_invoice" ? "أرصدة العميل المعلقة" : "أرصدة المورد المعلقة"}{" "}
          </span>{" "}
        </div>{" "}
        <span className="text-xs text-teal-600 font-medium">
          {" "}
          المتبقي:{" "}
          {amountResidual.toLocaleString("en-US", {
          minimumFractionDigits: 2
        })}{" "}
          ج.م{" "}
        </span>{" "}
      </div>{" "}
      {/* Content */}{" "}
      <div className="p-4">
        {" "}
        {loading ? <div className="flex items-center justify-center py-4 gap-2 text-teal-600">
            {" "}
            <Loader2 className="w-4 h-4 animate-spin" />{" "}
            <span className="text-sm">جاري البحث عن أرصدة معلقة...</span>{" "}
          </div> : payments.length === 0 ? <div className="text-center py-3 text-sm text-teal-600/70 flex items-center justify-center gap-2">
            {" "}
            <CheckCircle2 className="w-4 h-4" /> لا توجد أي أرصدة معلقة لهذا{" "}
            {invoiceType === "out_invoice" ? "العميل" : "المورد"}{" "}
          </div> : <div className="space-y-2">
            {" "}
            {payments.map(payment => <div key={payment.id} className="flex items-center justify-between bg-white border border-teal-200 rounded-md px-4 py-2.5 hover:border-teal-400 hover:shadow-sm transition-all group">
                {" "}
                <div className="flex items-center gap-3">
                  {" "}
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 group-hover:bg-teal-200 transition-colors">
                    {" "}
                    <CreditCard className="w-4 h-4" />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <div className="text-sm font-bold text-slate-800">
                      {payment.name}
                    </div>{" "}
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      {" "}
                      <span>{payment.date}</span>{" "}
                      {payment.journalName && <>
                          {" "}
                          <span className="text-slate-300">•</span>{" "}
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600">
                            {" "}
                            {payment.journalCode || payment.journalName}{" "}
                          </span>{" "}
                        </>}{" "}
                      {payment.ref && <>
                          {" "}
                          <span className="text-slate-300">•</span>{" "}
                          <span className="text-slate-400">
                            {payment.ref}
                          </span>{" "}
                        </>}{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="flex items-center gap-3">
                  {" "}
                  <span className="text-sm font-bold text-teal-700 font-numbers">
                    {" "}
                    {payment.amount.toLocaleString("en-US", {
                minimumFractionDigits: 2
              })}{" "}
                    ج.م{" "}
                  </span>{" "}
                  <button type="button" onClick={() => handleApply(payment.id)} disabled={applying === payment.id} className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors">
                    {" "}
                    {applying === payment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}{" "}
                    إضافة{" "}
                  </button>{" "}
                </div>{" "}
              </div>)}{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}