"use client";

import { TopPortal } from "@/components/common/TopPortal";
import { Filter, Printer, Download } from "lucide-react";
export function ShortageTopActions({
  from,
  to
}: {
  from?: string;
  to?: string;
}) {
  return <TopPortal>
      {" "}
      <div className="flex items-center gap-2" dir="rtl">
        {" "}
        <form method="GET" className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
          {" "}
          <Filter className="w-3.5 h-3.5 text-indigo-500" />{" "}
          <label className="text-slate-600 text-[11px] font-bold">من:</label>{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" name="from" defaultValue={from || ""} className="bg-transparent border-none text-[11px] outline-none text-slate-700 w-28" />{" "}
          <div className="h-3.5 w-px bg-slate-300"></div>{" "}
          <label className="text-slate-600 text-[11px] font-bold">إلى:</label>{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" name="to" defaultValue={to || ""} className="bg-transparent border-none text-[11px] outline-none text-slate-700 w-28" />{" "}
          <button type="submit" className="text-indigo-600 font-bold hover:text-indigo-800 border-r border-slate-300 pr-2 transition-colors text-[11px]">
            {" "}
            تطبيق{" "}
          </button>{" "}
        </form>{" "}
        <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 p-1.5 rounded-md transition-colors" title="طباعة">
          {" "}
          <Printer className="w-3.5 h-3.5" />{" "}
        </button>{" "}
      </div>{" "}
    </TopPortal>;
}