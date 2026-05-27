'use client';

// ===== PDF Generator using Canvas + jsPDF =====
// Uses Canvas 2D API for native Arabic text rendering, then converts to PDF.
// NO html2canvas (avoids oklab CSS bug). NO font embedding issues.

export interface PdfLineData {
  productName: string;
  quantity: number;
  unitName?: string;
  priceUnit: number;
  discount1: number;
  priceSubtotal: number;
  secondaryQuantity?: number;
  secondaryUnit?: string;
}

export interface PurchaseOrderPdfData {
  name: string;
  dateOrder?: string;
  partnerName?: string;
  companyName?: string;
  lines: PdfLineData[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
}

export interface SaleOrderPdfData {
  name: string;
  dateOrder?: string;
  partnerName?: string;
  companyName?: string;
  lines: PdfLineData[];
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Load Cairo font from Google Fonts for Canvas rendering */
async function loadArabicFont(): Promise<void> {
  // Check if font is already loaded
  if (document.fonts.check('16px Cairo')) return;

  const font = new FontFace(
    'Cairo',
    'url(https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpcWmhzfH5lWWgcQyyS4J0.ttf)',
    { weight: '400', style: 'normal' }
  );
  const fontBold = new FontFace(
    'Cairo',
    'url(https://fonts.gstatic.com/s/cairo/v28/SLXVc1nY6HkvangtZmpcWmhzfH5l8GkcQyyS4J0.ttf)',
    { weight: '700', style: 'normal' }
  );

  try {
    const [loaded, loadedBold] = await Promise.all([font.load(), fontBold.load()]);
    document.fonts.add(loaded);
    document.fonts.add(loadedBold);
    await document.fonts.ready;
  } catch {
    // Font loading failed — fallback to system Arabic fonts (Tahoma, Arial)
    console.warn('Cairo font load failed, using system fallback');
  }
}

// ─── Canvas Drawing Helpers ───

const SCALE = 2; // 2x for print quality
const A4_W = 794; // A4 width at 96dpi
const A4_H = 1123; // A4 height at 96dpi
const CW = A4_W * SCALE;
const CH = A4_H * SCALE;
const PAD = 50 * SCALE; // page padding

function setFont(ctx: CanvasRenderingContext2D, size: number, bold = false) {
  const weight = bold ? '700' : '400';
  ctx.font = `${weight} ${size * SCALE}px Cairo, Tahoma, Arial, sans-serif`;
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = '#000', width = 1) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width * SCALE;
  ctx.moveTo(x1 * SCALE, y1 * SCALE);
  ctx.lineTo(x2 * SCALE, y2 * SCALE);
  ctx.stroke();
}

function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill?: string, stroke?: string) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1 * SCALE;
    ctx.strokeRect(x * SCALE, y * SCALE, w * SCALE, h * SCALE);
  }
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, align: CanvasTextAlign = 'right') {
  ctx.textAlign = align;
  ctx.fillText(text, x * SCALE, y * SCALE);
}

// ─── Main PDF Rendering ───

