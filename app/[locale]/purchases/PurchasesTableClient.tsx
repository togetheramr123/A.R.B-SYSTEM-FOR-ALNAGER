"use client";

import { OdooTable, OdooColumn, OdooStatusBadge } from "@/components/common/OdooTable";
import { Truck, Plus, Star, Clock, TrendingUp, ShoppingCart, Calendar as CalendarIcon, BarChart3, Table2, LayoutGrid, ChevronDown, Download, Printer, Settings } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PurchasesTableClientProps {
  orders: any[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  searchQuery: string;
  baseUrl: string;
  locale: string;
  pageTitle?: string;
  activeFilter?: string;
  metrics: {
    invoicedThisMonth: number;
    invoicedLastMonth: number;
    waitingApproval: number;
    waitingReceipt: number;
    waitingBill: number;
  };
  filteredTotal?: number;
}

export function PurchasesTableClient({
  orders, currentPage, pageSize, totalCount, searchQuery,
  baseUrl, locale, pageTitle, activeFilter, metrics, filteredTotal
}: PurchasesTableClientProps) {
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    name: true, partner: true, buyer: true, deadline: true,
    activities: true, origin: true, amountTotal: true, status: true
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = () => {
      setColMenuOpen(false);
      setActionMenuOpen(false);
    };
    if (colMenuOpen || actionMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [colMenuOpen, actionMenuOpen]);

  const allColumns: { id: string; label: string }[] = [
    { id: "name", label: "المرجع" },
    { id: "partner", label: "المورد" },
    { id: "buyer", label: "المشتري" },
    { id: "deadline", label: "الموعد النهائي للطلب" },
    { id: "activities", label: "الأنشطة" },
    { id: "origin", label: "المستند المصدر" },
    { id: "amountTotal", label: "الإجمالي" },
    { id: "status", label: "الحالة" },
  ];

  const columns: OdooColumn[] = [
    ...(visibleCols.name ? [{
      id: "name", label: "المرجع",
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-gray-300 hover:text-yellow-400 cursor-pointer" />
          <span className="font-bold text-[#017E84] text-[13px]">{row.name}</span>
        </div>
      )
    }] : []),
    ...(visibleCols.partner ? [{
      id: "partner", label: "المورد",
      render: (row: any) => <span className="text-gray-800 text-[13px]">{row.partner?.name || "-"}</span>
    }] : []),
    ...(visibleCols.buyer ? [{
      id: "buyer", label: "المشتري",
      render: (row: any) => (
        <span className="text-gray-800 text-[13px] flex items-center gap-1">
          <span className="bg-[#714B67] w-5 h-5 rounded-full text-[9px] text-white flex items-center justify-center font-bold">ع</span>
          عبدالعزيز
        </span>
      )
    }] : []),
    ...(visibleCols.deadline ? [{
      id: "deadline", label: "الموعد النهائي للطلب",
      render: (row: any) => <span className="text-gray-500 text-[13px]">{row.dateOrder ? new Date(row.dateOrder).toLocaleDateString("en-GB").split("/").reverse().join("/") : "-"}</span>
    }] : []),
    ...(visibleCols.activities ? [{
      id: "activities", label: "الأنشطة",
      render: () => <Clock className="w-4 h-4 text-gray-400 mx-auto" />
    }] : []),
    ...(visibleCols.origin ? [{
      id: "origin", label: "المستند المصدر",
      render: (row: any) => <span className="text-gray-500 text-[13px]">{row.origin || "-"}</span>
    }] : []),
    ...(visibleCols.amountTotal ? [{
      id: "amountTotal", label: "الإجمالي",
      render: (row: any) => (
        <span className="font-bold text-gray-900 text-[13px]">
          {Number(row.amountTotal || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })} LE
        </span>
      )
    }] : []),
    ...(visibleCols.status ? [{
      id: "status", label: "الحالة",
      render: (row: any) => {
        const map: Record<string, { s: "draft"|"sale"|"cancel"|"done"; l: string }> = {
          draft: { s: "draft", l: "طلب عرض سعر" },
          sent: { s: "draft", l: "تم الإرسال" },
          purchase: { s: "sale", l: "أمر شراء" },
          done: { s: "done", l: "مقفل" },
          cancel: { s: "cancel", l: "ملغي" },
        };
        const cfg = map[row.status] || map.draft;
        return <OdooStatusBadge status={cfg.s} label={cfg.l} />;
      }
    }] : []),
  ];

  // Column visibility toggle button (settings icon in header)
  const colVisibilityMenu = (
    <div className="relative inline-block z-[100]">
      <div onClick={(e) => { e.stopPropagation(); setColMenuOpen(!colMenuOpen); }} className="cursor-pointer text-gray-400 hover:text-black flex justify-center items-center p-1" title="إعدادات الأعمدة">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
      </div>
      {colMenuOpen && (
        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded shadow-sm z-50 py-2 w-56" onClick={e => e.stopPropagation()}>
          {allColumns.map(c => (
            <label key={c.id} className="flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 cursor-pointer text-[13px] text-gray-700">
              <input type="checkbox" checked={visibleCols[c.id]} onChange={() => setVisibleCols(p => ({ ...p, [c.id]: !p[c.id] }))}
                className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84]" />
              {c.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  // Predefined filters for OdooTable
  const predefinedFilters = [
    { group: "personal", items: [
      { label: "مشترياتي", value: "mine" },
      { label: "معلم بنجمة", value: "starred" },
    ]},
    { group: "type", items: [
      { label: "طلبات عروض الأسعار", value: "rfq" },
      { label: "أوامر الشراء", value: "po" },
    ]},
    { group: "date", items: [
      { label: "مسودات طلبات عروض الأسعار", value: "draft" },
      { label: "بانتظار الإرسال", value: "sent" },
      { label: "طلبات متأخرة", value: "late" },
    ]},
  ];

  // Graph data
  const graphData = useMemo(() => {
    const byVendor: Record<string, number> = {};
    orders.forEach(o => {
      const name = o.partner?.name || "غير محدد";
      byVendor[name] = (byVendor[name] || 0) + Number(o.amountTotal || 0);
    });
    return Object.entries(byVendor).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);
  }, [orders]);

  // Pivot data
  const pivotData = useMemo(() => {
    const byVendor: Record<string, { count: number; total: number }> = {};
    orders.forEach(o => {
      const name = o.partner?.name || "غير محدد";
      if (!byVendor[name]) byVendor[name] = { count: 0, total: 0 };
      byVendor[name].count++;
      byVendor[name].total += Number(o.amountTotal || 0);
    });
    return Object.entries(byVendor).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.total - a.total);
  }, [orders]);

  const pivotGrandTotal = pivotData.reduce((s, r) => s + r.total, 0);
  const pivotGrandCount = pivotData.reduce((s, r) => s + r.count, 0);

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col gap-0 min-h-[calc(100vh-80px)]">
      {/* KPI Cards - Odoo style */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-stretch gap-0 divide-x divide-x-reverse divide-gray-200 h-[60px]">
          
          <div className="flex-1 px-4 text-center border-l border-gray-200">
            <div className="flex items-center justify-center gap-4 h-full">
              <div>
                <div className="text-xl font-bold text-gray-900">{fmt(metrics.invoicedThisMonth)} LE</div>
                <div className="text-[10px] text-gray-500 mt-0.5">مشتريات الفوترة للشهر هذا</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div>
                <div className="text-xl font-bold text-gray-900">{fmt(metrics.invoicedLastMonth)} LE</div>
                <div className="text-[10px] text-gray-500 mt-0.5">الشهر الذي قبله</div>
              </div>
            </div>
          </div>

          <Link href={`${baseUrl}/orders?filter=approval`}
            className={`flex-1 px-4 py-2 text-center flex flex-col justify-center cursor-pointer transition-colors ${activeFilter === 'approval' ? 'bg-blue-50 border-b-2 border-blue-500' : 'hover:bg-gray-50'}`}>
            <div className="text-2xl font-bold text-gray-900 leading-none">{metrics.waitingApproval}</div>
            <div className="text-xs text-gray-600 mt-1">بانتظار تصديق عرض السعر</div>
          </Link>

          <Link href={`${baseUrl}/orders?filter=receipt`}
            className={`flex-1 px-4 py-2 text-center flex flex-col justify-center cursor-pointer transition-colors ${activeFilter === 'receipt' ? 'bg-blue-50 border-b-2 border-blue-500' : 'hover:bg-gray-50'}`}>
            <div className="text-2xl font-bold text-gray-900 leading-none">{metrics.waitingReceipt}</div>
            <div className="text-xs text-gray-600 mt-1">بانتظار ارسال للمخزن</div>
          </Link>

          <Link href={`${baseUrl}/orders?filter=invoice`}
            className={`flex-1 px-4 py-2 text-center flex flex-col justify-center cursor-pointer transition-colors ${activeFilter === 'invoice' ? 'bg-blue-50 border-b-2 border-blue-500' : 'hover:bg-gray-50'}`}>
            <div className="text-2xl font-bold text-gray-900 leading-none">{metrics.waitingBill}</div>
            <div className="text-xs text-gray-600 mt-1">بانتظار انشاء الفوترة</div>
          </Link>

        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex flex-col mt-2 mb-4">
        <OdooTable
          title={pageTitle || "طلبات المشتريات"}
          actions={
            <div className="flex items-center gap-2">
              <Link href={`${baseUrl}/new`} className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1.5 rounded transition-colors text-sm font-bold shadow-sm">
                جديد
              </Link>
              <button className="text-gray-500 hover:text-gray-800 p-1.5 rounded transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          }
          tableHeaderAction={colVisibilityMenu}
          filters={predefinedFilters}
          renderBulkActions={(selectedIds) => (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                   const link = document.createElement("a");
                   link.href = "data:text/plain;charset=utf-8,Mock Download";
                   link.download = `quotations_${selectedIds.length}.pdf`;
                   link.click();
                }}
                className="flex items-center gap-1 text-gray-700 hover:text-black transition-colors px-2 py-1 text-sm font-bold"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
              
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActionMenuOpen(!actionMenuOpen); }}
                  className="flex items-center gap-1 text-gray-700 hover:text-black transition-colors px-2 py-1 text-sm font-bold"
                >
                  <Settings className="w-4 h-4" />
                  <span>إجراء</span>
                </button>
                
                {actionMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded shadow-md border border-gray-200 py-1 z-50" onClick={e => e.stopPropagation()}>
                    <button className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm text-gray-700">تصدير</button>
                    <button className="w-full text-right px-4 py-2 hover:bg-gray-50 text-sm text-red-600">حذف</button>
                  </div>
                )}
              </div>
            </div>
          )}
          columns={columns}
          data={orders}
          totalCount={totalCount}
          baseUrl={baseUrl}
          searchQuery={searchQuery}
          modelName="purchaseOrder"
          kanbanView={
            <div className="p-4 bg-gray-50 h-full overflow-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map(order => {
                  const statusMap: Record<string, { color: string; label: string }> = {
                    draft: { color: "bg-gray-100 text-gray-700", label: "طلب عرض سعر" },
                    sent: { color: "bg-blue-100 text-blue-700", label: "تم الإرسال" },
                    purchase: { color: "bg-green-100 text-green-800", label: "أمر شراء" },
                    done: { color: "bg-slate-200 text-slate-700", label: "مقفل" },
                    cancel: { color: "bg-red-100 text-red-600", label: "ملغي" },
                  };
                  const st = statusMap[order.status] || statusMap.draft;
                  return (
                    <Link key={order.id} href={`${baseUrl}/${order.id}`}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-[13px] font-bold text-[#017E84]">{order.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.dateOrder).toLocaleDateString("ar-EG")}
                          </div>
                        </div>
                        <Star className="w-4 h-4 text-gray-300 group-hover:text-yellow-400" />
                      </div>
                      <div className="text-sm font-medium text-gray-800 mb-1">
                        {order.partner?.name || "-"}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.color}`}>{st.label}</span>
                        <span className="font-bold text-gray-900 text-sm">{fmt(Number(order.amountTotal || 0))} LE</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          }
          pivotView={
            <div className="p-4 bg-white h-full overflow-auto">
              <table className="w-full text-right text-[13px] border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="p-3 text-right font-bold text-gray-700"></th>
                    <th className="p-3 text-center font-bold text-gray-700" colSpan={2}>
                      <div className="flex items-center justify-center gap-1">
                        <span>➕</span> الإجمالي
                      </div>
                    </th>
                  </tr>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-2 text-right text-gray-600"></th>
                    <th className="p-2 text-center text-gray-600">التعداد</th>
                    <th className="p-2 text-center text-gray-600">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50 font-bold border-b-2 border-gray-300">
                    <td className="p-2 text-right">⊟ الإجمالي</td>
                    <td className="p-2 text-center">{pivotGrandCount}</td>
                    <td className="p-2 text-center">{fmt(pivotGrandTotal)}</td>
                  </tr>
                  {pivotData.map((row, i) => (
                    <tr key={i} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-right pr-6">
                        <span className="text-[#017E84] cursor-pointer">➕</span> {row.name}
                      </td>
                      <td className="p-2 text-center">{row.count}</td>
                      <td className="p-2 text-center">{fmt(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
          graphView={
            <div className="p-4 bg-white h-full overflow-auto">
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                <span className="inline-block w-4 h-3 bg-[#017E84] rounded-sm"></span> الإجمالي
              </div>
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer>
                  <BarChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : String(v)} />
                    <Tooltip formatter={(v: number) => [fmt(v) + " LE", "الإجمالي"]} />
                    <Bar dataKey="total" fill="#017E84" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          }
        />
        {/* Footer total */}
        {filteredTotal !== undefined && filteredTotal > 0 && (
          <div className="bg-gray-50 px-8 py-2 text-sm font-bold text-gray-800 flex justify-end border-t border-gray-200">
            <span>{fmt(filteredTotal)} LE</span>
          </div>
        )}
      </div>
    </div>
  );
}