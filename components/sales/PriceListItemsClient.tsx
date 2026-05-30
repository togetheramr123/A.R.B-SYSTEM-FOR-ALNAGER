"use client";
import React from "react";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Filter, Star, List, Settings2, Search } from "lucide-react";
import { toast } from "sonner";
interface PriceList {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}
interface PriceListItem {
  id: string;
  priceListId: string;
  product: {
    id: string;
    name: string;
  } | null;
  price: number | string;
  buyPrice: number | string | null;
  isSaleFixed: boolean;
  isBuyFixed: boolean;
}
interface Props {
  priceList: PriceList;
  items: PriceListItem[];
  locale: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    startRecord: number;
    endRecord: number;
    totalCount: number;
  };
}
export function PriceListItemsClient({
  priceList,
  items,
  locale,
  pagination
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupBy, setShowGroupBy] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);
  /* Configurable columns */
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["product", "sale_price", "is_sale_fixed", "buy_price", "is_buy_fixed"]);
  const allPageSelected = items.length > 0 && items.every((p: any) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;
  const filtersRef = useRef<HTMLDivElement>(null);
  const groupByRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);
  const colPickerRef = useRef<HTMLTableCellElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
      if (groupByRef.current && !groupByRef.current.contains(e.target as Node)) setShowGroupBy(false);
      if (favoritesRef.current && !favoritesRef.current.contains(e.target as Node)) setShowFavorites(false);
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const toggleAll = () => {
    if (allPageSelected) setSelectedIds(new Set());else {
      const next = new Set(selectedIds);
      items.forEach((p: any) => next.add(p.id));
      setSelectedIds(next);
    }
  };
  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);else next.add(id);
    setSelectedIds(next);
  };
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const query = e.currentTarget.value;
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);else params.delete("q");
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
    }
  };
  const navigateToPage = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };
  /* Derived flags for columns */
  const showProduct = visibleColumns.includes("product");
  const showSalePrice = visibleColumns.includes("sale_price");
  const showSaleFixed = visibleColumns.includes("is_sale_fixed");
  const showBuyPrice = visibleColumns.includes("buy_price");
  const showBuyFixed = visibleColumns.includes("is_buy_fixed");
  return <div className="flex flex-col h-full bg-white relative" dir="rtl">
      {" "}
      {/* Odoo Sub-Header (Breadcrumb + Search) */}{" "}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
        {" "}
        <div className="flex items-center gap-2 flex-1">
          {" "}
          <span className="text-[13px] text-[#017E84] cursor-pointer hover:underline" onClick={() => router.push(`/${locale}/sales/pricelists`)}>
            قوائم الأسعار
          </span>{" "}
          <span className="text-gray-400">/</span>{" "}
          <span className="text-[13px] text-[#017E84] cursor-pointer hover:underline" onClick={() => router.push(`/${locale}/sales/pricelists/${priceList.id}`)}>
            {" "}
            {priceList.name} (EGP){" "}
          </span>{" "}
          <span className="text-gray-400">/</span>{" "}
          <span className="text-[13px] text-gray-800 font-medium cursor-pointer">
            عرض اسعار القائمة
          </span>{" "}
        </div>{" "}
        <div className="w-[300px] relative">
          {" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" placeholder="بحث..." defaultValue={searchParams.get("q") || ""} onKeyDown={handleSearch} className="w-full pl-8 pr-3 py-1 bg-gray-50 border border-gray-300 rounded text-sm outline-none focus:border-[#017E84] transition-colors" />{" "}
          <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1.5" />{" "}
        </div>{" "}
      </div>{" "}
      {/* Odoo Control Panel */}{" "}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white sticky top-0 z-10 min-h-[46px]">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <button className="bg-[#017E84] text-white px-3 py-1 rounded text-[13px] font-bold hover:bg-[#01656a] transition-colors shadow-sm" onClick={() => router.push(`/${locale}/sales/pricelists/${priceList.id}?new_item=1`)}>
            {" "}
            جديد{" "}
          </button>{" "}
          <button onClick={() => toast.info('ميزة التصدير قيد التطوير')} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="تصدير">
            {" "}
            <Download className="w-4 h-4" />{" "}
          </button>{" "}
          {someSelected && <div className="flex items-center gap-2 px-2 border-r border-gray-300">
              {" "}
              <span className="text-[13px] font-medium text-[#017E84]">
                {" "}
                تم تحديد {selectedIds.size} سجلات{" "}
              </span>{" "}
            </div>}{" "}
        </div>{" "}
        <div className="flex items-center gap-1.5">
          {" "}
          {/* Filters */}{" "}
          <div className="relative" ref={filtersRef}>
            {" "}
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 text-[13px] text-gray-700 hover:bg-gray-100 px-2 py-1 rounded">
              {" "}
              <Filter className="w-3.5 h-3.5" /> عوامل التصفية{" "}
            </button>{" "}
            {showFilters && <div className="absolute top-10 right-0 w-48 bg-white border border-gray-200 shadow-sm rounded-sm py-1 z-50">
                {" "}
                <button onClick={() => toast.info('ميزة فلتر الأرشيف قيد التطوير')} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100">
                  مؤرشف
                </button>{" "}
                <div className="border-t border-gray-100 my-1"></div>{" "}
                <button onClick={() => toast.info('ميزة الفلتر المخصص قيد التطوير')} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100">
                  إضافة عامل تصفية مخصص
                </button>{" "}
              </div>}{" "}
          </div>{" "}
          {/* Group By */}{" "}
          <div className="relative" ref={groupByRef}>
            {" "}
            <button onClick={() => setShowGroupBy(!showGroupBy)} className="flex items-center gap-1 text-[13px] text-gray-700 hover:bg-gray-100 px-2 py-1 rounded">
              {" "}
              <List className="w-3.5 h-3.5" /> التجميع حسب{" "}
            </button>{" "}
            {showGroupBy && <div className="absolute top-10 right-0 w-48 bg-white border border-gray-200 shadow-sm rounded-sm py-1 z-50">
                {" "}
                <button onClick={() => toast.info('هذه الميزة قيد التطوير')} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100">
                  المنتج
                </button>{" "}
                <button onClick={() => toast.info('هذه الميزة قيد التطوير')} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100">
                  المتغير
                </button>{" "}
                <button onClick={() => toast.info('هذه الميزة قيد التطوير')} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100">
                  قائمة الأسعار
                </button>{" "}
                <div className="border-t border-gray-100 my-1"></div>{" "}
                <button onClick={() => toast.info('هذه الميزة قيد التطوير')} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100">
                  إضافة مجموعة مخصصة
                </button>{" "}
              </div>}{" "}
          </div>{" "}
          {/* Favorites */}{" "}
          <div className="relative" ref={favoritesRef}>
            {" "}
            <button onClick={() => setShowFavorites(!showFavorites)} className="flex items-center gap-1 text-[13px] text-gray-700 hover:bg-gray-100 px-2 py-1 rounded">
              {" "}
              <Star className="w-3.5 h-3.5" /> المفضلات{" "}
            </button>{" "}
          </div>{" "}
          <div className="h-5 w-px bg-gray-300 mx-2"></div>{" "}
          {/* Pagination Options */}{" "}
          <div className="flex items-center text-[13px] text-gray-600 gap-2">
            {" "}
            <span>
              {" "}
              {pagination.totalCount === 0 ? "0" : `${pagination.startRecord}-${pagination.endRecord} / ${pagination.totalCount}`}{" "}
            </span>{" "}
            <div className="flex items-center gap-0">
              {" "}
              <button onClick={() => navigateToPage(pagination.currentPage - 1)} disabled={pagination.currentPage <= 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent">
                {" "}
                <ChevronRight className="w-4 h-4" />{" "}
              </button>{" "}
              <button onClick={() => navigateToPage(pagination.currentPage + 1)} disabled={pagination.currentPage >= pagination.totalPages} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent">
                {" "}
                <ChevronLeft className="w-4 h-4" />{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Main Table Content */}{" "}
      <div className="flex-1 overflow-auto bg-white custom-scrollbar">
        {" "}
        <table className="w-full text-right text-[13px] select-none border-collapse">
          {" "}
          <thead className="bg-[#f8f9fa] border-b border-gray-300 sticky top-0 z-10 shadow-sm text-gray-700">
            {" "}
            <tr>
              {" "}
              <th className="pl-3 pr-4 py-2 w-10 text-center border-l border-gray-300">
                {" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={allPageSelected} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] cursor-pointer block m-auto" />{" "}
              </th>{" "}
              {showProduct && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-gray-200 transition-colors group">
                  {" "}
                  <div className="flex items-center gap-1">Products</div>{" "}
                </th>}{" "}
              {showSalePrice && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-gray-200 transition-colors group text-left">
                  {" "}
                  <div className="flex items-center justify-end gap-1">
                    سعر البيع
                  </div>{" "}
                </th>}{" "}
              {showSaleFixed && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-gray-200 transition-colors group">
                  {" "}
                  <div className="flex items-center justify-center gap-1">
                    البيع قطعي
                  </div>{" "}
                </th>}{" "}
              {showBuyPrice && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-gray-200 transition-colors group text-left">
                  {" "}
                  <div className="flex items-center justify-end gap-1">
                    سعر الشراء
                  </div>{" "}
                </th>}{" "}
              {showBuyFixed && <th className="px-3 py-2 font-bold cursor-pointer hover:bg-gray-200 transition-colors group">
                  {" "}
                  <div className="flex items-center justify-center gap-1">
                    الشراء قطعي
                  </div>{" "}
                </th>}{" "}
              <th className="w-8 px-2 py-2 text-center relative" ref={colPickerRef}>
                {" "}
                <button onClick={() => setShowColPicker(!showColPicker)} className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-200 mx-auto">
                  {" "}
                  <Settings2 className="w-4 h-4" />{" "}
                </button>{" "}
                {showColPicker && <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 shadow-sm rounded-md py-1 min-w-[160px] z-50 text-right font-normal">
                    {" "}
                    <div className="px-3 py-1.5 text-xs text-gray-500 font-bold border-b border-gray-100 mb-1">
                      الأعمدة الظاهرة
                    </div>{" "}
                    {[{
                  id: "product",
                  label: "Products"
                }, {
                  id: "sale_price",
                  label: "سعر البيع"
                }, {
                  id: "is_sale_fixed",
                  label: "البيع قطعي"
                }, {
                  id: "buy_price",
                  label: "سعر الشراء"
                }, {
                  id: "is_buy_fixed",
                  label: "الشراء قطعي"
                }].map(col => {
                  const isVis = visibleColumns.includes(col.id);
                  return <button key={col.id} onClick={() => {
                    if (isVis && visibleColumns.length > 1) {
                      setVisibleColumns(visibleColumns.filter(c => c !== col.id));
                    } else if (!isVis) {
                      setVisibleColumns([...visibleColumns, col.id]);
                    }
                  }} className="w-full text-right px-4 py-1.5 hover:bg-gray-100 flex items-center justify-between group">
                          {" "}
                          <span>{col.label}</span>{" "}
                          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isVis} readOnly className="w-3.5 h-3.5 text-[#017E84] focus:ring-0 rounded-sm pointer-events-none opacity-50 group-hover:opacity-100" />{" "}
                        </button>;
                })}{" "}
                  </div>}{" "}
              </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-gray-200 bg-white">
            {" "}
            {items.length === 0 ? <tr>
                {" "}
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  {" "}
                  لا توجد منتجات مطابقة في هذه القائمة.{" "}
                </td>{" "}
              </tr> : items.map((item, idx) => {
            const isSelected = selectedIds.has(item.id);
            return <tr key={item.id} onClick={() => toggleSelection(item.id)} className={`hover:bg-gray-50 border-b border-gray-100 transition-colors cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}>
                    {" "}
                    <td className="pl-3 pr-4 py-2 border-l border-gray-100 text-center" onClick={e => e.stopPropagation()}>
                      {" "}
                      <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isSelected} onChange={() => toggleSelection(item.id)} className="w-4 h-4 rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] block m-auto cursor-pointer" />{" "}
                    </td>{" "}
                    {showProduct && <td className="px-3 py-2 text-gray-900 truncate max-w-[200px]">
                        {" "}
                        {item.product?.name || "---"}{" "}
                      </td>}{" "}
                    {showSalePrice && <td className="px-3 py-2 text-gray-800 text-left">
                        {" "}
                        {Number(item.price).toFixed(2)}{" "}
                      </td>}{" "}
                    {showSaleFixed && <td className="px-3 py-2 text-center text-gray-500">
                        {" "}
                        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={item.isSaleFixed} readOnly className="w-3.5 h-3.5 accent-[#017E84] pointer-events-none block m-auto opacity-80" />{" "}
                      </td>}{" "}
                    {showBuyPrice && <td className="px-3 py-2 text-gray-800 text-left">
                        {" "}
                        {item.buyPrice ? Number(item.buyPrice).toFixed(2) : "0.00"}{" "}
                      </td>}{" "}
                    {showBuyFixed && <td className="px-3 py-2 text-center text-gray-500">
                        {" "}
                        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={item.isBuyFixed} readOnly className="w-3.5 h-3.5 accent-[#017E84] pointer-events-none block m-auto opacity-80" />{" "}
                      </td>}{" "}
                    <td className="w-8"></td>{" "}
                  </tr>;
          })}{" "}
            {/* Fill empty rows visually if there are few items */}{" "}
            {Array.from({
            length: Math.max(0, 10 - items.length)
          }).map((_, i) => <tr key={`empty-${i}`} className="h-9">
                  {" "}
                  <td colSpan={7} className="border-b border-gray-50"></td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
      <div className="bg-white border-t border-gray-200 h-10 w-full shrink-0"></div>{" "}
    </div>;
}