"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, Download, ChevronLeft, ChevronRight, Filter, Upload, List, LayoutGrid, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function JournalItemsClient({ locale, items, totalCount, startRecord, endRecord, currentPage, totalPages, filter, journalFilter, q, totalDebit, totalCredit }: any) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  // Default visible columns
  const [visibleCols, setVisibleCols] = useState({
    date: true,
    entryName: true,
    account: true,
    partner: true,
    entreprise: false,
    label: true,
    debit: true,
    credit: true,
    matching: true,
    balance: false,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
      if (columnsRef.current && !columnsRef.current.contains(event.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCol = (col: keyof typeof visibleCols) => {
    setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <div className="flex flex-col h-full bg-white text-[13px] text-slate-700 font-sans">
      {/* Control Panel */}
      <div className="border-b border-slate-300 bg-white px-4 py-3 flex flex-col gap-3">
        {/* Top Row: Title & Search */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-slate-800">عناصر اليومية</h1>
          </div>
          
          <div className="w-[500px]">
            <form className="relative flex items-center w-full border border-slate-300 rounded bg-white px-2 focus-within:border-[#017E84] focus-within:ring-1 focus-within:ring-[#017E84]">
              {filter && (
                <div className="flex items-center bg-[#e0e0e0] text-slate-800 px-1.5 py-0.5 rounded text-xs ml-2 gap-1">
                  <span>{filter === 'posted' ? 'تم الترحيل' : 'مسودة'}</span>
                  <Link href={`/${locale}/accounting/journal-items`} className="hover:text-red-500">×</Link>
                </div>
              )}
              {journalFilter && <input type="hidden" name="journal" value={journalFilter} />}
              <input 
                type="text" 
                name="q"
                defaultValue={q}
                placeholder="بحث بالحساب، القيد،، الشريك..." 
                className="flex-1 py-1.5 bg-transparent border-none focus:ring-0 outline-none text-[13px] text-slate-800"
              />
              <Search className="w-4 h-4 text-slate-500 mr-2" />
            </form>
          </div>
        </div>

        {/* Bottom Row: Actions & Filters & Pager */}
        <div className="flex justify-between items-center mt-1">
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button className="text-slate-600 hover:text-slate-900 p-1.5 rounded hover:bg-slate-100 transition-colors" title="استيراد">
              <Upload className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-300 mx-2"></div>
            
            {/* Odoo Filters Bar */}
            <div className="flex items-center gap-4 text-slate-600 font-bold relative" ref={filterRef}>
              <div 
                className="flex items-center gap-1 cursor-pointer hover:text-slate-900"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <span>عوامل التصفية</span>
                <Filter className="w-3.5 h-3.5" />
              </div>

              {filterOpen && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-sm z-50 py-1 text-[13px] font-normal">
                  <Link href={`/${locale}/accounting/journal-items?filter=posted`} className="block px-4 py-1.5 hover:bg-slate-100 text-slate-700">
                    {filter === 'posted' ? '✓ ' : ''}تم الترحيل
                  </Link>
                  <Link href={`/${locale}/accounting/journal-items?filter=draft`} className="block px-4 py-1.5 hover:bg-slate-100 text-slate-700">
                    {filter === 'draft' ? '✓ ' : ''}مسودة
                  </Link>
                  {filter && (
                    <>
                      <div className="h-px bg-slate-200 my-1"></div>
                      <Link href={`/${locale}/accounting/journal-items`} className="block px-4 py-1.5 hover:bg-slate-100 text-slate-700">
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
          </div>

          {/* Pager */}
          <div className="flex items-center gap-4 text-[13px] text-slate-600">
            <div className="flex items-center gap-2">
              <button className="p-1 rounded text-[#0052cc] border-2 border-[#0052cc] bg-[#f0f4ff]">
                <List className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-slate-100 rounded text-slate-500">
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <span>{totalCount > 0 ? `${startRecord}-${endRecord} / ${totalCount}` : '0 / 0'}</span>
            <div className="flex items-center gap-1">
              {currentPage < totalPages ? (
                <Link href={`/${locale}/accounting/journal-items?page=${currentPage + 1}${filter ? `&filter=${filter}` : ""}${q ? `&q=${q}` : ""}`} className="p-1 hover:bg-slate-100 rounded text-slate-700">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="p-1 text-slate-300"><ChevronRight className="w-4 h-4" /></div>
              )}
              {currentPage > 1 ? (
                <Link href={`/${locale}/accounting/journal-items?page=${currentPage - 1}${filter ? `&filter=${filter}` : ""}${q ? `&q=${q}` : ""}`} className="p-1 hover:bg-slate-100 rounded text-slate-700">
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <div className="p-1 text-slate-300"><ChevronLeft className="w-4 h-4" /></div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List View Table */}
      <div className="flex-1 overflow-auto bg-white relative">
        <table className="w-full text-right whitespace-nowrap table-fixed">
          <thead className="bg-white border-b border-slate-300 text-slate-800 text-[13px]">
            <tr>
              {/* Column Selector Button */}
              <th className="w-10 py-3 px-2 text-center relative border-l border-slate-200">
                <div className="relative inline-block" ref={columnsRef}>
                  <button onClick={() => setColumnsOpen(!columnsOpen)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                  {columnsOpen && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-slate-200 shadow-lg rounded-sm z-50 py-1 text-right text-[12px] font-normal max-h-96 overflow-y-auto">
                      <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={visibleCols.entreprise} onChange={() => toggleCol('entreprise')} className="rounded-sm border-slate-300 text-[#017E84] focus:ring-0" />
                        <span>Entreprise</span>
                      </label>
                      <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={visibleCols.partner} onChange={() => toggleCol('partner')} className="rounded-sm border-slate-300 text-[#017E84] focus:ring-0" />
                        <span>الشريك</span>
                      </label>
                      <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={visibleCols.label} onChange={() => toggleCol('label')} className="rounded-sm border-slate-300 text-[#017E84] focus:ring-0" />
                        <span>بطاقة عنوان</span>
                      </label>
                      <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={visibleCols.matching} onChange={() => toggleCol('matching')} className="rounded-sm border-slate-300 text-[#017E84] focus:ring-0" />
                        <span>رقم المطابقة</span>
                      </label>
                      <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={visibleCols.balance} onChange={() => toggleCol('balance')} className="rounded-sm border-slate-300 text-[#017E84] focus:ring-0" />
                        <span>الرصيد</span>
                      </label>
                    </div>
                  )}
                </div>
              </th>

              {/* Table Headers based on visibility */}
              {visibleCols.date && <th className="py-3 px-2 font-bold w-32">التاريخ</th>}
              {visibleCols.entryName && <th className="py-3 px-2 font-bold w-40">قيد اليومية</th>}
              {visibleCols.account && <th className="py-3 px-2 font-bold w-48">حساب</th>}
              {visibleCols.partner && <th className="py-3 px-2 font-bold w-48">الشريك</th>}
              {visibleCols.entreprise && <th className="py-3 px-2 font-bold w-32">Entreprise</th>}
              {visibleCols.label && <th className="py-3 px-2 font-bold w-48">بطاقة عنوان</th>}
              {visibleCols.debit && <th className="py-3 px-2 font-bold w-32">المدين</th>}
              {visibleCols.credit && <th className="py-3 px-2 font-bold w-32">الدائن</th>}
              {visibleCols.balance && <th className="py-3 px-2 font-bold w-32">الرصيد</th>}
              {visibleCols.matching && <th className="py-3 px-2 font-bold w-24">رقم المطابقة</th>}
              
              <th className="w-10 py-3 px-4 text-center">
                <input type="checkbox" className="rounded-sm border-slate-300 text-[#017E84] focus:ring-[#017E84]" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-[13px]">
            {items.map((item: any) => {
              const dateStr = item.entry?.date ? new Date(item.entry.date).toLocaleDateString("ar-EG", {
                year: "numeric", month: "short", day: "numeric"
              }) : "-";
              
              const debit = Number(item.debit || 0);
              const credit = Number(item.credit || 0);
              const balance = debit - credit;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group cursor-pointer text-slate-700 border-b border-slate-100 last:border-0">
                  <td className="py-2.5 px-2 text-center border-l border-slate-50"></td>
                  
                  {visibleCols.date && <td className="py-2.5 px-2 truncate" title={dateStr}>{dateStr}</td>}
                  {visibleCols.entryName && (
                    <td className="py-2.5 px-2 font-bold truncate text-slate-800" title={item.entry?.name || ""}>
                      <Link href={`/${locale}/accounting/journal-entries/${item.entryId}`} className="text-[#666666] hover:text-[#017E84]">
                        {item.entry?.name || ""}
                      </Link>
                    </td>
                  )}
                  {visibleCols.account && <td className="py-2.5 px-2 truncate" title={`${item.account?.code || ""} ${item.account?.name || ""}`}>{item.account?.code || ""} {item.account?.name || ""}</td>}
                  {visibleCols.partner && <td className="py-2.5 px-2 truncate" title={item.entry?.partner?.name || ""}>{item.entry?.partner?.name || ""}</td>}
                  {visibleCols.entreprise && <td className="py-2.5 px-2 truncate" title="فرع 1">فرع 1</td>}
                  {visibleCols.label && <td className="py-2.5 px-2 truncate" title={item.name || ""}>{item.name || ""}</td>}
                  
                  {visibleCols.debit && (
                    <td className="py-2.5 px-2 font-medium text-slate-800 text-left">
                      {debit > 0 ? (
                        <>{debit.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-slate-500 text-[11px]">LE</span></>
                      ) : <span className="text-slate-400">0.00</span>}
                    </td>
                  )}
                  {visibleCols.credit && (
                    <td className="py-2.5 px-2 font-medium text-slate-800 text-left">
                      {credit > 0 ? (
                        <>{credit.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-slate-500 text-[11px]">LE</span></>
                      ) : <span className="text-slate-400">0.00</span>}
                    </td>
                  )}
                  {visibleCols.balance && (
                    <td className="py-2.5 px-2 font-medium text-slate-800 text-left">
                      {balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  )}
                  {visibleCols.matching && <td className="py-2.5 px-2 truncate" title={""}>{""}</td>}

                  <td className="py-2.5 px-4 text-center">
                    <input type="checkbox" className="rounded-sm border-slate-300 text-[#017E84] focus:ring-[#017E84] opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity" />
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-500 bg-white">
                  لا توجد عناصر يومية
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-slate-50 text-slate-800 font-bold text-[13px] border-t border-slate-300">
              <tr>
                <td className="py-2.5 px-2 text-center border-l border-slate-200"></td>
                {visibleCols.date && <td></td>}
                {visibleCols.entryName && <td></td>}
                {visibleCols.account && <td></td>}
                {visibleCols.partner && <td></td>}
                {visibleCols.entreprise && <td></td>}
                {visibleCols.label && <td className="py-2.5 px-2 text-left font-bold">الإجمالي</td>}
                {visibleCols.debit && (
                  <td className="py-2.5 px-2 text-left font-bold">
                    {totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-slate-500 text-[11px]">LE</span>
                  </td>
                )}
                {visibleCols.credit && (
                  <td className="py-2.5 px-2 text-left font-bold">
                    {totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-slate-500 text-[11px]">LE</span>
                  </td>
                )}
                {visibleCols.balance && (
                  <td className="py-2.5 px-2 text-left font-bold">
                    {(totalDebit - totalCredit).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </td>
                )}
                {visibleCols.matching && <td></td>}
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
