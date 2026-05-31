"use client";
import React from "react";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, Filter, ChevronDown, X, Calendar, Users, LayoutList, Check } from "lucide-react";
import { cn } from "@/lib/utils";
interface FilterProps {
  locale: string;
  currentFilters: {
    search?: string;
    state?: string;
    payment?: string;
    overdue?: string;
    group?: string;
  };
  filterCounts: {
    draft: number;
    posted: number;
    cancel: number;
    not_paid: number;
    paid: number;
    overdue: number;
  };
  basePath?: string;
}
export default function InvoiceFilters({
  locale,
  currentFilters,
  filterCounts,
  basePath
}: FilterProps) {
  const router = useRouter();
  const defaultPath = basePath || `/${locale}/accounting/invoices`;
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupBy, setShowGroupBy] = useState(false);
  const [searchValue, setSearchValue] = useState(currentFilters.search || ""); // Parse comma-separated values into arrays
  const activeStates = (currentFilters.state || "").split(",").filter(Boolean);
  const activePayments = (currentFilters.payment || "").split(",").filter(Boolean);
  const isOverdue = currentFilters.overdue === "true";
  const buildUrl = useCallback((params: Record<string, string | undefined>) => {
    const merged = {
      ...currentFilters,
      ...params,
      page: undefined
    };
    const parts: string[] = [];
    Object.entries(merged).forEach(([k, v]) => {
      if (v) parts.push(`${k}=${encodeURIComponent(v)}`);
    });
    return `${defaultPath}${parts.length ? "?" + parts.join("&") : ""}`;
  }, [currentFilters, defaultPath]); // Toggle a value in a comma-separated list
  const toggleFilter = (key: "state" | "payment", value: string) => {
    const current = key === "state" ? activeStates : activePayments;
    let next: string[];
    if (current.includes(value)) {
      next = current.filter(v => v !== value);
    } else {
      next = [...current, value];
    }
    router.push(buildUrl({
      [key]: next.length > 0 ? next.join(",") : undefined
    }));
  };
  const toggleOverdue = () => {
    router.push(buildUrl({
      overdue: isOverdue ? undefined : "true"
    }));
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({
      search: searchValue || undefined
    }));
  };
  const clearAllFilters = () => {
    setSearchValue("");
    router.push(defaultPath);
  };
  const hasActiveFilters = activeStates.length > 0 || activePayments.length > 0 || isOverdue || currentFilters.search;
  const totalActiveCount = activeStates.length + activePayments.length + (isOverdue ? 1 : 0); // All filter items in a vertical list
  const filterItems = [{
    type: "header" as const,
    label: "الحالة"
  }, {
    type: "item" as const,
    key: "draft",
    group: "state" as const,
    label: "مسودة",
    count: filterCounts.draft
  }, {
    type: "item" as const,
    key: "posted",
    group: "state" as const,
    label: "تم الترحيل",
    count: filterCounts.posted
  }, {
    type: "item" as const,
    key: "cancel",
    group: "state" as const,
    label: "تم الإلغاء",
    count: filterCounts.cancel
  }, {
    type: "divider" as const
  }, {
    type: "header" as const,
    label: "حالة الدفع"
  }, {
    type: "item" as const,
    key: "not_paid",
    group: "payment" as const,
    label: "غير مدفوعة",
    count: filterCounts.not_paid
  }, {
    type: "item" as const,
    key: "paid",
    group: "payment" as const,
    label: "مدفوع",
    count: filterCounts.paid
  }, {
    type: "divider" as const
  }, {
    type: "header" as const,
    label: "تاريخ الاستحقاق"
  }, {
    type: "overdue" as const,
    label: "متأخر",
    count: filterCounts.overdue
  }];
  const groupByItems = [{
    key: "salesperson",
    label: "مندوب المبيعات",
    icon: Users
  }, {
    key: "state",
    label: "الحالة",
    icon: LayoutList
  }, {
    key: "date",
    label: "تاريخ الفاتورة",
    icon: Calendar
  }, {
    key: "due_date",
    label: "تاريخ الاستحقاق",
    icon: Calendar
  }];
  return <div className="space-y-3">
      {" "}
      {/* Top Bar */}{" "}
      <div className="flex items-center gap-3">
        {" "}
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          {" "}
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="بحث..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-gray-50/50" />{" "}
        </form>{" "}
        {/* Filter Button */}{" "}
        <div className="relative">
          {" "}
          <button onClick={() => {
          setShowFilters(!showFilters);
          setShowGroupBy(false);
        }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors", showFilters || hasActiveFilters ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}>
            {" "}
            <Filter className="w-4 h-4" /> عوامل التصفية{" "}
            {totalActiveCount > 0 && <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {" "}
                {totalActiveCount}{" "}
              </span>}{" "}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showFilters && "rotate-180")} />{" "}
          </button>{" "}
          {/* Filter Dropdown — Vertical List */}{" "}
          {showFilters && <div className="absolute top-full right-0 mt-1 w-72 bg-white rounded-sm border border-gray-200 shadow-sm z-50 py-2 animate-in slide-in- fade-in duration-150">
              {" "}
              {filterItems.map((item, idx) => {
            if (item.type === "header") {
              return <div key={idx} className="px-4 pt-3 pb-1.5">
                      {" "}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {" "}
                        {item.label}{" "}
                      </span>{" "}
                    </div>;
            }
            if (item.type === "divider") {
              return <div key={idx} className="my-1.5 border-t border-gray-100" />;
            }
            if (item.type === "overdue") {
              return <button key={idx} onClick={toggleOverdue} className={cn("w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors", isOverdue && "bg-red-50 hover:bg-red-50")}>
                      {" "}
                      <div className="flex items-center gap-3">
                        {" "}
                        <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors", isOverdue ? "bg-red-600 border-red-600" : "border-gray-300")}>
                          {" "}
                          {isOverdue && <Check className="w-3 h-3 text-white" />}{" "}
                        </div>{" "}
                        <span className={cn("font-medium", isOverdue ? "text-red-700" : "text-gray-700")}>
                          {" "}
                          {item.label}{" "}
                        </span>{" "}
                      </div>{" "}
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", isOverdue ? "bg-red-200 text-red-800" : "bg-gray-100 text-gray-500")}>
                        {" "}
                        {item.count}{" "}
                      </span>{" "}
                    </button>;
            } // Regular filter item
            const isActive = item.group === "state" ? activeStates.includes(item.key!) : activePayments.includes(item.key!);
            return <button key={idx} onClick={() => toggleFilter(item.group!, item.key!)} className={cn("w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 transition-colors", isActive && "bg-blue-50/70 hover:bg-blue-50")}>
                    {" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                        {" "}
                        {isActive && <Check className="w-3 h-3 text-white" />}{" "}
                      </div>{" "}
                      <span className={cn("font-medium", isActive ? "text-blue-700" : "text-gray-700")}>
                        {" "}
                        {item.label}{" "}
                      </span>{" "}
                    </div>{" "}
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", isActive ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-500")}>
                      {" "}
                      {item.count}{" "}
                    </span>{" "}
                  </button>;
          })}{" "}
            </div>}{" "}
        </div>{" "}
        {/* Group By Button */}{" "}
        <div className="relative">
          {" "}
          <button onClick={() => {
          setShowGroupBy(!showGroupBy);
          setShowFilters(false);
        }} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors", showGroupBy || currentFilters.group ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}>
            {" "}
            <LayoutList className="w-4 h-4" /> التجميع حسب{" "}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showGroupBy && "rotate-180")} />{" "}
          </button>{" "}
          {showGroupBy && <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-sm border border-gray-200 shadow-sm z-50 py-2 animate-in slide-in- fade-in duration-150">
              {" "}
              {groupByItems.map(g => {
            const isActive = currentFilters.group === g.key;
            return <button key={g.key} onClick={() => router.push(buildUrl({
              group: isActive ? undefined : g.key
            }))} className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors", isActive && "bg-blue-50/70 hover:bg-blue-50")}>
                    {" "}
                    <div className={cn("w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors", isActive ? "bg-blue-600 border-blue-600" : "border-gray-300")}>
                      {" "}
                      {isActive && <Check className="w-3 h-3 text-white" />}{" "}
                    </div>{" "}
                    <g.icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "text-gray-400")} />{" "}
                    <span className={cn("font-medium", isActive ? "text-blue-700" : "text-gray-700")}>
                      {g.label}
                    </span>{" "}
                  </button>;
          })}{" "}
            </div>}{" "}
        </div>{" "}
        {hasActiveFilters && <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1">
            {" "}
            <X className="w-3 h-3" /> مسح الكل{" "}
          </button>}{" "}
      </div>{" "}
      {/* Active Filter Chips */}{" "}
      {hasActiveFilters && <div className="flex items-center gap-2 flex-wrap">
          {" "}
          {currentFilters.search && <ActiveChip label={`بحث: ${currentFilters.search}`} onRemove={() => {
        setSearchValue("");
        router.push(buildUrl({
          search: undefined
        }));
      }} />}{" "}
          {activeStates.map(s => <ActiveChip key={s} label={s === "draft" ? "مسودة" : s === "posted" ? "تم الترحيل" : "ملغية"} onRemove={() => toggleFilter("state", s)} />)}{" "}
          {activePayments.map(p => <ActiveChip key={p} label={p === "not_paid" ? "غير مدفوعة" : p === "paid" ? "مدفوع" : "جزئي"} onRemove={() => toggleFilter("payment", p)} />)}{" "}
          {isOverdue && <ActiveChip label="متأخر" onRemove={toggleOverdue} danger />}{" "}
        </div>}{" "}
    </div>;
}
function ActiveChip({
  label,
  onRemove,
  danger
}: {
  label: string;
  onRemove: () => void;
  danger?: boolean;
}) {
  return <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", danger ? "bg-red-50 text-red-700 border-red-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
      {" "}
      {label}{" "}
      <button onClick={onRemove} className="hover:opacity-70">
        {" "}
        <X className="w-3 h-3" />{" "}
      </button>{" "}
    </span>;
}