function renderInvoiceOnCanvas(
  ctx: CanvasRenderingContext2D,
  data: PurchaseOrderPdfData | SaleOrderPdfData,
  type: 'purchase' | 'sale'
) {
  const typeLabel = type === 'purchase' ? 'أمر شراء' : 'عرض سعر';
  const partnerLabel = type === 'purchase' ? 'المورد' : 'العميل';

  // White background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, CW, CH);
  ctx.fillStyle = '#000';

  const leftEdge = 50;
  const rightEdge = A4_W - 50;
  let y = 55;

  // ── Header ──
  // HSN logo (left side in RTL = right of canvas)
  setFont(ctx, 30, true);
  ctx.fillStyle = '#1e40af';
  drawText(ctx, 'H', rightEdge, y, 'right');
  const hWidth = ctx.measureText('H').width / SCALE;
  ctx.fillStyle = '#dc2626';
  drawText(ctx, 'S', rightEdge - hWidth, y, 'right');
  const sWidth = ctx.measureText('S').width / SCALE;
  ctx.fillStyle = '#1e40af';
  drawText(ctx, 'N', rightEdge - hWidth - sWidth, y, 'right');

  // GROUP subtitle
  setFont(ctx, 9, true);
  ctx.fillStyle = '#dc2626';
  drawText(ctx, 'G R O U P', rightEdge, y + 16, 'right');

  // Company name (right side in RTL = left of canvas)
  setFont(ctx, 20, true);
  ctx.fillStyle = '#000';
  drawText(ctx, 'النجار للأدوات الصحية', leftEdge, y, 'left');

  y += 30;
  drawLine(ctx, leftEdge, y, rightEdge, y, '#000', 2);

  // ── Order Info ──
  y += 28;
  setFont(ctx, 11, true);
  ctx.fillStyle = '#000';
  drawText(ctx, `${data.name} : رقم ${typeLabel}`, rightEdge, y, 'right');
  drawText(ctx, `${fmtDate(data.dateOrder)} : التاريخ`, leftEdge, y, 'left');

  // ── Order Type ──
  y += 28;
  setFont(ctx, 12, true);
  drawText(ctx, typeLabel, A4_W / 2, y, 'center');

  // ── Partner ──
  y += 30;
  setFont(ctx, 14, true);
  drawText(ctx, `${data.partnerName || '—'} : ${partnerLabel}`, rightEdge, y, 'right');

  // ── Table ──
  y += 25;

  // Column definitions (RTL: rightmost column first)
  const cols = [
    { label: 'م.', width: 35 },
    { label: 'اسم الصنف', width: 200 },
    { label: 'الكمية', width: 55 },
    { label: 'الوحدة', width: 55 },
    { label: 'سعر الوحدة', width: 75 },
    { label: 'الخصم', width: 65 },
    { label: 'الاجمالي', width: 80 },
    { label: 'ك. ثانوية', width: 75 },
  ];

  const tableWidth = cols.reduce((s, c) => s + c.width, 0);
  const tableLeft = (A4_W - tableWidth) / 2;
  const rowH = 28;

  // Draw header row
  drawRect(ctx, tableLeft, y, tableWidth, rowH, '#f0f0f0', '#000');

  let cx = tableLeft;
  setFont(ctx, 10, true);
  ctx.fillStyle = '#000';
  for (const col of cols) {
    // Draw cell border
    drawRect(ctx, cx, y, col.width, rowH, undefined, '#000');
    // Draw text centered
    drawText(ctx, col.label, cx + col.width / 2, y + 19, 'center');
    cx += col.width;
  }

  // Draw data rows
  y += rowH;
  setFont(ctx, 10, false);

  for (let i = 0; i < data.lines.length; i++) {
    const line = data.lines[i];
    const qty = line.quantity || 0;
    const price = line.priceUnit || 0;
    const disc = line.discount1 || 0;
    const subtotal = line.priceSubtotal || 0;
    const discValue = price * qty * (disc / 100);
    const secQty = line.secondaryQuantity || 0;

    const rowData = [
      String(i + 1),
      line.productName || '—',
      String(qty),
      line.unitName || 'قطعة',
      fmt(price),
      discValue > 0 ? fmt(discValue) : '0.00',
      fmt(subtotal),
      secQty > 0 ? `${secQty} ${line.secondaryUnit || ''}` : '—',
    ];

    cx = tableLeft;
    const bgColor = i % 2 === 1 ? '#f9f9f9' : '#fff';
    drawRect(ctx, tableLeft, y, tableWidth, rowH, bgColor);

    for (let j = 0; j < cols.length; j++) {
      drawRect(ctx, cx, y, cols[j].width, rowH, undefined, '#000');
      const align: CanvasTextAlign = j === 1 ? 'right' : 'center';
      const tx = j === 1 ? cx + cols[j].width - 6 : cx + cols[j].width / 2;
      ctx.fillStyle = '#000';
      // Truncate long product names
      let text = rowData[j];
      if (j === 1 && ctx.measureText(text).width / SCALE > cols[j].width - 10) {
        while (ctx.measureText(text + '...').width / SCALE > cols[j].width - 10 && text.length > 0) {
          text = text.slice(0, -1);
        }
        text += '...';
      }
      drawText(ctx, text, tx, y + 19, align);
      cx += cols[j].width;
    }
    y += rowH;
  }

  // ── Totals Section ──
  y += 15;
  const totalsWidth = 320;
  const totalsLeft = (A4_W - totalsWidth) / 2;
  const labelW = totalsWidth / 2;
  const valueW = totalsWidth / 2;

  const totalDiscount = data.lines.reduce((sum, l) => {
    return sum + ((l.priceUnit || 0) * (l.quantity || 0) * ((l.discount1 || 0) / 100));
  }, 0);

  const totals = [
    { label: 'الإجمالي قبل الخصم', value: fmt(data.amountUntaxed), bg: '#f9f9f9' },
    { label: 'الخصم', value: fmt(totalDiscount), bg: '#f9f9f9' },
    { label: 'الضريبة', value: fmt(data.amountTax), bg: '#f9f9f9' },
    { label: 'الصافي بعد الخصم', value: fmt(data.amountTotal), bg: '#e3f2fd' },
  ];

  setFont(ctx, 11, true);

  for (const row of totals) {
    // Label cell
    drawRect(ctx, totalsLeft + valueW, y, labelW, rowH, row.bg, '#000');
    ctx.fillStyle = '#000';
    drawText(ctx, row.label, totalsLeft + valueW + labelW / 2, y + 19, 'center');

    // Value cell
    drawRect(ctx, totalsLeft, y, valueW, rowH, '#fff', '#000');
    drawText(ctx, row.value, totalsLeft + valueW / 2, y + 19, 'center');

    y += rowH;
  }

  // ── Total Footer ──
  y += 20;
  setFont(ctx, 13, true);
  ctx.fillStyle = '#000';
  drawText(ctx, `اجمالي ${typeLabel} : ${fmt(data.amountTotal)}`, A4_W / 2, y, 'center');
}

/**
 * Generate a purchase order PDF (direct canvas render → PDF download)
 */
export async function generatePurchaseOrderPdf(data: PurchaseOrderPdfData): Promise<Blob> {
  await loadArabicFont();

  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  renderInvoiceOnCanvas(ctx, data, 'purchase');

  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  return pdf.output('blob');
}

/**
 * Generate a sale order PDF (direct canvas render → PDF download)
 */
export async function generateSaleOrderPdf(data: SaleOrderPdfData): Promise<Blob> {
  await loadArabicFont();

  const canvas = document.createElement('canvas');
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext('2d')!;

  renderInvoiceOnCanvas(ctx, data, 'sale');

  const jsPDF = (await import('jspdf')).default;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
  return pdf.output('blob');
}
