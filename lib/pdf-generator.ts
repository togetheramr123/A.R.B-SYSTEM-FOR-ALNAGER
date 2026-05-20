'use client';

/**
 * lib/pdf-generator.ts
 * ====================
 * PDF Generator for ERP documents (Invoices, Purchase Orders, Sale Orders).
 * Uses jsPDF to create professional Arabic-supported PDF documents.
 * 
 * USAGE:
 *   import { generateInvoicePDF } from '@/lib/pdf-generator';
 *   const blob = await generateInvoicePDF(invoiceData, companyData);
 *   // Download or preview
 */

import { jsPDF } from 'jspdf';

// ============================================================
// TYPES
// ============================================================

interface CompanyInfo {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  currencySymbol?: string;
}

interface DocumentLine {
  name: string;
  quantity: number;
  priceUnit: number;
  discount?: number;
  taxRate?: number;
  priceSubtotal: number;
  unitName?: string;
}

interface InvoiceData {
  name: string;
  type: 'out_invoice' | 'in_invoice' | 'out_refund' | 'in_refund';
  dateInvoice: string;
  dateDue?: string;
  partnerName: string;
  partnerAddress?: string;
  partnerTaxId?: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  amountResidual?: number;
  state: string;
  lines: DocumentLine[];
  invoiceOrigin?: string;
}

interface OrderData {
  name: string;
  dateOrder: string;
  partnerName: string;
  partnerAddress?: string;
  amountUntaxed: number;
  amountTax?: number;
  amountTotal: number;
  lines: DocumentLine[];
  state: string;
}

// ============================================================
// HELPERS
// ============================================================

