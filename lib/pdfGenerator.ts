'use client';

// ===== PDF Generator using html2pdf.js =====
// Uses browser-native Arabic text rendering (no font embedding needed).
// Creates an invisible DOM element, renders the invoice HTML, then captures as PDF.

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

function buildInvoiceHtml(
  data: PurchaseOrderPdfData | SaleOrderPdfData,
  type: 'purchase' | 'sale'
): string {
  const typeLabel = type === 'purchase' ? 'أمر شراء' : 'عرض سعر';
  const partnerLabel = type === 'purchase' ? 'اسم المورد' : 'اسم العميل';
  const bookLabel = type === 'purchase' ? 'المشتريات' : 'المبيعات';

  // Build lines HTML
  let linesHtml = '';
  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const qty = line.quantity || 0;
    const priceUnit = line.priceUnit || 0;
    const discount1 = line.discount1 || 0;
    const subtotal = line.priceSubtotal || 0;
    const discountValue = priceUnit * qty * (discount1 / 100);
    const secondaryQty = line.secondaryQuantity || 0;

    linesHtml += `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align:right;font-weight:bold;padding-right:8px;">${line.productName || '—'}</td>
        <td>${qty}</td>
        <td>${line.unitName || 'قطعة'}</td>
        <td>${formatNumber(priceUnit)}</td>
        <td>${discountValue > 0 ? formatNumber(discountValue) : '0.00'}</td>
        <td>${formatNumber(subtotal)}</td>
        <td>${secondaryQty > 0 ? `${secondaryQty} ${line.secondaryUnit || ''}` : '—'}</td>
      </tr>
    `;
  }

  // Calculate total discount
  const totalDiscount = data.lines.reduce((sum, line) => {
    return sum + ((line.priceUnit || 0) * (line.quantity || 0) * ((line.discount1 || 0) / 100));
  }, 0);

  return `
    <div id="pdf-content" dir="rtl" style="
      font-family: 'Cairo', 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      background: white;
      color: black;
      box-sizing: border-box;
      font-size: 14px;
      line-height: 1.6;
    ">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #000;padding-bottom:12px;margin-bottom:20px;">
        <div>
          <div style="font-size:36px;font-weight:900;color:#1e40af;letter-spacing:-2px;line-height:1;">H<span style="color:#dc2626;">S</span>N</div>
          <div style="font-size:11px;font-weight:700;color:#dc2626;letter-spacing:4px;margin-top:2px;">GROUP</div>
        </div>
        <div style="text-align:left;">
          <h1 style="font-size:28px;font-weight:900;color:#000;margin:0;letter-spacing:1px;">النجار للأدوات الصحية</h1>
        </div>
      </div>

      <!-- Info Row -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;">
          <span>رقم ${typeLabel}:</span>
          <span style="margin-right:8px;">${data.name}</span>
        </div>
        <div style="font-size:13px;font-weight:700;">
          <span>تحريراً في:</span>
          <span style="margin-right:8px;">${formatDate(data.dateOrder)}</span>
        </div>
      </div>

      <!-- Order Type -->
      <div style="text-align:center;margin-bottom:20px;">
        <span style="font-size:13px;font-weight:700;">نوع الطلب : دفتر / ${bookLabel}</span>
      </div>

      <!-- Partner -->
      <div style="font-size:18px;font-weight:700;margin-bottom:16px;">
        ${partnerLabel} : ${data.partnerName || '—'}
      </div>

      <!-- Lines Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#f9f9f9;">
            <th style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:13px;font-weight:700;width:35px;">م.</th>
            <th style="border:1px solid #000;padding:6px 8px;text-align:right;font-size:13px;font-weight:700;">اسم الصنف</th>
            <th style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:13px;font-weight:700;width:60px;">الكمية</th>
            <th style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:13px;font-weight:700;width:60px;">الوحدة</th>
            <th style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:13px;font-weight:700;width:80px;">سعر الوحدة</th>
            <th style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:13px;font-weight:700;width:80px;">قيمة الخصم</th>
            <th style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:13px;font-weight:700;width:90px;">الاجمالي</th>
            <th style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:13px;font-weight:700;width:90px;">الكمية الثانوية</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml}
        </tbody>
      </table>

      <!-- Totals Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-weight:700;">
        <tbody>
          <tr>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;width:50%;">${formatNumber(data.amountUntaxed)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;width:50%;background:#f9f9f9;">الإجمالي قبل الخصم</td>
          </tr>
          <tr>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;">${formatNumber(totalDiscount)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;background:#f9f9f9;">الخصم</td>
          </tr>
          <tr>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;">${formatNumber(data.amountTax)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;background:#f9f9f9;">الضريبة</td>
          </tr>
          <tr>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;font-size:15px;">${formatNumber(data.amountTotal)}</td>
            <td style="border:1px solid #000;padding:6px 8px;text-align:center;background:#e8f4f8;font-size:15px;">الصافي بعد الخصم</td>
          </tr>
        </tbody>
      </table>

      <!-- Total in words -->
      <div style="font-weight:700;font-size:14px;text-align:center;margin-top:24px;">
        اجمالي ${typeLabel} : ${formatNumber(data.amountTotal)} فقط لا غير
      </div>
    </div>
  `;
}

/**
 * Renders invoice HTML into a PDF blob using html2pdf.js.
 * Uses an isolated iframe to avoid inheriting page CSS (prevents oklab() errors).
 * The browser handles Arabic text natively — no font embedding required.
 */
async function renderHtmlToPdf(html: string): Promise<Blob> {
  // Dynamically import html2pdf.js (client-side only)
  const html2pdf = (await import('html2pdf.js')).default;

  // Create an isolated iframe (clean CSS context - no page styles leak in)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.left = '-9999px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-1';
  document.body.appendChild(iframe);

  // Write our HTML directly into the iframe (no URL load, fully self-contained)
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) throw new Error('Cannot access iframe document');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; font-family: 'Cairo', 'Segoe UI', 'Tahoma', sans-serif; }
        table td, table th { border: 1px solid #000; padding: 6px 8px; text-align: center; font-size: 13px; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `);
  iframeDoc.close();

  // Wait for fonts to load inside the iframe
  await new Promise(res => setTimeout(res, 1200));

  const element = iframeDoc.getElementById('pdf-content') || iframeDoc.body;

  const opt: any = {
    margin: 0,
    filename: 'document.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794, // A4 at 96dpi
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
  };

  try {
    const pdfBlob: Blob = await (html2pdf() as any).set(opt).from(element).outputPdf('blob');
    return pdfBlob;
  } finally {
    document.body.removeChild(iframe);
  }
}

/**
 * Generate a purchase order PDF directly from data.
 */
export async function generatePurchaseOrderPdf(data: PurchaseOrderPdfData): Promise<Blob> {
  const html = buildInvoiceHtml(data, 'purchase');
  return renderHtmlToPdf(html);
}

/**
 * Generate a sale order PDF directly from data.
 */
export async function generateSaleOrderPdf(data: SaleOrderPdfData): Promise<Blob> {
  const html = buildInvoiceHtml(data, 'sale');
  return renderHtmlToPdf(html);
}
