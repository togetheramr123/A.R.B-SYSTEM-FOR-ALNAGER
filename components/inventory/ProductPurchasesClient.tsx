"use client";

import React from "react";
import { OdooTable, OdooColumn, OdooAvatar } from "@/components/common/OdooTable";
import { formatCurrency, safeNumber } from "@/lib/utils/numberUtils";
interface ProductPurchasesClientProps {
  lines: any[];
  productName: string;
}
export function ProductPurchasesClient({
  lines,
  productName
}: ProductPurchasesClientProps) {
  const columns: OdooColumn<any>[] = [{
    id: "reference",
    label: "مرجع الطلب",
    render: row => row.order?.name || "-"
  }, {
    id: "date",
    label: "تاريخ التأكيد",
    render: row => new Date(row.order?.dateOrder).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }, {
    id: "partner",
    label: "الشريك",
    render: row => row.order?.partner?.name || "-"
  }, {
    id: "qty",
    label: "إجمالي الكمية",
    render: row => safeNumber(row.quantity),
    align: "center"
  }, {
    id: "price",
    label: "سعر الوحدة",
    render: row => formatCurrency(row.priceUnit),
    align: "right"
  }];
  return <div className="h-[calc(100vh-60px)]">
      {" "}
      <OdooTable data={lines} columns={columns} title={`المنتجات / ${productName} / سجل المشتريات`} totalCount={lines.length} />{" "}
    </div>;
}