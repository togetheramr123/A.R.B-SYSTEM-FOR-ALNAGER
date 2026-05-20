"use client";

import React, { useState, useEffect } from "react";
import { Filter, Printer, Download } from "lucide-react";
import { ProfitLossFilterModal } from "./ProfitLossFilterModal";
interface Journal {
  id: string;
  name: string;
  code: string;
}
interface ProfitLossHeaderProps {
  journals: Journal[];
  currentFilters: {
    from?: string;
    to?: string;
    target?: string;
    showDc?: string;
    journals?: string;
  };
  plData?: any;
}
export function ProfitLossHeader({
  journals,
  currentFilters,
  plData
}: ProfitLossHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    const handleExcel = () => {
      if (!plData) return;
      /* Build CSV Content */
      const rows = [["قائمة الدخل (الأرباح والخسائر)"], ["الفترة", currentFilters.from && currentFilters.to ? `من ${currentFilters.from} إلى ${currentFilters.to}` : "كل الفترات"], [""], ["الحساب", "الكود", "مدين", "دائن", "الرصيد"]];
      const addSection = (title: string, accounts: any[], total: number) => {
        rows.push([title, "", "", "", total.toString()]);
        accounts.forEach((acc: any) => {
          rows.push([acc.name, acc.code, (acc.debit || 0).toString(), (acc.credit || 0).toString(), (acc.balance || 0).toString()]);
        });
        rows.push([""]);
      };
      addSection("الإيرادات التمويلية والتشغيلية", plData.income || [], plData.totalIncome || 0);
      addSection("يُخصم: تكلفة البضاعة المباعة (COGS)", plData.cogs || [], plData.totalCogs || 0);
      rows.push(["إجمالي الربح المشتق من المتاجرة (Gross Profit)", "", "", "", (plData.grossProfit || 0).toString()]);
      rows.push([""]);
      addSection("يُخصم: المصروفات العمومية، والإدارية، والتشغيلية", plData.expenses || [], plData.totalExpenses || 0);
      rows.push(["صافي الربح النهائي (Net Profit)", "", "", "", (plData.netProfit || 0).toString()]);
      /* Convert to CSV string (with BOM for Arabic support) */
      const csvContent = "\uFEFF" + rows.map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `profit_loss_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    const handlePdf = () => {
      window.print();
    };
    window.addEventListener("export-pl-excel", handleExcel);
    window.addEventListener("export-pl-pdf", handlePdf);
    return () => {
      window.removeEventListener("export-pl-excel", handleExcel);
      window.removeEventListener("export-pl-pdf", handlePdf);
    };
  }, [plData, currentFilters]);
  /* Count active filters */
  let activeFiltersCount = 0;
  if (currentFilters.from) activeFiltersCount++;
  if (currentFilters.to) activeFiltersCount++;
  if (currentFilters.target === "all") activeFiltersCount++;
  if (currentFilters.showDc === "true") activeFiltersCount++;
  if (currentFilters.journals) activeFiltersCount++;
  return <>
      {" "}
      <div className="flex justify-between items-center mb-4 no-print">
        {" "}
        <div className="flex gap-2 items-center">
          {" "}
          <button onClick={() => setIsModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded shadow-sm text-sm font-bold flex items-center gap-2 transition-colors relative">
            {" "}
            <Filter className="w-4 h-4 text-[#017E84]" /> خيارات التقرير{" "}
            {activeFiltersCount > 0 && <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm">
                {" "}
                {activeFiltersCount}{" "}
              </span>}{" "}
          </button>{" "}
        </div>{" "}
        <div className="flex gap-2">
          {" "}
          <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
            {" "}
            <Printer size={14} /> طباعة{" "}
          </button>{" "}
          <button onClick={() => window.dispatchEvent(new CustomEvent("export-pl-excel"))} className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
            {" "}
            <Download size={14} /> إكسيل{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      <ProfitLossFilterModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} journals={journals} />{" "}
    </>;
}