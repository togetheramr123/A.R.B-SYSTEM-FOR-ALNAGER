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
  const {
    locale,
    id
  } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  /* Fetch Order with Relations */
  const order = await prisma.purchaseOrder.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      company: true,
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  if (!order) notFound();
  return <div className="bg-white min-h-screen p-8 text-black print:p-0">
      {" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { @page { size: A4; margin: 1cm; } body { -webkit-print-color-adjust: exact; } .no-print { display: none !important; } } `}</style>{" "}
      <div className="max-w-[21cm] mx-auto border border-gray-200 shadow-sm print:border-0 print:shadow-none p-8 min-h-[29.7cm] flex flex-col relative bg-white">
        {" "}
        {/* Control Bar (No Print) */}{" "}
        <div className="absolute top-0 right-full mr-4 flex flex-col gap-2 no-print">
          {" "}
          <a
        href="javascript:window.print()" className="bg-blue-600 text-white p-3 rounded-full shadow-sm hover:bg-blue-700 transition" title="Print">
            {" "}
            🖨️{" "}
          </a>{" "}
          <a href={`/${locale}/purchases/${id}`} className="bg-gray-600 text-white p-3 rounded-full shadow-sm hover:bg-gray-700 transition flex items-center justify-center" title="Back">
            {" "}
            ↩️{" "}
          </a>{" "}
        </div>{" "}
        {/* Header */}{" "}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          {" "}
          <div>
            {" "}
            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              أمر شراء
            </h1>{" "}
            <p className="text-xl text-slate-600 font-medium">
              {order.name}
            </p>{" "}
          </div>{" "}
          <div className="text-right">
            {" "}
            <h2 className="text-lg font-bold text-slate-800">
              {order.company?.name || "اسم الشركة"}
            </h2>{" "}
            <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed mt-1">
              {" "}
              {order.company?.email || "admin@company.com"}
              <br /> {order.company?.phone || "+20 123 456 7890"}{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Info Grid */}{" "}
        <div className="grid grid-cols-2 gap-12 mb-10">
          {" "}
          <div>
            {" "}
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2 tracking-wider">
              المورد
            </h3>{" "}
            <div className="text-slate-800 font-semibold text-lg">
              {order.partner?.name || "—"}
            </div>{" "}
            <div className="text-slate-500 text-sm mt-1">
              {" "}
              {order.partner?.phone && <div>{order.partner.phone}</div>}{" "}
              {order.partner?.email && <div>{order.partner.email}</div>}{" "}
              {[order.partner?.street, order.partner?.street2, order.partner?.city, order.partner?.country].filter(Boolean).join(", ") && <div>
                  {[order.partner?.street, order.partner?.street2, order.partner?.city, order.partner?.country].filter(Boolean).join(", ")}
                </div>}{" "}
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <div className="flex justify-between mb-2">
              {" "}
              <span className="text-slate-500 font-medium">
                تاريخ الطلب:
              </span>{" "}
              <span className="font-bold text-slate-900">
                {new Date(order.dateOrder).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
              </span>{" "}
            </div>{" "}
            <div className="flex justify-between mb-2">
              {" "}
              <span className="text-slate-500 font-medium">
                مرجع المورد:
              </span>{" "}
              <span className="font-bold text-slate-900">-</span>{" "}
            </div>{" "}
            <div className="flex justify-between">
              {" "}
              <span className="text-slate-500 font-medium">الحالة:</span>{" "}
              <span className="font-bold text-slate-900 uppercase">
                {" "}
                {order.status === "draft" ? "مسودة" : order.status === "purchase" ? "مؤكد" : order.status}{" "}
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Table */}{" "}
        <table className="w-full mb-8">
          {" "}
          <thead>
            {" "}
            <tr className="bg-slate-100 text-slate-700 text-sm">
              {" "}
              <th className="py-3 px-4 text-right font-bold border-y border-slate-200">
                المنتج
              </th>{" "}
              <th className="py-3 px-4 text-center font-bold border-y border-slate-200">
                الكمية
              </th>{" "}
              <th className="py-3 px-4 text-center font-bold border-y border-slate-200">
                سعر الوحدة
              </th>{" "}
              <th className="py-3 px-4 text-left font-bold border-y border-slate-200 w-[120px]">
                المجموع
              </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="text-sm text-slate-800">
            {" "}
            {order.lines.map((line: any) => <tr key={line.id} className="border-b border-slate-50">
                {" "}
                <td className="py-3 px-4 text-right">
                  {" "}
                  <div className="font-bold max-w-[300px] truncate">
                    {line.product?.name}
                  </div>{" "}
                  <div className="text-xs text-slate-500 mt-1 truncate">
                    {line.name}
                  </div>{" "}
                </td>{" "}
                <td className="py-3 px-4 text-center">{line.quantity}</td>{" "}
                <td className="py-3 px-4 text-center">
                  {line.priceUnit.toFixed(2)}
                </td>{" "}
                <td className="py-3 px-4 text-left font-medium">
                  {line.priceSubtotal.toFixed(2)}
                </td>{" "}
              </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
        {/* Footer Totals */}{" "}
        <div className="flex justify-end mt-auto mb-12">
          {" "}
          <div className="w-[8cm]">
            {" "}
            <div className="flex justify-between py-2 border-b border-slate-200 text-slate-600 text-sm">
              {" "}
              <span>الإجمالي قبل الضريبة</span>{" "}
              <span>{order.amountUntaxed.toFixed(2)}</span>{" "}
            </div>{" "}
            <div className="flex justify-between py-2 border-b border-slate-200 text-slate-600 text-sm">
              {" "}
              <span>الضرائب (14%)</span>{" "}
              <span>{order.amountTax.toFixed(2)}</span>{" "}
            </div>{" "}
            <div className="flex justify-between py-3 text-lg font-bold text-slate-900">
              {" "}
              <span>الإجمالي</span>{" "}
              <span>{order.amountTotal.toFixed(2)} ج.م</span>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Signature / Footer Text */}{" "}
        <div className="mt-auto border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          {" "}
          <p>Generated by Smart ERP Solutions</p>{" "}
        </div>{" "}
        {/* Auto Print Script */}{" "}
        <script dangerouslySetInnerHTML={{
        __html: ` function printPage() { window.print(); } `
      }} />{" "}
      </div>{" "}
    </div>;
}