"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { getPartners } from "@/app/actions/contacts";
export default function PartnerLedgerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [partnerId, setPartnerId] = useState(searchParams.get("partnerId") || "");
  /* Partners list */
  const [partners, setPartners] = useState<{
    id: string;
    name: string;
  }[]>([]);
  useEffect(() => {
    getPartners().then(setPartners);
  }, []);
  const handleApply = () => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (dateFrom) params.set("dateFrom", dateFrom);else params.delete("dateFrom");
      if (dateTo) params.set("dateTo", dateTo);else params.delete("dateTo");
      if (partnerId) params.set("partnerId", partnerId);else params.delete("partnerId");
      router.replace(`?${params.toString()}`);
    });
  };
  return <div className="bg-white p-4 mb-4 rounded border border-slate-200 flex flex-wrap gap-4 items-end">
      {" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          من تاريخ
        </label>{" "}
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border border-slate-300 rounded px-3 py-2 text-sm" />{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          إلى تاريخ
        </label>{" "}
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border border-slate-300 rounded px-3 py-2 text-sm" />{" "}
      </div>{" "}
      <div className="min-w-[200px]">
        {" "}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          الشريك
        </label>{" "}
        <select value={partnerId} onChange={e => setPartnerId(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
          {" "}
          <option value="">(الكل)</option>{" "}
          {partners.map(p => <option key={p.id} value={p.id}>
              {p.name}
            </option>)}{" "}
        </select>{" "}
      </div>{" "}
      <button onClick={handleApply} disabled={isPending} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50">
        {" "}
        {isPending ? "جاري التحديث..." : "تطبيق الفلتر"}{" "}
      </button>{" "}
    </div>;
}