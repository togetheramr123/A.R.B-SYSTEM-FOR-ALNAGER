'use client';

import { jsPDF } from 'jspdf';

// ===== Arabic Text Utilities =====
// jsPDF doesn't natively support Arabic shaping & RTL.
// We reverse the visual order of Arabic text for display in jsPDF.

function isArabic(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x0600 && code <= 0x06FF) || // Arabic
    (code >= 0xFE70 && code <= 0xFEFF) || // Arabic Presentation Forms-B
    (code >= 0xFB50 && code <= 0xFDFF)    // Arabic Presentation Forms-A
  );
}

function hasArabic(text: string): boolean {
  return [...text].some(c => isArabic(c));
}

// Simple visual reorder for Arabic text in jsPDF
// Since jsPDF renders LTR, we reverse the logical order so it appears correctly
function visualArabic(text: string): string {
  if (!text) return '';
  if (!hasArabic(text)) return text;
  
  // Split into segments of Arabic vs non-Arabic
  const segments: { text: string; arabic: boolean }[] = [];
  let current = '';
  let currentIsArabic = false;
  
  for (const char of text) {
    const charArabic = isArabic(char) || char === ' ';
    if (current === '') {
      currentIsArabic = isArabic(char);
      current = char;
    } else if (charArabic === currentIsArabic || char === ' ') {
      current += char;
    } else {
      segments.push({ text: current, arabic: currentIsArabic });
      current = char;
      currentIsArabic = isArabic(char);
    }
  }
  if (current) segments.push({ text: current, arabic: currentIsArabic });
  
  // Reverse the entire array for RTL context, 
  // and reverse individual Arabic segments
  const reversed = segments.reverse().map(seg => {
    if (seg.arabic) {
      return [...seg.text].reverse().join('');
    }
    return seg.text;
  });
  
  return reversed.join('');
}

// ===== PDF Generator =====

