"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
interface BreadcrumbItem {
  label: string;
  href?: string;
}
interface BreadcrumbProps {
  items: BreadcrumbItem[];
}
export function Breadcrumb({
  items
}: BreadcrumbProps) {
  return <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
      {" "}
      {items.map((item, index) => <div key={index} className="flex items-center gap-2">
          {" "}
          {index > 0 && <ChevronLeft className="w-4 h-4" />}{" "}
          {item.href ? <Link href={item.href} className="hover:text-blue-600 transition-colors">
              {" "}
              {item.label}{" "}
            </Link> : <span className="font-medium text-slate-800">{item.label}</span>}{" "}
        </div>)}{" "}
    </nav>;
}