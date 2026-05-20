"use client";

import { useState, useEffect } from "react";
import { getProfitAndLossReport } from "@/app/actions/reports";
import { Download, Filter, ChevronDown, ChevronRight, Calculator, FileText } from "lucide-react";

interface AccountRow {
  id: string;
  code: string;
  name: string;
  type: string;
  balance: number;
}

interface ReportData {
  operatingIncome: AccountRow[];
  costOfRevenue: AccountRow[];
  operatingExpenses: AccountRow[];
  totals: {
    operatingIncome: number;
    costOfRevenue: number;
    grossProfit: number;
    operatingExpenses: number;
    netProfit: number;
  };
}

export function ProfitAndLossReport() {
  const [period, setPeriod] = useState("this_month");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    operatingIncome: true,
    costOfRevenue: true,
    grossProfit: true,
    operatingExpenses: true,
    netProfit: true
  });

  const toggleExpand = (section: string) => {
    setExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let start: string | undefined = undefined;
      let end: string | undefined = undefined;
      const now = new Date();

      if (period === "this_month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
      } else if (period === "last_month") {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
      } else if (period === "this_year") {
        start = new Date(now.getFullYear(), 0, 1).toISOString();
        end = new Date(now.getFullYear(), 11, 31).toISOString();
      } else if (period === "custom") {
        start = customDates.start || undefined;
        end = customDates.end || undefined;
      }

      const report = await getProfitAndLossReport(start, end);
      setData(report);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== "custom" || (customDates.start && customDates.end)) {
      fetchReport();
    }
  }, [period, customDates]);

  const formatMoney = (amount: number) => {
    // In accounting, negative values are often shown in parentheses, but for standard ERP display we keep standard formatting
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0) + " EGP";
  };

  const ReportRow = ({
    label,
    amount,
    isHeader = false,
    isTotal = false,
    indent = false,
    onToggle,
    isExpanded,
    hideAmount = false
  }: any) => {
    return (
      <div 
        className={`flex items-center justify-between py-[10px] px-4 hover:bg-slate-50 transition-colors group
          ${isHeader ? "cursor-pointer select-none" : ""}
          ${isTotal ? "border-t-[1.5px] border-black border-b-[3px] border-double border-b-black mt-2 mb-4" : "border-b border-slate-100"}
          ${indent ? "pl-12" : "pl-4"}
        `}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {isHeader && (
            <span className="text-slate-500 hover:text-slate-800 transition-colors">
              {isExpanded ? <ChevronDown className="w-[14px] h-[14px]" /> : <ChevronRight className="w-[14px] h-[14px]" />}
            </span>
          )}
          <span className={`
            ${isTotal ? "font-bold text-[15px] text-black" : ""}
            ${isHeader ? "font-bold text-[14px] text-slate-800" : ""}
            ${!isTotal && !isHeader ? "text-[13px] text-slate-700 font-medium pr-6" : ""}
          `}>
            {label}
          </span>
        </div>
        
        {!hideAmount && (
          <div className={`text-[14px] font-medium tracking-tight font-mono
            ${isTotal ? "font-bold text-[15px] text-black" : "text-slate-800"}
            ${amount < 0 ? "text-red-600" : ""}
          `}>
            {amount !== undefined ? formatMoney(amount) : ""}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9f9]">
      {/* Odoo Control Panel */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <span className="hover:underline cursor-pointer">المحاسبة</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">التقارير</span>
          <span>/</span>
          <span className="text-slate-800 font-medium">الأرباح والخسائر</span>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-semibold text-slate-800">الأرباح والخسائر (Profit and Loss)</h1>
          
          <div className="flex items-center gap-3">
            {period === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-[#017E84]"
                  value={customDates.start}
                  onChange={e => setCustomDates(d => ({ ...d, start: e.target.value }))}
                />
                <span className="text-slate-400">-</span>
                <input
                  type="date"
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-[#017E84]"
                  value={customDates.end}
                  onChange={e => setCustomDates(d => ({ ...d, end: e.target.value }))}
                />
              </div>
            )}
            
            <select
              className="px-3 py-2 border border-slate-300 rounded text-sm bg-white outline-none focus:border-[#017E84] text-slate-700 min-w-[140px]"
              value={period}
              onChange={e => setPeriod(e.target.value)}
            >
              <option value="this_month">هذا الشهر (This Month)</option>
              <option value="last_month">الشهر الماضي (Last Month)</option>
              <option value="this_year">هذه السنة (This Year)</option>
              <option value="all_time">كل الأوقات (All Time)</option>
              <option value="custom">تاريخ مخصص...</option>
            </select>
            
            <div className="flex gap-2 border-r border-slate-300 pr-3 ml-1">
              <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-sm font-medium transition-colors">
                <Download className="w-4 h-4" /> PDF
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-sm font-medium transition-colors">
                <FileText className="w-4 h-4" /> XLSX
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Body */}
      <div className="p-6 flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto bg-white border border-slate-200 shadow-sm p-8" dir="rtl">
          
          {/* Document Header */}
          <div className="text-center mb-8 border-b border-slate-200 pb-6">
            <h2 className="text-xl font-bold text-slate-800">قائمة الدخل (Profit and Loss)</h2>
            <p className="text-slate-500 text-sm mt-1">
              {period === "this_month" && "عن الفترة: هذا الشهر"}
              {period === "last_month" && "عن الفترة: الشهر الماضي"}
              {period === "this_year" && "عن الفترة: هذه السنة"}
              {period === "all_time" && "عن الفترة: كل الأوقات"}
            </p>
          </div>

          {loading ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#017E84]"></div>
            </div>
          ) : data ? (
            <div className="flex flex-col font-sans">
              
              {/* Operating Income */}
              <ReportRow 
                label="إيرادات التشغيل (Operating Income)" 
                isHeader 
                isExpanded={expanded.operatingIncome} 
                onToggle={() => toggleExpand("operatingIncome")} 
                amount={data.totals.operatingIncome} 
              />
              {expanded.operatingIncome && data.operatingIncome.map(acc => (
                <ReportRow key={acc.id} label={`${acc.code} ${acc.name}`} amount={acc.balance} indent />
              ))}

              {/* Cost of Revenue */}
              <div className="mt-2">
                <ReportRow 
                  label="تكلفة البضاعة المباعة (Cost of Revenue)" 
                  isHeader 
                  isExpanded={expanded.costOfRevenue} 
                  onToggle={() => toggleExpand("costOfRevenue")} 
                  amount={data.totals.costOfRevenue} 
                />
                {expanded.costOfRevenue && data.costOfRevenue.map(acc => (
                  <ReportRow key={acc.id} label={`${acc.code} ${acc.name}`} amount={acc.balance} indent />
                ))}
              </div>

              {/* Gross Profit */}
              <ReportRow 
                label="إجمالي الربح (Gross Profit)" 
                isTotal 
                amount={data.totals.grossProfit} 
              />

              {/* Operating Expenses */}
              <div className="mt-6">
                <ReportRow 
                  label="مصروفات التشغيل (Operating Expenses)" 
                  isHeader 
                  isExpanded={expanded.operatingExpenses} 
                  onToggle={() => toggleExpand("operatingExpenses")} 
                  amount={data.totals.operatingExpenses} 
                />
                {expanded.operatingExpenses && data.operatingExpenses.map(acc => (
                  <ReportRow key={acc.id} label={`${acc.code} ${acc.name}`} amount={acc.balance} indent />
                ))}
              </div>

              {/* Net Profit */}
              <div className="mt-8">
                <ReportRow 
                  label="صافي الربح / الخسارة (Net Profit)" 
                  isTotal 
                  amount={data.totals.netProfit} 
                />
              </div>

            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              لا توجد بيانات لهذه الفترة
            </div>
          )}
        </div>
      </div>
    </div>
  );
}