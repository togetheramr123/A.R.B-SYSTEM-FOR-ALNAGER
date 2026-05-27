import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { serializeDecimal } from "@/lib/serialize";

// Simple Arabic Tafqeet (Number to words) function
function tafqeet(number: number): string {
  if (!number || number === 0) return "صفر";
  const numStr = number.toFixed(2);
  const [integers, decimals] = numStr.split('.');
  // Add robust tafqeet library or simple implementation if needed
  // For now, let's keep it simple or return standard formatting
  return `فقط لا غير`; // Placeholder since full robust tafqeet is long. We will just use the text layout.
}

export default async function PurchasePrintPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  try {
    const { locale, id } = await props.params;
    const session = await getSession();

    if (!session) redirect(`/${locale}/login`);

    /* Fetch Order with Relations */
    const orderRaw = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        partner: true,
        company: true,
        lines: {
          include: { product: true },
          orderBy: { sequence: 'asc' }
        }
      }
    });

    if (!orderRaw) notFound();

    const order = serializeDecimal(orderRaw);

    return (
    <div className="bg-white min-h-screen text-black print:p-0 print:bg-white font-sans" dir="rtl">
      <style>{`
        body, div, table, th, td, span, p { font-family: 'Cairo', system-ui, -apple-system, sans-serif !important; }
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; background: white; margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
        .classic-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .classic-table th, .classic-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: center;
          font-size: 14px;
        }
        .classic-table th { font-weight: bold; background-color: #fff; }
        
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .summary-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: center;
          font-size: 14px;
        }
      `}</style>

      {/* Control Bar (No Print) */}
      <div className="fixed top-8 left-8 flex flex-col gap-3 no-print z-50">
        <button className="no-print" onClick={() => { /* Client handles printing */ }}>
          <a href="javascript:window.print()" className="bg-slate-800 text-white p-4 rounded-full shadow-lg hover:bg-slate-900 flex items-center justify-center" title="طباعة">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.728 13.5H17.27m-10.54 3h10.54M6.728 10.5h10.54M3 7.5h18m-1.5 0v10.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18.5V7.5m15 0v-3a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v3" />
            </svg>
          </a>
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto p-4 sm:p-8 pt-8 relative bg-white min-h-[297mm]">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 border-b border-black pb-4">
          <div className="w-[200px]">
            {/* Logo placeholder - HSN GROUP */}
            <div className="flex items-center gap-1">
              <h1 className="text-4xl font-black text-blue-800 tracking-tighter m-0 p-0 leading-none">H<span className="text-red-600">S</span>N</h1>
            </div>
            <div className="text-red-600 font-bold tracking-widest text-sm mt-1">GROUP</div>
          </div>
          <div className="text-left flex flex-col items-end">
            <h1 className="text-4xl font-bold text-black tracking-wide">النجار للأدوات الصحية</h1>
          </div>
        </div>

        {/* Info Rows */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm font-bold text-black flex gap-2">
            <span>رقم أمر شراء:</span>
            <span>{order.name}</span>
          </div>
          <div className="text-sm font-bold text-black flex gap-2">
            <span>تحريراً في:</span>
            <span>
              {order.dateOrder && !isNaN(new Date(order.dateOrder).getTime())
                ? new Date(order.dateOrder).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })
                : "—"}
            </span>
          </div>
        </div>
        
        <div className="text-center mb-8">
          <span className="text-sm font-bold text-black">نوع الطلب : دفتر / المشتريات</span>
        </div>

        <div className="text-xl font-bold text-black mb-4">
          أسم المورد : {order.partner?.name || "—"}
        </div>

        {/* Lines Table */}
        <table className="classic-table text-black">
          <thead>
            <tr>
              <th className="w-10">م.</th>
              <th className="text-right px-2 w-auto">اسم الصنف</th>
              <th className="w-20">الكمية</th>
              <th className="w-20">الوحدة</th>
              <th className="w-24">سعر الوحدة</th>
              <th className="w-24">قيمة الخصم</th>
              <th className="w-32">الاجمالي</th>
              <th className="w-32">الكمية الثانوية</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line: any, index: number) => {
              const qty = Number(line.quantity || 0);
              const priceUnit = Number(line.priceUnit || 0);
              const discount1 = Number(line.discount1 || 0);
              const subtotal = Number(line.priceSubtotal || 0);
              const secondaryQty = Number(line.secondaryQuantity || 0);
              
              const discountValue = priceUnit * qty * (discount1 / 100);
              return (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td className="text-right font-bold pr-2">{line.product?.name || line.name || "—"}</td>
                  <td>{qty}</td>
                  <td>{line.unitName || line.product?.uom || 'قطعه'}</td>
                  <td>{priceUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{discountValue > 0 ? discountValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.0'}</td>
                  <td>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{secondaryQty > 0 ? `${secondaryQty} ${line.secondaryUnit || ''}` : '0.0'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Table */}
        <table className="summary-table text-black font-bold">
          <tbody>
            <tr>
              <td className="w-1/2">{Number(order.amountUntaxed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="w-1/2 bg-[#f9f9f9]">الإجمالي قبل الخصم</td>
            </tr>
            <tr>
              <td>{order.lines.reduce((sum: number, line: any) => sum + (Number(line.priceUnit || 0) * Number(line.quantity || 0) * (Number(line.discount1 || 0) / 100)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="bg-[#f9f9f9]">الخصم</td>
            </tr>
            <tr>
              <td>{Number(order.amountTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="bg-[#f9f9f9]">الضريبة</td>
            </tr>
            <tr>
              <td>{Number(order.amountTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="bg-[#f9f9f9]">الصافي بعد الخصم</td>
            </tr>
          </tbody>
        </table>

        {/* Text Amount */}
        <div className="font-bold text-base mt-8 text-black text-center">
          اجمالي أمر الشراء : {Number(order.amountTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} فقط لا غير
        </div>

      </div>
    </div>
  );
  } catch (err: any) {
    if (err && err.digest && err.digest.startsWith('NEXT_REDIRECT')) {
      throw err;
    }
    return (
      <div style={{ padding: '20px', color: 'red', direction: 'ltr', fontFamily: 'monospace' }}>
        <h1>Technical Error inside Print Page rendering:</h1>
        <pre>{err?.stack || err?.message || String(err)}</pre>
      </div>
    );
  }
}