export interface PurchaseOrderPdfData {
  name: string;
  dateOrder?: string;
  partnerName?: string;
  companyName?: string;
  lines: {
    productName: string;
    quantity: number;
    unitName?: string;
    priceUnit: number;
    discount1: number;
    priceSubtotal: number;
    secondaryQuantity?: number;
    secondaryUnit?: string;
  }[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
}

export interface SaleOrderPdfData {
  name: string;
  dateOrder?: string;
  partnerName?: string;
  companyName?: string;
  lines: {
    productName: string;
    quantity: number;
    unitName?: string;
    priceUnit: number;
    discount1: number;
    priceSubtotal: number;
    secondaryQuantity?: number;
    secondaryUnit?: string;
  }[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
}

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Generate a purchase order PDF directly from data using jsPDF.
 * This approach is 100% reliable on all platforms (no iframe, no html2canvas).
 */
export function generatePurchaseOrderPdf(data: PurchaseOrderPdfData): Blob {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== HEADER =====
  // HSN GROUP logo (left side)
  pdf.setFontSize(28);
  pdf.setTextColor(30, 64, 175); // blue-800
  pdf.text('HSN', margin, y + 8);
  
  pdf.setFontSize(10);
  pdf.setTextColor(220, 38, 38); // red-600
  pdf.text('GROUP', margin, y + 14);

  // Company name (right side) - for Arabic we use right alignment
  pdf.setFontSize(18);
  pdf.setTextColor(0, 0, 0);
  // Use Helvetica (built-in) - Arabic text will appear as boxes in standard fonts
  // We'll draw a separator line instead
  pdf.setFontSize(14);
  pdf.text('Al-Najjar Sanitary Tools', pageWidth - margin, y + 8, { align: 'right' });
  
  y += 18;
  
  // Separator line
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ===== ORDER INFO =====
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  
  // Order number
  pdf.text(`PO: ${data.name}`, pageWidth - margin, y, { align: 'right' });
  
  // Date
  const dateStr = data.dateOrder ? new Date(data.dateOrder).toLocaleDateString('en-GB') : '—';
  pdf.text(`Date: ${dateStr}`, margin, y);
  y += 8;
  
  // Order type
  pdf.setFontSize(10);
  pdf.text('Purchase Order', pageWidth / 2, y, { align: 'center' });
  y += 8;
  
  // Vendor name
  pdf.setFontSize(12);
  pdf.text(`Vendor: ${data.partnerName || '—'}`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  // ===== TABLE =====
  const colWidths = [10, 55, 18, 18, 25, 25, 29]; // Total = 180mm = contentWidth
  const headers = ['#', 'Product', 'Qty', 'Unit', 'Price', 'Discount', 'Total'];
  
  // Table header
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, contentWidth, 8, 'S');
  
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  
  let xPos = margin;
  for (let i = 0; i < headers.length; i++) {
    // Draw vertical lines
    if (i > 0) {
      pdf.line(xPos, y, xPos, y + 8);
    }
    pdf.text(headers[i], xPos + colWidths[i] / 2, y + 5.5, { align: 'center' });
    xPos += colWidths[i];
  }
  y += 8;

  // Table rows
  pdf.setFontSize(9);
  const rowHeight = 7;
  
  for (let idx = 0; idx < data.lines.length; idx++) {
    const line = data.lines[idx];
    
    // Check if we need a new page
    if (y + rowHeight > pageHeight - 50) {
      pdf.addPage();
      y = margin;
    }
    
    const qty = line.quantity || 0;
    const priceUnit = line.priceUnit || 0;
    const discount1 = line.discount1 || 0;
    const subtotal = line.priceSubtotal || 0;
    const discountValue = priceUnit * qty * (discount1 / 100);
    
    // Row background (alternating)
    if (idx % 2 === 1) {
      pdf.setFillColor(248, 248, 248);
      pdf.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    
    // Row border
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y, contentWidth, rowHeight, 'S');
    
    // Draw vertical lines
    xPos = margin;
    for (let i = 0; i < colWidths.length; i++) {
      if (i > 0) {
        pdf.line(xPos, y, xPos, y + rowHeight);
      }
      xPos += colWidths[i];
    }
    
    // Cell content
    pdf.setTextColor(0, 0, 0);
    xPos = margin;
    
    // # (index)
    pdf.text(String(idx + 1), xPos + colWidths[0] / 2, y + 5, { align: 'center' });
    xPos += colWidths[0];
    
    // Product name (left aligned, truncated if needed)
    const productName = line.productName || '—';
    const truncatedName = productName.length > 30 ? productName.substring(0, 28) + '..' : productName;
    pdf.text(truncatedName, xPos + 2, y + 5);
    xPos += colWidths[1];
    
    // Quantity
    pdf.text(String(qty), xPos + colWidths[2] / 2, y + 5, { align: 'center' });
    xPos += colWidths[2];
    
    // Unit
    pdf.text(line.unitName || 'pc', xPos + colWidths[3] / 2, y + 5, { align: 'center' });
    xPos += colWidths[3];
    
    // Price
    pdf.text(formatNumber(priceUnit), xPos + colWidths[4] / 2, y + 5, { align: 'center' });
    xPos += colWidths[4];
    
    // Discount
    pdf.text(discountValue > 0 ? formatNumber(discountValue) : '0.00', xPos + colWidths[5] / 2, y + 5, { align: 'center' });
    xPos += colWidths[5];
    
    // Total
    pdf.text(formatNumber(subtotal), xPos + colWidths[6] / 2, y + 5, { align: 'center' });
    
    y += rowHeight;
  }
  
  y += 5;

  // Check if we need a new page for totals
  if (y + 40 > pageHeight - 20) {
    pdf.addPage();
    y = margin;
  }

  // ===== TOTALS TABLE =====
  const totalsWidth = 100;
  const totalsX = pageWidth - margin - totalsWidth;
  const labelW = 50;
  const valueW = 50;
  const tRowH = 7;
  
  // Calculate total discount
  const totalDiscount = data.lines.reduce((sum, line) => {
    return sum + (line.priceUnit * line.quantity * (line.discount1 / 100));
  }, 0);
  
  const totalsRows = [
    { label: 'Subtotal (before discount)', value: formatNumber(data.amountUntaxed) },
    { label: 'Discount', value: formatNumber(totalDiscount) },
    { label: 'Tax', value: formatNumber(data.amountTax) },
    { label: 'Net Total', value: formatNumber(data.amountTotal) },
  ];
  
  pdf.setFontSize(9);
  for (let i = 0; i < totalsRows.length; i++) {
    const row = totalsRows[i];
    const rowY = y + i * tRowH;
    
    // Label cell
    pdf.setFillColor(i === totalsRows.length - 1 ? 220 : 245, i === totalsRows.length - 1 ? 235 : 245, i === totalsRows.length - 1 ? 245 : 245);
    pdf.rect(totalsX, rowY, labelW, tRowH, 'FD');
    
    // Value cell
    pdf.setFillColor(255, 255, 255);
    pdf.rect(totalsX + labelW, rowY, valueW, tRowH, 'FD');
    
    pdf.setTextColor(0, 0, 0);
    if (i === totalsRows.length - 1) {
      pdf.setFontSize(10);
    }
    pdf.text(row.label, totalsX + labelW / 2, rowY + 5, { align: 'center' });
    pdf.text(row.value, totalsX + labelW + valueW / 2, rowY + 5, { align: 'center' });
    pdf.setFontSize(9);
  }
  
  y += totalsRows.length * tRowH + 10;

  // ===== TOTAL IN WORDS =====
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(
    `Total: ${formatNumber(data.amountTotal)}`,
    pageWidth / 2, y, { align: 'center' }
  );

  return pdf.output('blob');
}

/**
 * Generate a sale order PDF directly from data using jsPDF.
 */
export function generateSaleOrderPdf(data: SaleOrderPdfData): Blob {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ===== HEADER =====
  pdf.setFontSize(28);
  pdf.setTextColor(30, 64, 175);
  pdf.text('HSN', margin, y + 8);
  
  pdf.setFontSize(10);
  pdf.setTextColor(220, 38, 38);
  pdf.text('GROUP', margin, y + 14);

  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Al-Najjar Sanitary Tools', pageWidth - margin, y + 8, { align: 'right' });
  
  y += 18;
  
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ===== ORDER INFO =====
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  
  pdf.text(`SO: ${data.name}`, pageWidth - margin, y, { align: 'right' });
  
  const dateStr = data.dateOrder ? new Date(data.dateOrder).toLocaleDateString('en-GB') : '—';
  pdf.text(`Date: ${dateStr}`, margin, y);
  y += 8;
  
  pdf.setFontSize(10);
  pdf.text('Sale Order', pageWidth / 2, y, { align: 'center' });
  y += 8;
  
  pdf.setFontSize(12);
  pdf.text(`Customer: ${data.partnerName || '—'}`, pageWidth - margin, y, { align: 'right' });
  y += 10;

  // ===== TABLE =====
  const colWidths = [10, 55, 18, 18, 25, 25, 29];
  const headers = ['#', 'Product', 'Qty', 'Unit', 'Price', 'Discount', 'Total'];
  
  pdf.setFillColor(240, 240, 240);
  pdf.rect(margin, y, contentWidth, 8, 'F');
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.3);
  pdf.rect(margin, y, contentWidth, 8, 'S');
  
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0);
  
