"use client";

import { useState, useEffect } from "react";
import { getPartnerOutstandingCredits, offsetContraInvoices } from "@/app/actions/accounting";
import { PlusCircle, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
interface OutstandingCreditsWidgetProps {
  partnerId: string;
  invoiceId: string;
  amountResidual: number;
  invoiceType: string;
}
export function OutstandingCreditsWidget({
  partnerId,
  invoiceId,
  amountResidual,
  invoiceType
}: OutstandingCreditsWidgetProps) {
  const [credits, setCredits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    if (!partnerId || amountResidual <= 0) {
      setIsLoading(false);
      return;
    }
    const fetchCredits = async () => {
      try {
        const data = await getPartnerOutstandingCredits(partnerId, invoiceId);
        setCredits(data.invoices || []);
      } catch (err) {
        console.error("Failed to fetch credits", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCredits();
  }, [partnerId, invoiceId, amountResidual]);
  const handleReconcile = async (contraInvoiceId: string) => {
    setProcessingId(contraInvoiceId);
    try {
      const result = (await offsetContraInvoices(invoiceId, contraInvoiceId)) as any;
      if (result.success) {
        toast.success(`تم التسوية بنجاح بمقدار ${result.offsetAmount} ج.م.`);
        router.refresh();
      } else {
        toast.error(result.error || "فشلت عملية التسوية");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع");
    } finally {
      setProcessingId(null);
    }
  };
  if (isLoading || credits.length === 0 || amountResidual <= 0) return null;
  const isSale = invoiceType.startsWith("out_");
  return <div className="mt-6 border border-sky-100 rounded-lg overflow-hidden bg-sky-50/30">
      {" "}
      <div className="bg-sky-50 border-b border-sky-100 px-4 py-2 flex items-center gap-2">
        {" "}
        <Info className="w-4 h-4 text-sky-600" />{" "}
        <span className="text-sm font-bold text-sky-900">
          {" "}
          أرصدة متاحة للمقاصة{" "}
        </span>{" "}
        <span className="text-xs text-sky-700 bg-sky-100 px-2 py-0.5 rounded-full mr-auto">
          {" "}
          {isSale ? "يوجد فواتير مشتريات مستحقة للعميل" : "يوجد فواتير مبيعات مستحقة على المورد"}{" "}
        </span>{" "}
      </div>{" "}
      <div className="divide-y divide-sky-50">
        {" "}
        {credits.map(credit => <div key={credit.id} className="flex items-center justify-between p-3 hover:bg-sky-50/50 transition-colors">
            {" "}
            <div>
              {" "}
              <div className="font-bold text-slate-800 text-sm">
                {" "}
                {credit.name}{" "}
                <span className="text-xs font-normal text-slate-500 mr-2">
                  ({new Date(credit.dateInvoice).toLocaleDateString("ar-EG")})
                </span>{" "}
              </div>{" "}
              <div className="text-xs text-slate-500 mt-1">
                {" "}
                رصيد متبقي:{" "}
                <span className="font-bold text-sky-700">
                  {Number(credit.amountResidual).toLocaleString()} ج.م
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <button type="button" onClick={() => handleReconcile(credit.id)} disabled={processingId !== null} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded transition-colors ${processingId === credit.id ? "bg-sky-100 text-sky-400 cursor-not-allowed" : "text-sky-700 hover:bg-sky-100"}`}>
              {" "}
              {processingId === credit.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}{" "}
              إضافة{" "}
            </button>{" "}
          </div>)}{" "}
      </div>{" "}
    </div>;
}