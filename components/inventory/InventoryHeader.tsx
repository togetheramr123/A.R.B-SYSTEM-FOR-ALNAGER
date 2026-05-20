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
export default function InventoryHeader({
  locale
}: {
  locale: string;
}) {
  const pathname = usePathname();
  const menuItems: MenuItem[] = [{
    title: "نظرة عامة",
    href: `/${locale}/inventory`
  }, {
    title: "العمليات",
    subItems: [{
      title: "التحويلات",
      href: `/${locale}/inventory/transfers`
    }, {
      title: "تعديلات المخزون",
      href: `/${locale}/inventory/adjustments`
    }, {
      title: "Scrap / إهلاك",
      href: `/${locale}/inventory/scrap`
    }, {
      title: "تجديد المخزون",
      href: `/${locale}/inventory/operations/replenishment`
    }, {
      title: "مخلفات التصنيع",
      href: `/${locale}/inventory/operations/scrap`
    }]
  }, {
    title: "المنتجات",
    subItems: [{
      title: "المنتجات",
      href: `/${locale}/inventory/products`
    }, {
      title: "متغيرات المنتجات",
      href: `/${locale}/inventory/products/variants`
    }, {
      title: "فئات المنتجات",
      href: `/${locale}/inventory/products/categories`
    }, {
      title: "الخصائص",
      href: `/${locale}/inventory/products/attributes`
    }, {
      title: "وحدات القياس",
      href: `/${locale}/inventory/config/uom`
    }]
  }, {
    title: "إعداد التقارير",
    subItems: [{
      title: "تقرير النواقص",
      href: `/${locale}/inventory/reporting/shortage`
    }, {
      title: "المخزون",
      href: `/${locale}/inventory/reporting/stock`
    }, {
      title: "المواقع",
      href: `/${locale}/inventory/reporting/locations`
    }, {
      title: "سجل الحركات",
      href: `/${locale}/inventory/moves`
    }]
  }, {
    title: "التهيئة",
    sections: [{
      title: "إدارة المخازن و المستودعات",
      items: [{
        title: "المستودعات",
        href: `/${locale}/inventory/warehouses`
      }, {
        title: "المواقع",
        href: `/${locale}/inventory/warehouses/locations`
      }, {
        title: "المسارات",
        href: `/${locale}/inventory/config/routes`
      }, {
        title: "القواعد",
        href: `/${locale}/inventory/config/rules`
      }, {
        title: "أنواع العمليات",
        href: `/${locale}/inventory/config/operation-types`
      }, {
        title: "قواعد التخزين",
        href: `/${locale}/inventory/config/putaway-rules`
      }]
    }, {
      title: "المنتجات",
      items: [{
        title: "فئات المنتجات",
        href: `/${locale}/inventory/products/categories`
      }, {
        title: "الخصائص",
        href: `/${locale}/inventory/products/attributes`
      }, {
        title: "قواعد إعادة الطلب",
        href: `/${locale}/inventory/operations/reordering`
      }]
    }, {
      title: "وحدات القياس",
      items: [{
        title: "فئات وحدات القياس",
        href: `/${locale}/inventory/config/uom-categories`
      }, {
        title: "وحدات القياس",
        href: `/${locale}/inventory/config/uom`
      }]
    }, {
      title: "التوصيل",
      items: [{
        title: "طُرُق الشحن",
        href: `/${locale}/inventory/config/delivery-methods`
      }]
    }]
  }];
  return <ModuleNavPortal>
      {" "}
      <div className="flex items-center gap-1 h-full text-[13.5px] font-medium text-slate-700">
        {" "}
        <span className="font-bold text-[15px] text-slate-800 tracking-tight flex items-center shrink-0 pr-2 pl-4">
          المخزون
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
    return <Link onClick={() => useBreadcrumbStore.getState().reset()} href={item.href || "#"} className={`px-3 flex items-center h-full hover:bg-slate-100 transition-colors ${isActive ? "bg-slate-100 font-bold text-slate-900" : ""}`}>
        {" "}
        {item.title}{" "}
      </Link>;
  }
  return <div className="relative h-full flex items-center" ref={dropdownRef}>
      {" "}
      <button onClick={() => setIsOpen(!isOpen)} className={`px-3 flex items-center gap-1 h-full hover:bg-slate-100 transition-colors ${isOpen ? "bg-slate-100 font-bold text-slate-900" : ""}`}>
        {" "}
        {item.title}{" "}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />{" "}
      </button>{" "}
      {isOpen && <div className="absolute top-10 right-0 mt-0 w-64 bg-white shadow-sm border border-slate-200 rounded-sm py-1 z-50 max-h-[75vh] overflow-y-auto custom-scrollbar">
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
              {section.items.map((sub, idx) => <Link key={idx} href={sub.href} className="block px-4 py-2 hover:bg-slate-100 transition-colors text-right text-sm" onClick={() => {
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