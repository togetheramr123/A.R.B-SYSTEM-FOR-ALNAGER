"use client";

import { useState, useRef, useEffect } from "react";
import { Settings, ChevronDown, Printer, Copy, Trash2, Archive } from "lucide-react";
interface ActionMenuProps {
  onPrint?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  isArchived?: boolean;
}
export function ActionMenu({
  onPrint,
  onDuplicate,
  onDelete,
  onArchive,
  isArchived
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return <div className="relative" ref={menuRef}>
      {" "}
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 bg-white text-slate-700 px-3 py-1.5 rounded-sm text-[13px] hover:bg-slate-50 transition-colors font-bold whitespace-nowrap">
        {" "}
        <Settings className="w-3.5 h-3.5 text-slate-500" /> إجراء{" "}
        <ChevronDown className="w-3 h-3 text-slate-400" />{" "}
      </button>{" "}
      {isOpen && <div className="absolute top-full rtl:right-0 ltr:left-0 mt-1 w-48 bg-white border border-slate-200 shadow-sm rounded-sm z-50 py-1">
          {" "}
          {onPrint && <button type="button" onClick={() => {
        setIsOpen(false);
        onPrint();
      }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
              {" "}
              <Printer className="w-4 h-4 text-slate-400" /> طباعة{" "}
            </button>}{" "}
          {onDuplicate && <button type="button" onClick={() => {
        setIsOpen(false);
        onDuplicate();
      }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
              {" "}
              <Copy className="w-4 h-4 text-slate-400" /> إنشاء نسخة مطابقة{" "}
            </button>}{" "}
          {onArchive && <button type="button" onClick={() => {
        setIsOpen(false);
        onArchive();
      }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
              {" "}
              <Archive className="w-4 h-4 text-slate-400" />{" "}
              {isArchived ? "إلغاء الأرشفة" : "أرشفة"}{" "}
            </button>}{" "}
          {onDelete && <>
              {" "}
              <div className="h-px w-full bg-slate-200 my-1" />{" "}
              <button type="button" onClick={() => {
          setIsOpen(false);
          onDelete();
        }} className="w-full text-start px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold">
                {" "}
                <Trash2 className="w-4 h-4 text-red-500" /> حذف{" "}
              </button>{" "}
            </>}{" "}
        </div>}{" "}
    </div>;
}