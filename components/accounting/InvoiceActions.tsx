"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, CreditCard, Send, Printer } from "lucide-react";
interface InvoiceActionsProps {
  id: string;
  state: string;
}
export default function InvoiceActions({
  id,
  state
}: InvoiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  /* Mock server actions */
  const handleAction = async (action: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Executing ${action} for Invoice ${id}`);
    router.refresh();
    setLoading(false);
  };
  return <div className="flex gap-2">
      {" "}
      {state === "draft" && <button onClick={() => handleAction("post")} disabled={loading} className="bg-[#017E84] text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50">
          {" "}
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{" "}
          ترحيل{" "}
        </button>}{" "}
      {state === "posted" && <button onClick={() => handleAction("payment")} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50">
          {" "}
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}{" "}
          تسجيل دفعة{" "}
        </button>}{" "}
      <button onClick={() => handleAction("print")} disabled={loading} className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50">
        {" "}
        <Printer className="w-4 h-4" /> طباعة{" "}
      </button>{" "}
      <button onClick={() => handleAction("send")} disabled={loading} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-all font-medium flex items-center gap-2 disabled:opacity-50">
        {" "}
        <Send className="w-4 h-4" /> إرسال بالبريد{" "}
      </button>{" "}
    </div>;
}