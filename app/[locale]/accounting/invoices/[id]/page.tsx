import InvoiceActionButtons from "@/components/accounting/InvoiceActionButtons";
import PartnerLedgerWidget from "@/components/accounting/PartnerLedgerWidget";
import { InvoiceTabs } from "@/components/accounting/InvoiceTabs";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { StatusBar } from "@/components/common/StatusBar";
import { InvoiceStatusBar } from "@/components/accounting/InvoiceStatusBar";
import { SmartButton } from "@/components/common/SmartButton";
import { Chatter } from "@/components/chatter/Chatter";
import { FileText, Printer, CreditCard, Undo2 } from "lucide-react";
import Link from "next/link";
import { PrintInvoiceButton } from "@/components/common/PrintInvoiceButton";
import { serializeDecimal } from "@/lib/serialize";
export const dynamic = "force-dynamic";
export default async function InvoiceDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    edit?: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const searchParams = await props.searchParams;
  const isEditing = searchParams?.edit === "true";
  const t = await getTranslations("Accounting");
  const invoice = await prisma.invoice.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      lines: {
        include: {
          product: true,
          account: true,
          taxes: {
            include: {
              tax: true
            }
          }
        },
        orderBy: {
          sequence: "asc"
        }
      },
      messages: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: "desc"
        }
      },
      journalEntry: {
        include: {
          items: {
            include: {
              account: true
            }
          }
        }
      },
      journal: true,
      fiscalPosition: true,
      company: true
    }
  });
  if (!invoice) notFound();
  const serializedInvoice = serializeDecimal(invoice);
  const paymentJournals = await prisma.journal.findMany({
    where: {
      type: {
        in: ["bank", "cash"]
      },
      companyId: invoice.companyId || undefined
    }
  });
  const typeLabels: Record<string, {
    label: string;
    color: string;
  }> = {
    out_invoice: {
      label: "فاتورة عميل",
      color: "text-sky-700"
    },
    in_invoice: {
      label: "فاتورة مورد",
      color: "text-orange-700"
    },
    out_refund: {
      label: "إشعار دائن (مرتجع بيع)",
      color: "text-red-700"
    },
    in_refund: {
      label: "إشعار مدين (مرتجع شراء)",
      color: "text-slate-700"
    }
  };
  const statusSteps = invoice.state === "cancel" ? [{
    key: "draft",
    label: "مسودة"
  }, {
    key: "cancel",
    label: "تم الإلغاء"
  }] : [{
    key: "draft",
    label: "مسودة"
  }, {
    key: "posted",
    label: "مُرحّلة"
  }, {
    key: "paid",
    label: "مدفوعة"
  }];
  const typeInfo = typeLabels[invoice.type] || {
    label: invoice.type,
    color: "text-slate-700"
  };
  const productLines = invoice.lines.filter((l: any) => l.lineType === "line");
  const sectionLines = invoice.lines.filter((l: any) => l.lineType === "section");
  const noteLines = invoice.lines.filter((l: any) => l.lineType === "note");
  const hasZeroPriceItem = productLines.some((l: any) => Number(l.priceUnit) === 0);
  return <div className="flex flex-col h-full bg-[#F9FAFB]" dir="rtl">
      {" "}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        {" "}
        <div className="bg-white border border-slate-300 shadow-sm w-full max-w-full rounded-sm min-h-[600px] relative overflow-hidden">
          {" "}
          {/* Header */}{" "}
          <div className="border-b border-slate-200 p-3 flex justify-between items-center bg-white relative z-20">
            {" "}
            <div className="flex gap-1.5 items-center">
              {" "}
              <InvoiceActionButtons invoiceId={id} invoiceName={invoice.name} state={invoice.state} type={invoice.type} amountResidual={Number(invoice.amountResidual)} amountTotal={Number(invoice.amountTotal)} partnerName={invoice.partner?.name || "—"} partnerId={invoice.partnerId || ""} approvalStatus={invoice.approvalStatus} hasZeroPriceItem={hasZeroPriceItem} paymentJournals={paymentJournals} />{" "}
              <PrintInvoiceButton invoiceId={id} locale={locale} type="invoice" />{" "}
            </div>{" "}
            <InvoiceStatusBar invoiceId={id} steps={statusSteps} currentStatus={invoice.state} />{" "}
          </div>{" "}
          <div className="p-8 relative z-0">
            {" "}
            {/* Ribbon for Paid State */}{" "}
            {invoice.state === "paid" && <div className="absolute top-0 left-0 z-10 w-28 h-28 pointer-events-none overflow-hidden">
                {" "}
                <div className="bg-green-600 text-white text-[12px] font-bold px-8 py-1 -rotate-45 -translate-x-[30px] translate-y-[20px] shadow-sm border border-green-700 text-center w-36 uppercase tracking-wide">
                  {" "}
                  مدفوع{" "}
                </div>{" "}
              </div>}{" "}
            {/* Smart Buttons */}{" "}
            {(invoice.saleOrderId || invoice.purchaseOrderId || invoice.invoiceOrigin) && <div className="o_button_box">
                {" "}
                {invoice.saleOrderId ? <Link href={`/${locale}/sales/${invoice.saleOrderId}`} className="oe_stat_button">
                    {" "}
                    <FileText className="w-5 h-5 o_stat_icon" />{" "}
                    <div className="o_stat_info">
                      {" "}
                      <span className="o_stat_value">1</span>{" "}
                      <span className="o_stat_text">المبيعات</span>{" "}
                    </div>{" "}
                  </Link> : invoice.purchaseOrderId ? <Link href={`/${locale}/purchases/${invoice.purchaseOrderId}`} className="oe_stat_button">
                    {" "}
                    <FileText className="w-5 h-5 o_stat_icon" />{" "}
                    <div className="o_stat_info">
                      {" "}
                      <span className="o_stat_value">1</span>{" "}
                      <span className="o_stat_text">المشتريات</span>{" "}
                    </div>{" "}
                  </Link> : invoice.invoiceOrigin ? <Link href={`/${locale}/sales?search=${invoice.invoiceOrigin}`} className="oe_stat_button">
                    {" "}
                    <FileText className="w-5 h-5 o_stat_icon" />{" "}
                    <div className="o_stat_info">
                      {" "}
                      <span className="o_stat_value">1</span>{" "}
                      <span className="o_stat_text">المصدر</span>{" "}
                    </div>{" "}
                  </Link> : null}{" "}
              </div>}{" "}
            {/* Title */}{" "}
            <div className="mb-8 mt-4">
              {" "}
              <div className={`${typeInfo.color} text-sm mb-1`}>
                {typeInfo.label}
              </div>{" "}
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1" dir="ltr" style={{
              textAlign: "right"
            }}>
                {" "}
                {invoice.name}{" "}
              </h1>{" "}
              {invoice.invoiceOrigin && <p className="text-sm text-slate-500">
                  المصدر: <span dir="ltr">{invoice.invoiceOrigin}</span>
                </p>}{" "}
            </div>{" "}
            {/* Form Groups — Matching Odoo Header Layout */}{" "}
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
              {" "}
              <div className="space-y-2">
                {" "}
                <div className="grid grid-cols-3 gap-2 items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    {" "}
                    {invoice.type.startsWith("out") ? "العميل" : "المورد"}{" "}
                  </label>{" "}
                  <div className="col-span-2 text-sm text-sky-700 font-medium hover:text-sky-600">
                    {" "}
                    <Link href={`/${locale}/contacts/${invoice.partner?.id}`}>
                      {" "}
                      {invoice.partner?.name || "—"}{" "}
                    </Link>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-3 gap-2 items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    الرقم المرجعي للدفعة
                  </label>{" "}
                  <div className="col-span-2 text-sm text-slate-600">
                    {" "}
                    {invoice.paymentReference || "-"}{" "}
                  </div>{" "}
                </div>{" "}
                {invoice.partner?.vat && <div className="grid grid-cols-3 gap-2 items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700">
                      الرقم الضريبي
                    </label>{" "}
                    <div className="col-span-2 text-sm text-slate-600">
                      {" "}
                      {invoice.partner?.vat}{" "}
                    </div>{" "}
                  </div>}{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <div className="grid grid-cols-3 gap-2 items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    تاريخ الفاتورة
                  </label>{" "}
                  <div className="col-span-2 text-sm text-slate-900">
                    {" "}
                    {new Date(invoice.dateInvoice).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-3 gap-2 items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    تاريخ الاستحقاق
                  </label>{" "}
                  <div className="col-span-2 text-sm text-slate-900">
                    {" "}
                    {invoice.dateDue ? new Date(invoice.dateDue).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }) : new Date(invoice.dateInvoice).toLocaleDateString("ar-EG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-3 gap-2 items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    دفتر اليومية
                  </label>{" "}
                  <div className="col-span-2 text-sm text-slate-900">
                    {" "}
                    {invoice.journal?.name || (invoice.type.startsWith("out") ? "دفتر / المبيعات" : "دفتر / المشتريات")}{" "}
                  </div>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Interactive Notebook Tabs */}{" "}
            <InvoiceTabs invoice={serializedInvoice} locale={locale} />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="bg-slate-50 border-t border-slate-300 p-4 flex justify-center">
        {" "}
        <div className="w-full max-w-full space-y-4">
          {" "}
          {invoice.state !== "draft" && <PartnerLedgerWidget partnerId={invoice.partnerId || ""} locale={locale} />}{" "}
          <Chatter model="invoice" id={id} />{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}