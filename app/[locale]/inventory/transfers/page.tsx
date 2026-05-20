"use client";

import OdooListView from "@/components/common/OdooListView";
import { toast } from "sonner";
export default async function TransfersPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const columns = [{
    key: "reference",
    label: "المرجع",
    width: "w-48"
  }, {
    key: "source",
    label: "المصدر",
    width: "w-48"
  }, {
    key: "destination",
    label: "الوجهة",
    width: "w-48"
  }, {
    key: "status",
    label: "الحالة",
    render: (row: any) => <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.status === "منتهي" ? "bg-green-100 text-green-700" : row.status === "قيد الانتظار" ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-700"}`}>
          {" "}
          {row.status}{" "}
        </span>
  }, {
    key: "date",
    label: "التاريخ المقرر"
  }];
  const data = [{
    id: "1",
    reference: "INT/00001",
    source: "مخزن العبور/Stock",
    destination: "مخزن العبور/Shelf 1",
    status: "منتهي",
    date: "2025/11/01"
  }, {
    id: "2",
    reference: "INT/00002",
    source: "مخزن العبور/Stock",
    destination: "مخزن العبور/Shelf 2",
    status: "قيد الانتظار",
    date: "2025/11/02"
  }, {
    id: "3",
    reference: "INT/00003",
    source: "مخزن العبور/Input",
    destination: "مخزن العبور/Stock",
    status: "مسودة",
    date: "2025/11/05"
  }];
  return <OdooListView title="التحويلات الداخلية" columns={columns} data={data} baseUrl={`/${locale}/inventory/transfers`} />;
}