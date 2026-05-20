import { getSession } from "@/lib/auth";
import Link from "next/link";
import { Plus, Search, FileText, ChevronLeft, ChevronRight, Filter, Upload } from "lucide-react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { serializeDecimal } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import InvoiceFilters from "@/components/accounting/InvoiceFilters";
export default async function BillsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    state?: string;
    payment?: string;
    overdue?: string;
    group?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const sp = await props.searchParams;
  const currentPage = parseInt(sp.page || "1");
  const pageSize = 30;
  const skip = (currentPage - 1) * pageSize;
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) redirect(`/${locale}`); // Build WHERE clause
  const where: any = {
    companyId,
    type: "in_invoice"
  };
  if (sp.search) {
    where.OR = [{
      name: {
        contains: sp.search
      }
    }, {
      partner: {
        name: {
          contains: sp.search
        }
      }
    }, {
      invoiceOrigin: {
        contains: sp.search
      }
    }];
  } // State filter (supports multi-select: "draft,posted");
  const stateValues = (sp.state || "").split(",").filter(Boolean);
  if (stateValues.length === 1) {
    where.state = stateValues[0];
  } else if (stateValues.length > 1) {
    where.state = {
      in: stateValues
    };
  } // Payment status filter (supports multi-select);
  const paymentValues = (sp.payment || "").split(",").filter(Boolean);
  if (paymentValues.length > 0) {
    const paymentConditions: any[] = [];
    if (paymentValues.includes("not_paid")) {
      paymentConditions.push({
        state: "posted",
        amountResidual: {
          gt: 0
        }
      });
    }
    if (paymentValues.includes("paid")) {
      paymentConditions.push({
        state: "posted",
        amountResidual: {
          lte: 0
        }
      });
    }
    if (paymentConditions.length === 1) {
      Object.assign(where, paymentConditions[0]);
    } else if (paymentConditions.length > 1) {
      where.OR = [...(where.OR || []), ...paymentConditions];
    }
  }
  if (sp.overdue === "true") {
    where.state = "posted";
    where.dateDue = {
      lt: new Date()
    };
    where.amountResidual = {
      gt: 0
    };
  }
  const [bills, totalCount] = await Promise.all([prisma.invoice.findMany({
    where,
    include: {
      partner: true
    },
    orderBy: {
      dateInvoice: "desc"
    },
    skip,
    take: pageSize
  }), prisma.invoice.count({
    where
  })]);
  const totalPages = Math.ceil(totalCount / pageSize);
  const serializedBills = serializeDecimal(bills); // Counts for filter badges
  const [draftCount, postedCount, cancelCount, notPaidCount, paidCount, overdueCount] = await Promise.all([prisma.invoice.count({
    where: {
      companyId,
      type: "in_invoice",
      state: "draft"
    }
  }), prisma.invoice.count({
    where: {
      companyId,
      type: "in_invoice",
      state: "posted"
    }
  }), prisma.invoice.count({
    where: {
      companyId,
      type: "in_invoice",
      state: "cancel"
    }
  }), prisma.invoice.count({
    where: {
      companyId,
      type: "in_invoice",
      state: "posted",
      amountResidual: {
        gt: 0
      }
    }
  }), prisma.invoice.count({
    where: {
      companyId,
      type: "in_invoice",
      state: "posted",
      amountResidual: {
        lte: 0
      }
    }
  }), prisma.invoice.count({
    where: {
      companyId,
      type: "in_invoice",
      state: "posted",
      dateDue: {
        lt: new Date()
      },
      amountResidual: {
        gt: 0
      }
    }
  })]);
  const filterCounts = {
    draft: draftCount,
    posted: postedCount,
    cancel: cancelCount,
    not_paid: notPaidCount,
    paid: paidCount,
    overdue: overdueCount
  };
  const getPaymentStatus = (inv: any) => {
    if (inv.state === "paid") return {
      label: "مدفوع",
      className: "bg-teal-50 text-emerald-700 border-emerald-200"
    };
    if (inv.state === "posted" && Number(inv.amountResidual || 0) === 0) return {
      label: "مدفوع",
      className: "bg-teal-50 text-emerald-700 border-emerald-200"
    };
    if (inv.state === "posted" && Number(inv.amountResidual || 0) < Number(inv.amountTotal || 0) && Number(inv.amountResidual || 0) > 0) return {
      label: "جزئي",
      className: "bg-amber-100 text-amber-700 border-amber-200"
    };
    if (inv.state === "posted") return {
      label: "غير مسدد",
      className: "bg-red-100 text-red-700 border-red-200"
    };
    return {
      label: "",
      className: ""
    };
  };
  const getStateLabel = (state: string) => {
    switch (state) {
      case "posted":
        return {
          label: "تم الترحيل",
          className: "bg-emerald-50 text-emerald-700 border-emerald-100"
        };
      case "paid":
        return {
          label: "تم الترحيل",
          className: "bg-emerald-50 text-emerald-700 border-emerald-100"
        };
      case "draft":
        return {
          label: "مسودة",
          className: "bg-gray-100 text-gray-600 border-gray-200"
        };
      case "cancel":
        return {
          label: "ملغية",
          className: "bg-red-50 text-red-600 border-red-100"
        };
      default:
        return {
          label: state,
          className: "bg-gray-100 text-gray-600 border-gray-200"
        };
    }
  };
  const formatDate = (d: any) => {
    if (!d) return "-";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };
  const isOverdue = (inv: any) => {
    if (!inv.dateDue || inv.state === "paid") return false;
    return new Date(inv.dateDue) < new Date() && Number(inv.amountResidual || 0) > 0;
  };
  const startRecord = skip + 1;
  const endRecord = Math.min(skip + pageSize, totalCount);
  const buildUrl = (params: any) => {
    const queryParts: string[] = [];
    Object.entries(params).forEach(([k, v]) => {
      if (v) queryParts.push(`${k}=${v}`);
    });
    return `/${locale}/accounting/bills${queryParts.length ? "?" + queryParts.join("&") : ""}`;
  };
  return <div className="p-6 space-y-4">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-xl font-bold text-gray-900">
          الفواتير (الموردين)
        </h1>{" "}
        <div className="flex gap-3 items-center">
          {" "}
          <span className="text-sm text-gray-500 font-medium font-numbers">
            {" "}
            {totalCount > 0 ? `${startRecord}-${endRecord} / ${totalCount}` : "0"}{" "}
          </span>{" "}
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg">
            {" "}
            {currentPage > 1 && <Link href={buildUrl({
            ...sp,
            page: currentPage - 1
          })} className="p-1.5 hover:bg-gray-100">
                {" "}
                <ChevronRight className="w-4 h-4 text-gray-500" />{" "}
              </Link>}{" "}
            {currentPage < totalPages && <Link href={buildUrl({
            ...sp,
            page: currentPage + 1
          })} className="p-1.5 hover:bg-gray-100">
                {" "}
                <ChevronLeft className="w-4 h-4 text-gray-500" />{" "}
              </Link>}{" "}
          </div>{" "}
          <Link href={`/${locale}/accounting/bills/create`} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm transition-colors">
            {" "}
            <Plus className="w-4 h-4" /> جديد{" "}
          </Link>{" "}
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
            {" "}
            <Upload className="w-4 h-4" /> رفع{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Filters */}{" "}
      <InvoiceFilters locale={locale} currentFilters={sp} filterCounts={filterCounts} basePath={`/${locale}/accounting/bills`} />{" "}
      {/* Table */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider">
              {" "}
              <tr>
                {" "}
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>{" "}
                <th className="px-4 py-3">العدد</th>{" "}
                <th className="px-4 py-3">المورد</th>{" "}
                <th className="px-4 py-3">تاريخ الفاتورة</th>{" "}
                <th className="px-4 py-3">تاريخ الاستحقاق</th>{" "}
                <th className="px-4 py-3">المرجع</th>{" "}
                <th className="px-4 py-3">الإجمالي</th>{" "}
                <th className="px-4 py-3">حالة الدفع</th>{" "}
                <th className="px-4 py-3">الحالة</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {serializedBills.map((bill: any) => {
              const payStatus = getPaymentStatus(bill);
              const stateInfo = getStateLabel(bill.state);
              const overdue = isOverdue(bill);
              return <tr key={bill.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer group">
                    {" "}
                    <td className="px-4 py-3">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </td>{" "}
                    <td className="px-4 py-3 font-bold text-blue-600 text-sm whitespace-nowrap">
                      {" "}
                      <Link href={`/${locale}/accounting/bills/${bill.id}`} className="flex items-center gap-1.5 hover:underline">
                        {" "}
                        <FileText className="w-3.5 h-3.5 opacity-40" />{" "}
                        {bill.name}{" "}
                      </Link>{" "}
                    </td>{" "}
                    <td className="px-4 py-3 text-gray-800 text-sm font-medium">
                      {bill.partner?.name || "-"}
                    </td>{" "}
                    <td className="px-4 py-3 text-gray-500 text-sm font-numbers">
                      {formatDate(bill.dateInvoice)}
                    </td>{" "}
                    <td className={cn("px-4 py-3 text-sm font-numbers", overdue ? "text-red-600 font-bold" : "text-gray-500")}>
                      {" "}
                      {formatDate(bill.dateDue)}{" "}
                      {overdue && <span className="text-red-500 text-[9px] mr-1 font-bold">
                          متأخر
                        </span>}{" "}
                    </td>{" "}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {bill.invoiceOrigin || bill.paymentReference || "-"}
                    </td>{" "}
                    <td className="px-4 py-3 font-bold text-gray-900 text-sm font-numbers">
                      {" "}
                      {Number(bill.amountTotal || 0).toLocaleString("en-US")}{" "}
                      <span className="text-[10px] text-gray-400">
                        ج.م
                      </span>{" "}
                    </td>{" "}
                    <td className="px-4 py-3">
                      {" "}
                      {payStatus.label && <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", payStatus.className)}>
                          {" "}
                          {payStatus.label}{" "}
                        </span>}{" "}
                    </td>{" "}
                    <td className="px-4 py-3">
                      {" "}
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border", stateInfo.className)}>
                        {" "}
                        {stateInfo.label}{" "}
                      </span>{" "}
                    </td>{" "}
                  </tr>;
            })}{" "}
              {serializedBills.length === 0 && <tr>
                  {" "}
                  <td colSpan={9} className="px-6 py-16 text-center text-gray-400">
                    {" "}
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />{" "}
                    <p className="font-bold">لا توجد فواتير مطابقة</p>{" "}
                    <p className="text-sm">جرب تغيير عوامل التصفية</p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}