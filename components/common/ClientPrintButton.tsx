"use client";

import { Printer } from "lucide-react";
export function ClientPrintButton() {
  return <button type="button" onClick={() => window.print()} className="bg-slate-800 text-white px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5">
      {" "}
      <Printer className="w-3.5 h-3.5" /> طباعة التقرير{" "}
    </button>;
}