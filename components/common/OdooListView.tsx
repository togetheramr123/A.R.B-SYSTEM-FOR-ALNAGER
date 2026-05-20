"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, Star, Plus, Download, MoreHorizontal, Check } from "lucide-react";
import { fetchGroupHeaders, fetchGroupRows } from "@/app/actions/genericGrouping";
import Link from "next/link";
interface Column {
  key: string;
  label: string;
  width?: string;
  render?: (row: any) => React.ReactNode;
}
interface OdooListViewProps {
  title: string;
  columns: Column[];
  data: any[];
  createNewLink?: string;
  createNewAction?: () => void;
  placeholderSearch?: string;
  baseUrl?: string;
  onRowClick?: (row: any) => void;
  hideNewButton?: boolean;
  hideDownloadButton?: boolean;
  modelName?: string;
}
export default function OdooListView({
  title,
  columns,
  data,
  createNewLink,
  createNewAction,
  placeholderSearch = "بحث...",
  baseUrl,
  onRowClick,
  hideNewButton = false,
  hideDownloadButton = false,
  modelName
}: OdooListViewProps) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<"filter" | "group" | "favorite" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupByKey, setGroupByKey] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  /* Server-side Grouping States */
  const [serverGroupHeaders, setServerGroupHeaders] = useState<any[]>([]);
  const [serverGroupData, setServerGroupData] = useState<Record<string, any[]>>({});
  const [isServerGroupingLoading, setIsServerGroupingLoading] = useState(false);
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
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(row => Object.values(row).some(val => String(val).toLowerCase().includes(q)));
  }, [data, searchQuery]);
  const groupedData = useMemo(() => {
    if (!groupByKey) return null;
    return filteredData.reduce((acc, row) => {
      const val = row[groupByKey] || "غير محدد";
      if (!acc[val]) acc[val] = [];
      acc[val].push(row);
      return acc;
    }, {} as Record<string, any[]>);
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
  const toggleAll = () => {
    if (selectedRows.length === filteredData.length && filteredData.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredData.map((d: any) => d.id));
    }
  };
  const toggleRow = (id: string) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(r => r !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };
  return <div className="flex flex-col h-full bg-white rounded shadow-sm border border-slate-200">
      {" "}
      {/* Header / Control Panel */}{" "}
      <div className="p-4 border-b border-slate-200 flex flex-col gap-4">
        {" "}
        <div className="flex justify-between items-center">
          {" "}
          <div className="flex items-center gap-4">
            {" "}
            <h1 className="text-xl font-bold text-slate-800">{title}</h1>{" "}
            {!hideNewButton && (createNewLink ? <Link href={createNewLink} className="bg-[#017E84] hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-sm">
                  {" "}
                  جديد{" "}
                </Link> : <button onClick={createNewAction} className="bg-[#017E84] hover:bg-indigo-700 text-white px-4 py-1.5 rounded text-sm transition-colors shadow-sm">
                  {" "}
                  جديد{" "}
                </button>)}{" "}
            {!hideDownloadButton && <button className="text-slate-600 hover:bg-slate-100 px-3 py-1.5 rounded text-sm border border-slate-300 transition-colors">
                {" "}
                تحميل{" "}
              </button>}{" "}
          </div>{" "}
          <div className="flex-1 max-w-xl mx-4">
            {" "}
            <div className="relative group">
              {" "}
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={placeholderSearch} className="w-full bg-slate-50 border border-slate-300 text-slate-700 rounded-md px-4 py-1.5 pr-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow" />{" "}
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex gap-2 relative">
            {" "}
            <div className={`px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${activeDropdown === "group" ? "bg-slate-200 text-slate-800" : "hover:bg-slate-100 text-slate-600"}`} onClick={() => setActiveDropdown(activeDropdown === "group" ? null : "group")}>
              {" "}
              <SlidersHorizontal className="w-4 h-4" />{" "}
              <span className="text-sm font-medium">تجميع حسب</span>{" "}
            </div>{" "}
            <div className={`px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-1 ${activeDropdown === "favorite" ? "bg-slate-200 text-slate-800" : "hover:bg-slate-100 text-slate-600"}`} onClick={() => setActiveDropdown(activeDropdown === "favorite" ? null : "favorite")}>
              {" "}
              <Star className="w-4 h-4" />{" "}
              <span className="text-sm font-medium">المفضلة</span>{" "}
            </div>{" "}
            {/* Dropdown Menus */}{" "}
            {activeDropdown && <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded shadow-sm border border-slate-200 z-[100] py-2">
                {" "}
                {activeDropdown === "group" && <div className="py-2 text-sm text-slate-700">
                    {" "}
                    <div className="flex flex-col">
                      {" "}
                      {[{
                  key: "vendorName",
                  label: "المورد"
                }, {
                  key: "productName",
                  label: "المنتج"
                }, {
                  key: "reference",
                  label: "مرجع الطلب"
                }, {
                  key: "status",
                  label: "الحالة"
                }].map(opt => <button key={opt.key} onClick={() => {
                  setGroupByKey(opt.key);
                  setActiveDropdown(null);
                }} className={`text-right px-4 py-1.5 hover:bg-slate-100 w-full flex items-center justify-between ${groupByKey === opt.key ? "bg-slate-50 font-bold text-[#017E84]" : ""}`}>
                          {" "}
                          <span>{opt.label}</span>{" "}
                          {groupByKey === opt.key && <Check className="w-4 h-4 text-[#017E84]" />}{" "}
                        </button>)}{" "}
                      <div className="h-px bg-slate-200 my-1 w-full"></div>{" "}
                      {groupByKey && <button onClick={() => {
                  setGroupByKey(null);
                  setActiveDropdown(null);
                }} className="text-right px-4 py-1.5 hover:bg-slate-100 w-full text-red-600 flex items-center gap-2">
                          {" "}
                          <span className="text-[10px]">✖</span> إزالة
                          التجميع{" "}
                        </button>}{" "}
                      <button className="text-right px-4 py-1.5 hover:bg-slate-100 w-full text-slate-600 flex items-center gap-2">
                        {" "}
                        <span className="text-[9px]">◀</span> إضافة مجموعة
                        مخصصة{" "}
                      </button>{" "}
                    </div>{" "}
                  </div>}{" "}
                {activeDropdown === "favorite" && <div className="px-4 py-2 text-sm text-slate-500">
                    {" "}
                    <div className="font-bold text-slate-700 mb-2 border-b pb-1">
                      عمليات البحث المفضلة
                    </div>{" "}
                    <div className="flex flex-col gap-1">
                      {" "}
                      <button className="text-right text-[#017E84] hover:bg-slate-50 p-1 rounded w-full">
                        حفظ البحث الحالي
                      </button>{" "}
                    </div>{" "}
                  </div>}{" "}
              </div>}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Table Area */}{" "}
      <div className="flex-1 overflow-auto">
        {" "}
        <table className="w-full text-right">
          {" "}
          <thead className="bg-slate-50 text-slate-700 font-medium text-sm sticky top-0 z-10">
            {" "}
            <tr>
              {" "}
              <th className="p-3 w-10 border-b border-slate-200">
                {" "}
                <input type="checkbox" className="rounded border-slate-300" checked={filteredData.length > 0 && selectedRows.length === filteredData.length} onChange={toggleAll} />{" "}
              </th>{" "}
              {columns.map((col, idx) => <th key={idx} className={`p-3 border-b border-slate-200 ${col.width || ""}`}>
                  {col.label}
                </th>)}{" "}
              <th className="p-3 w-10 border-b border-slate-200"></th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="text-sm text-slate-500 divide-y divide-slate-100">
            {" "}
            {isServerGroupingLoading ? <tr>
                {" "}
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-gray-500">
                  {" "}
                  جاري تجميع البيانات من الخادم...{" "}
                </td>{" "}
              </tr> : modelName && groupByKey && serverGroupHeaders.length > 0 ? serverGroupHeaders.map((header, gIdx) => <React.Fragment key={gIdx}>
                  {" "}
                  <tr className="bg-slate-50 cursor-pointer border-y border-slate-200 hover:bg-slate-100 transition-colors" onClick={() => toggleGroup(header.label, header.value)}>
                    {" "}
                    <td colSpan={columns.length + 2} className="p-3 font-bold text-slate-800">
                      {" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <span className="text-[10px] w-4 text-center">
                          {expandedGroups[header.label] ? "▼" : "◀"}
                        </span>{" "}
                        {header.label} ({header.count}){" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>{" "}
                  {expandedGroups[header.label] && (!serverGroupData[header.label] ? <tr>
                        {" "}
                        <td colSpan={columns.length + 2} className="px-4 py-2 text-center text-sm text-gray-400">
                          {" "}
                          جاري التحميل...{" "}
                        </td>{" "}
                      </tr> : serverGroupData[header.label].map((row: any, idx: number) => <tr key={`${gIdx}-${idx}`} className={`hover:bg-slate-50 transition-colors group ${onRowClick ? "cursor-pointer" : ""}`} onClick={() => onRowClick && onRowClick(row)}>
                            {" "}
                            <td className="p-3 w-10 pl-8" onClick={e => e.stopPropagation()}>
                              {" "}
                              <input type="checkbox" className="rounded border-slate-300 ml-4" checked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} />{" "}
                            </td>{" "}
                            {columns.map((col, cIdx) => <td key={cIdx} className={`p-3 ${col.width || ""}`}>
                                {" "}
                                {col.render ? col.render(row) : row[col.key]}{" "}
                              </td>)}{" "}
                            <td className="p-3 w-10 text-center">
                              {" "}
                              <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-800">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>{" "}
                            </td>{" "}
                          </tr>))}{" "}
                </React.Fragment>) : groupedData ? Object.entries(groupedData).map(([groupName, groupRows], gIdx) => <React.Fragment key={gIdx}>
                    {" "}
                    <tr className="bg-slate-50 cursor-pointer border-y border-slate-200 hover:bg-slate-100 transition-colors" onClick={() => toggleGroup(groupName)}>
                      {" "}
                      <td colSpan={columns.length + 2} className="p-3 font-bold text-slate-800">
                        {" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <span className="text-[10px] w-4 text-center">
                            {expandedGroups[groupName] ? "▼" : "◀"}
                          </span>{" "}
                          {groupName} ({(groupRows as any[]).length}){" "}
                        </div>{" "}
                      </td>{" "}
                    </tr>{" "}
                    {expandedGroups[groupName] && (groupRows as any[]).map((row, idx) => <tr key={`${gIdx}-${idx}`} className="hover:bg-[#017E84]/10/30 transition-colors group cursor-pointer bg-white" onClick={e => {
              if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
              if (onRowClick) onRowClick(row);else if (baseUrl) window.location.href = `${baseUrl}/${row.id}`;
            }}>
                          {" "}
                          <td className="p-3 pl-8">
                            {" "}
                            <input type="checkbox" className="rounded border-slate-300 ml-4" checked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} />{" "}
                          </td>{" "}
                          {columns.map((col, cIdx) => <td key={cIdx} className="p-3 text-slate-700">
                              {" "}
                              {col.render ? col.render(row) : row[col.key]}{" "}
                            </td>)}{" "}
                          <td className="p-3">
                            {" "}
                            <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded">
                              {" "}
                              <MoreHorizontal className="w-4 h-4" />{" "}
                            </button>{" "}
                          </td>{" "}
                        </tr>)}{" "}
                  </React.Fragment>) : filteredData.map((row, idx) => <tr key={idx} className="hover:bg-[#017E84]/10/30 transition-colors group cursor-pointer" onClick={e => {
            if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;
            if (onRowClick) onRowClick(row);else if (baseUrl) window.location.href = `${baseUrl}/${row.id}`;
          }}>
                  {" "}
                  <td className="p-3">
                    {" "}
                    <input type="checkbox" className="rounded border-slate-300" checked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} />{" "}
                  </td>{" "}
                  {columns.map((col, cIdx) => <td key={cIdx} className="p-3 text-slate-700">
                      {" "}
                      {col.render ? col.render(row) : row[col.key]}{" "}
                    </td>)}{" "}
                  <td className="p-3">
                    {" "}
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded">
                      {" "}
                      <MoreHorizontal className="w-4 h-4" />{" "}
                    </button>{" "}
                  </td>{" "}
                </tr>)}{" "}
            {filteredData.length === 0 && <tr>
                {" "}
                <td colSpan={columns.length + 2} className="p-8 text-center text-slate-400">
                  {" "}
                  لا توجد سجلات لعرضها{" "}
                </td>{" "}
              </tr>}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
      {/* Footer / Pagination */}{" "}
      <div className="p-2 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
        {" "}
        <span>{selectedRows.length} محدد</span>{" "}
        <div className="flex gap-4">
          {" "}
          <span>
            1-{Math.min(50, filteredData.length)} / {filteredData.length}
          </span>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}