  let xPos = margin;
  for (let i = 0; i < headers.length; i++) {
    if (i > 0) pdf.line(xPos, y, xPos, y + 8);
    pdf.text(headers[i], xPos + colWidths[i] / 2, y + 5.5, { align: 'center' });
    xPos += colWidths[i];
  }
  y += 8;

  pdf.setFontSize(9);
  const rowHeight = 7;
  
  for (let idx = 0; idx < data.lines.length; idx++) {
    const line = data.lines[idx];
    
    if (y + rowHeight > pageHeight - 50) {
      pdf.addPage();
      y = margin;
    }
    
    const qty = line.quantity || 0;
    const priceUnit = line.priceUnit || 0;
    const discount1 = line.discount1 || 0;
    const subtotal = line.priceSubtotal || 0;
    const discountValue = priceUnit * qty * (discount1 / 100);
    
    if (idx % 2 === 1) {
      pdf.setFillColor(248, 248, 248);
      pdf.rect(margin, y, contentWidth, rowHeight, 'F');
    }
    
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.2);
    pdf.rect(margin, y, contentWidth, rowHeight, 'S');
    
    xPos = margin;
    for (let i = 0; i < colWidths.length; i++) {
      if (i > 0) pdf.line(xPos, y, xPos, y + rowHeight);
      xPos += colWidths[i];
    }
    
