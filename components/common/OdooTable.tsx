"use client";

import { Search, Filter, ChevronDown, Star, ChevronLeft, ChevronRight, List, Calendar, Clock, MoreHorizontal, Check, LayoutGrid, Table2, BarChart3, Grid3X3, Trash2, Archive, ArchiveRestore } from "lucide-react";
import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { fetchGroupHeaders, fetchGroupRows } from "@/app/actions/genericGrouping";
import { bulkDeleteRecords, bulkArchiveRecords } from "@/app/actions/bulk-actions";
export interface OdooColumn<T = any> {
  id: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}
export interface OdooFilterGroup {
  group: string;
  label?: string;
  items: { label: string; value: string; }[];
}
interface OdooTableProps<T = any> {
  data: T[];
  columns: OdooColumn<T>[];
  title: string;
  totalCount?: number;
  actions?: React.ReactNode;
  currentPage?: number;
  pageSize?: number;
  baseUrl?: string;
  searchQuery?: string;
  onRowClick?: (row: T) => void;
  modelName?: string;
  kanbanView?: React.ReactNode;
  pivotView?: React.ReactNode;
  graphView?: React.ReactNode;
  calendarView?: React.ReactNode;
  tableHeaderAction?: React.ReactNode;
  filters?: OdooFilterGroup[];
  renderBulkActions?: (selectedIds: string[]) => React.ReactNode;
}
export function OdooTable<T extends {
  id: string | number;
}>({
  data,
  columns,
  title,
  totalCount = 0,
  actions,
  currentPage = 1,
  pageSize = 20,
  baseUrl,
  searchQuery = "",
  onRowClick,
  modelName,
  kanbanView,
  pivotView,
  graphView,
  calendarView,
  tableHeaderAction,
  filters,
  renderBulkActions
}: OdooTableProps<T>) {
  const [selected, setSelected] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [activeDropdown, setActiveDropdown] = useState<"filter" | "group" | "favorite" | null>(null);
  const [groupByKey, setGroupByKey] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [activeView, setActiveView] = useState<"list" | "kanban" | "calendar" | "pivot" | "graph">("list");
  
  /* Bulk Action States */
  const [isBulkMenuOpen, setIsBulkMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<'delete' | 'archive' | 'unarchive' | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  const handleBulkAction = async (actionType: 'delete' | 'archive' | 'unarchive') => {
    setIsActionPending(true);
    try {
      let result;
      if (actionType === 'delete') {
        result = await bulkDeleteRecords(modelName || '', selected);
      } else if (actionType === 'archive') {
        result = await bulkArchiveRecords(modelName || '', selected, false);
      } else if (actionType === 'unarchive') {
        result = await bulkArchiveRecords(modelName || '', selected, true);
      }

      if (result?.error) {
        toast.error(result.error, {
          style: { direction: 'rtl', textAlign: 'right' }
        });
      } else if (result?.success) {
        toast.success("تم تنفيذ العملية بنجاح");
        setSelected([]);
      }
    } catch (err: any) {
      toast.error("حدث خطأ أثناء تنفيذ العملية: " + (err.message || ''));
    } finally {
      setIsActionPending(false);
      setIsConfirmOpen(null);
      setIsBulkMenuOpen(false);
    }
  };

  /* Server-side Grouping States */
  const [serverGroupHeaders, setServerGroupHeaders] = useState<any[]>([]);
  const [serverGroupData, setServerGroupData] = useState<Record<string, any[]>>({});
  const [isServerGroupingLoading, setIsServerGroupingLoading] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
      setIsBulkMenuOpen(false);
    };
    if (activeDropdown || isBulkMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [activeDropdown, isBulkMenuOpen]);

  /* Fetch Server Group Headers */
  useEffect(() => {
    if (modelName && groupByKey) {
      setIsServerGroupingLoading(true);
      fetchGroupHeaders(modelName, groupByKey, {}).then(headers => {
        setServerGroupHeaders(headers);
        setExpandedGroups({});
        setIsServerGroupingLoading(false);
      });
    } else {
      setServerGroupHeaders([]);
    }
  }, [modelName, groupByKey]);
  const handleToggleServerGroup = async (groupName: string, groupValue: any) => {
    const isCurrentlyExpanded = expandedGroups[groupName];
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !isCurrentlyExpanded
    }));
    if (!isCurrentlyExpanded && !serverGroupData[groupName]) {
      const rows = await fetchGroupRows(modelName!, groupByKey!, groupValue, {});
      setServerGroupData(prev => ({
        ...prev,
        [groupName]: rows
      }));
    }
  };
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter(row => Object.values(row as any).some(val => String(val).toLowerCase().includes(q)));
  }, [data, searchTerm]);
  const groupedData = useMemo(() => {
    if (!groupByKey) return null;
    return filteredData.reduce((acc, row) => {
      const val = (row as any)[groupByKey];
      const groupName = val ? String(val) : "غير محدد";
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(row);
      return acc;
    }, {} as Record<string, T[]>);
  }, [filteredData, groupByKey]);
  const toggleGroup = (groupName: string, groupValue?: any) => {
    if (modelName && groupByKey) {
      handleToggleServerGroup(groupName, groupValue);
    } else {
      setExpandedGroups(prev => ({
        ...prev,
        [groupName]: !prev[groupName]
      }));
    }
  };
  const toggleSelectAll = () => {
    if (selected.length === filteredData.length && filteredData.length > 0) {
      setSelected([]);
    } else {
      setSelected(filteredData.map(d => String(d.id)));
    }
  };
  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(i => i !== id));
    } else {
      setSelected(prev => [...prev, id]);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (baseUrl) {
      const url = new URL(window.location.href);
      if (searchTerm) url.searchParams.set("search", searchTerm);else url.searchParams.delete("search");
      url.searchParams.delete("page");
      /* Reset to page 1 on search */
      window.location.href = url.pathname + url.search;
    }
  };
  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalCount || filteredData.length);
  const totalPages = Math.ceil((totalCount || filteredData.length) / pageSize);
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Control Panel (Header) */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex flex-col gap-3 relative z-[60]">
        {/* Top Row: Title (Right) & Search (Left) */}
        <div className="flex flex-col-reverse md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 order-2 md:order-1">
            <div className="text-xl font-medium text-gray-800">{title}</div>
          </div>
          <div className="flex-1 max-w-2xl w-full order-1 md:order-2">
            <form onSubmit={handleSearch} className="flex items-center border-b border-gray-300 bg-white focus-within:border-[#017E84] pb-1 transition-colors">
              <Search className="w-4 h-4 text-gray-500 ml-2" />
              <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-transparent outline-none text-sm placeholder-gray-400" />
            </form>
          </div>
        </div>

        {/* Bottom Row: Actions (Right) & Filters/Pagination/Views (Left) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm relative">
          
          {/* Bottom Right in RTL (Start): Action Buttons */}
          <div className="flex items-center gap-2 order-2 md:order-1">
             {actions}
             {selected.length > 0 && (
               <div className="flex items-center gap-2 mr-4 pr-4 border-r border-gray-200">
                  <div className="bg-[#714B67]/10 text-[#714B67] text-[13px] px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    <span>{selected.length} محدد</span>
                  </div>
                  {renderBulkActions ? (
                    renderBulkActions(selected)
                  ) : modelName ? (
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsBulkMenuOpen(!isBulkMenuOpen);
                        }}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-1 font-arabic"
                      >
                        إجراءات <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      {isBulkMenuOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg py-1 z-[100] text-right font-arabic">
                          <button
                            onClick={() => setIsConfirmOpen('delete')}
                            className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 font-medium flex items-center gap-2 text-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> حذف المحدّد
                          </button>
                          {(modelName.toLowerCase() === 'partner' || modelName.toLowerCase() === 'product') && (
                            <>
                              <button
                                onClick={() => setIsConfirmOpen('archive')}
                                className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 text-xs"
                              >
                                <Archive className="w-3.5 h-3.5" /> أرشفة المحدّد
                              </button>
                              <button
                                onClick={() => setIsConfirmOpen('unarchive')}
                                className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 text-xs"
                              >
                                <ArchiveRestore className="w-3.5 h-3.5" /> إلغاء الأرشفة
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : null}
               </div>
             )}
          </div>

          {/* Bottom Left in RTL (End): Filters, Pagination, Views */}
          <div className="flex flex-wrap items-center gap-4 order-1 md:order-2 mr-auto">
            
            {/* Filters Group */}
            <div className="flex items-center gap-2 text-gray-700">
              
              {/* Filter */}
              <div className="relative">
                <div className={`flex items-center gap-1 cursor-pointer px-1.5 py-1 rounded transition-colors ${activeDropdown === "filter" ? "bg-gray-200 text-black" : "hover:bg-gray-100"}`} onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === "filter" ? null : "filter"); }}>
                  <Filter className="w-4 h-4" /> <span>عوامل التصفية</span> <ChevronDown className="w-3 h-3" />
                </div>
                {activeDropdown === "filter" && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded shadow-md border border-gray-200 py-2 z-50" onClick={e => e.stopPropagation()}>
                    {filters && filters.length > 0 ? (
                      <div className="flex flex-col text-sm text-gray-700">
                        {filters.map((fGroup, i) => (
                          <React.Fragment key={fGroup.group}>
                            {i > 0 && <div className="h-px bg-gray-200 my-1 w-full" />}
                            {fGroup.label && <div className="px-4 py-1 text-xs text-gray-400 font-bold">{fGroup.label}</div>}
                            {fGroup.items.map(item => (
                              <label key={item.value} className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84]" />
                                <span>{item.label}</span>
                              </label>
                            ))}
                          </React.Fragment>
                        ))}
                        <div className="h-px bg-gray-200 my-1 w-full" />
                        <button className="text-right px-4 py-1.5 hover:bg-gray-50 w-full flex items-center gap-2 text-gray-700">
                          <span className="text-[10px]">◀</span> إضافة عامل تصفية مخصص
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">
                        <p>لا توجد عوامل تصفية مخصصة</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Group By */}
              <div className="relative">
                <div className={`flex items-center gap-1 cursor-pointer px-1.5 py-1 rounded transition-colors ${activeDropdown === "group" ? "bg-gray-200 text-black" : "hover:bg-gray-100"}`} onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === "group" ? null : "group"); }}>
                  <Grid3X3 className="w-4 h-4" /> <span>التجميع حسب</span> <ChevronDown className="w-3 h-3" />
                </div>
                {activeDropdown === "group" && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded shadow-md border border-gray-200 py-2 z-50" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col text-sm text-gray-700">
                      {columns.filter(c => c.id !== "id").map(opt => (
                        <button key={opt.id} onClick={() => { setGroupByKey(opt.id); setActiveDropdown(null); }} className={`text-right px-4 py-1.5 hover:bg-gray-100 w-full flex items-center justify-between ${groupByKey === opt.id ? "bg-gray-50 font-bold text-[#017E84]" : ""}`}>
                          <span>{opt.label}</span>
                          {groupByKey === opt.id && <Check className="w-4 h-4 text-[#017E84]" />}
                        </button>
                      ))}
                      <div className="h-px bg-gray-200 my-1 w-full"></div>
                      {groupByKey && (
                        <button onClick={() => { setGroupByKey(null); setActiveDropdown(null); }} className="text-right px-4 py-1.5 hover:bg-gray-100 w-full text-red-600 flex items-center gap-2">
                          <span className="text-[10px]">✖</span> إزالة التجميع
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Favorites */}
              <div className="relative">
                <div className={`flex items-center gap-1 cursor-pointer px-1.5 py-1 rounded transition-colors ${activeDropdown === "favorite" ? "bg-gray-200 text-black" : "hover:bg-gray-100"}`} onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === "favorite" ? null : "favorite"); }}>
                  <Star className="w-4 h-4" /> <span>المفضلات</span> <ChevronDown className="w-3 h-3" />
                </div>
                {activeDropdown === "favorite" && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded shadow-md border border-gray-200 py-2 z-50" onClick={e => e.stopPropagation()}>
                    <div className="px-4 py-2 text-sm text-gray-500">
                      <div className="font-bold text-gray-700 mb-2 border-b pb-1">
                        عمليات البحث المفضلة
                      </div>
                      <button className="text-right text-[#017E84] hover:bg-gray-50 p-1 rounded w-full">
                        حفظ البحث الحالي
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination & Views Group */}
            <div className="flex items-center gap-3">
              {/* Pagination */}
              <div className="flex items-center gap-3 text-gray-600">
                <div className="text-[13px]">
                  <span className="font-bold text-gray-800">{totalCount === 0 ? "0" : startIdx}-{endIdx}</span>
                  <span className="mx-1">/</span>
                  <span className="font-bold text-gray-800">{totalCount || filteredData.length}</span>
                </div>
                {baseUrl && (
                  <div className="flex items-center text-gray-400">
                    <button className="p-1 hover:text-black hover:bg-gray-100 rounded disabled:opacity-30" disabled={currentPage >= totalPages} onClick={() => {
                       const url = new URL(window.location.href); url.searchParams.set("page", String(currentPage + 1)); window.location.href = url.pathname + url.search;
                    }}> <ChevronRight className="w-4 h-4" /> </button>
                    <button className="p-1 hover:text-black hover:bg-gray-100 rounded disabled:opacity-30" disabled={currentPage <= 1} onClick={() => {
                       const url = new URL(window.location.href); url.searchParams.set("page", String(currentPage - 1)); window.location.href = url.pathname + url.search;
                    }}> <ChevronLeft className="w-4 h-4" /> </button>
                  </div>
                )}
              </div>

              {/* View Switcher */}
              <div className="flex items-center gap-0.5">
                <button onClick={() => setActiveView("list")} className={`p-1.5 rounded ${activeView === "list" ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500"}`} title="قائمة">
                  <List className="w-4 h-4" />
                </button>
                {kanbanView && (
                  <button onClick={() => setActiveView("kanban")} className={`p-1.5 rounded ${activeView === "kanban" ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500"}`} title="كانبان">
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                )}
                {pivotView && (
                  <button onClick={() => setActiveView("pivot")} className={`p-1.5 rounded ${activeView === "pivot" ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500"}`} title="محوري">
                    <Table2 className="w-4 h-4" />
                  </button>
                )}
                {graphView && (
                  <button onClick={() => setActiveView("graph")} className={`p-1.5 rounded ${activeView === "graph" ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500"}`} title="رسم بياني">
                    <BarChart3 className="w-4 h-4" />
                  </button>
                )}
                {calendarView && (
                  <button onClick={() => setActiveView("calendar")} className={`p-1.5 rounded ${activeView === "calendar" ? "bg-gray-200 text-gray-800" : "hover:bg-gray-100 text-gray-500"}`} title="تقويم">
                    <Calendar className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

        </div>
      </div>
      </div>
      {/* Data Table */}
      <div className="flex-1 overflow-auto bg-white min-h-[350px]">
        {activeView === "list" && (
          <table className="w-full text-right text-sm border-collapse">
            <thead className="bg-white sticky top-0 z-10 shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="w-10 px-4 py-3 text-center">
                  <input type="checkbox" className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84]" checked={selected.length === filteredData.length && filteredData.length > 0} onChange={toggleSelectAll} />
                </th>
                {columns.map(col => <th key={col.id} className={`px-4 py-2 font-bold text-gray-700 cursor-pointer hover:bg-gray-50 group hover:text-black ${col.align === "center" ? "text-center" : col.align === "left" ? "text-left" : "text-right"}`} style={{
                width: col.width
              }}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      {/* Invisible sort icon unless hovered/active - simulating simplistic view */}
                    </div>
                  </th>)}
                <th className="w-10 px-2 text-center align-middle relative">
                  {tableHeaderAction}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isServerGroupingLoading ? <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                    جاري تجميع البيانات من الخادم...
                  </td>
                </tr> : modelName && groupByKey && serverGroupHeaders.length > 0 ? serverGroupHeaders.map((header, gIdx) => <React.Fragment key={gIdx}>
                    <tr className="bg-gray-50 cursor-pointer border-y border-gray-200 hover:bg-gray-100 transition-colors" onClick={() => toggleGroup(header.label, header.value)}>
                      <td colSpan={columns.length + 2} className="p-3 font-bold text-gray-800">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] w-4 text-center">
                            {expandedGroups[header.label] ? "▼" : "◀"}
                          </span>
                          {header.label} ({header.count})
                        </div>
                      </td>
                    </tr>
                    {expandedGroups[header.label] && (!serverGroupData[header.label] ? <tr>
                          <td colSpan={columns.length + 2} className="px-4 py-2 text-center text-sm text-gray-400">
                            جاري التحميل...
                          </td>
                        </tr> : serverGroupData[header.label].map((row: any) => <tr key={row.id} className={`hover:bg-gray-50 group transition-colors bg-white ${onRowClick || baseUrl ? "cursor-pointer" : ""}`} onClick={e => {
                if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                if (onRowClick) onRowClick(row);else if (baseUrl) window.location.href = `${baseUrl}/${row.id}`;
              }}>
                            <td className="px-4 py-2 text-center pl-8" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] ml-4" checked={selected.includes(String(row.id))} onChange={e => toggleSelect(String(row.id), e as any)} onClick={e => e.stopPropagation()} />
                            </td>
                            {columns.map(col => <td key={col.id} className={`px-4 py-2.5 text-gray-700 font-medium ${col.align === "center" ? "text-center" : col.align === "left" ? "text-left" : "text-right"}`}>
                                {col.render ? col.render(row) : (row as any)[col.id]}
                              </td>)}
                            <td className="px-2 text-center">
                              <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-black bg-white rounded-full">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>))}
                  </React.Fragment>) : groupedData ? Object.entries(groupedData).map(([groupName, groupRows], gIdx) => <React.Fragment key={gIdx}>
                      <tr className="bg-gray-50 cursor-pointer border-y border-gray-200 hover:bg-gray-100 transition-colors" onClick={() => toggleGroup(groupName)}>
                        <td colSpan={columns.length + 2} className="p-3 font-bold text-gray-800">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] w-4 text-center">
                              {expandedGroups[groupName] ? "▼" : "◀"}
                            </span>
                            {groupName} ({groupRows.length})
                          </div>
                        </td>
                      </tr>
                      {expandedGroups[groupName] && groupRows.map(row => <tr key={row.id} className={`hover:bg-gray-50 group transition-colors bg-white ${onRowClick || baseUrl ? "cursor-pointer" : ""}`} onClick={e => {
                if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
                if (onRowClick) onRowClick(row);else if (baseUrl) window.location.href = `${baseUrl}/${row.id}`;
              }}>
                            <td className="px-4 py-2 text-center pl-8" onClick={e => e.stopPropagation()}>
                              <input type="checkbox" className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] ml-4" checked={selected.includes(String(row.id))} onChange={e => toggleSelect(String(row.id), e as any)} onClick={e => e.stopPropagation()} />
                            </td>
                            {columns.map(col => <td key={col.id} className={`px-4 py-2.5 text-gray-700 font-medium ${col.align === "center" ? "text-center" : col.align === "left" ? "text-left" : "text-right"}`}>
                                {col.render ? col.render(row) : (row as any)[col.id]}
                              </td>)}
                            <td className="px-2 text-center">
                              <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-black bg-white rounded-full">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>)}
                    </React.Fragment>) : filteredData.map(row => <tr key={row.id} className={`hover:bg-gray-50 group transition-colors ${onRowClick || baseUrl ? "cursor-pointer" : ""}`} onClick={e => {
              if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
              if (onRowClick) onRowClick(row);else if (baseUrl) window.location.href = `${baseUrl}/${row.id}`;
            }}>
                    <td className="px-4 py-2 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84]" checked={selected.includes(String(row.id))} onChange={e => toggleSelect(String(row.id), e as any)} onClick={e => e.stopPropagation()} />
                    </td>
                    {columns.map(col => <td key={col.id} className={`px-4 py-2.5 text-gray-700 font-medium ${col.align === "center" ? "text-center" : col.align === "left" ? "text-left" : "text-right"}`}>
                        {col.render ? col.render(row) : (row as any)[col.id]}
                      </td>)}
                    <td className="px-2 text-center">
                      <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-black bg-white rounded-full">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>)}
              {filteredData.length === 0 && <tr>
                  <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                    لا توجد بيانات مطابقة.
                  </td>
                </tr>}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200 font-bold text-gray-700">
              {/* Optional Totals Row logic could go here */}
            </tfoot>
          </table>
        )}
        {activeView === "kanban" && kanbanView}
        {activeView === "pivot" && pivotView}
        {activeView === "graph" && graphView}
        {activeView === "calendar" && calendarView}
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4 font-arabic">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl border border-gray-200" dir="rtl">
            <h3 className="text-base font-bold text-gray-900 mb-2">تأكيد الإجراء</h3>
            <p className="text-xs text-gray-500 mb-6">
              {isConfirmOpen === 'delete' && `هل أنت متأكد من رغبتك في حذف ${selected.length} عنصر؟ لا يمكن التراجع عن هذا الإجراء.`}
              {isConfirmOpen === 'archive' && `هل أنت متأكد من رغبتك في أرشفة ${selected.length} عنصر؟`}
              {isConfirmOpen === 'unarchive' && `هل أنت متأكد من رغبتك في إلغاء أرشفة ${selected.length} عنصر؟`}
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
    </div>
  );
}

/* Helper components for Odoo style cells */
export const OdooStatusBadge = ({
  status,
  label
}: {
  status: "sale" | "draft" | "cancel" | "done";
  label: string;
}) => {
  /* Colors matching Odoo's default badges */
  const colors = {
    sale: "bg-[#188556] text-white", /* Green for Sale Order */
    draft: "bg-[#00A09D] text-white", // Cyan/Teal for Quotation/Draft
    cancel: "bg-gray-400 text-white",
    done: "bg-[#188556] text-white",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[status] || "bg-gray-400"}`}>
      {label}
    </span>
  );
};
export const OdooAvatar = ({
  name,
  color = "bg-red-500"
}: {
  name: string;
  color?: string;
}) => {
  return <div className="flex items-center justify-end gap-2">
      {" "}
      <span>{name}</span>{" "}
      <div className={`w-5 h-5 rounded-full ${color} text-white flex items-center justify-center text-[10px] font-bold`}>
        {" "}
        {name.charAt(0)}{" "}
      </div>{" "}
    </div>;
};
export const OdooActivityIcon = () => <div className="flex justify-center">
    {" "}
    <Clock className="w-4 h-4 text-gray-400 hover:text-black cursor-pointer" />{" "}
  </div>;
