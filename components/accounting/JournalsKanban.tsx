"use client";

import React, { useEffect, useState } from "react";
import {
  getJournalsKanbanData,
  JournalKanbanData,
} from "@/app/actions/dashboards";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
export function JournalsKanban({ locale }: { locale: string }) {
  const [journals, setJournals] = useState<JournalKanbanData[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getJournalsKanbanData().then((data) => {
      setJournals(data);
      setLoading(false);
    });
  }, []);
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
        {" "}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-64 bg-slate-200 rounded-sm border border-slate-300"
          ></div>
        ))}{" "}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {" "}
      {journals.map((journal) => (
        <div
          key={journal.id}
          className="relative bg-white rounded-md shadow-sm border-t-4 border-slate-200 hover:shadow-md transition-shadow group flex flex-col h-64"
          style={{}}
        >
          {" "}
          {}{" "}
          <div className="p-4 pb-2 flex justify-between items-start border-b border-slate-100">
            {" "}
            <div>
              {" "}
              <h3 className="text-[16px] font-bold text-slate-800 hover:text-[#017E84] cursor-pointer">
                {journal.name}
              </h3>{" "}
            </div>{" "}
            <button className="text-slate-400 hover:text-slate-600">
              {" "}
              <MoreVertical className="w-5 h-5" />{" "}
            </button>{" "}
          </div>{" "}
          {}{" "}
          <div className="p-4 flex-1 flex flex-col justify-between">
            {" "}
            {}{" "}
            {(journal.type === "sale" || journal.type === "purchase") && (
              <div className="flex justify-between h-full">
                {" "}
                {}{" "}
                <div className="space-y-2.5 flex-1 pr-2 border-l border-slate-100 pl-4">
                  {" "}
                  <Link
                    href={`/${locale}/accounting/${journal.type === "sale" ? "invoices" : "bills"}?state=draft`}
                    className="flex justify-between items-center group/link"
                  >
                    {" "}
                    <span className="text-sm text-slate-600 group-hover/link:text-[#017E84] group-hover/link:underline">
                      {journal.stats.draftCount} فواتير مسودة
                    </span>{" "}
                    <span
                      className="text-sm font-bold text-slate-700"
                      dir="ltr"
                    >
                      {fmt(journal.stats.draftAmount)} LE
                    </span>{" "}
                  </Link>{" "}
                  <Link
                    href={`/${locale}/accounting/${journal.type === "sale" ? "invoices" : "bills"}?state=unpaid`}
                    className="flex justify-between items-center group/link"
                  >
                    {" "}
                    <span className="text-sm text-slate-600 group-hover/link:text-[#017E84] group-hover/link:underline">
                      {journal.stats.unpaidCount} فواتير غير مدفوعة
                    </span>{" "}
                    <span
                      className="text-sm font-bold text-slate-700"
                      dir="ltr"
                    >
                      {fmt(journal.stats.unpaidAmount)} LE
                    </span>{" "}
                  </Link>{" "}
                  {journal.stats.lateCount > 0 && (
                    <Link
                      href={`/${locale}/accounting/${journal.type === "sale" ? "invoices" : "bills"}?state=late`}
                      className="flex justify-between items-center group/link"
                    >
                      {" "}
                      <span className="text-sm font-bold text-amber-600 group-hover/link:underline">
                        {journal.stats.lateCount} فواتير متأخرة
                      </span>{" "}
                      <span
                        className="text-sm font-bold text-amber-600"
                        dir="ltr"
                      >
                        {fmt(journal.stats.lateAmount)} LE
                      </span>{" "}
                    </Link>
                  )}{" "}
                </div>{" "}
                {}{" "}
                <div className="w-1/3 flex flex-col justify-start items-center pt-1">
                  <Link
                    href={`/${locale}/accounting/${journal.type === "sale" ? "invoices/new" : "bills/new"}`}
                    className="bg-[#017E84] hover:bg-[#015e63] text-white text-sm font-bold px-4 py-2 rounded shadow-sm w-full text-center transition-colors"
                  >
                    فاتورة جديدة
                  </Link>
                </div>
              </div>
            )}
            
            {(journal.type === 'bank' || journal.type === 'cash') && (
              <div className="flex justify-between h-full">
                <div className="space-y-4 flex-1 pr-2 border-l border-slate-100 pl-4">
                  <div className="flex justify-between items-center group/link cursor-pointer">
                    <span className="text-sm text-slate-600 hover:text-[#017E84] hover:underline">الرصيد في د.أستاذ</span>
                    <span className="text-sm font-bold text-slate-700" dir="ltr">{fmt(journal.stats.balance || 0)} LE</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-sm">آخر كشف حساب</span>
                    <span className="text-sm font-bold" dir="ltr">--</span>
                  </div>
                </div>
                
                <div className="w-1/3 flex flex-col justify-start items-center space-y-2 pt-1">
                  <Link
                    href={`/${locale}/accounting/bank-statements/new?journalId=${journal.id}`}
                    className="bg-[#017E84] hover:bg-[#015e63] text-white text-sm font-bold px-4 py-2 rounded shadow-sm w-full text-center transition-colors"
                  >
                    إنشاء كشف
                  </Link>
                  <Link
                    href={`/${locale}/accounting/payments/new?journalId=${journal.id}`}
                    className="text-[#017E84] hover:text-[#015e63] text-sm font-bold w-full text-center hover:underline"
                  >
                    دفعة جديدة
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}{" "}
    </div>
  );
}
