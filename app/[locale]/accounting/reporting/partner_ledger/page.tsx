"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  getPartnerLedgerData,
  getLedgerFilterOptions,
} from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/numberUtils";
import {
  FileDown,
  Printer,
  ChevronRight,
  ChevronDown,
  Settings,
  BookOpen,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
export default function PartnerLedgerPage() {
  const t = useTranslations("Accounting");
  const searchParams = useSearchParams();
  const initialPartnerId = searchParams.get("partnerId");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [options, setOptions] = useState({
    journals: [],
    accounts: [],
    partners: [],
    tags: [],
    accountTypes: [],
  } as any);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [filters, setFilters] = useState({
    startDate: todayStr,
    endDate: todayStr,
    partnerIds: initialPartnerId ? [initialPartnerId] : [],
    accountIds: [] as string[],
    journalIds: [] as string[],
    accountTypes: [] as string[],
    tags: [] as string[],
    reconciled: "all",
    includeDetails: true,
    showInitialBalance: true,
  });
  const [data, setData] = useState<any[]>([]);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const [expandedPartners, setExpandedPartners] = useState<Set<string>>(
    new Set(),
  );
  useEffect(() => {
    loadOptions();
  }, []);
  useEffect(() => {
    if (options.journals.length > 0 || options.partners.length > 0) {
      applyFilters();
    }
  }, [options]);
  const loadOptions = async () => {
    try {
      const opts = await getLedgerFilterOptions();
      setOptions(opts);
    } catch (e) {
      toast.error("فشل تحميل خيارات الفلاتر");
    }
  };
  const applyFilters = async () => {
    setApplying(true);
    try {
      const res = await getPartnerLedgerData({
        ...filters,
        reconciled:
          filters.reconciled === "all"
            ? undefined
            : filters.reconciled === "reconciled",
      });
      setData(res);
      if (res.length === 1) {
        setExpandedPartners(new Set([res[0].partner.id]));
      } else {
        setExpandedPartners(new Set());
      }
    } catch (e) {
      toast.error("فشل تحميل بيانات التقرير");
    } finally {
      setApplying(false);
      setLoading(false);
    }
  };
  const togglePartner = (id: string) => {
    const next = new Set(expandedPartners);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedPartners(next);
  };
  const toggleFilterArray = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => {
      const current = prev[key] as string[];
      if (current.includes(value)) {
        return { ...prev, [key]: current.filter((v) => v !== value) };
      } else {
        return { ...prev, [key]: [...current, value] };
      }
    });
  };
  const exportToExcel = () => {
    const rows: any[] = [];
    rows.push([`التاريخ: ${format(new Date(), "dd/MM/yyyy", { locale: ar })}`]);
    rows.push([]); // Data
    rows.push([
      "الشريك / التاريخ",
      "الدفتر",
      "حساب",
      "حركة",
      "وصف المدخلات",
      "مدين",
      "دائن",
      "رصيد",
    ]);

    data.forEach((pData) => {
      // Partner Row
      rows.push([
        pData.partner.name,
        "",
        "",
        "",
        "",
        pData.debit,
        pData.credit,
        pData.balance,
      ]);

      if ((filters as any).includeDetails) {
        if ((filters as any).showInitialBalance) {
          rows.push([
            "الرصيد الافتتاحي (Initial Balance)",
            "",
            "",
            "",
            "",
            pData.initialBalance > 0 ? pData.initialBalance : 0,
            pData.initialBalance < 0 ? Math.abs(pData.initialBalance) : 0,
            pData.initialBalance,
          ]);
        }
        pData.lines.forEach((line: any) => {
          rows.push([
            format(new Date(line.date), "dd MMMM, yyyy", { locale: ar }),
            line.journalCode,
            line.accountCode,
            line.entryName,
            line.name,
            line.debit,
            line.credit,
            line.balance,
          ]);
        });
        rows.push([
          "الرصيد الختامي (Ending Balance)",
          "",
          "",
          "",
          "",
          pData.balance > 0 ? pData.balance : 0,
          pData.balance < 0 ? Math.abs(pData.balance) : 0,
          pData.balance,
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Partner Ledger");
    XLSX.writeFile(wb, `Partner_Ledger_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };
  const printPDF = () => {
    window.print();
  };
  const accountTypeTranslations: Record<string, string> = {
    receivable: "ذمم مدينة (عملاء)",
    payable: "ذمم دائنة (موردين)",
    bank: "بنك",
    cash: "نقدية",
    asset_current: "أصول متداولة",
    current_assets: "أصول متداولة",
    expense: "مصروفات",
    income: "إيرادات",
    liability: "الالتزامات",
    liability_current: "التزامات متداولة",
    equity: "حقوق الملكية",
  };
  const translateAccountType = (type: string) =>
    accountTypeTranslations[type] || type;
  const journalCodeTranslations: Record<string, string> = {
    PUR: "مشتريات",
    INV: "مبيعات",
    BNK: "بنك",
    BNK1: "بنك",
    CSH: "نقدية",
    CSH1: "نقدية",
    MISC: "متنوعة",
    STJ: "تسويات",
  };
  const translateJournalCode = (code: string) =>
    journalCodeTranslations[code] || code; // Helper for custom dropdowns
  const DropdownFilter = ({
    label,
    optionsList,
    filterKey,
    displayProp = "name",
  }: any) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const activeCount = (filters[filterKey as keyof typeof filters] as string[])
      .length;
    return (
      <div className="relative" ref={ref}>
        {" "}
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center justify-between gap-2 px-3 h-[34px] rounded text-[13px] font-bold border transition-colors ${activeCount > 0 ? "bg-[#017E84] text-white border-[#017E84]" : "bg-[#017E84] text-white border-[#017E84] hover:bg-[#016e73]"}`}
        >
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>{label}</span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-70" />
        </button>{" "}
        {open && (
          <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-slate-200 shadow-sm rounded-sm z-50 max-h-80 overflow-y-auto">
            {" "}
            <div className="p-2 sticky top-0 bg-white border-b border-slate-100 flex justify-between items-center">
              {" "}
              <span className="text-[11px] font-bold text-slate-500">
                تحديد متعدد
              </span>{" "}
              {activeCount > 0 && (
                <button
                  onClick={() => setFilters((p) => ({ ...p, [filterKey]: [] }))}
                  className="text-[11px] text-red-500 hover:underline"
                >
                  مسح
                </button>
              )}{" "}
            </div>{" "}
            <div className="p-2 border-b border-slate-100 sticky top-[37px] bg-white z-10">
              <input autoComplete="off" autoCorrect="off" spellCheck={false}
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-slate-300 rounded focus:outline-none focus:border-[#017E84]"
              />
            </div>
            <div className="py-1">
              {" "}
              {optionsList
                .filter((opt: any) => {
                  const displayRaw = typeof opt === "string" ? opt : opt?.[displayProp];
                  const display = filterKey === "accountTypes" ? translateAccountType(displayRaw) : displayRaw;
                  return (display || "").toString().toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map((opt: any) => {
                const val = typeof opt === "string" ? opt : opt?.id;
                const displayRaw =
                  typeof opt === "string" ? opt : opt?.[displayProp];
                const display =
                  filterKey === "accountTypes"
                    ? translateAccountType(displayRaw)
                    : displayRaw;
                const isSelected = (
                  filters[filterKey as keyof typeof filters] as string[]
                ).includes(val);
                return (
                  <label
                    key={val}
                    className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
                  >
                    {" "}
                    <input autoComplete="off" autoCorrect="off" spellCheck={false}
                      type="checkbox"
                      checked={isSelected}
                      onChange={() =>
                        toggleFilterArray(
                          filterKey as keyof typeof filters,
                          val,
                        )
                      }
                      className="rounded border-slate-300 text-[#017E84] focus:ring-[#017E84]"
                    />{" "}
                    <span className="text-[13px] text-slate-700">
                      {display}
                    </span>{" "}
                  </label>
                );
              })}{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>
    );
  };
  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        جاري تحميل التقرير...
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-slate-50 print:bg-white print:p-0">
      {" "}
      {/* Header & Actions - Hidden in Print */}{" "}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-4 print:hidden">
        {" "}
        <div className="flex justify-between items-center">
          {" "}
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {" "}
            <BookOpen className="w-6 h-6 text-[#017E84]" /> الاستاذ المساعد
            للشركاء{" "}
          </h1>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <Button
              variant="outline"
              className="bg-white border-slate-300 hover:bg-slate-50 text-slate-700 h-9 px-4 text-[13px] font-bold rounded-sm flex items-center gap-2"
              onClick={exportToExcel}
            >
              {" "}
              <FileDown className="w-4 h-4" /> تصدير اكسيل{" "}
            </Button>{" "}
            <Button
              className="bg-[#017E84] hover:bg-[#015e63] text-white h-9 px-4 text-[13px] font-bold rounded-sm flex items-center gap-2"
              onClick={printPDF}
            >
              {" "}
              <Printer className="w-4 h-4" /> طباعه PDF{" "}
            </Button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Filters Row */}{" "}
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          {" "}
          <Button
            className={`bg-[#017E84] hover:bg-[#015e63] text-white h-[34px] px-6 text-[13px] font-bold rounded ${applying ? "opacity-70" : ""}`}
            onClick={applyFilters}
            disabled={applying}
          >
            {" "}
            {applying ? "جاري التحميل..." : "تطبيق"}{" "}
          </Button>{" "}
          <div className="h-6 w-px bg-slate-300 mx-1 shrink-0"></div> {/* Date Range */}{" "}
          <div className="flex items-center gap-3 bg-white border border-slate-300 rounded px-3 h-[34px] shrink-0" dir="ltr">
            {" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false}
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, startDate: e.target.value }))
              }
              className="text-[13px] border-none focus:ring-0 w-32 bg-transparent p-0 text-slate-700 cursor-pointer"
              title="تاريخ البداية"
            />{" "}
            <span className="text-slate-400 font-bold px-1">-</span>{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false}
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((p) => ({ ...p, endDate: e.target.value }))
              }
              className="text-[13px] border-none focus:ring-0 w-32 bg-transparent p-0 text-slate-700 cursor-pointer"
              title="تاريخ النهاية"
            />{" "}
            <span className="text-[13px] text-slate-700 font-bold border-l border-slate-200 pl-3 ml-1">
              التاريخ:
            </span>{" "}
          </div>{" "}
          <DropdownFilter
            label="نوع الحساب"
            optionsList={options.accountTypes}
            filterKey="accountTypes"
          />{" "}
          <select
            className="h-[34px] bg-white border border-slate-300 text-slate-700 text-[13px] font-bold rounded px-3 focus:ring-1 focus:ring-[#017E84] focus:border-[#017E84]"
            value={filters.reconciled}
            onChange={(e) =>
              setFilters((p) => ({ ...p, reconciled: e.target.value }))
            }
          >
            {" "}
            <option value="all">كل التسويات</option>{" "}
            <option value="reconciled">تم التسوية</option>{" "}
            <option value="unreconciled">لم يتم التسوية</option>{" "}
          </select>{" "}
          <DropdownFilter
            label="اليوميات"
            optionsList={options.journals}
            filterKey="journalIds"
          />{" "}
          <DropdownFilter
            label="الحسابات"
            optionsList={options.accounts}
            filterKey="accountIds"
          />{" "}
          <DropdownFilter
            label="الشركاء"
            optionsList={options.partners}
            filterKey="partnerIds"
          />{" "}
          <DropdownFilter
            label="وسم العملاء"
            optionsList={options.tags}
            filterKey="tags"
          />{" "}
          <div className="relative shrink-0" ref={optionsRef}>
            {" "}
            <button
              onClick={() => setOptionsOpen(!optionsOpen)}
              className="flex items-center gap-2 px-3 h-[34px] rounded text-[13px] font-bold border bg-white text-slate-700 border-slate-300 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>خيارات</span>
              <ChevronDown className="w-4 h-4 opacity-70 text-slate-500" />
            </button>{" "}
            {optionsOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-slate-200 shadow-sm rounded-sm z-50 p-2">
                {" "}
                <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer">
                  {" "}
                  <input autoComplete="off" autoCorrect="off" spellCheck={false}
                    type="checkbox"
                    checked={filters.includeDetails}
                    onChange={(e) =>
                      setFilters((p) => ({
                        ...p,
                        includeDetails: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-[#017E84]"
                />{" "}
                <span className="text-[13px]">شامل التفاصيل</span>{" "}
              </label>{" "}
              <label className="flex items-center gap-2 p-1.5 hover:bg-slate-50 cursor-pointer">
                {" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false}
                  type="checkbox"
                  checked={filters.showInitialBalance}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      showInitialBalance: e.target.checked,
                    }))
                  }
                  className="rounded border-slate-300 text-[#017E84]"
                />{" "}
                <span className="text-[13px]">الرصيد الافتتاحي</span>{" "}
              </label>{" "}
            </div>
            )}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Print Header - Only visible in print */}{" "}
      <div className="hidden print:block mb-8">
        {" "}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-4">
          {" "}
          <div>
            {" "}
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              الاستاذ العام للشركاء
            </h1>{" "}
            <div className="text-[11px] text-slate-600 flex gap-4">
              {" "}
              <span>
                تاريخ الاستخراج: {format(new Date(), "dd/MM/yyyy HH:mm")}
              </span>{" "}
              {filters.startDate && <span>من: {filters.startDate}</span>}{" "}
              {filters.endDate && <span>إلى: {filters.endDate}</span>}{" "}
            </div>{" "}
          </div>{" "}
          {/* Placeholder for Logo */}{" "}
          <div className="w-32 h-12 bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold border border-slate-300">
            {" "}
            Company Logo{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Report Content */}{" "}
      <div className="flex-1 overflow-auto p-6 print:p-0 print:overflow-visible">
        {" "}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden print:border-none print:shadow-none">
          {" "}
          <table className="w-full text-right border-collapse">
            {" "}
            <thead>
              {" "}
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-transparent print:border-b-2 print:border-slate-800">
                {" "}
                <th className="p-3 text-[12px] font-bold text-slate-700 w-1/3">
                  الشريك / التاريخ
                </th>{" "}
                <th className="p-3 text-[12px] font-bold text-slate-700">
                  اليومية
                </th>{" "}
                <th className="p-3 text-[12px] font-bold text-slate-700">
                  حساب
                </th>{" "}
                <th className="p-3 text-[12px] font-bold text-slate-700 w-1/4">
                  وصف المدخلات
                </th>{" "}
                <th className="p-3 text-[12px] font-bold text-slate-700 text-left">
                  مدين
                </th>{" "}
                <th className="p-3 text-[12px] font-bold text-slate-700 text-left">
                  دائن
                </th>{" "}
                <th className="p-3 text-[12px] font-bold text-slate-700 text-left">
                  رصيد
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {data.map((pData) => {
                const isExpanded =
                  expandedPartners.has(pData.partner.id) ||
                  (typeof window !== "undefined" &&
                    window.matchMedia("print").matches); // Always expand in print
                return (
                  <React.Fragment key={pData.partner.id}>
                    {" "}
                    {/* Partner Row */}{" "}
                    <tr
                      className="bg-slate-100 border-b border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors print:bg-slate-100 print:break-inside-avoid"
                      onClick={() => togglePartner(pData.partner.id)}
                    >
                      {" "}
                      <td className="p-3 text-[13px] font-bold text-slate-800 flex items-center gap-2">
                        {" "}
                        <ChevronRight
                          className={`w-4 h-4 text-slate-500 transition-transform print:hidden ${isExpanded ? "rotate-90" : "rtl:-rotate-180"}`}
                        />{" "}
                        {pData.partner.name}{" "}
                      </td>{" "}
                      <td></td> <td></td> <td></td>{" "}
                      <td
                        className="p-3 text-[13px] font-bold text-slate-800 text-left"
                        dir="ltr"
                      >
                        {formatCurrency(pData.debit)}
                      </td>{" "}
                      <td
                        className="p-3 text-[13px] font-bold text-slate-800 text-left"
                        dir="ltr"
                      >
                        {formatCurrency(pData.credit)}
                      </td>{" "}
                      <td
                        className="p-3 text-[13px] font-bold text-slate-800 text-left"
                        dir="ltr"
                      >
                        {formatCurrency(pData.balance)}
                      </td>{" "}
                    </tr>{" "}
                    {/* Expanded Details */}{" "}
                    {isExpanded && filters.includeDetails && (
                      <>
                        {" "}
                        {/* Initial Balance */}{" "}
                        {filters.showInitialBalance && (
                          <tr className="border-b border-slate-100 bg-white print:break-inside-avoid">
                            {" "}
                            <td className="p-2 px-8 text-[11px] font-bold italic text-slate-500">
                              الرصيد الافتتاحي
                            </td>{" "}
                            <td colSpan={3}></td>{" "}
                            <td
                              className="p-2 text-[12px] text-slate-600 text-left"
                              dir="ltr"
                            >
                              {" "}
                              {pData.initialBalance > 0
                                ? formatCurrency(pData.initialBalance)
                                : "-"}{" "}
                            </td>{" "}
                            <td
                              className="p-2 text-[12px] text-slate-600 text-left"
                              dir="ltr"
                            >
                              {" "}
                              {pData.initialBalance < 0
                                ? formatCurrency(Math.abs(pData.initialBalance))
                                : "-"}{" "}
                            </td>{" "}
                            <td
                              className="p-2 text-[12px] font-bold text-slate-700 text-left"
                              dir="ltr"
                            >
                              {formatCurrency(pData.initialBalance)}
                            </td>{" "}
                          </tr>
                        )}{" "}
                        {/* Lines */}{" "}
                        {pData.lines.map((line: any) => (
                          <tr
                            key={line.id}
                            className="border-b border-slate-50 bg-white hover:bg-slate-50 transition-colors print:break-inside-avoid"
                          >
                            {" "}
                            <td className="p-2 px-8 text-[12px] text-slate-700">
                              {" "}
                              {format(new Date(line.date), "dd MMMM, yyyy", {
                                locale: ar,
                              })}{" "}
                            </td>{" "}
                            <td className="p-2 text-[11px] text-slate-600">
                              {translateJournalCode(line.journalCode)}
                            </td>{" "}
                            <td className="p-2 text-[11px] text-slate-600">
                              {line.accountCode}
                            </td>{" "}
                            <td className="p-2 text-[11px] text-slate-700 truncate max-w-[200px]">
                              {" "}
                              {line.entryName}{" "}
                              {line.name ? `- ${line.name}` : ""}{" "}
                            </td>{" "}
                            <td
                              className="p-2 text-[12px] text-slate-700 text-left"
                              dir="ltr"
                            >
                              {" "}
                              {line.debit > 0
                                ? formatCurrency(line.debit)
                                : "-"}{" "}
                            </td>{" "}
                            <td
                              className="p-2 text-[12px] text-slate-700 text-left"
                              dir="ltr"
                            >
                              {" "}
                              {line.credit > 0
                                ? formatCurrency(line.credit)
                                : "-"}{" "}
                            </td>{" "}
                            <td
                              className="p-2 text-[12px] font-bold text-slate-800 text-left"
                              dir="ltr"
                            >
                              {" "}
                              {formatCurrency(line.balance)}{" "}
                            </td>{" "}
                          </tr>
                        ))}{" "}
                        {/* Ending Balance */}{" "}
                        <tr className="border-b-2 border-slate-200 bg-slate-50/50 print:break-inside-avoid">
                          {" "}
                          <td className="p-2 px-8 text-[11px] font-bold italic text-slate-500">
                            الرصيد الختامي
                          </td>{" "}
                          <td colSpan={3}></td>{" "}
                          <td
                            className="p-2 text-[12px] font-bold text-slate-700 text-left"
                            dir="ltr"
                          >
                            {" "}
                            {pData.balance > 0
                              ? formatCurrency(pData.balance)
                              : "-"}{" "}
                          </td>{" "}
                          <td
                            className="p-2 text-[12px] font-bold text-slate-700 text-left"
                            dir="ltr"
                          >
                            {" "}
                            {pData.balance < 0
                              ? formatCurrency(Math.abs(pData.balance))
                              : "-"}{" "}
                          </td>{" "}
                          <td
                            className="p-2 text-[12px] font-bold text-[#017E84] text-left"
                            dir="ltr"
                          >
                            {formatCurrency(pData.balance)}
                          </td>{" "}
                        </tr>{" "}
                      </>
                    )}{" "}
                  </React.Fragment>
                );
              })}{" "}
              {data.length === 0 && !applying && (
                <tr>
                  {" "}
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 text-sm"
                  >
                    {" "}
                    لا توجد بيانات مطابقة للبحث{" "}
                  </td>{" "}
                </tr>
              )}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
