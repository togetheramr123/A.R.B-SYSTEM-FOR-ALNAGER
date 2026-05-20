"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { ModuleNavPortal } from "@/components/common/ModuleNavPortal";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
interface SubItem {
  title: string;
  href: string;
}
interface MenuSection {
  title?: string;
  items: SubItem[];
}
interface MenuItem {
  title: string;
  href?: string;
  subItems?: SubItem[];
  sections?: MenuSection[];
}
export default function AccountingHeader({
  locale,
  canAccessTreasury = true
}: {
  locale: string;
  canAccessTreasury?: boolean;
}) {
  const pathname = usePathname();
  const menuItems: MenuItem[] = [{
    title: "لوحة المعلومات",
    href: `/${locale}/accounting`
  }, {
    title: "العملاء",
    subItems: [{
      title: "الفواتير",
      href: `/${locale}/accounting/invoices`
    }, {
      title: "إشعارات دائنة",
      href: `/${locale}/accounting/returns?type=out_refund`
    }, {
      title: "الدفعات",
      href: `/${locale}/accounting/payments`
    }, {
      title: "المنتجات",
      href: `/${locale}/inventory/products`
    }, /* Shared */{
      title: "العملاء",
      href: `/${locale}/contacts?type=customer`
    }, /* Shared */{
      title: "كشف الحساب",
      href: `/${locale}/accounting/reporting/partner_ledger`
    }]
  }, {
    title: "الموردين",
    subItems: [{
      title: "الفواتير",
      href: `/${locale}/accounting/bills`
    }, {
      title: "إشعارات مدين",
      href: `/${locale}/accounting/returns?type=in_refund`
    }, {
      title: "الدفعات",
      href: `/${locale}/accounting/payments`
    }, {
      title: "الموردين",
      href: `/${locale}/contacts?type=vendor`
    }, /* Shared */{
      title: "كشف الحساب",
      href: `/${locale}/accounting/reporting/partner_ledger`
    }]
  }, {
    title: "المحاسبة",
    subItems: [{
      title: "القيود اليومية",
      href: `/${locale}/accounting/journal-entries`
    }, {
      title: "عناصر اليومية",
      href: `/${locale}/accounting/journal-items`
    }, ...(canAccessTreasury ? [{
      title: "الخزائن والصناديق",
      href: `/${locale}/accounting/cash-registers`
    }, {
      title: "سند قبض",
      href: `/${locale}/accounting/cash-registers/new-transaction?type=receipt`
    }, {
      title: "سند صرف",
      href: `/${locale}/accounting/cash-registers/new-transaction?type=disbursement`
    }, {
      title: "العهد النقدية",
      href: `/${locale}/accounting/petty-cash`
    }, {
      title: "التسويات البنكية",
      href: `/${locale}/accounting/reconciliation`
    }] : []), {
      title: "الأصول",
      href: `/${locale}/accounting/assets`
    }]
  }, {
    title: "إعداد التقارير",
    subItems: [{
      title: "الأرباح والخسائر",
      href: `/${locale}/accounting/reporting/profit_and_loss`
    }, {
      title: "الميزانية العمومية",
      href: `/${locale}/accounting/reporting/balance_sheet`
    }, {
      title: "ميزان المراجعة",
      href: `/${locale}/accounting/reporting/trial_balance`
    }, {
      title: "كشف حساب الشريك",
      href: `/${locale}/accounting/reporting/partner_ledger`
    }, {
      title: "أعمار الديون",
      href: `/${locale}/accounting/reporting/aged_balance`
    }]
  }, {
    title: "التهيئة",
    sections: [{
      title: "المحاسبة",
      items: [{
        title: "دفاتر اليومية",
        href: `/${locale}/accounting/journals`
      }, {
        title: "شجرة الحسابات",
        href: `/${locale}/accounting/accounts`
      }, {
        title: "الضرائب",
        href: `/${locale}/accounting/configuration/taxes`
      }, {
        title: "العملات",
        href: `/${locale}/accounting/configuration/currencies`
      }]
    }, ...(canAccessTreasury ? [{
      title: "المدفوعات",
      items: [{
        title: "طرق الدفع",
        href: `/${locale}/accounting/configuration/payment_methods`
      }, {
        title: "حسابات البنوك",
        href: `/${locale}/accounting/bank`
      }]
    }] : [])]
  }];
  return <ModuleNavPortal>
      {" "}
      <div className="flex items-center gap-1 h-full text-[13.5px] font-medium text-slate-700">
        {" "}
        <span className="font-bold text-[15px] text-slate-800 tracking-tight flex items-center shrink-0 pr-2 pl-4">
          {" "}
          المحاسبة{" "}
        </span>{" "}
        {menuItems.map((item, index) => <DropdownMenu key={index} item={item} isActive={pathname.startsWith(item.href || "")} />)}{" "}
      </div>{" "}
    </ModuleNavPortal>;
}
function DropdownMenu({
  item,
  isActive
}: {
  item: MenuItem;
  isActive: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  if (!item.subItems && !item.sections) {
    return <Link onClick={() => useBreadcrumbStore.getState().reset()} href={item.href || "#"} className="hover:text-amber-600 transition-colors py-4 px-1">
        {" "}
        {item.title}{" "}
      </Link>;
  }
  return <div className="relative h-full flex items-center" ref={dropdownRef}>
      {" "}
      <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-1.5 hover:text-amber-600 transition-colors py-4 px-1 ${isOpen ? "text-amber-600 font-bold" : ""}`}>
        {" "}
        {item.title}{" "}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />{" "}
      </button>{" "}
      {isOpen && <div className="absolute top-full right-0 mt-0 w-64 bg-white rounded-b-xl rounded-tl-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 py-2 z-[100] max-h-[75vh] overflow-y-auto custom-scrollbar animate-in slide-in- fade-in duration-200">
          {" "}
          {/* Render Simple SubItems */}{" "}
          {item.subItems?.map((sub, idx) => <Link key={idx} href={sub.href} className="block px-5 py-2 hover:bg-slate-50 hover:text-amber-700 transition-colors text-right font-medium" onClick={() => {
        useBreadcrumbStore.getState().reset();
        setIsOpen(false);
      }}>
              {" "}
              {sub.title}{" "}
            </Link>)}{" "}
          {/* Render Sections */}{" "}
          {item.sections?.map((section, secIdx) => <div key={secIdx} className="mb-2">
              {" "}
              {section.title && <div className="px-5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 mt-1 mb-1">
                  {" "}
                  {section.title}{" "}
                </div>}{" "}
              {section.items.map((sub, idx) => <Link key={idx} href={sub.href} className="block px-5 py-2 hover:bg-slate-50 hover:text-amber-700 transition-colors text-right font-medium" onClick={() => {
          useBreadcrumbStore.getState().reset();
          setIsOpen(false);
        }}>
                  {" "}
                  {sub.title}{" "}
                </Link>)}{" "}
            </div>)}{" "}
        </div>}{" "}
    </div>;
}