const formatNumber = (num: number, symbol = 'ر.س') => {
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// Since jsPDF doesn't natively support Arabic well, we use LTR rendering
// with manual column positioning for Arabic headers
const COLORS = {
  primary: [0, 160, 157] as [number, number, number],      // #00A09D — teal
  dark: [30, 41, 59] as [number, number, number],           // slate-800
  gray: [100, 116, 139] as [number, number, number],        // slate-500
  light: [241, 245, 249] as [number, number, number],       // slate-100
  white: [255, 255, 255] as [number, number, number],
  accent: [37, 99, 235] as [number, number, number],        // blue-600
  red: [220, 38, 38] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
};

// ============================================================
// MAIN GENERATORS
// ============================================================

/**
 * Generate Invoice PDF
 */
export function generateInvoicePDF(invoice: InvoiceData, company: CompanyInfo): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // --- HEADER ---
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(company.name, margin, y + 8);
  
  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  if (company.phone) doc.text(`Tel: ${company.phone}`, margin, y);
  if (company.email) doc.text(`Email: ${company.email}`, margin + 50, y);
  if (company.taxId) doc.text(`Tax ID: ${company.taxId}`, margin + 110, y);

  // Document Title
  y += 12;
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  const typeLabels: Record<string, string> = {
    'out_invoice': 'INVOICE',
    'in_invoice': 'VENDOR BILL',
    'out_refund': 'CREDIT NOTE',
    'in_refund': 'DEBIT NOTE',
  };
  doc.text(typeLabels[invoice.type] || 'INVOICE', margin + 4, y + 7);
  doc.text(invoice.name, pageWidth - margin - 4, y + 7, { align: 'right' });

  // --- INFO BLOCKS ---
  y += 18;
  
  // Left: Customer/Vendor Info
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.type.includes('out') ? 'Bill To:' : 'Vendor:', margin, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(invoice.partnerName, margin, y);
  if (invoice.partnerAddress) { y += 4; doc.text(invoice.partnerAddress, margin, y); }
  if (invoice.partnerTaxId) { y += 4; doc.text(`Tax ID: ${invoice.partnerTaxId}`, margin, y); }

  // Right: Document details
  const rightX = pageWidth - margin;
  let ry = y - 9;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Date: ${formatDate(invoice.dateInvoice)}`, rightX, ry, { align: 'right' });
  ry += 5;
  if (invoice.dateDue) doc.text(`Due: ${formatDate(invoice.dateDue)}`, rightX, ry, { align: 'right' });
  ry += 5;
  if (invoice.invoiceOrigin) doc.text(`Origin: ${invoice.invoiceOrigin}`, rightX, ry, { align: 'right' });
  ry += 5;
  const stateColors: Record<string, [number, number, number]> = {
    'draft': COLORS.gray,
    'posted': COLORS.accent,
    'paid': COLORS.green,
  };
  doc.setTextColor(...(stateColors[invoice.state] || COLORS.gray));
  doc.text(`Status: ${invoice.state.toUpperCase()}`, rightX, ry, { align: 'right' });

  // --- TABLE ---
  y += 12;
  const cols = [
    { label: '#', width: 8 },
    { label: 'Description', width: contentWidth - 68 },
    { label: 'Qty', width: 15 },
    { label: 'Price', width: 22 },
    { label: 'Total', width: 23 },
  ];

  // Table header
  doc.setFillColor(...COLORS.dark);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  let cx = margin + 2;
  for (const col of cols) {
    doc.text(col.label, cx, y + 5);
    cx += col.width;
  }

  // Table rows
  y += 7;
  doc.setFont('helvetica', 'normal');
  
  invoice.lines.forEach((line, index) => {
    if (y > 260) {
      doc.addPage();
      y = margin;
    }
    
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(...COLORS.light);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    cx = margin + 2;
    doc.text(String(index + 1), cx, y + 4);
    cx += cols[0].width;
    doc.text((line.name || '').substring(0, 55), cx, y + 4);
    cx += cols[1].width;
    doc.text(String(line.quantity), cx, y + 4);
    cx += cols[2].width;
    doc.text(formatNumber(line.priceUnit, ''), cx, y + 4);
    cx += cols[3].width;
    doc.text(formatNumber(line.priceSubtotal, ''), cx, y + 4);
    
    y += 6;
  });

  // --- TOTALS ---
  y += 5;
  const totalsX = pageWidth - margin - 55;
  doc.setDrawColor(...COLORS.gray);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 5;
  
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text('Subtotal:', totalsX, y);
  doc.text(formatNumber(invoice.amountUntaxed), pageWidth - margin, y, { align: 'right' });
  
  y += 5;
  doc.text('Tax:', totalsX, y);
  doc.text(formatNumber(invoice.amountTax), pageWidth - margin, y, { align: 'right' });

  y += 6;
  doc.setFillColor(...COLORS.primary);
  doc.rect(totalsX - 2, y - 4, 57, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('TOTAL:', totalsX, y + 1);
  doc.text(formatNumber(invoice.amountTotal), pageWidth - margin - 2, y + 1, { align: 'right' });

  if (invoice.amountResidual !== undefined && invoice.amountResidual > 0 && invoice.state !== 'draft') {
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.red);
    doc.text('Amount Due:', totalsX, y);
    doc.text(formatNumber(invoice.amountResidual), pageWidth - margin, y, { align: 'right' });
  }

  // --- FOOTER ---
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated by Smart ERP 2026`, margin, footerY);
  doc.text(`Page 1`, pageWidth - margin, footerY, { align: 'right' });

  return doc;
}

/**
 * Generate Purchase Order PDF
 */
