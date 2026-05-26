import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

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
  const { locale, id } = await props.params;
  const session = await getSession();

  if (!session) redirect(`/${locale}/login`);

  /* Fetch Order with Relations */
  const order = await prisma.purchaseOrder.findUnique({
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

  if (!order) notFound();

  return (
    <div className="bg-white min-h-screen text-black print:p-0 print:bg-white font-sans" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
        body, div, table, th, td { font-family: 'Cairo', sans-serif; }
        @media print {
          @page { size: A4; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
        }
        .classic-table th, .classic-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: center;
        }
        .classic-table th { font-weight: bold; background-color: #fff; }
      `}</style>

      {/* Control Bar (No Print) */}
      <div className="fixed top-8 left-8 flex flex-col gap-3 no-print z-50">
        <button onClick={() => {}} className="no-print">
          <a href="javascript:window.print()" className="bg-slate-800 text-white p-4 rounded-full shadow-lg hover:bg-slate-900 flex items-center justify-center" title="طباعة">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.728 13.5H17.27m-10.54 3h10.54M6.728 10.5h10.54M3 7.5h18m-1.5 0v10.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18.5V7.5m15 0v-3a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v3" />
            </svg>
          </a>
        </button>
      </div>

      <div className="max-w-[21cm] mx-auto p-8 pt-12 relative bg-white">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-10">
          <div className="w-[200px]">
            {/* Logo placeholder - simulating the HSN GROUP logo */}
            <div className="flex items-center gap-1">
              <h1 className="text-4xl font-black text-blue-800 tracking-tighter m-0 p-0 leading-none">H<span className="text-red-600">S</span>N</h1>
            </div>
            <div className="text-red-600 font-bold tracking-widest text-sm mt-1">GROUP</div>
          </div>
          <div className="text-left flex flex-col items-end pt-2">
            <h1 className="text-3xl font-extrabold text-black">النجار للأدوات الصحية</h1>
            <h2 className="text-2xl font-bold text-red-700 mt-6" style={{ color: '#b91c1c' }}>
              رقم أمر شراء {order.name}
            </h2>
          </div>
        </div>

        {/* Info Rows */}
        <div className="flex justify-between items-center mb-6 mt-4">
          <div className="text-base font-bold text-black">
            تحريراً في : {new Date(order.dateOrder).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div className="text-base font-bold text-black">
            نوع الطلب : دفتر / المشتريات
          </div>
        </div>

        <div className="text-xl font-bold text-black mb-4">
          أسم المورد : {order.partner?.name || "—"}
        </div>

        {/* Lines Table */}
        <table className="w-full classic-table mb-8 text-sm" style={{ borderCollapse: 'collapse', border: '1px solid #000' }}>
          <thead>
            <tr>
              <th className="w-12">م.</th>
              <th className="text-right">اسم الصنف</th>
              <th className="w-24">الكمية</th>
              <th className="w-20">الوحدة</th>
              <th className="w-24">سعر الوحدة</th>
              <th className="w-24">قيمة الخصم</th>
              <th className="w-32">الاجمالي</th>
              <th className="w-32">الكمية الثانوية</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line: any, index: number) => {
              // Ensure numeric values since Prisma might return Decimal objects
              const qty = Number(line.quantity || 0);
              const priceUnit = Number(line.priceUnit || 0);
              const discount1 = Number(line.discount1 || 0);
              const subtotal = Number(line.priceSubtotal || 0);
              const secondaryQty = Number(line.secondaryQty || 0);
              
              // Calculate discount amount
              const discountValue = priceUnit * qty * (discount1 / 100);
              return (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td className="text-right font-bold pr-2">{line.product?.name || line.name || "—"}</td>
                  <td>{qty}</td>
                  <td>{line.unitName || line.uom || 'قطعه'}</td>
                  <td>{priceUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{discountValue > 0 ? discountValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</td>
                  <td>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td>{secondaryQty > 0 ? `${secondaryQty} ${line.secondaryUom || ''}` : '0.00'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Table */}
        <table className="w-full classic-table mb-8 font-bold text-base" style={{ borderCollapse: 'collapse', border: '1px solid #000' }}>
          <tbody>
            <tr>
              <td className="w-1/2 text-right pr-4">الإجمالي قبل الخصم</td>
              <td className="w-1/2">{Number(order.amountUntaxed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="text-right pr-4">الخصم</td>
              <td>{order.lines.reduce((sum: number, line: any) => sum + (Number(line.priceUnit || 0) * Number(line.quantity || 0) * (Number(line.discount1 || 0) / 100)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="text-right pr-4">الضريبة</td>
              <td>{Number(order.amountTax || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td className="text-right pr-4">الصافي بعد الخصم</td>
              <td>{Number(order.amountTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        {/* Text Amount */}
        <div className="font-bold text-lg mb-2">
          اجمالي أمر الشراء : {Number(order.amountTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} فقط لا غير
        </div>
        <div className="text-base text-black mb-12">
          {/* Real Tafqeet would go here */}
        </div>

      </div>
    </div>
  );
}