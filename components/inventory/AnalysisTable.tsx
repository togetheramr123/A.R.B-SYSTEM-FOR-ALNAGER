import React from "react";
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Filter, Download, ArrowUpDown } from 'lucide-react';
interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  aggregate?: 'sum' | 'avg' | 'count' | 'none';
}
export interface FilterOption {
  id: string;
  label: string;
  group?: string;
  filterFn: (row: any) => boolean;
}

export interface GroupByOption {
  id: string;
  label: string;
  groupFn: (row: any) => string | number;
}

interface AnalysisTableProps {
  title: string;
  columns: Column[];
  data: any[];
  searchPlaceholder?: string;
  filterOptions?: FilterOption[];
  groupByOptions?: GroupByOption[];
}
export function AnalysisTable({
  title,
  columns,
  data,
  searchPlaceholder = "بحث...",
  filterOptions,
  groupByOptions
}: AnalysisTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [activeGroupBy, setActiveGroupBy] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupBy, setShowGroupBy] = useState(false);
  
  const filterRef = useRef<HTMLDivElement>(null);
  const groupByRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
      if (groupByRef.current && !groupByRef.current.contains(event.target as Node)) {
        setShowGroupBy(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredData = React.useMemo(() => {
    let result = data;
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(row => {
        return columns.some(col => {
          const val = row[col.key];
          if (val == null) return false;
          return String(val).toLowerCase().includes(lowerQuery);
        });
      });
    }

    if (activeFilters.size > 0 && filterOptions) {
      result = result.filter(row => {
        for (const filterId of activeFilters) {
          const opt = filterOptions.find(o => o.id === filterId);
          if (opt && !opt.filterFn(row)) {
            return false;
          }
        }
        return true;
      });
    }

    return result;
  }, [data, searchQuery, columns, activeFilters, filterOptions]);

  const groupedData = React.useMemo(() => {
    if (!activeGroupBy || !groupByOptions) return null;
    const groupOpt = groupByOptions.find(g => g.id === activeGroupBy);
    if (!groupOpt) return null;

    const groups: Record<string, any[]> = {};
    filteredData.forEach(row => {
      const key = String(groupOpt.groupFn(row));
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });

    return Object.entries(groups).map(([key, rows]) => ({ key, rows }));
  }, [filteredData, activeGroupBy, groupByOptions]);

  return <div className="bg-white min-h-screen" dir="rtl"> 
    <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 bg-white"> 
      <div className="flex items-center gap-2"> 
        <h1 className="text-lg text-slate-700">{title}</h1> 
      </div> 
      <div className="flex gap-4 items-center"> 
        <div className="flex gap-2"> 
          <div className="relative"> 
            <input type="text" placeholder={searchPlaceholder} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 pr-4 py-1 border border-slate-300 rounded-sm text-[13px] w-64 focus:outline-none focus:border-[#017E84]" /> 
            <Search className="w-4 h-4 text-slate-400 absolute left-2 top-1.5" /> 
          </div> 
          <div className="relative" ref={filterRef}>
            <button onClick={() => { setShowFilters(!showFilters); setShowGroupBy(false); }} className="flex items-center gap-1 px-3 py-1 border border-slate-300 rounded-sm text-[13px] hover:bg-slate-50 text-slate-700 bg-white shadow-sm"> 
              <Filter className="w-3.5 h-3.5" /> <span>عوامل التصفية</span> <ChevronDown className="w-3 h-3" /> 
            </button> 
            {showFilters && filterOptions && filterOptions.length > 0 && (
              <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-slate-200 shadow-lg rounded-sm z-50 py-1">
                {filterOptions.map((opt, i) => {
                  const isChecked = activeFilters.has(opt.id);
                  const isNewGroup = i > 0 && filterOptions[i - 1].group !== opt.group;
                  return (
                    <React.Fragment key={opt.id}>
                      {isNewGroup && <div className="border-t border-slate-100 my-1"></div>}
                      <div 
                        className={`flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 cursor-pointer text-[13px] ${isChecked ? 'text-slate-900 font-medium' : 'text-slate-700'}`}
                        onClick={() => {
                          const newFilters = new Set(activeFilters);
                          if (isChecked) newFilters.delete(opt.id);
                          else newFilters.add(opt.id);
                          setActiveFilters(newFilters);
                        }}
                      >
                        <div className="w-3 h-3 flex items-center justify-center">
                           {isChecked && <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                        </div>
                        {opt.label}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
          <div className="relative" ref={groupByRef}>
            <button onClick={() => { setShowGroupBy(!showGroupBy); setShowFilters(false); }} className="flex items-center gap-1 px-3 py-1 border border-slate-300 rounded-sm text-[13px] hover:bg-slate-50 text-slate-700 bg-white shadow-sm"> 
              <ArrowUpDown className="w-3.5 h-3.5" /> <span>تجميع حسب</span> <ChevronDown className="w-3 h-3" /> 
            </button> 
            {showGroupBy && groupByOptions && groupByOptions.length > 0 && (
              <div className="absolute top-full mt-1 right-0 w-48 bg-white border border-slate-200 shadow-lg rounded-sm z-50 py-1">
                {activeGroupBy && (
                  <div 
                    className="px-3 py-1.5 hover:bg-slate-100 cursor-pointer text-[13px] text-slate-500 border-b border-slate-100 mb-1"
                    onClick={() => { setActiveGroupBy(null); setShowGroupBy(false); }}
                  >
                    إلغاء التجميع
                  </div>
                )}
                {groupByOptions.map(opt => {
                  const isChecked = activeGroupBy === opt.id;
                  return (
                    <div key={opt.id} 
                      className={`px-3 py-1.5 hover:bg-slate-100 cursor-pointer text-[13px] flex items-center gap-2 ${isChecked ? 'text-slate-900 font-medium bg-slate-50' : 'text-slate-700'}`}
                      onClick={() => { setActiveGroupBy(opt.id); setShowGroupBy(false); }}
                    >
                      <div className="w-3 h-3 flex items-center justify-center">
                         {isChecked && <svg className="w-3 h-3 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                      </div>
                      {opt.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <button className="flex items-center gap-1 px-3 py-1 border border-slate-300 rounded-sm text-[13px] hover:bg-slate-50 text-slate-700 bg-white shadow-sm"> 
            <span className="text-slate-500">المفضلات</span> <ChevronDown className="w-3 h-3" /> 
          </button> 
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-600">
          <span>{filteredData.length > 0 ? `1-${filteredData.length} / ${filteredData.length}` : '0 / 0'}</span>
          <div className="flex gap-1">
             <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronDown className="w-4 h-4 rotate-90" /></button>
             <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ChevronDown className="w-4 h-4 -rotate-90" /></button>
          </div>
        </div>
      </div> 
    </div> 
    <div className="overflow-x-auto bg-white"> 
      <table className="w-full text-right text-[13px]"> 
        <thead className="bg-white border-b-2 border-slate-300 text-slate-700 font-bold whitespace-nowrap"> 
          <tr> 
            <th className="px-3 py-2 w-10"> <input type="checkbox" className="rounded border-slate-300" /> </th> 
            {columns.map(col => <th key={col.key} className={`px-2 py-2 ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'}`}> {col.label} </th>)} 
          </tr> 
        </thead> 
        <tbody> 
          {groupedData ? (
            groupedData.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <td colSpan={columns.length + 1} className="px-3 py-2 font-bold text-slate-800 text-right cursor-pointer hover:bg-slate-100">
                    <div className="flex items-center gap-2">
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                      {group.key} <span className="text-slate-500 font-normal">({group.rows.length})</span>
                    </div>
                  </td>
                </tr>
                {group.rows.map((row, idx) => <tr key={idx} className="border-b border-slate-100 odd:bg-white even:bg-[#f9fafb] hover:bg-slate-50 transition-colors whitespace-nowrap"> 
                  <td className="px-3 py-1.5"> <input type="checkbox" className="rounded border-slate-300" /> </td> 
                  {columns.map(col => <td key={col.key} className={`px-2 py-1.5 text-slate-800 ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'}`}> {col.render ? col.render(row[col.key], row) : row[col.key]} </td>)} 
                </tr>)}
              </React.Fragment>
            ))
          ) : (
            filteredData.map((row, idx) => <tr key={idx} className="border-b border-slate-200 odd:bg-white even:bg-[#f9fafb] hover:bg-slate-100 transition-colors whitespace-nowrap"> 
              <td className="px-3 py-1.5"> <input type="checkbox" className="rounded border-slate-300" /> </td> 
              {columns.map(col => <td key={col.key} className={`px-2 py-1.5 text-slate-800 ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'}`}> {col.render ? col.render(row[col.key], row) : row[col.key]} </td>)} 
            </tr>)
          )} 
        </tbody> 
        <tfoot className="bg-white border-t-2 border-slate-300 font-bold text-slate-800 whitespace-nowrap"> 
          <tr> 
            <td className="px-3 py-2"></td> 
            {columns.map(col => {
              const isNumeric = data.some(r => typeof r[col.key] === 'number');
              const aggregateType = col.aggregate ?? (isNumeric ? 'sum' : 'none');
              let result: React.ReactNode = '';
              if (aggregateType === 'sum') {
                const sum = filteredData.reduce((acc, row) => acc + (typeof row[col.key] === 'number' ? row[col.key] : 0), 0);
                result = sum.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                });
              } else if (aggregateType === 'avg') {
                const sum = filteredData.reduce((acc, row) => acc + (typeof row[col.key] === 'number' ? row[col.key] : 0), 0);
                const avg = filteredData.length > 0 ? sum / filteredData.length : 0;
                result = avg.toLocaleString(undefined, {
                  minimumFractionDigits: 2
                });
              } else if (aggregateType === 'count') {
                result = filteredData.length;
              }
              return <td key={col.key} className={`px-2 py-2 font-bold ${col.align === 'left' ? 'text-left' : col.align === 'center' ? 'text-center' : 'text-right'}`}> {result} </td>;
            })} 
          </tr> 
        </tfoot> 
      </table> 
    </div> 
  </div>;
}