"use client";

import React from "react";
import { OdooTable, OdooColumn, OdooStatusBadge, OdooAvatar } from "@/components/common/OdooTable";
import { formatCurrency, safeNumber } from "@/lib/utils/numberUtils";
interface ProductSalesClientProps {
  lines: any[];
  productName: string;
}
export function ProductSalesClient({
  lines,
  productName
}: ProductSalesClientProps) {
  const columns: OdooColumn<any>[] = [{
    id: "date",
    label: "تاريخ الطلب",
    render: row => new Date(row.order?.dateOrder).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }, {
    id: "reference",
    label: "رقم الأمر",
    render: row => row.order?.name || "-"
  }, {
    id: "salesperson",
    label: "مندوب المبيعات",
    render: row => {
      const name = row.order?.user?.name || "-";
      if (name === "-") return name;
      return <OdooAvatar name={name} color="bg-blue-500" />;
    }
  }, {
    id: "team",
    label: "فريق المبيعات",
    render: row => row.order?.salesTeam?.name || "المبيعات"
  }, {
    id: "qty",
    label: "الكمية",
    render: row => safeNumber(row.quantity),
    align: "center"
  }, {
    id: "total",
    label: "الإجمالي",
    render: row => formatCurrency(row.priceSubtotal),
    align: "right"
  }];
  return <div className="h-[calc(100vh-60px)]">
      {" "}
      <OdooTable data={lines} columns={columns} title={`المنتجات / ${productName} / تحليل المبيعات`} totalCount={lines.length} />{" "}
    </div>;
}