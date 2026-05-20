"use client";

import { FileText, Truck, Package, DollarSign, ShoppingCart, Users, BarChart2, type LucideIcon } from "lucide-react";
import Link from "next/link";
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Truck,
  Package,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart2
};
interface SmartButtonProps {
  icon: LucideIcon | string;
  label: string;
  count?: number;
  onClick?: () => void;
  href?: string;
  color?: string;
}
export function SmartButton({
  icon,
  label,
  count,
  onClick,
  href
}: SmartButtonProps) {
  const Icon = typeof icon === "string" ? iconMap[icon] || FileText : icon;
  const className = "flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 transition-colors h-[44px] min-w-[120px] max-w-[160px] relative first:rounded-l-sm last:rounded-r-sm -ml-px";
  const content = <>
      {" "}
      <div className="flex-shrink-0 text-slate-600">
        {" "}
        <Icon className="w-5 h-5" />{" "}
      </div>{" "}
      <div className="flex flex-col items-start leading-none overflow-hidden">
        {" "}
        <span className="font-bold text-slate-800 text-[13px] truncate w-full">
          {" "}
          {count ?? 0}{" "}
        </span>{" "}
        <span className="text-[10px] text-slate-500 uppercase font-medium truncate w-full">
          {" "}
          {label}{" "}
        </span>{" "}
      </div>{" "}
    </>;
  if (href) {
    return <Link href={href} className={className}>
        {" "}
        {content}{" "}
      </Link>;
  }
  return <button onClick={onClick} className={className}>
      {" "}
      {content}{" "}
    </button>;
}