"use client";

import React, { useState, useEffect } from "react";
import { AnalysisTable } from "@/components/inventory/AnalysisTable";
import { getProductPurchases } from "@/app/actions/analysis";
export default function PurchaseAnalysisPage({
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
      try {
        const result = await getProductPurchases(params.id);
        if (result) {
          /* @ts-ignore */setData(result.data); /* @ts-ignore setProductName(result.productName); */
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.id]);
  const columns: any[] = [{
    key: "order_ref",
    label: "مرجع الطلب",
    className: "text-blue-600",
    aggregate: "none"
  }, {
    key: "date",
    label: "تاريخ التأكيد",
    render: (val: Date) => val ? new Date(val).toLocaleDateString("en-CA") : "-"
  }, {
    key: "partner_name",
    label: "الشريك",
    aggregate: "none"
  }, {
    key: "quantity",
    label: "إجمالي الكمية",
    align: "left",
    render: (val: number) => val.toFixed(2),
    aggregate: "sum"
  }, {
    key: "price_unit",
    label: "سعر الوحدة",
    align: "left",
    render: (val: number) => val.toFixed(2),
    aggregate: "avg"
  }, {
    key: "price_subtotal",
    label: "الإجمالي",
    align: "left",
    render: (val: number) => val.toFixed(2),
    aggregate: "sum"
  }];
  if (loading) return <div className="p-8 text-center">جاري التحميل...</div>;
  return <AnalysisTable title={`المنتجات / سجل المشتريات`} columns={columns} data={data} />;
}