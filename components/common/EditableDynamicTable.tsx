"use client";
import React from "react";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ArrowRight, SlidersHorizontal } from "lucide-react";
import { UseFormRegister, Control } from "react-hook-form";
const OdooGripIcon = ({
  className
}: {
  className?: string;
}) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="5" cy="3" r="1.5" /> <circle cx="5" cy="8" r="1.5" />{" "}
    <circle cx="5" cy="13" r="1.5" /> <circle cx="11" cy="3" r="1.5" />{" "}
    <circle cx="11" cy="8" r="1.5" /> <circle cx="11" cy="13" r="1.5" />{" "}
  </svg>;
export interface Column<T = any> {
  id: string;
  label: string;
  width?: string;
  minWidth?: string;
  required?: boolean;
  sticky?: boolean;
  defaultVisible?: boolean;
  renderHeader?: () => React.ReactNode;
  renderCell: (field: T, index: number, register: UseFormRegister<any>, control?: Control<any>) => React.ReactNode;
}
interface EditableDynamicTableProps<T = any> {
  columns: Column<T>[];
  fields: T[];
  register: UseFormRegister<any>;
  control?: Control<any>;
  onRemove: (index: number) => void;
  onAdd?: () => void;
  onAddSection?: () => void;
  onAddNote?: () => void;
  onAddFromImage?: () => void;
  disableAdd?: boolean;
  readOnly?: boolean;
  fieldArrayName?: string;
  onSwap?: (indexA: number, indexB: number) => void;
  itemsPerPage?: number;
  tableId?: string;
  rowClassName?: (item: T, index: number) => string;
}
export function EditableDynamicTable({
  columns,
  fields,
  register,
  control,
  onRemove,
  onAdd,
  onAddSection,
  onAddNote,
  onAddFromImage,
  disableAdd,
  readOnly = false,
  fieldArrayName = "lines",
  onSwap,
  itemsPerPage,
  tableId,
  rowClassName
}: EditableDynamicTableProps) {
  const [currentPage, setCurrentPage] = useState(1); // Initialize visibility state based on props and localStorage
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    let saved: Record<string, boolean> | null = null;
    if (tableId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`erp_table_vis_${tableId}`);
        if (stored) saved = JSON.parse(stored);
      } catch (e) {}
    }
    const initial: Record<string, boolean> = {};
    columns.forEach(col => {
      if (saved && saved[col.id] !== undefined) {
        // Respect saved setting unless it's a required column 
        initial[col.id] = col.required || saved[col.id];
      } else {
        initial[col.id] = col.required || col.defaultVisible !== false;
      }
    });
    return initial;
  });
  const [colWidths, setColWidths] = useState<Record<string, number | string>>(() => {
    let saved: Record<string, number | string> | null = null;
    if (tableId && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(`erp_table_widths_${tableId}`);
        if (stored) saved = JSON.parse(stored);
      } catch (e) {}
    }
    const initial: Record<string, number | string> = {};
    columns.forEach(col => {
      if (saved && saved[col.id] !== undefined) {
        initial[col.id] = saved[col.id];
      } else if (col.width) {
        initial[col.id] = col.width;
      }
    });
    return initial;
  });
  useEffect(() => {
    if (tableId && typeof window !== "undefined") {
      localStorage.setItem(`erp_table_vis_${tableId}`, JSON.stringify(visibleColumns));
    }
  }, [visibleColumns, tableId]);
  useEffect(() => {
    if (tableId && typeof window !== "undefined") {
      localStorage.setItem(`erp_table_widths_${tableId}`, JSON.stringify(colWidths));
    }
  }, [colWidths, tableId]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  useEffect(() => {
    if (!showSettings) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node) && settingsBtnRef.current && !settingsBtnRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);
  const activeColumns = columns.filter(col => visibleColumns[col.id]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
    if (e.key === "Tab" && !e.shiftKey && onAdd && !readOnly && !disableAdd) {
      const target = e.target as HTMLElement;
      const focusableElements = Array.from(e.currentTarget.querySelectorAll('input:not([type="hidden"]), select, textarea, button')).filter(el => !(el as HTMLInputElement).disabled && (el as HTMLElement).tabIndex !== -1) as HTMLElement[];
      if (focusableElements.length > 0 && target === focusableElements[focusableElements.length - 1]) {
        e.preventDefault();
        onAdd();
        setTimeout(() => {
          if (!e.currentTarget) return;
          const newInputs = Array.from(e.currentTarget.querySelectorAll('input:not([type="hidden"]), select, textarea, button')).filter(el => !(el as HTMLInputElement).disabled && (el as HTMLElement).tabIndex !== -1) as HTMLElement[];
          if (newInputs.length > focusableElements.length) {
            newInputs[focusableElements.length]?.focus();
          }
        }, 50);
      }
    }
  };
  const handleResizeStart = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.pageX;
    const th = (e.target as HTMLElement).closest("th");
    if (!th) return;
    const startWidth = th.getBoundingClientRect().width;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diffX = startX - moveEvent.pageX;
      const newWidth = Math.max(80, startWidth + diffX);
      setColWidths(prev => ({
        ...prev,
        [colId]: newWidth
      }));
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (readOnly) return;
    setDraggedIndex(index);
    setDropTargetIndex(null);
    e.dataTransfer.effectAllowed = "move";
    // Create a styled drag image from the row
    const row = (e.target as HTMLElement).closest("tr");
    if (row) {
      const clone = row.cloneNode(true) as HTMLElement;
      clone.style.position = "fixed";
      clone.style.top = "-9999px";
      clone.style.left = "-9999px";
      clone.style.width = row.getBoundingClientRect().width + "px";
      clone.style.backgroundColor = "#f0fdfa";
      clone.style.border = "2px solid #017E84";
      clone.style.borderRadius = "6px";
      clone.style.boxShadow = "0 8px 25px rgba(1,126,132,0.25)";
      clone.style.opacity = "0.92";
      clone.style.transform = "scale(1.01)";
      clone.style.zIndex = "99999";
      clone.style.display = "table-row";
      // Wrap in a table for proper rendering
      const wrapper = document.createElement("table");
      wrapper.style.position = "fixed";
      wrapper.style.top = "-9999px";
      wrapper.style.left = "-9999px";
      wrapper.style.width = row.getBoundingClientRect().width + "px";
      wrapper.style.borderCollapse = "collapse";
      const tbody = document.createElement("tbody");
      tbody.appendChild(clone);
      wrapper.appendChild(tbody);
      document.body.appendChild(wrapper);
      e.dataTransfer.setDragImage(wrapper, row.getBoundingClientRect().width / 2, 20);
      setTimeout(() => wrapper.remove(), 0);
    }
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || readOnly) return;
    setDropTargetIndex(index);
    if (onSwap) {
      onSwap(draggedIndex, index);
      setDraggedIndex(index);
    }
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };
  return <div className="border border-slate-200 bg-white flex flex-col relative" style={{
    borderRadius: "3px"
  }}>
      {" "}
      {showSettings && <div ref={settingsRef} className="absolute right-0 top-10 z-[100] bg-white border border-slate-200 shadow-sm rounded-sm py-2 min-w-[220px]">
          {" "}
          <div className="px-3 py-1 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            {" "}
            إظهار/إخفاء الأعمدة{" "}
          </div>{" "}
          <div className="max-h-60 overflow-y-auto">
            {" "}
            {columns.filter(c => !c.required && c.label?.trim()).map(col => <label key={col.id} className="flex flex-row-reverse justify-between items-center px-4 py-2 hover:bg-slate-50 cursor-pointer">
                  {" "}
                  <span className="text-sm text-slate-700 font-medium">
                    {col.label}
                  </span>{" "}
                  <input type="checkbox" checked={visibleColumns[col.id]} onChange={() => toggleColumn(col.id)} className="rounded border-slate-300 text-[#017E84] focus:ring-indigo-500 w-4 h-4" />{" "}
                </label>)}{" "}
          </div>{" "}
        </div>}{" "}
      <div className="w-full overflow-x-auto custom-scrollbar relative pb-10">
        {" "}
        <table className="w-full text-sm text-right" style={{
        tableLayout: "fixed",
        minWidth: `${Math.max(activeColumns.reduce((sum, col) => { const w = colWidths[col.id] || col.width; if (w && typeof w === 'string' && w.endsWith('px')) return sum + parseInt(w); if (typeof w === 'number') return sum + w; return sum; }, 0) + 80 + 40 + 500, 1200)}px`
      }}>
          {" "}
          <thead className="bg-white text-slate-700 border-b border-slate-200 font-bold relative z-[20] shadow-sm">
            {" "}
            <tr>
              {" "}
              <th className="w-[40px] min-w-[40px] px-2 py-1.5 align-middle text-center relative pr-4 border-r border-slate-200 sticky right-0 bg-white z-[20] ">
                {" "}
                <button ref={settingsBtnRef} type="button" className="text-slate-400 hover:text-slate-800 transition-colors inline-flex justify-center items-center h-full w-full" onClick={() => setShowSettings(!showSettings)} title="تكوين الأعمدة">
                  {" "}
                  <SlidersHorizontal className="w-4 h-4 mx-auto" />{" "}
                </button>{" "}
              </th>{" "}
              <th className="w-[40px] min-w-[40px] px-1 py-1.5 align-middle text-center border-y border-slate-200 text-slate-500 sticky right-[40px] bg-white z-[20] ">
                {" "}
                #{" "}
              </th>{" "}
              {activeColumns.map(col => <th key={col.id} className={`px-2 py-1.5 text-[13px] font-bold text-slate-700 border-r border-l border-slate-200 relative group/th overflow-hidden text-ellipsis whitespace-nowrap ${col.sticky ? "sticky bg-slate-50 z-[20] shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.1)]" : ""}`} style={{
              width: colWidths[col.id] || col.width || "auto",
              minWidth: col.minWidth || "80px",
              ...(colWidths[col.id] ? { maxWidth: colWidths[col.id] } : {}),
              right: col.sticky ? "80px" : "auto"
            }}>
                  {" "}
                  <div className="absolute top-0 bottom-0 left-0 w-2 cursor-col-resize hover:bg-indigo-300 opacity-0 group-hover/th:opacity-100 transition-opacity z-10" onMouseDown={e => handleResizeStart(e, col.id)} title="تغيير العرض" />{" "}
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">{col.renderHeader ? col.renderHeader() : col.label}</span>{" "}
                </th>)}
              {!readOnly && (
                <th className="w-[40px] min-w-[40px] px-2 py-1.5 border-l border-slate-200 bg-white z-[20]"></th>
              )}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100 bg-white" onKeyDown={handleKeyDown}>
            {" "}
            {fields.map((field: any, index) => {
            const type = field.type || "product";
            if (type === "section") {
              return <tr key={field.id || index} className={`bg-slate-100 group transition-all duration-150 ${draggedIndex === index ? "ring-2 ring-[#017E84] shadow-lg z-50 scale-[1.01]" : ""} ${dropTargetIndex === index && draggedIndex !== index ? "border-t-[3px] border-t-[#017E84]" : ""}`} draggable={!readOnly} onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd} style={{
                opacity: draggedIndex === index ? 0.6 : 1
              }}>
                    {" "}
                    <td className="px-2 py-2 text-center border-r border-slate-200 sticky right-0 bg-slate-100 z-[10] cursor-grab active:cursor-grabbing">
                      {" "}
                      <OdooGripIcon className="text-slate-400 hover:text-slate-600 transition-colors mx-auto" />{" "}
                    </td>{" "}
                    <td className="px-1 py-1 text-center border-y border-slate-200 sticky right-[40px] bg-slate-100 z-[10]"></td>{" "}
                    <td colSpan={activeColumns.length} className="px-2 py-1.5 border-r border-l border-slate-200">
                      {" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <input {...register(`lines.${index}.description`)} className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder-slate-500" placeholder="عنوان القسم..." />{" "}
                        <input type="hidden" {...register(`lines.${index}.type`)} value="section" />{" "}
                        {!readOnly && <button type="button" onClick={() => onRemove(index)} className="text-slate-400 hover:text-red-500 p-1">
                            {" "}
                            <Trash2 className="w-4 h-4" />{" "}
                          </button>}{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>;
            }
            if (type === "note") {
              return <tr key={field.id || index} className={`bg-white group hover:bg-slate-50 transition-all duration-150 ${draggedIndex === index ? "ring-2 ring-[#017E84] bg-teal-50/50 shadow-lg z-50 scale-[1.01]" : ""} ${dropTargetIndex === index && draggedIndex !== index ? "border-t-[3px] border-t-[#017E84]" : ""}`} draggable={!readOnly} onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd} style={{
                opacity: draggedIndex === index ? 0.6 : 1
              }}>
                    {" "}
                    <td className="px-2 py-2 text-center border-r border-slate-200 sticky right-0 bg-white group-hover:bg-slate-50 z-[10] cursor-grab active:cursor-grabbing">
                      {" "}
                      <OdooGripIcon className="text-slate-300 hover:text-slate-500 transition-colors mx-auto" />{" "}
                    </td>{" "}
                    <td className="px-1 py-1 text-center border-y border-slate-200 sticky right-[40px] bg-white group-hover:bg-slate-50 z-[10]"></td>{" "}
                    <td colSpan={activeColumns.length} className="px-2 py-1.5 border-r border-l border-slate-200">
                      {" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <input {...register(`lines.${index}.description`)} className="w-full bg-transparent italic text-slate-600 outline-none placeholder-slate-400" placeholder="ملاحظة..." />{" "}
                        <input type="hidden" {...register(`lines.${index}.type`)} value="note" />{" "}
                        {!readOnly && <button type="button" onClick={() => onRemove(index)} className="text-slate-400 hover:text-red-500 p-1">
                            {" "}
                            <Trash2 className="w-4 h-4" />{" "}
                          </button>}{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>;
            }
            return <tr key={field.id || index} className={`group hover:bg-slate-50 relative transition-all duration-150 ${activeRow === index ? "bg-indigo-50/50" : ""} ${draggedIndex === index ? "ring-2 ring-[#017E84] bg-teal-50/50 shadow-lg z-50 scale-[1.01]" : ""} ${dropTargetIndex === index && draggedIndex !== index ? "border-t-[3px] border-t-[#017E84]" : ""} ${rowClassName ? rowClassName(field, index) : ""}`} onClick={() => setActiveRow(index)} draggable={!readOnly} onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd} style={{
              opacity: draggedIndex === index ? 0.6 : 1
            }}>
                  {" "}
                  <td className={`px-2 py-2 text-center border-r border-slate-200 sticky right-0 z-[10] cursor-grab active:cursor-grabbing ${draggedIndex === index ? "bg-teal-50" : "bg-white group-hover:bg-slate-50"}`}>
                    {" "}
                    <OdooGripIcon className={`transition-colors mx-auto ${draggedIndex !== null ? "text-[#017E84]" : "text-slate-300 hover:text-slate-500"}`} />{" "}
                  </td>{" "}
                  <td className="px-1 py-1 relative text-center text-slate-500 border-y border-slate-200 sticky right-[40px] bg-white group-hover:bg-slate-50 z-[10]">
                    {" "}
                    {activeRow === index ? <div className="absolute top-1/2 -translate-y-1/2 right-2 w-max text-indigo-600 flex items-center">
                        {" "}
                        <ArrowRight className="w-3.5 h-3.5" />{" "}
                      </div> : <span className="text-[13px]">{index + 1}</span>}{" "}
                  </td>{" "}
                  {activeColumns.map(col => <td key={col.id} className={`p-0 m-0 border-l border-slate-200 last:border-l-0 align-top focus-within:ring-1 focus-within:ring-[#017E84] focus-within:ring-inset relative ${col.sticky ? "sticky bg-white group-hover:bg-slate-50 z-[10] shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.05)]" : ""}`} style={{
                right: col.sticky ? "80px" : "auto"
              }}>
                      {" "}
                      <div className="h-full min-h-[36px] w-full flex items-center justify-center">
                        {" "}
                        {col.renderCell(field, index, register, control)}{" "}
                      </div>{" "}
                    </td>)}{" "}
                  <td className="px-2 py-1 text-center bg-white group-hover:bg-slate-50 border-l border-slate-200">
                    {" "}
                    {!readOnly && <button type="button" onClick={e => {
                  e.stopPropagation();
                  onRemove(index);
                }} className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 inline-flex items-center justify-center" title="حذف">
                        {" "}
                        <Trash2 className="w-[14px] h-[14px]" />{" "}
                      </button>}{" "}
                  </td>{" "}
                </tr>;
          })}{" "}
            {/* Empty/Add Row State */}{" "}
            {!disableAdd && !readOnly && <tr>
                {" "}
                <td colSpan={activeColumns.length + 3} className="px-4 py-2 border-t border-slate-200">
                  {" "}
                  <div className="flex gap-4">
                    {" "}
                    <button type="button" onClick={onAdd} className="flex items-center gap-1.5 text-[#017E84] hover:text-[#015e63] text-[13px] font-bold px-2 py-1 rounded hover:bg-[#017E84]/10 transition-colors">
                      {" "}
                      <Plus className="w-4 h-4" /> إضافة منتج{" "}
                    </button>{" "}
                    {onAddSection && <button type="button" onClick={onAddSection} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-[13px] font-bold px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                        {" "}
                        إضافة قسم{" "}
                      </button>}{" "}
                    {onAddNote && <button type="button" onClick={onAddNote} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 text-[13px] font-bold px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                        {" "}
                        إضافة ملاحظة{" "}
                      </button>}{" "}
                    {onAddFromImage && <button type="button" onClick={onAddFromImage} className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-[13px] font-bold px-3 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-colors shadow-sm ml-auto border border-indigo-100">
                        {" "}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg> أضف من صورة (AI){" "}
                      </button>}{" "}
                  </div>{" "}
                </td>{" "}
              </tr>}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}