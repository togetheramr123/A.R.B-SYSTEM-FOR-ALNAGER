"use client";

import { useState, useCallback, useRef, useEffect, Fragment } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Package, Check, X, FileSpreadsheet, FileText, Archive, LayoutGrid, List, Search, ChevronLeft, ChevronRight, ChevronDown, CheckCheck, Upload, Filter, AlignLeft, Star, Settings2, Loader2, Trash2, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProductIdsByFilter, fetchProductsForGroup, getProductsForExport } from "@/app/actions/inventory";
import { ExportDialog, ExportField } from "@/components/common/ExportDialog";
import { bulkDeleteRecords, bulkArchiveRecords } from "@/app/actions/bulk-actions";
import { toast } from "sonner";
interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  category?: {
    name: string;
    id?: string;
  };
  type: string;
  uom: string;
  hasSecondaryUnit?: boolean;
  secondaryUom?: string;
  salePrice: number;
  costPrice: number;
  totalStock: number;
  forecastedQty?: number;
  responsibleName?: string;
  tags?: any[];
  image?: string;
  categoryId?: string;
}
interface ProductListClientProps {
  products: Product[];
  locale: string;
  typeLabels: Record<string, {
    label: string;
    color: string;
  }>;
  searchQuery?: string;
  groupBy?: string;
  totalCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    startRecord: number;
    endRecord: number;
    prevUrl?: string;
    nextUrl?: string;
  };
  groupSummaries?: any[];
}
const AVAILABLE_COLUMNS = [{
  id: "internal_reference",
  label: "مرجع داخلي"
}, {
  id: "barcode",
  label: "باركود"
}, {
  id: "tags",
  label: "علامات تصنيف"
}, {
  id: "responsible",
  label: "المسؤول"
}, {
  id: "category",
  label: "فئة المنتج"
}, {
  id: "type",
  label: "نوع المنتج"
}, {
  id: "sale_price",
  label: "سعر البيع"
}, {
  id: "cost_price",
  label: "التكلفة"
}, {
  id: "forecasted",
  label: "الكمية المتوقعة"
}, {
  id: "stock",
  label: "الكمية في اليد"
}, {
  id: "uom",
  label: "وحدة القياس"
}, {
  id: "income_account",
  label: "حساب الدخل"
}, {
  id: "expense_account",
  label: "حساب النفقات"
}];
export function ProductListClient({
  products,
  locale,
  typeLabels,
  searchQuery,
  groupBy,
  totalCount,
  pagination,
  groupSummaries = []
}: ProductListClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // UI States
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid"); // Defaulting to grid to test
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupBy, setShowGroupBy] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(["internal_reference", "category", "tags", "responsible", "sale_price", "cost_price", "forecasted", "stock", "uom"]); // Selection States
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [loadedGroupProducts, setLoadedGroupProducts] = useState<Record<string, Product[]>>({});
  const [loadingGroups, setLoadingGroups] = useState<Record<string, boolean>>({});
  
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
  const [isLoadingBulk, setIsLoadingBulk] = useState(false);

  /* Bulk Actions State */
  const [isConfirmOpen, setIsConfirmOpen] = useState<'delete' | 'archive' | 'unarchive' | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  const handleBulkAction = async (actionType: 'delete' | 'archive' | 'unarchive') => {
    setIsActionPending(true);
    try {
      let result;
      const ids = Array.from(selectedIds);
      if (actionType === 'delete') {
        result = await bulkDeleteRecords('product', ids);
      } else if (actionType === 'archive') {
        result = await bulkArchiveRecords('product', ids, false);
      } else if (actionType === 'unarchive') {
        result = await bulkArchiveRecords('product', ids, true);
      }

      if (result?.error) {
        toast.error(result.error, {
          style: { direction: 'rtl', textAlign: 'right' }
        });
      } else if (result?.success) {
        toast.success("تم تنفيذ العملية بنجاح");
        setSelectedIds(new Set());
        router.refresh();
      }
    } catch (err: any) {
      toast.error("حدث خطأ أثناء تنفيذ العملية: " + (err.message || ''));
    } finally {
      setIsActionPending(false);
      setIsConfirmOpen(null);
    }
  };
  const filtersRef = useRef<HTMLDivElement>(null);
  const groupByRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);
  const colPickerRef = useRef<HTMLTableCellElement>(null);
  const allPageSelected = products.length > 0 && products.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;
  const currentFilter = searchParams.get("filter"); // Click outside handler for dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) setShowFilters(false);
      if (groupByRef.current && !groupByRef.current.contains(e.target as Node)) setShowGroupBy(false);
      if (favoritesRef.current && !favoritesRef.current.contains(e.target as Node)) setShowFavorites(false);
      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []); 
  
  const handleExport = async (format: "csv" | "xlsx", selectedFields: string[]) => {
    setIsExporting(true);
    try {
      // 1. Fetch data from server
      let idsToExport = Array.from(selectedIds);
      if (allPageSelected) {
          // If they clicked select all, fetch based on filter instead of ids
          idsToExport = []; 
      }
      const dataToExport = await getProductsForExport(idsToExport, currentFilter);
      
      // 2. Map data to selected columns only
      const fieldLabels = AVAILABLE_COLUMNS.reduce((acc: any, col) => ({...acc, [col.id]: col.label}), {});
      
      const mappedData = dataToExport.map((row: any) => {
        const newRow: any = {};
        selectedFields.forEach(fieldId => {
          newRow[fieldLabels[fieldId] || fieldId] = row[fieldId] ?? "";
        });
        return newRow;
      });

      // 3. Generate file
      const worksheet = XLSX.utils.json_to_sheet(mappedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
      
      if (format === "csv") {
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        XLSX.writeFile(workbook, `products_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      }
      
    } catch (e) {
      console.error("Export failed:", e);
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };

  // Selection Logic
  const toggleGroup = async (groupName: string) => {
    const isCurrentlyCollapsed = collapsedGroups[groupName] ?? true;
    
    if (isCurrentlyCollapsed && !loadedGroupProducts[groupName] && groupBy) {
      // Need to fetch
      setLoadingGroups(prev => ({ ...prev, [groupName]: true }));
      try {
        const data = await fetchProductsForGroup(groupBy, groupName);
        setLoadedGroupProducts(prev => ({ ...prev, [groupName]: data }));
      } catch (e) {
        console.error("Failed to load group", e);
      } finally {
        setLoadingGroups(prev => ({ ...prev, [groupName]: false }));
      }
    }
    
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !isCurrentlyCollapsed }));
  };

  const toggleAll = () => {
    if (allPageSelected) setSelectedIds(new Set());else {
      const next = new Set(selectedIds);
      products.forEach(p => next.add(p.id));
      setSelectedIds(next);
    }
  };
  const toggleOne = (id: string, index: number, shiftKey: boolean) => {
    const next = new Set(selectedIds);
    if (shiftKey && lastClickedIndex !== null) {
      const start = Math.min(lastClickedIndex, index);
      const end = Math.max(lastClickedIndex, index);
      for (let i = start; i <= end; i++) next.add(products[i].id);
    } else {
      if (next.has(id)) next.delete(id);else next.add(id);
    }
    setSelectedIds(next);
    setLastClickedIndex(index);
  };
  const clearSelection = () => setSelectedIds(new Set());
  const selectByFilter = async () => {
    setIsLoadingBulk(true);
    try {
      const ids = await getProductIdsByFilter({
        type: currentFilter || undefined
      });
      setSelectedIds(new Set(ids));
    } finally {
      setIsLoadingBulk(false);
    }
  }; // Filter Navigation Handler
  const updateFilter = (filterValue: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (filterValue) sp.set("filter", filterValue);else sp.delete("filter");
    sp.set("page", "1");
    router.push(`${pathname}?${sp.toString()}`);
    setShowFilters(false);
  };
  const updateGroupBy = (key: string | null) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (key) sp.set("groupBy", key);else sp.delete("groupBy");
    sp.set("page", "1");
    router.push(`${pathname}?${sp.toString()}`);
    setShowGroupBy(false);
  };
  const toggleColumn = (colId: string) => {
    setVisibleColumns(prev => prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]);
  };
  const exportExcel = useCallback(() => {
    const selected = products.filter(p => selectedIds.has(p.id));
    const data = selected.length > 0 ? selected : products;
    const headers = ["اسم المنتج", "الباركود", "الفئة", "النوع", "سعر البيع", "التكلفة"];
    const csvContent = "\uFEFF" + [headers.join(","), ...data.map(p => `"${p.name}","${p.barcode || p.sku || ""}","${p.category?.name || ""}","${typeLabels[p.type]?.label || p.type}","${p.salePrice}","${p.costPrice}"`)].join("\n");
    const url = URL.createObjectURL(new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [products, selectedIds, typeLabels]);
  const renderKanbanCard = (product: Product, index: number, isSelected: boolean) => <div key={product.id} className={cn("group flex flex-col bg-white border border-gray-300 rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all relative h-[92px] w-full", isSelected ? "border-[#017E84] ring-1 ring-[#017E84]" : "")}>
      {" "}
      {/* Checkbox (Top Right) */}{" "}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        {" "}
        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isSelected} onChange={e => toggleOne(product.id, index, (e.nativeEvent as any).shiftKey)} className={cn("w-4 h-4 rounded border-gray-300 accent-[#017E84] focus:ring-[#017E84] bg-white cursor-pointer shadow-sm", isSelected ? "opacity-100" : "")} />{" "}
      </div>{" "}
      {isSelected && <div className="absolute top-2 right-2 z-20 opacity-100">
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={true} readOnly className="w-4 h-4 rounded border-gray-300 accent-[#017E84] focus:ring-[#017E84] bg-white cursor-pointer shadow-sm" />
        </div>}{" "}
      {" "}
      <Link href={`/${locale}/inventory/products/${product.id}`} className="flex p-3 gap-3 h-full items-start">
        {" "}
        {/* Image (Rendered First -> Appears on the Right in RTL) */}{" "}
        <div className="w-[64px] h-[64px] bg-white flex-shrink-0 flex items-center justify-center overflow-hidden ml-1">
          {" "}
          {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50/50 border border-gray-100/50 rounded-sm">
              {" "}
              <Package className="w-7 h-7 text-gray-200" strokeWidth={1.5} />{" "}
            </div>}{" "}
        </div>{" "}
        {/* Details (Appears on the Left in RTL) */}{" "}
        <div className="flex-1 flex flex-col min-w-0">
          {" "}
          <span className="font-[600] text-gray-900 text-[13px] leading-tight mb-[3px] truncate" title={product.name}>
            {product.name}
          </span>{" "}
          <span className="text-[12px] text-gray-600 mb-[3px] truncate">
            السعر:{" "}
            {Number(product.salePrice).toLocaleString("en-US", {
            minimumFractionDigits: 2
          })}{" "}
            ج.م
          </span>{" "}
          <span className="text-[12px] text-gray-600 truncate">
            {" "}
            الكمية في اليد:{" "}
            {product.type === "storable" ? <span>
                {Number(product.totalStock).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
                قطعه
              </span> : "—"}{" "}
          </span>{" "}
        </div>{" "}
      </Link>{" "}
      <ExportDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        availableFields={AVAILABLE_COLUMNS}
        defaultSelectedFieldIds={["internal_reference", "barcode", "cost_price", "sale_price", "stock", "forecasted"]}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>;
  return <div className="flex flex-col min-h-screen bg-gray-50/30">
      {" "}
      {/* ════════ ODOO 17 CONTROL PANEL ════════ */}{" "}
      <div className="bg-white border-b border-gray-200 w-full z-20">
        {" "}
        {/* Search Row */}{" "}
        <div className="flex items-center justify-end px-4 py-1.5 border-b border-gray-100">
          {" "}
          {isLoadingBulk && <span className="text-[10px] text-gray-500 mr-2 bg-gray-100 px-2 py-0.5 rounded-full animate-pulse">
              جاري التحميل...
            </span>}{" "}
          {/* Search Field */}{" "}
          <div className="relative w-full sm:w-[350px]">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />{" "}
            <form onSubmit={e => {
            e.preventDefault();
            const val = new FormData(e.currentTarget).get("q");
            const sp = new URLSearchParams(searchParams.toString());
            if (val) sp.set("q", val.toString());else sp.delete("q");
            sp.set("page", "1");
            router.push(`${pathname}?${sp.toString()}`);
          }}>
              {" "}
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" name="q" defaultValue={searchQuery} placeholder="بحث في المنتجات..." className="w-full bg-gray-100/80 hover:bg-gray-200/50 focus:bg-white text-[13px] py-1.5 pr-9 pl-3 rounded outline-none border border-transparent focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-medium placeholder:text-gray-400" />{" "}
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
              <Link href={`/${locale}/inventory/products/new`} className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1.5 rounded font-bold text-[13px] transition-colors shadow-sm">
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
              {/* Filters Dropdown */}
              <div className="relative" ref={filtersRef}>
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors font-medium cursor-pointer ${showFilters ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"}`}>
                  <Filter className="w-3.5 h-3.5" /> عوامل التصفية <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {showFilters && (
                  <div className="absolute top-[110%] right-0 w-56 bg-white border border-gray-200 shadow-sm rounded py-1 z-50 text-right text-[13px]">
                    <button onClick={() => updateFilter("service")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>الخدمات</span>
                      {currentFilter === "service" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("storable")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>المنتجات</span>
                      {currentFilter === "storable" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("can_sell")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>يمكن بيعه</span>
                      {currentFilter === "can_sell" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("can_purchase")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>يمكن شراؤه</span>
                      {currentFilter === "can_purchase" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("available")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>المنتجات المتوفرة</span>
                      {currentFilter === "available" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("negative_forecast")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>الكمية المتوقعة السالبة</span>
                      {currentFilter === "negative_forecast" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>المفضلات</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>تحذيرات</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("archived")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>مؤرشف</span>
                      {currentFilter === "archived" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>إضافة عامل تصفية مخصص</span>
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    {currentFilter && (
                      <>
                        <div className="border-t border-gray-200 my-1" />
                        <button onClick={() => updateFilter(null)} className="w-full px-4 py-1.5 hover:bg-gray-100 text-gray-500 transition-colors flex justify-between items-center font-bold">
                          إلغاء التصفية <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Group By Dropdown */}{" "}
              <div className="relative" ref={groupByRef}>
                {" "}
                <button onClick={() => setShowGroupBy(!showGroupBy)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors font-medium cursor-pointer", showGroupBy ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100")}>
                  {" "}
                  <AlignLeft className="w-3.5 h-3.5" /> التجميع حسب{" "}
                  <ChevronDown className="w-3 h-3 opacity-60" />{" "}
                </button>{" "}
                {showGroupBy && <div className="absolute top-[110%] right-0 w-48 bg-white border border-gray-200 shadow-sm rounded-lg py-1 z-50 overflow-hidden text-right">
                    {" "}
                    <div className="px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase">
                      تجميع البيانات
                    </div>{" "}
                    <button onClick={() => updateGroupBy("category")} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100 transition-colors flex items-center justify-between">
                      {" "}
                      <span>فئة المنتجات</span>{" "}
                      {groupBy === "category" && <Check className="w-3.5 h-3.5 text-[#017E84]" />}{" "}
                    </button>{" "}
                    <button onClick={() => updateGroupBy("type")} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100 transition-colors flex items-center justify-between">
                      {" "}
                      <span>نوع المنتج</span>{" "}
                      {groupBy === "type" && <Check className="w-3.5 h-3.5 text-[#017E84]" />}{" "}
                    </button>{" "}
                    {groupBy && <>
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
                {showFavorites && <div className="absolute top-[110%] right-0 w-48 bg-white border border-gray-200 shadow-sm rounded-lg py-1 z-50 overflow-hidden text-right">
                    {" "}
                    <button className="w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between hover:bg-gray-100 transition-colors">
                      {" "}
                      <span>البحث الحالي</span>{" "}
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />{" "}
                    </button>{" "}
                    <div className="border-t border-gray-100 my-1" />{" "}
                    <button className="w-full text-right px-4 py-1.5 text-[13px] text-gray-500 hover:bg-gray-100 transition-colors">
                      حفظ البحث الحالي
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
                {totalCount > 0 ? `${pagination.startRecord}-${pagination.endRecord} / ${totalCount}` : "0-0 / 0"}{" "}
              </span>{" "}
              <div className="flex items-center border border-gray-200 hover:border-gray-300 rounded shadow-sm bg-white overflow-hidden transition-colors">
                {" "}
                {pagination.prevUrl ? <Link href={pagination.prevUrl} className="p-1 hover:bg-gray-100 text-gray-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link> : <button disabled className="p-1 text-gray-300">
                    <ChevronRight className="w-4 h-4" />
                  </button>}{" "}
                <div className="w-px h-6 bg-gray-200" />{" "}
                {pagination.nextUrl ? <Link href={pagination.nextUrl} className="p-1 hover:bg-gray-100 text-gray-600 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </Link> : <button disabled className="p-1 text-gray-300">
                    <ChevronLeft className="w-4 h-4" />
                  </button>}{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center bg-gray-100 p-0.5 rounded border border-gray-200">
              {" "}
              <button onClick={() => setViewMode("list")} className={cn("p-1 rounded transition-colors", viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800")}>
                {" "}
                <List className="w-4 h-4" />{" "}
              </button>{" "}
              <button onClick={() => setViewMode("grid")} className={cn("p-1 rounded transition-colors", viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800")}>
                {" "}
                <LayoutGrid className="w-4 h-4" />{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Select All Banner */}{" "}
      {allPageSelected && totalCount > products.length && <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-2 text-center text-[13px] text-gray-700 flex justify-center items-center gap-2">
          {" "}
          تم تحديد <span className="font-bold">{products.length}</span> في هذه
          الصفحة.{" "}
          <button onClick={selectByFilter} className="font-bold text-[#017E84] hover:underline underline-offset-2 flex items-center gap-1">
            {" "}
            تحديد كل الـ {totalCount} منتج{" "}
            <CheckCheck className="w-4 h-4" />{" "}
          </button>{" "}
        </div>}{" "}
      {/* ════════ LIST VIEW (Odoo Clean Style) ════════ */}{" "}
      <div className="flex-1 overflow-auto">
        {" "}
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
                  <th className="px-3 py-2.5 font-bold">اسم المنتج</th>{" "}
                  {visibleColumns.includes("internal_reference") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      مرجع داخلي
                    </th>}{" "}
                  {visibleColumns.includes("barcode") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      باركود
                    </th>}
                  {visibleColumns.includes("tags") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      علامات تصنيف
                    </th>}
                  {visibleColumns.includes("responsible") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      المسؤول
                    </th>}{" "}
                  {visibleColumns.includes("category") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      فئة المنتج
                    </th>}{" "}
                  {visibleColumns.includes("type") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      النوع
                    </th>}{" "}
                  {visibleColumns.includes("uom") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      وحدة القياس
                    </th>}{" "}
                  {visibleColumns.includes("sale_price") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      سعر البيع
                    </th>}{" "}
                  {visibleColumns.includes("cost_price") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      التكلفة
                    </th>}{" "}
                  {visibleColumns.includes("forecasted") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      الكمية المتوقعة
                    </th>}
                  {visibleColumns.includes("stock") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      الكمية في اليد
                    </th>}{" "}
                  {/* Column Picker Toggle */}{" "}
                  <th className="px-3 py-2.5 w-8 text-center relative" ref={colPickerRef}>
                    {" "}
                    <button onClick={() => setShowColPicker(!showColPicker)} className="text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100">
                      {" "}
                      <Settings2 className="w-4 h-4" />{" "}
                    </button>{" "}
                    {showColPicker && <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 shadow-sm rounded py-1 z-50 text-right">
                        {" "}
                        <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase">
                          الأعمدة المعروضة
                        </div>{" "}
                        {AVAILABLE_COLUMNS.map(col => <button key={col.id} onClick={e => {
                    e.stopPropagation();
                    toggleColumn(col.id);
                  }} className="w-full px-3 py-1.5 text-[13px] text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                            {" "}
                            <div className="flex items-center gap-2 w-full">
                              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={visibleColumns.includes(col.id)} readOnly className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] ml-auto" />
                              <span className="flex-1 text-right">{col.label}</span>
                            </div>
                          </button>)}{" "}
                      </div>}{" "}
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
                            <tbody className="divide-y divide-gray-100">
                {" "}
                {(() => {
                  if (!groupBy) {
                    return products.map((product, index) => {
                      const isSelected = selectedIds.has(product.id);
                      return (
                        <tr key={product.id} className={cn("hover:bg-gray-50 transition-colors group", isSelected && "bg-blue-50/30")}>
                          <td className="px-3 py-2">
                            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isSelected} onChange={e => toggleOne(product.id, index, (e.nativeEvent as any).shiftKey)} className="rounded border-gray-300 w-4 h-4 accent-[#017E84] focus:ring-[#017E84] opacity-50 group-hover:opacity-100 data-[checked=true]:opacity-100 transition-opacity cursor-pointer" data-checked={isSelected} />
                          </td>
                          <td className="px-3 py-2 font-bold text-gray-900 truncate max-w-[250px]">
                            <Link href={`/${locale}/inventory/products/${product.id}`} className="hover:text-[#017E84]">
                              {product.name}
                            </Link>
                          </td>
                          {visibleColumns.includes("internal_reference") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.sku || "—"}</td>}
                          {visibleColumns.includes("barcode") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.barcode || "—"}</td>}
                          {visibleColumns.includes("tags") && <td className="px-3 py-2">
                              {product.tags && product.tags.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {product.tags.map((t: any) => (
                                    <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium" style={{ backgroundColor: t.color + '20', color: t.color }}>
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              ) : "—"}
                          </td>}
                          {visibleColumns.includes("responsible") && <td className="px-3 py-2 text-gray-600">
                              {product.responsibleName ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                    {product.responsibleName[0]}
                                  </div>
                                  {product.responsibleName}
                                </div>
                              ) : "—"}
                          </td>}
                          {visibleColumns.includes("category") && <td className="px-3 py-2 text-gray-600">{product.category?.name || "—"}</td>}
                          {visibleColumns.includes("type") && <td className="px-3 py-2 text-gray-600">{typeLabels[product.type]?.label || product.type}</td>}
                          {visibleColumns.includes("uom") && <td className="px-3 py-2 text-gray-600">{product.uom || "—"}</td>}
                          {visibleColumns.includes("sale_price") && <td className="px-3 py-2 text-gray-800">{Number(product.salePrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                          {visibleColumns.includes("cost_price") && <td className="px-3 py-2 text-gray-800">{Number(product.costPrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                          {visibleColumns.includes("forecasted") && <td className="px-3 py-2 font-medium">
                              {product.type === "storable" ? <span className={(product.forecastedQty || 0) > 0 ? "text-gray-900" : (product.forecastedQty || 0) < 0 ? "text-red-600" : "text-gray-400"}>
                                  {product.forecastedQty}
                                </span> : <span className="text-gray-300">—</span>}
                          </td>}
                          {visibleColumns.includes("stock") && <td className="px-3 py-2 font-medium">
                              {product.type === "storable" ? <span className={product.totalStock > 0 ? "text-gray-900" : "text-gray-400"}>
                                  {product.totalStock}
                                </span> : <span className="text-gray-300">—</span>}
                          </td>}
                          <td className="px-3 py-2"></td>
                        </tr>
                      );
                    });
                  } else {
                    // Dynamic Grouping logic
                    const summaries = groupSummaries || [];
                    
                    return summaries.map(({ key: groupName, count }: { key: string, count: number }) => {
                      const isCollapsed = collapsedGroups[groupName] ?? true; // Default to collapsed in Odoo style
                      return (
                        <Fragment key={groupName}>
                          <tr className="bg-gray-50/80 hover:bg-gray-100 border-y border-gray-200 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                            <td colSpan={2} className="px-3 py-2 font-bold text-gray-900">
                              <div className="flex items-center gap-1.5">
                                {loadingGroups[groupName] ? (
                                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : isCollapsed ? (
                                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                                {groupName} <span className="text-gray-500 font-normal">({count})</span>
                              </div>
                            </td>
                            {/* Empty cells for group row to match Odoo structure */}
                            {visibleColumns.includes("internal_reference") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("barcode") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("tags") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("responsible") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("category") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("type") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("uom") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("sale_price") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("cost_price") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("forecasted") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("stock") && <td className="px-3 py-2"></td>}
                            <td className="px-3 py-2"></td>
                          </tr>
                          {!isCollapsed && (loadedGroupProducts[groupName] || []).map((product: any) => {
                            const index = products.findIndex(p => p.id === product.id);
                            const isSelected = selectedIds.has(product.id);
                            return (
                              <tr key={product.id} className={cn("hover:bg-gray-50 transition-colors group", isSelected && "bg-blue-50/30")}>
                                <td className="px-3 py-2">
                                  <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isSelected} onChange={e => toggleOne(product.id, index, (e.nativeEvent as any).shiftKey)} className="rounded border-gray-300 w-4 h-4 accent-[#017E84] focus:ring-[#017E84] opacity-50 group-hover:opacity-100 data-[checked=true]:opacity-100 transition-opacity cursor-pointer" data-checked={isSelected} />
                                </td>
                                <td className="px-3 py-2 font-bold text-gray-900 truncate max-w-[250px]">
                                  <Link href={`/${locale}/inventory/products/${product.id}`} className="hover:text-[#017E84] pr-4">
                                    {product.name}
                                  </Link>
                                </td>
                                {visibleColumns.includes("internal_reference") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.sku || "—"}</td>}
                                {visibleColumns.includes("barcode") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.barcode || "—"}</td>}
                                {visibleColumns.includes("tags") && <td className="px-3 py-2">
                                    {product.tags && product.tags.length > 0 ? (
                                      <div className="flex gap-1 flex-wrap">
                                        {product.tags.map((t: any) => (
                                          <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium" style={{ backgroundColor: t.color + '20', color: t.color }}>
                                            {t.name}
                                          </span>
                                        ))}
                                      </div>
                                    ) : "—"}
                                </td>}
                                {visibleColumns.includes("responsible") && <td className="px-3 py-2 text-gray-600">
                                    {product.responsibleName ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                          {product.responsibleName[0]}
                                        </div>
                                        {product.responsibleName}
                                      </div>
                                    ) : "—"}
                                </td>}
                                {visibleColumns.includes("category") && <td className="px-3 py-2 text-gray-600">{product.category?.name || "—"}</td>}
                                {visibleColumns.includes("type") && <td className="px-3 py-2 text-gray-600">{typeLabels[product.type]?.label || product.type}</td>}
                                {visibleColumns.includes("uom") && <td className="px-3 py-2 text-gray-600">{product.uom || "—"}</td>}
                                {visibleColumns.includes("sale_price") && <td className="px-3 py-2 text-gray-800">{Number(product.salePrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                                {visibleColumns.includes("cost_price") && <td className="px-3 py-2 text-gray-800">{Number(product.costPrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                                {visibleColumns.includes("forecasted") && <td className="px-3 py-2 font-medium">
                                    {product.type === "storable" ? <span className={(product.forecastedQty || 0) > 0 ? "text-gray-900" : (product.forecastedQty || 0) < 0 ? "text-red-600" : "text-gray-400"}>
                                        {product.forecastedQty}
                                      </span> : <span className="text-gray-300">—</span>}
                                </td>}
                                {visibleColumns.includes("stock") && <td className="px-3 py-2 font-medium">
                                    {product.type === "storable" ? <span className={product.totalStock > 0 ? "text-gray-900" : "text-gray-400"}>
                                        {product.totalStock}
                                      </span> : <span className="text-gray-300">—</span>}
                                </td>}
                                <td className="px-3 py-2"></td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    });
                  }
                })()}
                {products.length === 0 && <tr>
                    <td colSpan={11} className="px-4 py-20 text-center text-gray-400 font-medium bg-gray-50/50">
                      لا توجد سجلات مطابقة.
                    </td>
                  </tr>}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>}{" "}
        {/* ════════ KANBAN VIEW (Odoo White Minimalist Style) ════════ */}{" "}
        {viewMode === "grid" && <div className="p-4 bg-gray-50 min-h-full">
            {" "}
            {products.length === 0 ? <div className="text-center py-20 text-gray-400 font-medium bg-white rounded-lg border border-gray-100 shadow-sm">
                لا توجد سجلات مطابقة.
              </div> : groupBy ? (() => {
          const groups: Record<string, Product[]> = {};
          products.forEach(p => {
            const g = groupBy === "category" ? p.category?.name || "بدون فئة" : typeLabels[p.type]?.label || p.type;
            if (!groups[g]) groups[g] = [];
            groups[g].push(p);
          });
          return <div className="space-y-6">
                    {" "}
                    {Object.entries(groups).map(([groupName, groupProducts]) => <div key={groupName} className="space-y-4">
                          {" "}
                          <h3 className="font-bold text-gray-900 text-lg px-2 border-b-2 border-gray-200 pb-2 flex items-center gap-2">
                            {" "}
                            {groupName}{" "}
                            <span className="bg-gray-200 text-gray-700 font-medium px-2 py-0.5 rounded-full text-[13px]">
                              {groupProducts.length}
                            </span>{" "}
                          </h3>{" "}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {" "}
                            {groupProducts.map(product => {
                  const index = products.findIndex(p => p.id === product.id);
                  const isSelected = selectedIds.has(product.id);
                  return renderKanbanCard(product, index, isSelected);
                })}{" "}
                          </div>{" "}
                        </div>)}{" "}
                    <ExportDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        availableFields={AVAILABLE_COLUMNS}
        defaultSelectedFieldIds={["internal_reference", "barcode", "cost_price", "sale_price", "stock", "forecasted"]}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>;
        })() : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {" "}
                {products.map((product, index) => {
            const isSelected = selectedIds.has(product.id);
            return renderKanbanCard(product, index, isSelected);
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
          <div className="flex items-center gap-1 font-arabic">
            {" "}
            <button onClick={exportExcel} className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
              {" "}
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />{" "}
              تصدير{" "}
            </button>{" "}
            <button onClick={() => window.print()} className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
              {" "}
              <FileText className="w-4 h-4 text-gray-300" /> طباعة{" "}
            </button>{" "}
            {currentFilter === "archived" ? (
              <button onClick={() => setIsConfirmOpen('unarchive')} className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
                <ArchiveRestore className="w-4 h-4 text-teal-400" /> إلغاء الأرشفة
              </button>
            ) : (
              <button onClick={() => setIsConfirmOpen('archive')} className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
                <Archive className="w-4 h-4 text-amber-400" /> أرشفة
              </button>
            )}
            <button onClick={() => setIsConfirmOpen('delete')} className="flex items-center gap-1.5 hover:bg-white/10 text-white px-3 py-1.5 rounded-full text-[12px] font-semibold transition-colors">
              <Trash2 className="w-4 h-4 text-red-400" /> حذف
            </button>
            <button onClick={clearSelection} className="ml-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="إلغاء التحديد">
              {" "}
              <X className="w-4 h-4" />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <ExportDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        availableFields={AVAILABLE_COLUMNS}
        defaultSelectedFieldIds={["internal_reference", "barcode", "cost_price", "sale_price", "stock", "forecasted"]}
        onExport={handleExport}
        isExporting={isExporting}
      />
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-arabic">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl border border-gray-200" dir="rtl">
            <h3 className="text-base font-bold text-gray-900 mb-2">تأكيد الإجراء</h3>
            <p className="text-xs text-gray-500 mb-6">
              {isConfirmOpen === 'delete' && `هل أنت متأكد من رغبتك في حذف ${selectedIds.size} عنصر؟ لا يمكن التراجع عن هذا الإجراء.`}
              {isConfirmOpen === 'archive' && `هل أنت متأكد من رغبتك في أرشفة ${selectedIds.size} عنصر؟`}
              {isConfirmOpen === 'unarchive' && `هل أنت متأكد من رغبتك في إلغاء أرشفة ${selectedIds.size} عنصر؟`}
            </p>
            <div className="flex justify-end gap-3">
              <button
                disabled={isActionPending}
                onClick={() => setIsConfirmOpen(null)}
                className="px-4 py-2 rounded text-xs font-bold text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                disabled={isActionPending}
                onClick={() => handleBulkAction(isConfirmOpen)}
                className={`px-4 py-2 rounded text-xs font-bold text-white disabled:opacity-50 ${
                  isConfirmOpen === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#017E84] hover:bg-[#015e63]'
                }`}
              >
                {isActionPending ? 'جاري التنفيذ...' : 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>;
}