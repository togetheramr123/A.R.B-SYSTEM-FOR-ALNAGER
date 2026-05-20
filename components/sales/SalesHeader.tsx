"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { ModuleNavPortal } from "@/components/common/ModuleNavPortal";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
export function SalesHeader({
  locale
}: {
  locale: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("Sales");
  const isActive = (path: string) => pathname?.includes(path);
  return <ModuleNavPortal>
      {" "}
      <div className="flex items-center gap-1 h-full text-[13.5px] font-medium text-slate-700">
        {" "}
        <span className="font-bold text-[15px] text-slate-800 tracking-tight flex items-center shrink-0 pr-2 pl-4">
          المبيعات
        </span>{" "}
        {/* Navigation Links */}{" "}
        <nav className="flex items-center h-full rtl:space-x-reverse">
          {" "}
          <Link onClick={() => useBreadcrumbStore.getState().reset()} href={`/${locale}/sales`} className={`px-3 flex items-center h-full hover:bg-slate-100 transition-colors ${isActive("/sales") && !isActive("products") && !isActive("reporting") && !isActive("configuration") ? "bg-slate-100 font-bold text-slate-900" : ""}`}>
            {" "}
            الطلبات{" "}
          </Link>{" "}
          <div className="relative group h-full flex items-center">
            {" "}
            <button className={`px-3 flex items-center gap-1 h-full hover:bg-slate-100 transition-colors ${isActive("products") || isActive("pricelists") ? "bg-slate-100 font-bold text-slate-900" : ""}`}>
              {" "}
              المنتجات{" "}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180`} />{" "}
            </button>{" "}
            {/* Dropdown */}{" "}
            <div className="absolute top-10 right-0 mt-0 w-48 bg-white shadow-sm border border-slate-200 rounded-sm py-1 hidden group-hover:block z-50">
              {" "}
              <Link onClick={() => useBreadcrumbStore.getState().reset()} href={`/${locale}/inventory/products`} className="block px-4 py-2 hover:bg-slate-100 transition-colors text-right text-sm">
                {" "}
                المنتجات{" "}
              </Link>{" "}
              <Link onClick={() => useBreadcrumbStore.getState().reset()} href={`/${locale}/sales/pricelists`} className="block px-4 py-2 hover:bg-slate-100 transition-colors text-right text-sm">
                {" "}
                قوائم الأسعار{" "}
              </Link>{" "}
            </div>{" "}
          </div>{" "}
          <div className="relative group h-full flex items-center">
            {" "}
            <button className={`px-3 flex items-center gap-1 h-full hover:bg-slate-100 transition-colors ${isActive("/analysis") || isActive("/partner_ledger") ? "bg-slate-100 font-bold text-slate-900" : ""}`}>
              {" "}
              إعداد التقارير{" "}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180`} />{" "}
            </button>{" "}
            <div className="absolute top-10 right-0 mt-0 w-56 bg-white shadow-sm border border-slate-200 rounded-sm py-1 hidden group-hover:block z-50">
              {" "}
              <Link onClick={() => useBreadcrumbStore.getState().reset()} href={`/${locale}/sales/analysis`} className="block px-4 py-2 hover:bg-slate-100 transition-colors text-right text-sm">
                {" "}
                تحليل المبيعات{" "}
              </Link>{" "}
              <Link onClick={() => useBreadcrumbStore.getState().reset()} href={`/${locale}/accounting/reporting/partner_ledger`} className="block px-4 py-2 hover:bg-slate-100 transition-colors text-right text-sm">
                {" "}
                الاستاذ المساعد للشركاء{" "}
              </Link>{" "}
            </div>{" "}
          </div>{" "}
        </nav>{" "}
      </div>{" "}
    </ModuleNavPortal>;
}