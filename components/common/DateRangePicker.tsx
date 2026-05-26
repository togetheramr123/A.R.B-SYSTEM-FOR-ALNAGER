"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
export function DateRangePicker({
  defaultFrom,
  defaultTo
}: {
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /* Initialize state from URL params or props */
  const [from, setFrom] = useState(searchParams.get("from") || defaultFrom || "");
  const [to, setTo] = useState(searchParams.get("to") || defaultTo || "");
  const handleApply = () => {
    const params = new URLSearchParams(searchParams);
    if (from) params.set("from", from);else params.delete("from");
    if (to) params.set("to", to);else params.delete("to");
    router.replace(`${pathname}?${params.toString()}`);
  };
  return <div className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border border-slate-200">
      {" "}
      <Calendar className="w-4 h-4 text-slate-500" />{" "}
      <div className="flex items-center gap-2">
        {" "}
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" value={from} onChange={e => setFrom(e.target.value)} className="text-sm bg-transparent border border-slate-200 rounded px-2 py-1 outline-none focus:border-slate-500" />{" "}
        <span className="text-slate-400 text-sm">to</span>{" "}
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" value={to} onChange={e => setTo(e.target.value)} className="text-sm bg-transparent border border-slate-200 rounded px-2 py-1 outline-none focus:border-slate-500" />{" "}
      </div>{" "}
      <button onClick={handleApply} className="bg-slate-700 text-white text-sm font-medium px-3 py-1 rounded hover:bg-slate-700 transition-colors ml-2">
        {" "}
        Apply{" "}
      </button>{" "}
    </div>;
}