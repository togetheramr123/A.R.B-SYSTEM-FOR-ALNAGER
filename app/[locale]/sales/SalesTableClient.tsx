"use client";

import { OdooTable, OdooColumn, OdooStatusBadge } from "@/components/common/OdooTable";
import { ShoppingBag, Plus } from "lucide-react";
import Link from "next/link";
interface SalesTableClientProps {
  orders: any[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  searchQuery: string;
  baseUrl: string;
  locale: string;
  pageTitle?: string;
  activeFilter?: string;
  isManager: boolean;
  metrics: {
    invoicedThisMonth: number;
    invoicedLastMonth: number;
    waitingApproval: number;
    waitingReceipt: number;
    waitingBill: number;
  };
}
export function SalesTableClient({
  orders,
  currentPage,
  pageSize,
  totalCount,
  searchQuery,
  baseUrl,
  locale,
  pageTitle,
  activeFilter,
  isManager,
  metrics
}: SalesTableClientProps) {
  const columns: OdooColumn[] = [{
    id: "name",
    label: "المرجع",
    render: row => <div className="flex items-center gap-2">
          {" "}
          <ShoppingBag className="w-4 h-4 text-gray-400 opacity-40" />{" "}
          <span className="font-bold text-blue-600 text-sm">{row.name}</span>{" "}
          {row.source === "portal" && <span className="bg-[#714B67] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              {" "}
              📱 بوابة{" "}
            </span>}{" "}
        </div>
  }, {
    id: "dateOrder",
    label: "تاريخ الطلب",
    render: row => <span className="text-gray-500 text-sm">
          {" "}
          {new Date(row.dateOrder).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).split("/").reverse().join("/")}{" "}
        </span>
  }, {
    id: "partner",
    label: "العميل",
    render: row => <span className="text-gray-800 text-sm font-medium">
          {row.partner?.name || "-"}
        </span>
  }, {
    id: "salesperson",
    label: "مندوب المبيعات",
    render: row => <span className="text-gray-800 text-sm flex items-center gap-1">
          مدير النظام{" "}
          <span className="bg-red-500 w-4 h-4 rounded-full text-[8px] text-white flex items-center justify-center">
            M
          </span>
        </span>
  }, {
    id: "amountTotal",
    label: "الإجمالي",
    render: row => <span className="font-bold text-gray-900 text-sm">
          {" "}
          {Number(row.amountTotal || 0).toLocaleString("en-US")}{" "}
          <span className="text-[10px] text-gray-400">ج.م</span>{" "}
        </span>
  }, {
    id: "status",
    label: "الحالة",
    render: row => {
      let badgeStatus: "draft" | "sale" | "cancel" | "done" = "draft";
      let label = "عرض سعر";
      if (row.status === "sale") {
        badgeStatus = "sale";
        label = "طلب بيع";
      }
      if (row.status === "done") {
        badgeStatus = "done";
        label = "مقفل";
      }
      if (row.status === "cancel") {
        badgeStatus = "cancel";
        label = "ملغي";
      }
      if (row.status === "sent") {
        badgeStatus = "draft";
        label = "تم الإرسال";
      }
      return <OdooStatusBadge status={badgeStatus} label={label} />;
    }
  }];
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-0 min-h-[calc(100vh-80px)]">
      {/* KPI Cards - Odoo style */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-stretch gap-0 divide-x divide-x-reverse divide-gray-200 h-[60px]">
          
          {isManager && (
            <div className="flex-1 px-4 text-center border-l border-gray-200">
              <div className="flex items-center justify-center gap-4 h-full">
                <div>
                  <div className="text-xl font-bold text-gray-900">{fmt(metrics.invoicedThisMonth)} LE</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">مبيعات الفوترة للشهر هذا</div>
                </div>
                <div className="w-px h-8 bg-gray-200"></div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{fmt(metrics.invoicedLastMonth)} LE</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">الشهر الذي قبله</div>
                </div>
              </div>
            </div>
          )}

          <Link href={`${baseUrl}/orders?filter=approval`}
            className={`flex-1 px-4 py-2 text-center flex flex-col justify-center cursor-pointer transition-colors ${activeFilter === 'approval' ? 'bg-[#714B67]/10 border-b-2 border-[#714B67]' : 'hover:bg-gray-50'}`}>
            <div className="text-2xl font-bold text-gray-900 leading-none">{metrics.waitingApproval}</div>
            <div className="text-xs text-gray-600 mt-1">بانتظار تصديق عرض السعر</div>
          </Link>

          <Link href={`${baseUrl}/orders?filter=receipt`}
            className={`flex-1 px-4 py-2 text-center flex flex-col justify-center cursor-pointer transition-colors ${activeFilter === 'receipt' ? 'bg-[#714B67]/10 border-b-2 border-[#714B67]' : 'hover:bg-gray-50'}`}>
            <div className="text-2xl font-bold text-gray-900 leading-none">{metrics.waitingReceipt}</div>
            <div className="text-xs text-gray-600 mt-1">بانتظار ارسال للمخزن</div>
          </Link>

          <Link href={`${baseUrl}/orders?filter=invoice`}
            className={`flex-1 px-4 py-2 text-center flex flex-col justify-center cursor-pointer transition-colors ${activeFilter === 'invoice' ? 'bg-[#714B67]/10 border-b-2 border-[#714B67]' : 'hover:bg-gray-50'}`}>
            <div className="text-2xl font-bold text-gray-900 leading-none">{metrics.waitingBill}</div>
            <div className="text-xs text-gray-600 mt-1">بانتظار انشاء الفوترة</div>
          </Link>

        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col mt-2 mb-4">
        <OdooTable 
          title={pageTitle || "طلبات البيع"} 
          actions={
            <Link href={`${baseUrl}/new`} className="bg-[#714B67] hover:bg-[#5a3c52] text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors text-sm font-bold shadow-sm">
              <Plus className="w-4 h-4" /> جديد
            </Link>
          } 
          columns={columns} 
          data={orders} 
          totalCount={totalCount} 
          baseUrl={baseUrl} 
          searchQuery={searchQuery} 
          modelName="saleOrder" 
        />
      </div>
    </div>
  );
}