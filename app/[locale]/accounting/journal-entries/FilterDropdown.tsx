"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function FilterDropdown({ locale, currentFilter }: { locale: string, currentFilter?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-4 text-slate-600 font-bold relative" ref={ref}>
      <div 
        className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
        onClick={() => setOpen(!open)}
      >
        <span>عوامل التصفية</span>
        <Filter className="w-3.5 h-3.5" />
      </div>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-sm z-50 py-1 text-[13px] font-normal">
          <Link 
            href={`/${locale}/accounting/journal-entries?filter=posted`}
            className="block px-4 py-1.5 hover:bg-slate-100 text-slate-700"
            onClick={() => setOpen(false)}
          >
            {currentFilter === 'posted' ? '✓ ' : ''}تم الترحيل
          </Link>
          <Link 
            href={`/${locale}/accounting/journal-entries?filter=draft`}
            className="block px-4 py-1.5 hover:bg-slate-100 text-slate-700"
            onClick={() => setOpen(false)}
          >
            {currentFilter === 'draft' ? '✓ ' : ''}مسودة
          </Link>
          {currentFilter && (
            <>
              <div className="h-px bg-slate-200 my-1"></div>
              <Link 
                href={`/${locale}/accounting/journal-entries`}
                className="block px-4 py-1.5 hover:bg-slate-100 text-slate-700"
                onClick={() => setOpen(false)}
              >
                إلغاء عوامل التصفية
              </Link>
            </>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900 opacity-50" title="قريباً">
        <span>التجميع حسب</span>
        <LayoutGrid className="w-3.5 h-3.5" />
      </div>
      <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900 opacity-50" title="قريباً">
        <span>المفضلات</span>
        <span className="text-yellow-500 text-lg leading-none mt-[-4px]">★</span>
      </div>
    </div>
  );
}
