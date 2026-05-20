"use client";

import { OdooTable, OdooColumn, OdooStatusBadge, OdooAvatar, OdooActivityIcon } from "@/components/common/OdooTable";
import { OdooStatsPanel } from "@/components/common/OdooStatsPanel";
import Link from "next/link";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";
interface PurchasesListProps {
  data: any[];
  totalCount: number;
  locale: string;
}
export default function PurchasesList({
  data,
  totalCount,
  locale
}: PurchasesListProps) {
  const router = useRouter();
  const columns: OdooColumn[] = [{
    id: "name",
    label: "المرجع",
    width: "150px",
    render: row => <div className="flex items-center justify-end gap-2">
          {" "}
          <Star className={`w-4 h-4 ${row.star ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}`} />{" "}
          <Link href={`/${locale}/purchases/${row.id}`} className="font-bold text-gray-800 hover:text-sky-600">
            {" "}
            {row.name}{" "}
          </Link>{" "}
        </div>
  }, {
    id: "partnerName",
    label: "المورد",
    width: "250px",
    render: row => row.partner?.name || "-"
  }, {
    id: "buyer",
    label: "المشتري",
    width: "120px",
    render: row => <OdooAvatar name={row.user?.name || "Admin"} color="bg-green-500" />
  }, {
    id: "dateOrder",
    label: "تاريخ الطلب",
    width: "150px",
    align: "center",
    render: row => new Date(row.dateOrder).toLocaleDateString()
  }, {
    id: "source",
    label: "المستند المصدر",
    width: "120px",
    render: row => row.origin || "-"
  }, {
    id: "amountTotal",
    label: "الإجمالي",
    width: "120px",
    align: "left",
    render: row => <span className="font-bold">
          {row.amountTotal.toLocaleString(undefined, {
        minimumFractionDigits: 2
      })}
        </span>
  }, {
    id: "status",
    label: "الحالة",
    width: "120px",
    align: "center",
    render: row => <OdooStatusBadge status={row.status} label={row.status === "draft" ? "طلب عرض سعر" : row.status === "sent" ? "تم الإرسال" : row.status === "purchase" ? "أمر شراء" : row.status} />
  }];
  const actions = <Link href={`/${locale}/purchases/new`}>
      {" "}
      <button className="bg-[#017E84] hover:bg-[#015e63] text-white px-4 py-1.5 rounded shadow-sm text-sm font-medium">
        {" "}
        جديد{" "}
      </button>{" "}
    </Link>;
  return <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col bg-slate-50">
      {" "}
      <OdooTable title="طلبات عروض الأسعار" data={data} columns={columns} totalCount={totalCount} actions={actions} />{" "}
      <div className="order-first">
        {" "}
        <OdooStatsPanel />{" "}
      </div>{" "}
    </div>;
}