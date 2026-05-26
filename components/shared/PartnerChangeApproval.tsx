"use client";

import { useState, useTransition } from "react";
import { approvePartnerChange, rejectPartnerChange } from "@/app/actions/accounting";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, X } from "lucide-react";
interface PartnerChangeApprovalProps {
  approvalId: string;
  details: {
    oldPartnerName: string;
    newPartnerName: string;
    docName: string;
  };
  requesterName?: string;
}
export default function PartnerChangeApproval({
  approvalId,
  details,
  requesterName
}: PartnerChangeApprovalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const handleApprove = () => {
    if (!confirm("هل أنت متأكد من الموافقة على تغيير العميل؟ سيتم التعديل في جميع المستندات المرتبطة تلقائياً.")) return;
    startTransition(async () => {
      try {
        const result = await approvePartnerChange(approvalId);
        if (result.success) {
          toast.success("تمت الموافقة وتم تعديل العميل في جميع المستندات");
          router.refresh();
        }
      } catch (e: any) {
        toast.error(e.message || "حدث خطأ");
      }
    });
  };
  const handleReject = () => {
    startTransition(async () => {
      try {
        const result = await rejectPartnerChange(approvalId, rejectReason || undefined);
        if (result.success) {
          toast.info("تم رفض طلب تعديل العميل");
          setShowRejectReason(false);
          router.refresh();
        }
      } catch (e: any) {
        toast.error(e.message || "حدث خطأ");
      }
    });
  };
  return <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 space-y-3">
      {" "}
      <div className="flex items-start gap-3">
        {" "}
        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          {" "}
          <span className="text-amber-600 text-sm">🔄</span>{" "}
        </div>{" "}
        <div className="flex-1 min-w-0">
          {" "}
          <p className="text-sm font-bold text-amber-800">
            {" "}
            طلب تعديل اسم العميل — {details.docName}{" "}
          </p>{" "}
          <p className="text-xs text-amber-700 mt-1">
            {" "}
            {requesterName || "مستخدم"} يطلب تغيير العميل من{" "}
            <span className="font-bold text-red-600 line-through">
              {details.oldPartnerName}
            </span>{" "}
            إلى{" "}
            <span className="font-bold text-green-700">
              {details.newPartnerName}
            </span>{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {!showRejectReason ? <div className="flex gap-2">
          {" "}
          <button onClick={handleApprove} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition">
            {" "}
            <CheckCircle2 className="w-3.5 h-3.5" />{" "}
            {isPending ? "جاري..." : "موافقة"}{" "}
          </button>{" "}
          <button onClick={() => setShowRejectReason(true)} disabled={isPending} className="flex items-center gap-1.5 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 disabled:opacity-50 transition">
            {" "}
            <XCircle className="w-3.5 h-3.5" /> رفض{" "}
          </button>{" "}
        </div> : <div className="space-y-2">
          {" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="سبب الرفض (اختياري)..." className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400" autoFocus />{" "}
          <div className="flex gap-2">
            {" "}
            <button onClick={handleReject} disabled={isPending} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition">
              {" "}
              {isPending ? "جاري..." : "تأكيد الرفض"}{" "}
            </button>{" "}
            <button onClick={() => setShowRejectReason(false)} className="px-4 py-2 text-slate-500 text-xs font-medium">
              {" "}
              إلغاء{" "}
            </button>{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}