    pdf.setTextColor(0, 0, 0);
    xPos = margin;
    
    pdf.text(String(idx + 1), xPos + colWidths[0] / 2, y + 5, { align: 'center' });
    xPos += colWidths[0];
    
    const productName = line.productName || '—';
    const truncatedName = productName.length > 30 ? productName.substring(0, 28) + '..' : productName;
    pdf.text(truncatedName, xPos + 2, y + 5);
    xPos += colWidths[1];
    
    pdf.text(String(qty), xPos + colWidths[2] / 2, y + 5, { align: 'center' });
    xPos += colWidths[2];
    
    pdf.text(line.unitName || 'pc', xPos + colWidths[3] / 2, y + 5, { align: 'center' });
    xPos += colWidths[3];
    
    pdf.text(formatNumber(priceUnit), xPos + colWidths[4] / 2, y + 5, { align: 'center' });
    xPos += colWidths[4];
    
    pdf.text(discountValue > 0 ? formatNumber(discountValue) : '0.00', xPos + colWidths[5] / 2, y + 5, { align: 'center' });
    xPos += colWidths[5];
    
    pdf.text(formatNumber(subtotal), xPos + colWidths[6] / 2, y + 5, { align: 'center' });
    
    y += rowHeight;
  }
  
  y += 5;

  if (y + 40 > pageHeight - 20) {
    pdf.addPage();
    y = margin;
  }

  // ===== TOTALS =====
  const totalsWidth = 100;
  const totalsX = pageWidth - margin - totalsWidth;
  const labelW = 50;
  const valueW = 50;
  const tRowH = 7;
  
  const totalDiscount = data.lines.reduce((sum, line) => {
    return sum + (line.priceUnit * line.quantity * (line.discount1 / 100));
  }, 0);
  
  const totalsRows = [
    { label: 'Subtotal', value: formatNumber(data.amountUntaxed) },
    { label: 'Discount', value: formatNumber(totalDiscount) },
    { label: 'Tax', value: formatNumber(data.amountTax) },
    { label: 'Net Total', value: formatNumber(data.amountTotal) },
  ];
  
  pdf.setFontSize(9);
  for (let i = 0; i < totalsRows.length; i++) {
    const row = totalsRows[i];
    const rowY = y + i * tRowH;
    
    pdf.setFillColor(i === totalsRows.length - 1 ? 220 : 245, i === totalsRows.length - 1 ? 235 : 245, i === totalsRows.length - 1 ? 245 : 245);
    pdf.rect(totalsX, rowY, labelW, tRowH, 'FD');
    pdf.setFillColor(255, 255, 255);
    pdf.rect(totalsX + labelW, rowY, valueW, tRowH, 'FD');
    
    pdf.setTextColor(0, 0, 0);
    if (i === totalsRows.length - 1) pdf.setFontSize(10);
    pdf.text(row.label, totalsX + labelW / 2, rowY + 5, { align: 'center' });
    pdf.text(row.value, totalsX + labelW + valueW / 2, rowY + 5, { align: 'center' });
    pdf.setFontSize(9);
  }
  
  y += totalsRows.length * tRowH + 10;

  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(
    `Total: ${formatNumber(data.amountTotal)}`,
    pageWidth / 2, y, { align: 'center' }
  );

  return pdf.output('blob');
}
