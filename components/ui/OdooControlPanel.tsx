"use client";

import { useState, useRef, useEffect } from "react";
import { Filter, LayoutGrid, List, ChevronDown, ChevronRight, Star, Clock } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface OdooControlPanelProps {
  totalCount: number;
  startRecord: number;
  endRecord: number;
  currentPage: number;
  totalPages: number;
}

export function OdooControlPanel({
  totalCount,
  startRecord,
  endRecord,
  currentPage,
  totalPages,
}: OdooControlPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeFilters = searchParams.get("filter")?.split(",").filter(Boolean) || [];
  const activeGroupBy = searchParams.get("groupBy");
  const activeView = searchParams.get("view") || "list";

  const [filterOpen, setFilterOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [favoriteOpen, setFavoriteOpen] = useState(false);

  // Submenu states
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const favoriteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
      if (groupRef.current && !groupRef.current.contains(event.target as Node)) setGroupOpen(false);
      if (favoriteRef.current && !favoriteRef.current.contains(event.target as Node)) setFavoriteOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleParam = (key: "filter" | "groupBy" | "view", value: string) => {
    const params = new URLSearchParams(searchParams);
    
    if (key === "filter") {
      let current = params.get("filter")?.split(",").filter(Boolean) || [];
      if (current.includes(value)) {
        current = current.filter(v => v !== value);
      } else {
        current.push(value);
      }
      if (current.length > 0) params.set("filter", current.join(","));
      else params.delete("filter");
    } else if (key === "groupBy") {
      if (params.get("groupBy") === value) params.delete("groupBy");
      else params.set("groupBy", value);
    } else if (key === "view") {
      params.set("view", value);
    }

    params.delete("page"); // Reset page on filter/group change
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("filter");
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  const navigatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between w-full mt-1">
      {/* Left side: Filters & Group By */}
      <div className="flex items-center gap-4 text-[13px] text-slate-700 font-bold relative z-40">
        
        {/* Filter Dropdown */}
        <div className="relative" ref={filterRef}>
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
            onClick={() => { setFilterOpen(!filterOpen); setGroupOpen(false); setFavoriteOpen(false); }}
          >
            <span>عوامل التصفية</span>
            <Filter className="w-3.5 h-3.5" />
          </div>

          {filterOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 shadow-lg rounded-sm py-1 font-normal">
              
              <FilterItem label="غير مُرحل (مسودة)" value="draft" active={activeFilters.includes("draft")} onClick={() => toggleParam("filter", "draft")} />
              <FilterItem label="تم الترحيل" value="posted" active={activeFilters.includes("posted")} onClick={() => toggleParam("filter", "posted")} />
              <FilterItem label="معكوس" value="reversed" active={activeFilters.includes("reversed")} onClick={() => toggleParam("filter", "reversed")} />
              
              <div className="h-px bg-slate-200 my-1"></div>
              
              <FilterItem label="المبيعات" value="sales" active={activeFilters.includes("sales")} onClick={() => toggleParam("filter", "sales")} />
              <FilterItem label="المشتريات" value="purchases" active={activeFilters.includes("purchases")} onClick={() => toggleParam("filter", "purchases")} />
              <FilterItem label="البنك" value="bank" active={activeFilters.includes("bank")} onClick={() => toggleParam("filter", "bank")} />
              <FilterItem label="نقدي" value="cash" active={activeFilters.includes("cash")} onClick={() => toggleParam("filter", "cash")} />
              <FilterItem label="منوعات" value="general" active={activeFilters.includes("general")} onClick={() => toggleParam("filter", "general")} />
              
              <div className="h-px bg-slate-200 my-1"></div>
              
              {/* Nested Date Filter */}
              <div 
                className="relative flex items-center justify-between px-4 py-1.5 hover:bg-slate-100 cursor-pointer text-slate-700"
                onMouseEnter={() => setDateFilterOpen(true)}
                onMouseLeave={() => setDateFilterOpen(false)}
              >
                <span>التاريخ</span>
                <ChevronRight className="w-3.5 h-3.5 transform rotate-180" />
                
                {dateFilterOpen && (
                  <div className="absolute top-0 right-full mr-0.5 w-48 bg-white border border-slate-200 shadow-lg rounded-sm py-1">
                    <FilterItem label="هذه السنة" value="date_year" active={activeFilters.includes("date_year")} onClick={() => toggleParam("filter", "date_year")} />
                    <FilterItem label="هذا الشهر" value="date_month" active={activeFilters.includes("date_month")} onClick={() => toggleParam("filter", "date_month")} />
                  </div>
                )}
              </div>

              {activeFilters.length > 0 && (
                <>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <div 
                    className="px-4 py-1.5 hover:bg-slate-100 cursor-pointer text-red-600"
                    onClick={() => { clearFilters(); setFilterOpen(false); }}
                  >
                    إلغاء عوامل التصفية
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Group By Dropdown */}
        <div className="relative" ref={groupRef}>
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
            onClick={() => { setGroupOpen(!groupOpen); setFilterOpen(false); setFavoriteOpen(false); }}
          >
            <span>التجميع حسب</span>
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>

          {groupOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 shadow-lg rounded-sm py-1 font-normal">
              <GroupItem label="الشريك" value="partner" active={activeGroupBy === "partner"} onClick={() => toggleParam("groupBy", "partner")} />
              <GroupItem label="دفتر اليومية" value="journal" active={activeGroupBy === "journal"} onClick={() => toggleParam("groupBy", "journal")} />
              <GroupItem label="الحالة" value="state" active={activeGroupBy === "state"} onClick={() => toggleParam("groupBy", "state")} />
              <GroupItem label="التاريخ" value="date" active={activeGroupBy === "date"} onClick={() => toggleParam("groupBy", "date")} />
              
              {activeGroupBy && (
                <>
                  <div className="h-px bg-slate-200 my-1"></div>
                  <div 
                    className="px-4 py-1.5 hover:bg-slate-100 cursor-pointer text-red-600"
                    onClick={() => { toggleParam("groupBy", ""); setGroupOpen(false); }}
                  >
                    إلغاء التجميع
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Favorites Dropdown */}
        <div className="relative" ref={favoriteRef}>
          <div 
            className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
            onClick={() => { setFavoriteOpen(!favoriteOpen); setFilterOpen(false); setGroupOpen(false); }}
          >
            <span>المفضلات</span>
            <Star className="w-3.5 h-3.5 fill-current text-slate-400" />
          </div>
          
          {favoriteOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 shadow-lg rounded-sm py-2 font-normal text-slate-500 text-center text-xs">
              لا توجد مفضلات محفوظة.
            </div>
          )}
        </div>
      </div>

      {/* Right side: Pager & View Toggles */}
      <div className="flex items-center gap-4 text-[13px] text-slate-600">
        
        {/* View Toggles */}
        <div className="flex items-center border border-slate-300 rounded shadow-sm bg-white overflow-hidden">
          <button 
            className={cn("p-1.5 flex items-center justify-center transition-colors", activeView !== "kanban" ? "bg-slate-100 text-slate-800" : "bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
            onClick={() => toggleParam("view", "list")}
            title="List"
          >
            <List className="w-[18px] h-[18px]" />
          </button>
          <div className="w-px h-full bg-slate-200"></div>
          <button 
            className={cn("p-1.5 flex items-center justify-center transition-colors", activeView === "kanban" ? "bg-slate-100 text-slate-800" : "bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50")}
            onClick={() => toggleParam("view", "kanban")}
            title="Kanban"
          >
            <LayoutGrid className="w-[18px] h-[18px]" />
          </button>
        </div>

        {/* Pager */}
        <span className="font-medium text-slate-700">
          {totalCount > 0 ? `${startRecord}-${endRecord} / ${totalCount}` : '0 / 0'}
        </span>
        
        <div className="flex items-center gap-1">
          <button 
            disabled={currentPage <= 1}
            onClick={() => navigatePage(currentPage - 1)}
            className="p-1 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" /> {/* Right arrow points left in RTL */}
          </button>
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => navigatePage(currentPage + 1)}
            className="p-1 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-4 h-4 transform -rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterItem({ label, value, active, onClick }: { label: string, value: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      className="px-4 py-1.5 hover:bg-slate-100 cursor-pointer flex items-center gap-2 text-slate-700"
      onClick={onClick}
    >
      <span className={cn("w-3 text-emerald-600", active ? "opacity-100" : "opacity-0")}>✓</span>
      <span>{label}</span>
    </div>
  );
}

function GroupItem({ label, value, active, onClick }: { label: string, value: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      className="px-4 py-1.5 hover:bg-slate-100 cursor-pointer flex items-center gap-2 text-slate-700"
      onClick={onClick}
    >
      <span className={cn("w-3 text-emerald-600", active ? "opacity-100" : "opacity-0")}>✓</span>
      <span>{label}</span>
    </div>
  );
}
