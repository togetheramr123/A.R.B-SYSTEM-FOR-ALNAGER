"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
export default function PartnerLedgerFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("Accounting.Reports.Filters");
  const tLedger = useTranslations("Accounting.Reports.PartnerLedger");
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");
  const [type, setType] = useState(searchParams.get("type") || "all");
  const [includeReconciled, setIncludeReconciled] = useState(
    searchParams.get("includeReconciled") !== "false",
  );
  function handleSearch() {
    const params = new URLSearchParams(searchParams);
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    if (type && type !== "all") params.set("type", type);
    else params.delete("type");
    if (!includeReconciled) params.set("includeReconciled", "false");
    else params.delete("includeReconciled");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }
  return (
    <div className="flex flex-wrap items-end gap-4 no-print bg-slate-50 p-4 rounded-lg border border-slate-200 shadow-sm mb-6 text-slate-800">
      {" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t("from")}
        </label>{" "}
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t("to")}
        </label>{" "}
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
        />{" "}
      </div>{" "}
      <div>
        {" "}
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {t("accountType")}
        </label>{" "}
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border bg-white"
        >
          {" "}
          <option value="all">{tLedger("all")}</option>{" "}
          <option value="receivable">{tLedger("receivable")}</option>{" "}
          <option value="payable">{tLedger("payable")}</option>{" "}
        </select>{" "}
      </div>{" "}
      <div className="flex items-center gap-2 pb-2">
        {" "}
        <input
          type="checkbox"
          id="includeReconciled"
          checked={includeReconciled}
          onChange={(e) => setIncludeReconciled(e.target.checked)}
          className="h-4 w-4 text-[#017E84] focus:ring-indigo-500 border-gray-300 rounded"
        />{" "}
        <label
          htmlFor="includeReconciled"
          className="text-sm font-medium text-slate-700 select-none"
        >
          {" "}
          {t("includeReconciled")}{" "}
        </label>{" "}
      </div>{" "}
      <div className="flex-1 text-right">
        {" "}
        <button
          onClick={handleSearch}
          disabled={isPending}
          className="bg-slate-800 text-white px-6 py-2 rounded-md hover:bg-slate-900 disabled:opacity-50 transition-colors shadow"
        >
          {" "}
          {isPending ? t("updating") : t("update")}{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}
