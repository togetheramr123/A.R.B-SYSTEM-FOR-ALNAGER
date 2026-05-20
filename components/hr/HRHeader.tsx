"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Building2, FileSignature, Receipt, LayoutDashboard } from "lucide-react";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
const navItems = [{
  key: "overview",
  label: "نظرة عامة",
  icon: LayoutDashboard,
  path: ""
}, {
  key: "employees",
  label: "الموظفين",
  icon: Users,
  path: "/employees"
}, {
  key: "departments",
  label: "الأقسام",
  icon: Building2,
  path: "/departments"
}, {
  key: "contracts",
  label: "العقود",
  icon: FileSignature,
  path: "/contracts"
}, {
  key: "payslips",
  label: "كشوف المرتبات",
  icon: Receipt,
  path: "/payslips"
}];
export function HRHeader({
  locale
}: {
  locale: string;
}) {
  const pathname = usePathname();
  const basePath = `/${locale}/hr`;
  return <div className="bg-white border-b border-gray-200 px-6">
      {" "}
      <div className="flex items-center gap-6 overflow-x-auto" style={{
      scrollbarWidth: "none"
    }}>
        {" "}
        {navItems.map(item => {
        const fullPath = `${basePath}${item.path}`;
        const isActive = item.path === "" ? pathname === fullPath : pathname.startsWith(fullPath);
        const Icon = item.icon;
        return <Link onClick={() => useBreadcrumbStore.getState().reset()} key={item.key} href={fullPath} className={cn("flex items-center gap-2 px-1 py-4 text-sm font-semibold border-b-2 transition-all whitespace-nowrap", isActive ? "border-[#017E84] text-[#017E84]" : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300")}>
              {" "}
              <Icon className="w-4 h-4" /> {item.label}{" "}
            </Link>;
      })}{" "}
      </div>{" "}
    </div>;
}