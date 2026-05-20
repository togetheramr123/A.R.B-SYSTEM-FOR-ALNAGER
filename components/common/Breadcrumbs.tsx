"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useBreadcrumbsStore } from "@/store/breadcrumbsStore"; // Maps URL segments to Arabic readable names for fallback
const routeTranslations: Record<string, string> = {
  sales: "المبيعات",
  quotations: "عروض الأسعار",
  orders: "أوامر البيع",
  analysis: "التحليل",
  inventory: "المخزون",
  configuration: "التهيئة",
  categories: "الفئات",
  products: "المنتجات",
  variants: "المتغيرات",
  transfers: "التحويلات",
  adjustments: "جرد المخزون",
  locations: "المواقع",
  accounting: "المحاسبة",
  invoices: "الفواتير",
  bills: "فواتير الموردين",
  "journal-items": "عناصر اليومية",
  "trial-balance": "ميزان المراجعة",
  "profit-loss": "الأرباح والخسائر",
  purchases: "المشتريات",
  partners: "جهات الاتصال",
  contacts: "جهات الاتصال"
};
export function Breadcrumbs({
  currentRecordName
}: {
  currentRecordName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // We only use the store to resolve dynamic labels like product names
  const {
    routeLabels,
    updateCurrentLabel,
    historyStack,
    pushToStack,
    resetStack
  } = useBreadcrumbsStore();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []); // Effect for updating current context label exactly when provided
  useEffect(() => {
    if (currentRecordName && pathname) {
      updateCurrentLabel(currentRecordName, pathname);
    }
  }, [pathname, currentRecordName, updateCurrentLabel]); // Effect for tracking history Stack
  useEffect(() => {
    if (!pathname) return;
    const segments = pathname.split("/").filter(Boolean); // Ignore pure home paths (like just /ar or /en)
    if (segments.length < 2) {
      resetStack();
      return;
    }
    const isRootModulePath = segments.length === 2 && (segments[0] === "ar" || segments[0] === "en");
    const hasUUID = segments.some(seg => seg.length >= 25 && seg.includes("-"));
    const hasNew = segments.includes("new"); // When user explicitly visits a dashboard/root or a List View, clear the deep stack. // A list view is any path that does NOT contain a UUID and does NOT contain 'new'
    const isListView = !hasUUID && !hasNew;
    if (isRootModulePath || isListView) {
      resetStack();
    }
    const lastSeg = segments[segments.length - 1];
    let defaultLabel = routeTranslations[lastSeg] || lastSeg;
    const isUUID = lastSeg.length >= 25 && lastSeg.includes("-");
    if (isUUID) defaultLabel = "سجل";
    if (lastSeg === "new") defaultLabel = "سجل جديد";
    if (searchParams.has("templateId") && !isUUID) defaultLabel = "المتغيرات"; // Construct full URL including search params to push to history
    const fullUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname; // Push this state to the stack
    pushToStack(fullUrl, defaultLabel);
  }, [pathname, searchParams, pushToStack, resetStack]);
  if (!isMounted || !pathname) return null;
  if (historyStack.length === 0) return null;
  return <div className="flex items-center w-full hidden md:flex">
      {" "}
      <nav className="flex items-center text-[19px] font-semibold tracking-tight hide-scrollbar overflow-x-auto w-full">
        {" "}
        {historyStack.map((item, index) => {
        const isLast = index === historyStack.length - 1;
        return <div key={item.id} className="flex items-center whitespace-nowrap">
              {" "}
              {isLast ? <span className="text-slate-800" title={item.label}>
                  {" "}
                  {item.label}{" "}
                </span> : <Link href={item.url} className="text-[#017E84] hover:text-[#015e63] transition-colors" title={item.label}>
                  {" "}
                  {item.label}{" "}
                </Link>}{" "}
              {!isLast && <span className="mx-2 text-slate-400 font-normal shrink-0 mt-0.5">
                  /
                </span>}{" "}
            </div>;
      })}{" "}
      </nav>{" "}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>{" "}
    </div>;
}