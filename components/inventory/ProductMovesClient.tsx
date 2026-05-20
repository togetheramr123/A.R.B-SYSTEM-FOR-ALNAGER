"use client";

import React from "react";
import { OdooTable, OdooColumn, OdooStatusBadge } from "@/components/common/OdooTable";
import { formatCurrency, safeNumber } from "@/lib/utils/numberUtils";
interface ProductMovesClientProps {
  moves: any[];
  productName: string;
}
export function ProductMovesClient({
  moves,
  productName
}: ProductMovesClientProps) {
  const columns: OdooColumn<any>[] = [{
    id: "date",
    label: "التاريخ",
    render: row => new Date(row.date).toLocaleDateString("ar-EG")
  }, {
    id: "reference",
    label: "المرجع",
    render: row => row.picking?.name || row.reference || "-"
  }, {
    id: "product",
    label: "المنتج",
    render: () => productName
  }, {
    id: "source",
    label: "من",
    render: row => row.sourceLocation?.name || "-"
  }, {
    id: "dest",
    label: "إلى",
    render: row => row.destLocation?.name || "-"
  }, {
    id: "quantity",
    label: "الكمية",
    render: row => safeNumber(row.quantity),
    align: "center"
  }, {
    id: "unit",
    label: "الوحدة",
    render: row => row.unitName || "-",
    align: "center"
  }, {
    id: "status",
    label: "الحالة",
    render: row => {
      const statusMap: any = {
        draft: {
          label: "مسودة",
          type: "cancel"
        },
        assigned: {
          label: "متاح",
          type: "draft"
        },
        done: {
          label: "تم الانتهاء",
          type: "done"
        },
        cancel: {
          label: "ملغى",
          type: "cancel"
        }
      };
      const mapped = statusMap[row.status] || {
        label: row.status,
        type: "cancel"
      };
      return <OdooStatusBadge status={mapped.type} label={mapped.label} />;
    },
    align: "center"
  }];
  return <div className="h-[calc(100vh-60px)]">
      {" "}
      <OdooTable data={moves} columns={columns} title={`المنتجات / ${productName} / سجل الحركات`} totalCount={moves.length} />{" "}
    </div>;
}