export function generatePurchaseOrderPDF(order: OrderData, company: CompanyInfo): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(company.name, margin, y + 8);
  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  if (company.phone) doc.text(`Tel: ${company.phone}`, margin, y);
  if (company.email) doc.text(`Email: ${company.email}`, margin + 50, y);

  // Title
  y += 12;
  doc.setFillColor(...COLORS.accent);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text('PURCHASE ORDER', margin + 4, y + 7);
  doc.text(order.name, pageWidth - margin - 4, y + 7, { align: 'right' });

  // Info
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor:', margin, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(order.partnerName, margin, y);

  const rightX = pageWidth - margin;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Date: ${formatDate(order.dateOrder)}`, rightX, y - 5, { align: 'right' });

  // Table
  y += 10;
  const cols = [
    { label: '#', width: 8 },
    { label: 'Description', width: contentWidth - 68 },
    { label: 'Qty', width: 15 },
    { label: 'Price', width: 22 },
    { label: 'Total', width: 23 },
  ];

  doc.setFillColor(...COLORS.dark);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  let cx = margin + 2;
  for (const col of cols) {
    doc.text(col.label, cx, y + 5);
    cx += col.width;
  }

  y += 7;
  doc.setFont('helvetica', 'normal');
  
  order.lines.forEach((line, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(...COLORS.light);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    cx = margin + 2;
    doc.text(String(index + 1), cx, y + 4); cx += cols[0].width;
    doc.text((line.name || '').substring(0, 55), cx, y + 4); cx += cols[1].width;
    doc.text(String(line.quantity), cx, y + 4); cx += cols[2].width;
    doc.text(formatNumber(line.priceUnit, ''), cx, y + 4); cx += cols[3].width;
    doc.text(formatNumber(line.priceSubtotal, ''), cx, y + 4);
    y += 6;
  });

  // Totals
  y += 5;
  const totalsX = pageWidth - margin - 55;
  doc.setFillColor(...COLORS.accent);
  doc.rect(totalsX - 2, y - 1, 57, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('TOTAL:', totalsX, y + 4);
  doc.text(formatNumber(order.amountTotal), pageWidth - margin - 2, y + 4, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated by Smart ERP 2026`, margin, footerY);

  return doc;
}

/**
 * Generate Sale Order / Quotation PDF
 */
export function generateSaleOrderPDF(order: OrderData, company: CompanyInfo): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.text(company.name, margin, y + 8);
  y += 12;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  if (company.phone) doc.text(`Tel: ${company.phone}`, margin, y);
  if (company.email) doc.text(`Email: ${company.email}`, margin + 50, y);

  // Title
  y += 12;
  const isQuote = order.state === 'draft' || order.state === 'sent';
  doc.setFillColor(...(isQuote ? COLORS.primary : COLORS.green));
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.white);
  doc.text(isQuote ? 'QUOTATION' : 'SALES ORDER', margin + 4, y + 7);
  doc.text(order.name, pageWidth - margin - 4, y + 7, { align: 'right' });

  // Info
  y += 18;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer:', margin, y);
  doc.setFont('helvetica', 'normal');
  y += 5;
  doc.text(order.partnerName, margin, y);

  const rightX = pageWidth - margin;
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Date: ${formatDate(order.dateOrder)}`, rightX, y - 5, { align: 'right' });

  // Table
  y += 10;
  const cols = [
    { label: '#', width: 8 },
    { label: 'Description', width: contentWidth - 68 },
    { label: 'Qty', width: 15 },
    { label: 'Price', width: 22 },
    { label: 'Total', width: 23 },
  ];

  doc.setFillColor(...COLORS.dark);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.white);
  doc.setFont('helvetica', 'bold');
  let cx = margin + 2;
  for (const col of cols) { doc.text(col.label, cx, y + 5); cx += col.width; }

  y += 7;
  doc.setFont('helvetica', 'normal');
  
  order.lines.forEach((line, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(...COLORS.light);
      doc.rect(margin, y, contentWidth, 6, 'F');
    }
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.dark);
    cx = margin + 2;
    doc.text(String(index + 1), cx, y + 4); cx += cols[0].width;
    doc.text((line.name || '').substring(0, 55), cx, y + 4); cx += cols[1].width;
    doc.text(String(line.quantity), cx, y + 4); cx += cols[2].width;
    doc.text(formatNumber(line.priceUnit, ''), cx, y + 4); cx += cols[3].width;
    doc.text(formatNumber(line.priceSubtotal, ''), cx, y + 4);
    y += 6;
  });

  // Totals
  y += 5;
  const totalsX = pageWidth - margin - 55;
  if (isQuote) {
    doc.setFillColor(...COLORS.primary);
  } else {
    doc.setFillColor(...COLORS.green);
  }
  doc.rect(totalsX - 2, y - 1, 57, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.white);
  doc.text('TOTAL:', totalsX, y + 4);
  doc.text(formatNumber(order.amountTotal), pageWidth - margin - 2, y + 4, { align: 'right' });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.gray);
  doc.text(`Generated by Smart ERP 2026`, margin, footerY);

  return doc;
}

// ============================================================
// DOWNLOAD HELPERS
// ============================================================

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function openPDFInNewTab(doc: jsPDF) {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
