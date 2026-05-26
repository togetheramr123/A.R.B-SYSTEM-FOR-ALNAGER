import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

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
        include: { product: true }
      }
    }
  });

  if (!order) notFound();

  // Determine standard colors for the theme
  const primaryColor = "#017E84"; // A deep teal often used in this project
  const isRTL = locale === 'ar';

  return (
    <div className="bg-slate-100 min-h-screen p-8 text-black print:p-0 print:bg-white font-sans" dir={isRTL ? "rtl" : "ltr"}>
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; background: white; margin: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; }
        }
      `}</style>

      {/* Control Bar (No Print) */}
      <div className="fixed top-8 right-8 flex flex-col gap-3 no-print z-50">
        <button onClick={() => {
          // Provide a way to print from the client
        }} className="no-print">
          <a href="javascript:window.print()" className="bg-[#017E84] text-white p-4 rounded-full shadow-lg hover:bg-[#01656a] transition-transform hover:scale-105 flex items-center justify-center" title="طباعة">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.728 13.5H17.27m-10.54 3h10.54M6.728 10.5h10.54M3 7.5h18m-1.5 0v10.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18.5V7.5m15 0v-3a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v3" />
            </svg>
          </a>
        </button>
        <a href={`/${locale}/purchases/${id}`} className="bg-slate-700 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-transform hover:scale-105 flex items-center justify-center" title="رجوع">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
        </a>
      </div>

      <div className="max-w-[21cm] mx-auto bg-white shadow-2xl print:shadow-none min-h-[29.7cm] flex flex-col relative overflow-hidden print:overflow-visible">
        {/* Top Accent Bar */}
        <div className="h-4 w-full" style={{ backgroundColor: primaryColor }}></div>

        <div className="p-10 flex-1 flex flex-col">
          {/* Header Section */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex flex-col">
              {/* Logo Placeholder / Name */}
              <div className="mb-2">
                <span className="text-3xl font-extrabold tracking-tight" style={{ color: primaryColor }}>
                  {order.company?.name || "HSN GROUP"}
                </span>
              </div>
              <div className="text-sm text-slate-500 leading-relaxed max-w-[250px]">
                {order.company?.street && <span>{order.company.street}<br/></span>}
                {order.company?.city && <span>{order.company.city}<br/></span>}
                {order.company?.email && <span>{order.company.email}<br/></span>}
                {order.company?.phone && <span>{order.company.phone}</span>}
                {!order.company?.street && !order.company?.email && (
                  <>
                    شارع التسعين، التجمع الخامس<br/>
                    القاهرة، مصر<br/>
                    info@hsngroup.com<br/>
                    +20 123 456 7890
                  </>
                )}
              </div>
            </div>

            <div className="text-left flex flex-col items-end">
              <h1 className="text-5xl font-black text-slate-100 uppercase tracking-widest mb-2" style={{ WebkitTextStroke: '1px #cbd5e1' }}>
                {order.status === 'draft' ? 'طلب تسعير' : 'أمر شراء'}
              </h1>
              <div className="text-2xl font-bold text-slate-800 mb-1">{order.name}</div>
              <div className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                التاريخ: {new Date(order.dateOrder).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          <hr className="border-slate-200 mb-8" />

          {/* Info Cards */}
          <div className="flex justify-between gap-8 mb-12">
            {/* Vendor Info */}
            <div className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: primaryColor }}>إلى المورد</h3>
              <div className="text-lg font-bold text-slate-900 mb-1">{order.partner?.name || "—"}</div>
              <div className="text-sm text-slate-600 leading-relaxed">
                {[order.partner?.street, order.partner?.street2].filter(Boolean).join("، ")}
                {order.partner?.city && <><br/>{order.partner.city}</>}
                {order.partner?.country && <><br/>{order.partner.country}</>}
                {order.partner?.phone && <><br/><span className="text-slate-500 font-medium mt-1 inline-block">{order.partner.phone}</span></>}
                {order.partner?.email && <><br/><span className="text-slate-500 font-medium">{order.partner.email}</span></>}
              </div>
            </div>

            {/* Additional Order Info */}
            <div className="flex-1 bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-slate-500">مرجع المورد:</span>
                <span className="text-sm font-bold text-slate-800">{order.partnerRef || "—"}</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-slate-500">طريقة الدفع:</span>
                <span className="text-sm font-bold text-slate-800">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-500">حالة الطلب:</span>
                <span className="text-sm font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: order.status === 'purchase' ? primaryColor : '#64748b' }}>
                  {order.status === "draft" ? "مسودة / قيد المراجعة" : order.status === "purchase" ? "مؤكد ومُعتمد" : order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Lines Table */}
          <div className="mb-8 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm text-right">
              <thead style={{ backgroundColor: primaryColor }} className="text-white">
                <tr>
                  <th className="py-4 px-5 font-bold">#</th>
                  <th className="py-4 px-5 font-bold">المنتج / الوصف</th>
                  <th className="py-4 px-5 font-bold text-center">الكمية</th>
                  <th className="py-4 px-5 font-bold text-center">سعر الوحدة</th>
                  <th className="py-4 px-5 font-bold text-center">الخصم</th>
                  <th className="py-4 px-5 font-bold text-left">المجموع</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {order.lines.map((line: any, index: number) => (
                  <tr key={line.id} className="hover:bg-slate-50 transition-colors page-break">
                    <td className="py-4 px-5 font-medium text-slate-400">{index + 1}</td>
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-800 text-base">{line.product?.name || "—"}</div>
                      {line.name && line.name !== line.product?.name && (
                        <div className="text-xs text-slate-500 mt-1">{line.name}</div>
                      )}
                    </td>
                    <td className="py-4 px-5 text-center font-bold text-slate-700">
                      {line.quantity} <span className="text-xs font-normal text-slate-400">{line.unitName || ''}</span>
                    </td>
                    <td className="py-4 px-5 text-center text-slate-700">
                      {line.priceUnit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-5 text-center text-slate-700">
                      {line.discount1 > 0 ? `${line.discount1}%` : '-'}
                    </td>
                    <td className="py-4 px-5 text-left font-bold text-slate-900">
                      {line.priceSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end mb-12 page-break">
            <div className="w-[10cm] bg-slate-50 rounded-xl p-5 border border-slate-100">
              <div className="flex justify-between py-2 text-sm">
                <span className="font-semibold text-slate-500">الإجمالي قبل الضريبة:</span>
                <span className="font-bold text-slate-800">{order.amountUntaxed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between py-2 text-sm border-b border-slate-200">
                <span className="font-semibold text-slate-500">الضرائب:</span>
                <span className="font-bold text-slate-800">{order.amountTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between pt-4 pb-2 text-xl">
                <span className="font-black text-slate-900">الصافي المطلوب:</span>
                <span className="font-black" style={{ color: primaryColor }}>
                  {order.amountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م
                </span>
              </div>
            </div>
          </div>

          {/* Terms and Notes */}
          {order.notes && (
            <div className="mb-12 page-break">
              <h3 className="text-sm font-bold text-slate-800 mb-2">الشروط والأحكام / ملاحظات:</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                {order.notes}
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="mt-auto pt-12 grid grid-cols-2 gap-8 text-center page-break">
            <div>
              <div className="w-48 mx-auto border-b-2 border-slate-300 mb-2 pb-8"></div>
              <p className="text-sm font-bold text-slate-600">توقيع المشتري / الاعتماد</p>
            </div>
            <div>
              <div className="w-48 mx-auto border-b-2 border-slate-300 mb-2 pb-8"></div>
              <p className="text-sm font-bold text-slate-600">توقيع المورد بالاستلام</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 text-center text-xs text-slate-400">
          تم إنشاء هذا المستند آلياً عبر نظام <strong>Smart ERP</strong> - HSN Group
        </div>
      </div>
    </div>
  );
}