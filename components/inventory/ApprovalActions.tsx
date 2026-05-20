"use client";

import { useState } from "react";
import { handleApprovalAction } from "@/app/actions/approvals";
import { Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
export function ApprovalActions({
  requestId
}: {
  requestId: string;
}) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const onAction = async (action: "approve" | "reject") => {
    setIsLoading(action);
    try {
      const res = await handleApprovalAction(requestId, action);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(action === "approve" ? "تمت الموافقة والسماح بالصرف" : "تم الرفض نهائياً");
      }
    } catch (e) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setIsLoading(null);
    }
  };
  return <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
      {" "}
      <button onClick={() => onAction("approve")} disabled={!!isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded shadow-sm text-sm font-bold transition-all disabled:opacity-50">
        {" "}
        {isLoading === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{" "}
        موافقة{" "}
      </button>{" "}
      <button onClick={() => onAction("reject")} disabled={!!isLoading} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-white border border-slate-300 hover:bg-red-50 hover:text-red-600 text-slate-600 px-3 py-1.5 rounded shadow-sm text-sm font-bold transition-all disabled:opacity-50">
        {" "}
        {isLoading === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}{" "}
        رفض{" "}
      </button>{" "}
    </div>;
}