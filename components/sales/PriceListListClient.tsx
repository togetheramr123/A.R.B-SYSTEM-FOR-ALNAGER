"use client";

import { useState, useCallback, useRef, useEffect, Fragment, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Check, X, FileSpreadsheet, FileText, Archive, LayoutGrid, List, Search, ChevronLeft, ChevronRight, ChevronDown, CheckCheck, Upload, Filter, AlignLeft, Star, DollarSign, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deletePriceLists } from "@/app/actions/pricelists";
import { toast } from "sonner";
interface PriceListItem {
  id: string;
  name: string;
  currencyId: string;
  type: string;
  active: boolean;
  startDate?: string | null;
  endDate?: string | null;
  producingCompany?: string | null;
  arCode?: string | null;
  partner?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}
interface Props {
  pricelists: PriceListItem[];
  locale: string;
  searchQuery?: string;
  filterParam?: string;
  groupByParam?: string;
  baseUrl?: string; // e.g. '/ar/purchases/pricelists' — defaults to sales
}
export function PriceListListClient({
  pricelists,
  locale,
  searchQuery,
  filterParam,
  groupByParam,
  baseUrl
}: Props) {
  const listBaseUrl = baseUrl || `/${locale}/sales/pricelists`;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // UI States
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupBy, setShowGroupBy] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false); // Selection States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const groupByRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null); // 1. Filter
  const filtered = useMemo(() => {
    let result = [...pricelists]; // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.partner?.name?.toLowerCase()?.includes(q) || p.producingCompany?.toLowerCase()?.includes(q));
    } // Archive filter
    if (filterParam === "archived") {
      result = result.filter(p => !p.active);
    } else if (filterParam === "sale") {
      result = result.filter(p => p.active && p.type === "sale");
    } else if (filterParam === "purchase") {
      result = result.filter(p => p.active && p.type === "purchase");
    } else {
      result = result.filter(p => p.active);
    }
    return result;
  }, [pricelists, searchQuery, filterParam]);
  const allPageSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;
  const currentFilter = searchParams.get("filter"); // Click outside handler for dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
      if (groupByRef.current && !groupByRef.current.contains(e.target as Node)) setShowGroupBy(false);
      if (favoritesRef.current && !favoritesRef.current.contains(e.target as Node)) setShowFavorites(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []); // Selection Logic
  const toggleAll = () => {
    if (allPageSelected) setSelectedIds(new Set());else {
      const next = new Set(selectedIds);
      filtered.forEach(p => next.add(p.id));
      setSelectedIds(next);
    }
  };
  const toggleOne = (id: string, index: number, shiftKey: boolean) => {
    const next = new Set(selectedIds);
    if (shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      for (let i = start; i <= end; i++) next.add(filtered[i].id);
    } else {
      if (next.has(id)) next.delete(id);else next.add(id);
    }
    setSelectedIds(next);
    setLastClickedIndex(index);
  };
  const clearSelection = () => setSelectedIds(new Set()); // Filter Navigation Handler
  const updateFilter = (filterValue: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (filterValue) sp.set("filter", filterValue);else sp.delete("filter");
    router.push(`${pathname}?${sp.toString()}`);
    setShowFilters(false);
  };
  const updateGroupBy = (key: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (key) sp.set("groupBy", key);else sp.delete("groupBy");
    router.push(`${pathname}?${sp.toString()}`);
    setShowGroupBy(false);
  };
  const exportCSV = useCallback(() => {
    const selected = filtered.filter(p => selectedIds.has(p.id));
    const data = selected.length > 0 ? selected : filtered;
    const headers = ["اسم قائمة الأسعار", "العملة", "الشريك"];
    const csvContent = "\uFEFF" + [headers.join(","), ...data.map(p => `"${p.name}","EGP","${p.partner?.name || "عامة"}"`)].join("\n");
    const url = URL.createObjectURL(new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `pricelists_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, selectedIds]); // Group By logic
  const groupByKey = groupByParam;
  const getGroupValue = (item: PriceListItem): string => {
    if (groupByKey === "type") return item.type === "sale" ? "مبيعات" : "مشتريات";
    if (groupByKey === "partner") return item.partner?.name || "عامة (بدون تخصيص)";
    if (groupByKey === "company") return item.producingCompany || "غير محدد";
    return "";
  };
  const renderKanbanCard = (item: PriceListItem, index: number, isSelected: boolean) => <div key={item.id} className={cn("group bg-white border border-gray-300 rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all relative cursor-pointer", isSelected ? "border-[#017E84] ring-1 ring-[#017E84]" : "")}>
      {" "}
      {/* Checkbox */}{" "}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        {" "}
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isSelected} onChange={e => toggleOne(item.id, index, (e.nativeEvent as any).shiftKey)} className={cn("w-4 h-4 rounded border-gray-300 accent-[#017E84] focus:ring-[#017E84] bg-white cursor-pointer shadow-sm", isSelected ? "opacity-100" : "")} />{" "}
      </div>{" "}
      {isSelected && <div className="absolute top-2 right-2 z-20 opacity-100">
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={true} readOnly className="w-4 h-4 rounded border-gray-300 accent-[#017E84] focus:ring-[#017E84] bg-white cursor-pointer shadow-sm" />
        </div>}{" "}
      <Link href={`${listBaseUrl}/${item.id}`} className="flex flex-col p-4 gap-2 min-h-[90px]">
        {" "}
        {/* Currency & Type Badge */}{" "}
        <div className="flex items-center justify-between gap-2">
          {" "}
          <span className="text-[10px] text-gray-500 font-bold bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase tracking-tighter">
            EGP
          </span>{" "}
          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded tracking-tighter uppercase", item.type === "sale" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>
            {" "}
            {item.type === "sale" ? "SALES" : "PURCH"}{" "}
          </span>{" "}
        </div>{" "}
        {/* Name */}{" "}
        <span className="font-bold text-gray-900 text-[13px] leading-tight line-clamp-2 min-h-[2.5em] group-hover:text-[#017E84] transition-colors" title={item.name}>
          {" "}
          {item.name}{" "}
        </span>{" "}
        {/* Footer Info */}{" "}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          {" "}
          <span className="text-[11px] text-gray-400 truncate max-w-[120px]">
            {" "}
            {item.partner?.name || "عامة"}{" "}
          </span>{" "}
          {item.startDate && <div className="flex items-center gap-1 text-[10px] text-teal-600 font-bold">
              {" "}
              <Filter className="w-3 h-3" />{" "}
              {new Date(item.startDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}{" "}
            </div>}{" "}
        </div>{" "}
      </Link>{" "}
    </div>;
  return <div className="flex flex-col min-h-screen bg-gray-50/30">
      {" "}
      {/* ════════ ODOO 17 CONTROL PANEL ════════ */}{" "}
      <div className="bg-white border-b border-gray-200 w-full z-20">
        {" "}
        {/* Top: Title + Search */}{" "}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
          {" "}
          <h1 className="text-xl font-bold text-gray-900">
            قوائم الأسعار
          </h1>{" "}
          {/* Search Field */}{" "}
          <div className="relative w-full sm:w-[350px]">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />{" "}
            <form onSubmit={e => {
            e.preventDefault();
            const val = new FormData(e.currentTarget).get("q");
            const sp = new URLSearchParams(searchParams.toString());
            if (val) sp.set("q", val.toString());else sp.delete("q");
            router.push(`${pathname}?${sp.toString()}`);
          }}>
              {" "}
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" name="q" defaultValue={searchQuery} placeholder="بحث..." className="w-full bg-gray-100/80 hover:bg-gray-200/50 focus:bg-white text-[13px] py-1.5 pr-9 pl-3 rounded outline-none border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-medium placeholder:text-gray-400" />{" "}
            </form>{" "}
          </div>{" "}
        </div>{" "}
        {/* BOTTOM ROW: Actions, Filters, Views, Pagination */}{" "}
        <div className="flex items-center justify-between px-4 py-1.5">
          {" "}
          {/* Actions & Filters */}{" "}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {" "}
            <div className="flex items-center gap-1">
              {" "}
              <Link href={`${listBaseUrl}/new`} className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1.5 rounded font-bold text-[13px] transition-colors shadow-sm">
                {" "}
                جديد{" "}
              </Link>{" "}
              <button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded transition-colors" title="استيراد">
                {" "}
                <Upload className="w-4 h-4" />{" "}
              </button>{" "}
            </div>{" "}
            <div className="h-5 w-px bg-gray-300 my-auto hidden sm:block" />{" "}
            <div className="flex items-center gap-1 text-[13px]">
              {" "}
              {/* Filters Dropdown */}{" "}
              <div className="relative" ref={filtersRef}>
                {" "}
                <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 px-2.5 py-1.5 hover:bg-gray-100 rounded transition-colors font-medium">
                  {" "}
                  <Filter className="w-3.5 h-3.5" /> عوامل التصفية{" "}
                  <ChevronDown className="w-3 h-3 opacity-60" />{" "}
                </button>{" "}
                {showFilters && <div className="absolute top-[110%] right-0 w-52 bg-white border border-gray-200 shadow-sm rounded-lg py-1 z-50 overflow-hidden">
                    {" "}
                    <button onClick={() => updateFilter(null)} className="w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between hover:bg-gray-100 transition-colors">
                      {" "}
                      <span>الكل</span>{" "}
                      {!currentFilter && <Check className="w-3.5 h-3.5 text-[#017E84]" />}{" "}
                    </button>{" "}
                    <div className="border-t border-gray-100 my-1"></div>{" "}
                    <button onClick={() => updateFilter("archived")} className="w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between hover:bg-gray-100 transition-colors text-red-600">
                      {" "}
                      <span>📦 مؤرشف</span>{" "}
                      {currentFilter === "archived" && <Check className="w-3.5 h-3.5 text-red-600" />}{" "}
                    </button>{" "}
                    <div className="border-t border-gray-100 my-1"></div>{" "}
                    <button onClick={() => updateFilter("sale")} className="w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between hover:bg-gray-100 transition-colors">
                      {" "}
                      <span>مبيعات (Sales)</span>{" "}
                      {currentFilter === "sale" && <Check className="w-3.5 h-3.5 text-[#017E84]" />}{" "}
                    </button>{" "}
                    <button onClick={() => updateFilter("purchase")} className="w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between hover:bg-gray-100 transition-colors">
                      {" "}
                      <span>مشتريات (Purchases)</span>{" "}
                      {currentFilter === "purchase" && <Check className="w-3.5 h-3.5 text-[#017E84]" />}{" "}
                    </button>{" "}
                    <div className="border-t border-gray-100 my-1"></div>{" "}
                    <button className="w-full text-right px-4 py-1.5 text-[13px] text-gray-500 hover:bg-gray-100 transition-colors">
                      {" "}
                      إضافة عامل تصفية مخصص ⁺{" "}
                    </button>{" "}
                  </div>}{" "}
              </div>{" "}
              {/* Group By Dropdown */}{" "}
              <div className="relative" ref={groupByRef}>
                {" "}
                <button onClick={() => setShowGroupBy(!showGroupBy)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors font-medium cursor-pointer", showGroupBy ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100")}>
                  {" "}
                  <AlignLeft className="w-3.5 h-3.5" /> التجميع حسب{" "}
                  <ChevronDown className="w-3 h-3 opacity-60" />{" "}
                </button>{" "}
                {showGroupBy && <div className="absolute top-[110%] right-0 w-56 bg-white border border-gray-200 shadow-sm rounded-lg py-1 z-50 overflow-hidden text-right">
                    {" "}
                    <div className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase">
                      تجميع البيانات
                    </div>{" "}
                    {[{
                  id: "type",
                  label: "قائمة الأسعار"
                }, {
                  id: "partner",
                  label: "الشركة المنتجة"
                }, {
                  id: "company",
                  label: "الشركة"
                }].map(g => <button key={g.id} onClick={() => updateGroupBy(g.id)} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100 transition-colors flex items-center justify-between">
                        {" "}
                        <span>{g.label}</span>{" "}
                        {groupByKey === g.id && <Check className="w-3.5 h-3.5 text-[#017E84]" />}{" "}
                      </button>)}{" "}
                    <div className="border-t border-gray-100 my-1"></div>{" "}
                    <button className="w-full text-right px-4 py-1.5 text-[13px] text-gray-500 hover:bg-gray-100 transition-colors">
                      {" "}
                      إضافة مجموعة مخصصة ⁺{" "}
                    </button>{" "}
                    {groupByKey && <>
                        {" "}
                        <div className="border-t border-gray-100 my-1" />{" "}
                        <button onClick={() => updateGroupBy(null)} className="w-full text-right px-4 py-1.5 text-[13px] text-gray-500 hover:bg-gray-100 transition-colors flex items-center justify-between">
                          {" "}
                          إلغاء التجميع <X className="w-3 h-3" />{" "}
                        </button>{" "}
                      </>}{" "}
                  </div>}{" "}
              </div>{" "}
              {/* Favorites Dropdown */}{" "}
              <div className="relative" ref={favoritesRef}>
                {" "}
                <button onClick={() => setShowFavorites(!showFavorites)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors font-medium cursor-pointer", showFavorites ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100")}>
                  {" "}
                  <Star className="w-3.5 h-3.5" /> المفضلات{" "}
                  <ChevronDown className="w-3 h-3 opacity-60" />{" "}
                </button>{" "}
                {showFavorites && <div className="absolute top-[110%] right-0 w-56 bg-white border border-gray-200 shadow-sm rounded-lg py-2 z-50 overflow-hidden text-right">
                    {" "}
                    <div className="px-4 py-2">
                      {" "}
                      <div className="text-[13px] font-medium text-gray-700 mb-2">
                        حفظ البحث الحالي
                      </div>{" "}
                      <div className="flex items-center gap-2 text-[12px] text-gray-600 mb-1.5">
                        {" "}
                        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="w-3.5 h-3.5 accent-[#017E84]" />{" "}
                        <span>استخدمه كافتراضي</span>{" "}
                      </div>{" "}
                      <div className="flex items-center gap-2 text-[12px] text-gray-600 mb-3">
                        {" "}
                        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="w-3.5 h-3.5 accent-[#017E84]" />{" "}
                        <span>المشاركة مع كافة المستخدمين</span>{" "}
                      </div>{" "}
                      <button className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1 rounded text-[12px] font-bold w-full transition-colors">
                        {" "}
                        حفظ{" "}
                      </button>{" "}
                    </div>{" "}
                    <div className="border-t border-gray-100 my-1"></div>{" "}
                    <button className="w-full text-right px-4 py-1.5 text-[13px] text-gray-600 hover:bg-gray-100 transition-colors">
                      {" "}
                      استيراد السجلات{" "}
                    </button>{" "}
                  </div>}{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Pagination & View Modes */}{" "}
          <div className="flex items-center gap-4">
            {" "}
            <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
              {" "}
              <span className="hidden sm:inline-block">
                {" "}
                {filtered.length > 0 ? `1-${filtered.length} / ${filtered.length}` : "0-0 / 0"}{" "}
              </span>{" "}
              <div className="flex items-center border border-gray-200 hover:border-gray-300 rounded shadow-sm bg-white overflow-hidden transition-colors">
                {" "}
                <button disabled className="p-1 text-gray-300">
                  <ChevronRight className="w-4 h-4" />
                </button>{" "}
                <div className="w-px h-6 bg-gray-200" />{" "}
                <button disabled className="p-1 text-gray-300">
                  <ChevronLeft className="w-4 h-4" />
                </button>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center bg-gray-100 p-0.5 rounded border border-gray-200">
              {" "}
              <button onClick={() => setViewMode("list")} className={cn("p-1 rounded transition-colors", viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800")}>
                {" "}
                <List className="w-4 h-4" />{" "}
              </button>{" "}
              <button onClick={() => setViewMode("kanban")} className={cn("p-1 rounded transition-colors", viewMode === "kanban" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800")}>
                {" "}
                <LayoutGrid className="w-4 h-4" />{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* ════════ CONTENT ════════ */}{" "}
      <div className="flex-1 overflow-auto">
        {" "}
        {/* ════════ LIST VIEW ════════ */}{" "}
        {viewMode === "list" && <div className="bg-white min-h-full">
            {" "}
            <table className="w-full text-right text-[13px] whitespace-nowrap">
              {" "}
              <thead className="border-b-2 border-gray-200">
                {" "}
                <tr className="text-gray-800 bg-white">
                  {" "}
                  <th className="px-3 py-2.5 w-10 font-medium">
                    {" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={allPageSelected} onChange={toggleAll} ref={el => {
                  if (el) el.indeterminate = someSelected && !allPageSelected;
                }} className="rounded border-gray-300 w-4 h-4 accent-[#017E84] focus:ring-[#017E84] cursor-pointer" />{" "}
                  </th>{" "}
                  <th className="px-3 py-2.5 font-bold">اسم قائمة الأسعار</th>{" "}
                  <th className="px-3 py-2.5 font-bold text-gray-600 w-8 text-center">
                    ⇅
                  </th>{" "}
                  <th className="px-3 py-2.5 w-10"></th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-gray-100">
                {" "}
                {(() => {
              if (filtered.length === 0) {
                return <tr>
                        <td colSpan={4} className="px-4 py-20 text-center text-gray-400 font-medium bg-gray-50/50">
                          لا توجد سجلات مطابقة.
                        </td>
                      </tr>;
              }
              let currentGroup: string | null = null;
              return filtered.map((item, index) => {
                const groupVal = groupByKey ? getGroupValue(item) : null;
                const isNewGroup = groupByKey && groupVal !== currentGroup;
                if (isNewGroup) currentGroup = groupVal;
                const isSelected = selectedIds.has(item.id);
                return <Fragment key={item.id}>
                        {" "}
                        {isNewGroup && <tr className="bg-gray-100/70 border-y border-gray-200">
                            {" "}
                            <td colSpan={4} className="px-5 py-2.5 font-bold text-gray-800 text-right">
                              {" "}
                              {groupVal}{" "}
                              <span className="bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5 text-[11px] mr-2 shadow-sm font-medium">
                                {filtered.filter(p => getGroupValue(p) === groupVal).length}{" "}
                                عناصر
                              </span>{" "}
                            </td>{" "}
                          </tr>}{" "}
                        <tr className={cn("hover:bg-gray-50 transition-colors group", isSelected && "bg-blue-50/30")}>
                          {" "}
                          <td className="px-3 py-2">
                            {" "}
                            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isSelected} onChange={e => toggleOne(item.id, index, (e.nativeEvent as any).shiftKey)} className="rounded border-gray-300 w-4 h-4 accent-[#017E84] focus:ring-[#017E84] opacity-50 group-hover:opacity-100 data-[checked=true]:opacity-100 transition-opacity cursor-pointer" data-checked={isSelected} />{" "}
                          </td>{" "}
                          <td className="px-3 py-2 font-bold text-gray-900">
                            {" "}
                            <Link href={`${listBaseUrl}/${item.id}`} className="hover:text-[#017E84]">
                              {item.name}
                            </Link>{" "}
                          </td>{" "}
                          <td className="px-3 py-2 text-center text-gray-400">
                            ⇅
                          </td>{" "}
                          <td className="px-3 py-2">
                            {" "}
                            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="w-4 h-4 accent-gray-400 cursor-pointer opacity-40 group-hover:opacity-100" />{" "}
                          </td>{" "}
                        </tr>{" "}
                      </Fragment>;
              });
            })()}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>}{" "}
        {/* ════════ KANBAN VIEW ════════ */}{" "}
        {viewMode === "kanban" && <div className="p-4 bg-gray-50 min-h-full">
            {" "}
            {filtered.length === 0 ? <div className="text-center py-20 text-gray-400 font-medium bg-white rounded-lg border border-gray-100 shadow-sm">
                لا توجد سجلات مطابقة.
              </div> : groupByKey ? (() => {
          const groups: Record<string, PriceListItem[]> = {};
          filtered.forEach(p => {
            const g = getGroupValue(p);
            if (!groups[g]) groups[g] = [];
            groups[g].push(p);
          });
          return <div className="space-y-6">
                    {" "}
                    {Object.entries(groups).map(([groupName, groupItems]) => <div key={groupName} className="space-y-4">
                        {" "}
                        <h3 className="font-bold text-gray-900 text-lg px-2 border-b-2 border-gray-200 pb-2 flex items-center gap-2">
                          {" "}
                          {groupName}{" "}
                          <span className="bg-gray-200 text-gray-700 font-medium px-2 py-0.5 rounded-full text-[13px]">
                            {groupItems.length}
                          </span>{" "}
                        </h3>{" "}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {" "}
                          {groupItems.map(item => {
                  const index = filtered.findIndex(p => p.id === item.id);
                  const isSelected = selectedIds.has(item.id);
                  return renderKanbanCard(item, index, isSelected);
                })}{" "}
                        </div>{" "}
                      </div>)}{" "}
                  </div>;
        })() : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {" "}
                {filtered.map((item, index) => {
            const isSelected = selectedIds.has(item.id);
            return renderKanbanCard(item, index, isSelected);
          })}{" "}
              </div>}{" "}
          </div>}{" "}
      </div>{" "}
      {/* ════════ FLOATING ACTION BAR ════════ */}{" "}
      <div className={cn("fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ease-out print:hidden", someSelected ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 pointer-events-none scale-95")}>
        {" "}
        <div className="bg-gray-900 rounded-full shadow-sm pl-2 pr-4 py-1.5 flex items-center gap-4 border border-gray-800">
          {" "}
          <div className="flex items-center gap-2 text-white/90 text-[13px] font-medium border-l border-gray-700 pl-4">
            {" "}
            <CheckCheck className="w-4 h-4 text-[#017E84]" />{" "}
            <span>
              محدد{" "}
              <span className="font-bold text-white ml-0.5">
                {selectedIds.size}
              </span>
            </span>{" "}
          </div>{" "}
          <div className="flex items-center gap-1">
            {" "}
            <button onClick={exportCSV} className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
              {" "}
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />{" "}
              تصدير{" "}
            </button>{" "}
            <button onClick={() => window.print()} className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
              {" "}
              <FileText className="w-4 h-4 text-gray-300" /> طباعة{" "}
            </button>{" "}
            <button className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
              {" "}
              <Archive className="w-4 h-4 text-amber-400" /> أرشفة{" "}
            </button>{" "}
            <button onClick={async () => {
            if (!confirm(`هل أنت متأكد من حذف ${selectedIds.size} قائمة أسعار؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;
            try {
              const result = await deletePriceLists(Array.from(selectedIds));
              if (result?.error) {
                toast.error(result.error);
              } else {
                toast.success(`تم حذف ${selectedIds.size} قائمة بنجاح`);
                clearSelection();
                router.refresh();
              }
            } catch (e: any) {
              toast.error(e.message || "خطأ في الحذف");
            }
          }} className="flex items-center gap-1.5 hover:bg-red-500/20 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
              {" "}
              <Trash2 className="w-4 h-4 text-red-400" /> حذف{" "}
            </button>{" "}
            <button onClick={clearSelection} className="ml-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="إلغاء التحديد">
              {" "}
              <X className="w-4 h-4" />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}