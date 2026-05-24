'use client';
import React from "react";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, X, Search, Filter, Layers } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
export type FilterOption = {
  key: string;
  label: string;
  domain?: any;
  type?: string;
};
;
export type GroupByOption = {
  label: string;
  key: string;
};
interface OdooSearchProps {
  filters?: FilterOption[];
  groupBys?: GroupByOption[];
  className?: string;
  placeholder?: string;
}
export function OdooSearch({
  filters = [],
  groupBys = [],
  className,
  placeholder = "Search..."
}: OdooSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupBys, setShowGroupBys] = useState(false);
  const activeFilterKeys = searchParams.get('filter')?.split(',').filter(Boolean) || [];
  const activeGroupByKey = searchParams.get('groupBy');
  const currentSearch = searchParams.get('q') || '';
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);
  const updateParams = (newFilters: string[], newGroupBy: string | null, newSearch: string) => {
    const params = new URLSearchParams(searchParams);
    if (newFilters.length > 0) params.set('filter', newFilters.join(','));else params.delete('filter');
    if (newGroupBy) params.set('groupBy', newGroupBy);else params.delete('groupBy');
    if (newSearch) params.set('q', newSearch);else params.delete('q');
    router.replace(`${pathname}?${params.toString()}`);
  };
  const toggleFilter = (key: string) => {
    const newFilters = activeFilterKeys.includes(key) ? activeFilterKeys.filter(k => k !== key) : [...activeFilterKeys, key];
    updateParams(newFilters, activeGroupByKey, searchTerm);
  };
  const toggleGroupBy = (key: string) => {
    const newGroupBy = activeGroupByKey === key ? null : key;
    updateParams(activeFilterKeys, newGroupBy, searchTerm);
  };
const clearAll = () => {
  setSearchTerm('');
  updateParams([], null, '');
};
const handleSearchCommit = (e: React.FormEvent) => {
  e.preventDefault();
  updateParams(activeFilterKeys, activeGroupByKey, searchTerm);
};
const filterRef = useRef<HTMLDivElement>(null);
const groupRef = useRef<HTMLDivElement>(null);
return(<div className={`w-full space-y-2 ${className}`}> {} <div className="flex items-center gap-2 bg-white border rounded-md p-1 shadow-sm focus-within:ring-1 focus-within:ring-indigo-500"> <Search className="w-4 h-4 text-gray-400 ml-2" /> <form onSubmit={handleSearchCommit} className="flex-1"> <input type="text" className="w-full text-sm outline-none bg-transparent p-1" placeholder={placeholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /> </form> {activeFilterKeys.length > 0 && <Button variant="ghost" size="icon" onClick={clearAll} className="h-6 w-6"><X className="w-3 h-3" /></Button>} </div> {} <div className="flex flex-wrap items-center gap-2"> {} {filters.length > 0 && <div className="relative" ref={filterRef}> <Button variant={activeFilterKeys.length ? "secondary" : "outline"} size="sm" className="h-7 text-xs gap-1" onClick={() => setShowFilters(!showFilters)}> <Filter className="w-3 h-3" /> Filters <ChevronDown className="w-3 h-3" /> </Button> {showFilters && <div className="absolute top-8 left-0 min-w-[200px] bg-white border rounded shadow-sm z-50 py-1"> {filters.map(f => <div key={f.key} className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${activeFilterKeys.includes(f.key) ? 'bg-[#017E84]/10 text-indigo-700' : ''}`} onClick={() => {
          toggleFilter(f.key);
          setShowFilters(false);
        }}> {f.label} {activeFilterKeys.includes(f.key) && <span className="text-xs">✓</span>} </div>)} </div>} </div>} {} {groupBys.length > 0 && <div className="relative" ref={groupRef}> <Button variant={activeGroupByKey ? "secondary" : "outline"} size="sm" className="h-7 text-xs gap-1" onClick={() => setShowGroupBys(!showGroupBys)}> <Layers className="w-3 h-3" /> Group By <ChevronDown className="w-3 h-3" /> </Button> {showGroupBys && <div className="absolute top-8 left-0 min-w-[200px] bg-white border rounded shadow-sm z-50 py-1"> {groupBys.map(g => <div key={g.key} className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between ${activeGroupByKey === g.key ? 'bg-[#017E84]/10 text-indigo-700' : ''}`} onClick={() => {
          toggleGroupBy(g.key);
          setShowGroupBys(false);
        }}> {g.label} {activeGroupByKey === g.key && <span className="text-xs">✓</span>} </div>)} </div>} </div>} {} <div className="flex items-center gap-1 flex-wrap"> {activeFilterKeys.map(k => {
        const label = filters.find(f => f.key === k)?.label || k;
        return <Badge key={k} variant="secondary" className="h-6 text-xs gap-1 pl-2 pr-1 bg-[#017E84]/10 text-indigo-700 border-indigo-100"> {label} <X className="w-3 h-3 cursor-pointer hover:text-indigo-900" onClick={() => toggleFilter(k)} /> </Badge>;
      })} {activeGroupByKey && <Badge variant="outline" className="h-6 text-xs gap-1 pl-2 pr-1 border-gray-300 text-gray-700"> Grouping: {groupBys.find(g => g.key === activeGroupByKey)?.label || activeGroupByKey} <X className="w-3 h-3 cursor-pointer hover:text-gray-900" onClick={() => toggleGroupBy(activeGroupByKey)} /> </Badge>} </div> </div> </div>);
}
