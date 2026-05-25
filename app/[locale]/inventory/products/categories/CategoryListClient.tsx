"use client";

import React from "react";
import Link from "next/link";
import { OdooTable, OdooColumn } from "@/components/common/OdooTable";
import { Plus } from "lucide-react";

interface CategoryListClientProps {
  categories: any[];
  locale: string;
}

export function CategoryListClient({ categories, locale }: CategoryListClientProps) {
  const costingLabels: Record<string, string> = {
    standard: "السعر القياسي",
    fifo: "FIFO",
    avco: "متوسط التكلفة (AVCO)"
  };
  const valuationLabels: Record<string, string> = {
    manual_periodic: "يدوي (دوري)",
    real_time: "آلي (مؤتمت)"
  };

  const columns: OdooColumn[] = [
    {
      id: "name",
      label: "اسم الفئة",
      render: (row) => (
        <Link href={`/${locale}/inventory/products/categories/${row.id}`} className="font-semibold text-gray-900 hover:text-[#017E84] transition-colors block w-full font-arabic">
          {row.name}
        </Link>
      )
    },
    {
      id: "parent",
      label: "الفئة الأم",
      render: (row) => <span className="font-arabic">{row.parent?.name || ""}</span>
    },
    {
      id: "costingMethod",
      label: "طريقة التكلفة",
      render: (row) => <span className="font-arabic">{costingLabels[row.costingMethod] || row.costingMethod}</span>
    },
    {
      id: "valuation",
      label: "تقييم المخزون",
      render: (row) => <span className="font-arabic">{valuationLabels[row.valuation] || row.valuation}</span>
    },
    {
      id: "products",
      label: "المنتجات",
      align: "center",
      render: (row) => <span className="font-arabic">{row._count.products > 0 ? row._count.products : ""}</span>
    }
  ];

  return (
    <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden min-h-[calc(100vh-140px)]">
      <OdooTable
        title="فئات المنتجات"
        columns={columns}
        data={categories}
        modelName="productCategory"
        currentPage={1}
        pageSize={100}
        totalCount={categories.length}
        actions={
          <Link
            href={`/${locale}/inventory/products/categories/new`}
            className="bg-[#017E84] hover:bg-[#01686c] text-white px-3 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors text-xs font-bold shadow-sm font-arabic"
          >
            <Plus className="w-3.5 h-3.5" /> جديد
          </Link>
        }
      />
    </div>
  );
}
