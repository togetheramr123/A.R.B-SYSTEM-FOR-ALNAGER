"use client";

import { Printer } from "lucide-react";
export function BrowserPrintButton({
  className
}: {
  className?: string;
}) {
  return <button onClick={() => window.print()} title="طباعة" className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:border-slate-400 transition-colors ${className || ""}`}>
      {" "}
      <Printer className="w-4 h-4" /> <span>طباعة</span>{" "}
    </button>;
}