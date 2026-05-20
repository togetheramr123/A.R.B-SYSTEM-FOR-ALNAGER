"use client";

import React, { useEffect, useState } from "react";
import { AnalysisTable } from "@/components/inventory/AnalysisTable";
import { getProductSales } from "@/app/actions/analysis";
export default function SalesAnalysisPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
  useEffect(() => {
    const loadData = async () => {
      const result = await getProductSales(params.id);
      if (result) {
        /* @ts-ignore */setData(result.data); /* @ts-ignore setProductName(result.productName); */
      }
      setLoading(false);
    };
    loadData();
  }, [params.id]);
  const columns: any[] = [{
    key: "date",
    label: "تاريخ الطلب",
    render: (val: Date) => val ? new Date(val).toLocaleString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }) : "-"
  }, {
    key: "order_ref",
    label: "رقم الأمر",
    aggregate: "none"
  }, {
    key: "sales_person",
    label: "مندوب المبيعات",
    render: (val: string) => <span className="flex items-center gap-2">
          {" "}
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${val === "Unknown" ? "bg-slate-300" : "bg-[#017E84]"}`}>
            {" "}
            {val.charAt(0)}{" "}
          </span>{" "}
          {val === "Unknown" ? "-" : val}{" "}
        </span>,
    aggregate: "none"
  }, {
    key: "team",
    label: "فريق المبيعات",
    aggregate: "none"
  }, {
    key: "price_subtotal",
    label: "الإجمالي",
    align: "left",
    render: (val: number) => <span dir="ltr" className="font-medium text-slate-800">
          {val.toLocaleString(undefined, {
        minimumFractionDigits: 2
      })}
        </span>,
    aggregate: "sum"
  }];
  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  return <AnalysisTable title={`المنتجات / تحليل المبيعات`} columns={columns} data={data} />;
}