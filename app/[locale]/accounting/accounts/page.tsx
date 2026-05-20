"use client";

import { useParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Plus, Search, FileText, Download, Filter } from "lucide-react";
import { getChartOfAccounts, saveAccount } from "@/app/actions/accounting";
import { AccountCreationDialog } from "@/components/dialogs/AccountCreationDialog";
export default function ChartOfAccountsPage() {
  const params = useParams();
  const locale = params?.locale || "ar";
  const t = useTranslations("Accounting");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await getChartOfAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load accounts", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAccounts();
  }, []);
  const handleCreateAccount = async (data: any) => {
    const result = await saveAccount({
      ...data,
      id: "new"
    });
    if (result.success) {
      setIsCreateDialogOpen(false);
      loadAccounts();
    } else {
      throw new Error(result.error || "Failed to create account");
    }
  };
  const getTypeLabels = (type: string) => {
    switch (type) {
      case "asset":
        return {
          label: "أصول متداولة",
          color: "bg-blue-100 text-blue-800"
        };
      case "bank":
        return {
          label: "بنك ونقدية",
          color: "bg-teal-50 text-emerald-800"
        };
      case "receivable":
        return {
          label: "حسابات مدينة",
          color: "bg-cyan-100 text-cyan-800"
        };
      case "payable":
        return {
          label: "حسابات دائنة",
          color: "bg-red-50 text-rose-800"
        };
      case "liability":
        return {
          label: "خصوم متداولة",
          color: "bg-orange-100 text-orange-800"
        };
      case "income":
        return {
          label: "إيرادات",
          color: "bg-green-100 text-green-800"
        };
      case "expense":
        return {
          label: "مصروفات",
          color: "bg-red-100 text-red-800"
        };
      case "equity":
        return {
          label: "حقوق ملكية",
          color: "bg-purple-100 text-purple-800"
        };
      default:
        return {
          label: type,
          color: "bg-slate-100 text-slate-800"
        };
    }
  };
  return <div className="p-4">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <Link href={`/${locale}/accounting/chart-of-accounts/new`} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
            {" "}
            <Plus className="w-3.5 h-3.5" /> جديد{" "}
          </Link>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="w-full max-w-7xl space-y-4">
        {" "}
        {/* Search and Filters */}{" "}
        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
          {" "}
          <div className="flex w-full items-center gap-4">
            {" "}
            <div className="relative flex-1 max-w-md border-b border-slate-300 focus-within:border-sky-600 transition-colors">
              {" "}
              <input type="text" placeholder="البحث بالكود أو الاسم..." className="w-full pl-4 pr-10 py-1.5 text-sm outline-none bg-transparent" />{" "}
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
            </div>{" "}
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
              {" "}
              <Filter className="w-4 h-4" /> تصفية{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Ledger Accounts Table */}{" "}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {" "}
          {loading ? <div className="p-12 text-center text-slate-500 flex flex-col items-center">
              {" "}
              <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />{" "}
              Loading Chart of Accounts...{" "}
            </div> : <div className="overflow-x-auto">
              {" "}
              <table className="w-full text-right text-sm whitespace-nowrap">
                {" "}
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium sticky top-0">
                  {" "}
                  <tr>
                    {" "}
                    <th className="px-6 py-3 min-w-[100px]">الكود</th>{" "}
                    <th className="px-6 py-3 min-w-[250px]">اسم الحساب</th>{" "}
                    <th className="px-6 py-3">النوع</th>{" "}
                    <th className="px-6 py-3">المجموعة</th>{" "}
                    <th className="px-6 py-3 text-center">يسمح بالتسوية</th>{" "}
                    <th className="px-6 py-3 text-left">الرصيد</th>{" "}
                    <th className="px-6 py-3 text-center">إجراءات</th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-slate-100">
                  {" "}
                  {accounts.map(acc => {
                const typeInfo = getTypeLabels(acc.type);
                return <tr key={acc.id} className="hover:bg-sky-50 transition-colors group">
                        {" "}
                        <td className="px-6 py-3 font-medium text-slate-900">
                          {acc.code}
                        </td>{" "}
                        <td className="px-6 py-3">
                          {" "}
                          <Link href={`/${locale}/accounting/chart-of-accounts/${acc.id}`} className="flex items-center gap-2">
                            {" "}
                            <FileText className="w-4 h-4 text-slate-400" />{" "}
                            <span className="font-semibold text-sky-700 hover:underline cursor-pointer">
                              {acc.name}
                            </span>{" "}
                          </Link>{" "}
                        </td>{" "}
                        <td className="px-6 py-3">
                          {" "}
                          <span className={`px-2.5 py-1 rounded-sm text-xs font-semibold ${typeInfo.color}`}>
                            {" "}
                            {typeInfo.label}{" "}
                          </span>{" "}
                        </td>{" "}
                        <td className="px-6 py-3 text-slate-500 capitalize">
                          {acc.internalGroup || "-"}
                        </td>{" "}
                        <td className="px-6 py-3 text-center">
                          {" "}
                          {acc.allowReconciliation ? <span className="text-teal-700 font-bold">✓</span> : <span className="text-slate-300">-</span>}{" "}
                        </td>{" "}
                        <td className={`px-6 py-3 text-left font-mono font-medium ${acc.balance < 0 ? "text-red-600" : "text-slate-900"}`}>
                          {" "}
                          {acc.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{" "}
                          {acc.currency || "EGP"}{" "}
                        </td>{" "}
                        <td className="px-6 py-3 text-center">
                          {" "}
                          <Link href={`/${locale}/accounting/chart-of-accounts/${acc.id}`} className="text-slate-400 hover:text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity font-medium text-xs border rounded px-2 py-1">
                            {" "}
                            إعداد{" "}
                          </Link>{" "}
                        </td>{" "}
                      </tr>;
              })}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}