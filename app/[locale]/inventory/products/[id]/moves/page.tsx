"use client";

import React, { useState, useEffect } from "react";
import { AnalysisTable, FilterOption, GroupByOption } from "@/components/inventory/AnalysisTable";
import { getProductMoves } from "@/app/actions/analysis";
export default function ProductMovesPage({
  params
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const resolvedParams = React.use(params);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
  useEffect(() => {
    const loadData = async () => {
      const result = await getProductMoves(resolvedParams.id);
      if (result) {
        /* @ts-ignore */setData(result.data); /* @ts-ignore setProductName(result.productName); */
      }
      setLoading(false);
    };
    loadData();
  }, [resolvedParams.id]);
  const translateLocation = (val: string) => {
    if (!val) return "-";
    if (val.includes("WH/Stock")) return "المخزن الرئيسي";
    if (val.includes("Customers")) return "العملاء";
    if (val.includes("Vendors")) return "الموردين";
    if (val.includes("Scrap")) return "الخردة";
    if (val.includes("Inventory adjustment")) return "تسويات الجرد";
    if (val.includes("Production")) return "الإنتاج";
    return val;
  };

  const columns: any[] = [{
    key: "date",
    label: "التاريخ",
    render: (val: Date) => val ? new Date(val).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }) : "-"
  }, {
    key: "reference",
    label: "المرجع",
    aggregate: "none"
  }, {
    key: "productName",
    label: "المنتج",
    aggregate: "none"
  }, {
    key: "source",
    label: "من",
    render: (val: string) => translateLocation(val),
    aggregate: "none"
  }, {
    key: "dest",
    label: "إلى",
    render: (val: string) => translateLocation(val),
    aggregate: "none"
  }, {
    key: "quantity",
    label: "الكمية",
    align: "left",
    render: (val: number) => <span className="font-bold text-red-600">{val.toFixed(3)}</span>,
    aggregate: "sum"
  }, {
    key: "unitName",
    label: "الوحدة",
    aggregate: "none"
  }, {
    key: "secQty",
    label: "الكمية الثانوية",
    align: "left",
    render: (val: number) => <span>{val.toFixed(3)}</span>,
    aggregate: "sum"
  }, {
    key: "secUnitName",
    label: "الثانوية UOM",
    aggregate: "none"
  }, {
    key: "status",
    label: "الحالة",
    render: (val: string) => {
      const isDone = val === "done";
      return <span className={`px-2 py-0.5 rounded-sm text-xs font-bold text-white whitespace-nowrap ${isDone ? "bg-[#28a745]" : "bg-slate-400"}`}>
            {" "}
            {isDone ? "تم الانتهاء" : val === "draft" ? "مسودة" : val === "assigned" ? "متاح" : val === "cancel" ? "ملغى" : val}{" "}
          </span>;
    },
    aggregate: "none"
  }];

  const filterOptions: FilterOption[] = [
    {
      id: "status_done",
      label: "تم الانتهاء",
      group: "tasks",
      filterFn: (row: any) => row.status === "done"
    },
    {
      id: "incoming",
      label: "واردة",
      group: "direction",
      filterFn: (row: any) => row.dest === "المخزن الرئيسي" || row.dest === "WH/Stock"
    },
    {
      id: "outgoing",
      label: "الصادرة",
      group: "direction",
      filterFn: (row: any) => row.source === "المخزن الرئيسي" || row.source === "WH/Stock"
    },
    {
      id: "internal",
      label: "داخلي",
      group: "direction",
      filterFn: (row: any) => (row.source === "المخزن الرئيسي" || row.source === "WH/Stock") && (row.dest === "المخزن الرئيسي" || row.dest === "WH/Stock")
    },
    {
      id: "last_30_days",
      label: "آخر 30 يوم",
      group: "date",
      filterFn: (row: any) => {
        if (!row.date) return false;
        const date = new Date(row.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return date >= thirtyDaysAgo;
      }
    },
    {
      id: "last_3_months",
      label: "آخر 3 أشهر",
      group: "date",
      filterFn: (row: any) => {
        if (!row.date) return false;
        const date = new Date(row.date);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return date >= threeMonthsAgo;
      }
    },
    {
      id: "last_12_months",
      label: "آخر 12 شهراً",
      group: "date",
      filterFn: (row: any) => {
        if (!row.date) return false;
        const date = new Date(row.date);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        return date >= twelveMonthsAgo;
      }
    }
  ];

  const groupByOptions: GroupByOption[] = [
    {
      id: "product",
      label: "المنتج",
      groupFn: (row: any) => row.productName || "غير محدد"
    },
    {
      id: "status",
      label: "الحالة",
      groupFn: (row: any) => row.status === "done" ? "تم الانتهاء" : row.status === "draft" ? "مسودة" : row.status === "assigned" ? "متاح" : row.status === "cancel" ? "ملغى" : row.status
    },
    {
      id: "date",
      label: "التاريخ",
      groupFn: (row: any) => {
        if (!row.date) return "غير محدد";
        const d = new Date(row.date);
        return d.toLocaleString("ar-EG", { month: "long", year: "numeric" });
      }
    },
    {
      id: "location",
      label: "الموقع",
      groupFn: (row: any) => translateLocation(row.source)
    }
  ];

  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  return <AnalysisTable 
    title={`المنتجات / سجل الحركات`} 
    columns={columns} 
    data={data} 
    filterOptions={filterOptions}
    groupByOptions={groupByOptions}
  />;
}