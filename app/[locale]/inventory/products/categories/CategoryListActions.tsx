"use client";

import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocale } from "next-intl";
export function CategoryListActions() {
  const locale = useLocale();
  return <TopPortal>
      {" "}
      <div className="flex items-center gap-2 shrink-0 rtl:flex-row-reverse" dir="rtl">
        {" "}
        <Link href={`/${locale}/inventory/products/categories/new`} className="bg-[#017E84] hover:bg-[#01686c] text-white px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors text-xs font-bold shadow-sm">
          {" "}
          <Plus className="w-3.5 h-3.5" /> جديد{" "}
        </Link>{" "}
      </div>{" "}
    </TopPortal>;
}