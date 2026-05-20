"use client";

import { Printer } from "lucide-react";
import { generateInvoicePDF, generatePurchaseOrderPDF, generateSaleOrderPDF, openPDFInNewTab } from "@/lib/pdf-generator";
interface PrintButtonProps {
  type: "invoice" | "purchase" | "sale";
  data: any;
  company?: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    taxId?: string;
  };
  className?: string;
}
export function PrintButton({
  type,
  data,
  company,
  className
}: PrintButtonProps) {
  const defaultCompany = company || {
    name: "Smart ERP 2026",
    phone: "",
    email: ""
  };
  const handlePrint = () => {
    try {
      let doc;
      if (type === "invoice") {
        doc = generateInvoicePDF({
          name: data.name || "",
          type: data.type || "out_invoice",
          dateInvoice: data.dateInvoice || new Date().toISOString(),
          dateDue: data.dateDue,
          partnerName: data.partner?.name || data.partnerName || "",
          partnerAddress: data.partner?.street || "",
          partnerTaxId: data.partner?.taxId || "",
          amountUntaxed: Number(data.amountUntaxed || 0),
          amountTax: Number(data.amountTax || 0),
          amountTotal: Number(data.amountTotal || 0),
          amountResidual: Number(data.amountResidual || 0),
          state: data.state || "draft",
          lines: (data.lines || []).map((line: any) => ({
            name: line.name || line.product?.name || "",
            quantity: Number(line.quantity || 0),
            priceUnit: Number(line.priceUnit || 0),
            discount: Number(line.discount1 || 0),
            taxRate: Number(line.taxRate || 0),
            priceSubtotal: Number(line.priceSubtotal || 0),
            unitName: line.unitName || ""
          })),
          invoiceOrigin: data.invoiceOrigin || ""
        }, defaultCompany);
      } else if (type === "purchase") {
        doc = generatePurchaseOrderPDF({
          name: data.name || "",
          dateOrder: data.dateOrder || new Date().toISOString(),
          partnerName: data.partner?.name || data.partnerName || "",
          amountUntaxed: Number(data.amountUntaxed || 0),
          amountTax: Number(data.amountTax || 0),
          amountTotal: Number(data.amountTotal || 0),
          state: data.status || "draft",
          lines: (data.lines || []).map((line: any) => ({
            name: line.name || line.product?.name || "",
            quantity: Number(line.quantity || 0),
            priceUnit: Number(line.priceUnit || 0),
            discount: Number(line.discount1 || 0),
            priceSubtotal: Number(line.priceSubtotal || 0)
          }))
        }, defaultCompany);
      } else {
        doc = generateSaleOrderPDF({
          name: data.name || "",
          dateOrder: data.dateOrder || new Date().toISOString(),
          partnerName: data.partner?.name || data.partnerName || "",
          amountUntaxed: Number(data.amountUntaxed || 0),
          amountTotal: Number(data.amountTotal || 0),
          state: data.status || "draft",
          lines: (data.lines || []).map((line: any) => ({
            name: line.name || line.product?.name || "",
            quantity: Number(line.quantity || 0),
            priceUnit: Number(line.priceUnit || 0),
            discount: Number(line.discount1 || 0),
            priceSubtotal: Number(line.priceSubtotal || 0)
          }))
        }, defaultCompany);
      }
      openPDFInNewTab(doc);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };
  return <button onClick={handlePrint} title="طباعة PDF" className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 hover:border-slate-400 transition-colors ${className || ""}`}>
      {" "}
      <Printer className="w-4 h-4" /> <span>طباعة</span>{" "}
    </button>;
}