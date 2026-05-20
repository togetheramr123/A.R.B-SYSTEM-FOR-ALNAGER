import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getQuoteAvailabilityReport } from "@/app/actions/inventoryAvailability";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { TopPortal } from "@/components/common/TopPortal";
import { ClientPrintButton } from "@/components/common/ClientPrintButton";
export default async function AvailabilityReportPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const params = await props.params;
  const locale = params.locale;
  const orderId = params.id; // Fetch Order
  const order = await prisma.saleOrder.findUnique({
    where: {
      id: orderId
    },
    include: {
      partner: true,
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  if (!order) {
    return notFound();
  } // Extract product IDs
  const productIds = order.lines.map(line => line.productId).filter(Boolean) as string[];
  const reportData = await getQuoteAvailabilityReport(productIds);
  return <div className="bg-slate-100 min-h-screen py-4 px-4 sm:px-8 font-sans print:p-0 print:bg-white print:min-h-0" dir={locale === "ar" ? "rtl" : "ltr"}>
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse print:hidden" dir={locale === "ar" ? "rtl" : "ltr"}>
          {" "}
          <Link href={`/${locale}/sales/${orderId}`} className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-gray-50 transition-colors flex items-center gap-1">
            {" "}
            {locale === "ar" ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}{" "}
            عودة لعرض السعر{" "}
          </Link>{" "}
          <ClientPrintButton />{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="max-w-[1200px] mx-auto pb-20 print:w-full print:max-w-none print:m-0 print:p-0">
        {" "}
        <div className="bg-white border border-slate-300 shadow-sm print:shadow-none print:border-none print:p-0 rounded-sm p-8 sm:p-12 min-h-[600px] print:min-h-0 relative">
          {" "}
          {/* Header */}{" "}
          <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-start">
            {" "}
            <div>
              {" "}
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                تقرير التوافر والرصيد
              </h1>{" "}
              <p className="text-sm font-semibold text-slate-500">
                {" "}
                عرض السعر:{" "}
                <span className="text-slate-800 font-bold">
                  {order.name}
                </span>{" "}
              </p>{" "}
              <p className="text-[13px] font-semibold text-gray-600">
                {" "}
                العميل:{" "}
                <span className="text-black font-bold">
                  {order.partner?.name || "غير محدد"}
                </span>{" "}
              </p>{" "}
            </div>{" "}
            <div className="text-left">
              {" "}
              <p className="text-xs text-slate-500 mb-1">تاريخ التقرير</p>{" "}
              <p className="text-sm font-bold text-slate-800">
                {new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {/* Table */}{" "}
          <div className="overflow-x-auto">
            {" "}
            <table className="w-full text-[13px] text-right text-black border-collapse border border-gray-300">
              {" "}
              <thead>
                {" "}
                <tr className="bg-gray-100">
                  {" "}
                  <th className="py-1.5 px-2 font-bold align-middle w-1/4 border border-gray-300">
                    الصنف
                  </th>{" "}
                  <th className="py-1.5 px-2 font-bold align-middle text-center border border-gray-300">
                    المطلوب
                  </th>{" "}
                  <th className="py-1.5 px-2 font-bold align-middle w-1/4 border border-gray-300">
                    الكميات المحجوزة
                  </th>{" "}
                  <th className="py-1.5 px-2 font-bold align-middle text-center border border-gray-300">
                    المتاح (بعد الحجز)
                  </th>{" "}
                  <th className="py-1.5 px-2 font-bold align-middle text-center border border-gray-300">
                    الصافي بعد صرف الكل
                  </th>{" "}
                  <th className="py-1.5 px-2 font-bold align-middle text-center border border-gray-300">
                    الصافي بعد صرف الكل (ثانوي)
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {order.lines.map((line, index) => {
                if (!line.productId) return null;
                const availability = reportData.find(r => r.productId === line.productId);
                const requestedQty = Number(line.quantity || 0);
                const availableStock = availability?.availableStock || 0;
                const expectedBalance = availableStock - requestedQty;
                const isNegativeBalance = expectedBalance < 0;
                const secondaryUom = availability?.secondaryUom;
                const hasSecondary = availability?.hasSecondaryUnit && secondaryUom;
                const factor = availability?.secondaryUomFactor || 1;
                const balanceSecondary = hasSecondary ? (expectedBalance / factor).toFixed(2) : "-";
                return <tr key={line.id} className="hover:bg-gray-50 transition-colors">
                      {" "}
                      <td className="py-1.5 px-2 font-bold text-black align-top border border-gray-300">
                        {" "}
                        {line.name || availability?.productName}{" "}
                      </td>{" "}
                      <td className="py-1.5 px-2 text-center align-top border border-gray-300">
                        {" "}
                        {requestedQty} {availability?.uom}{" "}
                      </td>{" "}
                      <td className="py-1 px-2 align-top border border-gray-300">
                        {" "}
                        {availability && availability.reservations.length > 0 ? <div className="space-y-0.5">
                            {" "}
                            {availability.reservations.map(res => <div key={res.id} className="flex justify-between items-start text-black py-0.5 border-b border-gray-200 last:border-0">
                                {" "}
                                <span className="font-bold shrink-0 ml-2">
                                  {res.quantity} {availability.uom}
                                </span>{" "}
                                <span className="flex-1 text-left text-xs" dir="ltr">
                                  {res.partnerName}
                                </span>{" "}
                              </div>)}{" "}
                          </div> : <span className="text-gray-500 italic text-xs">
                            لا توجد حجوزات
                          </span>}{" "}
                      </td>{" "}
                      <td className="py-1.5 px-2 text-center align-top border border-gray-300">
                        {" "}
                        {availableStock} {availability?.uom}{" "}
                      </td>{" "}
                      <td className="py-1.5 px-2 text-center align-top font-bold border border-gray-300">
                        {" "}
                        <span className={isNegativeBalance ? "text-red-600" : "text-black"}>
                          {" "}
                          {expectedBalance} {availability?.uom}{" "}
                        </span>{" "}
                      </td>{" "}
                      <td className="py-1.5 px-2 text-center align-top font-bold border border-gray-300">
                        {" "}
                        {hasSecondary ? <span className={isNegativeBalance ? "text-red-600" : "text-black"}>
                            {" "}
                            {balanceSecondary} {secondaryUom}{" "}
                          </span> : <span className="text-gray-400">-</span>}{" "}
                      </td>{" "}
                    </tr>;
              })}{" "}
              </tbody>{" "}
            </table>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Print Styles Overlay to hide Next.js layout headers if needed */}{" "}
      <style dangerouslySetInnerHTML={{
      __html: ` @media print { @page { size: A4 portrait; margin: 0mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; margin: 15mm !important; } /* Hide browser-injected elements if any, and all fixed floating widgets (like chat robots) */ .fixed, [class*="fixed"] { display: none !important; } #module-nav-portal, #top-actions-portal, header, nav, aside { display: none !important; } main { padding: 0 !important; margin: 0 !important; background: white !important; } .print\\:border-none { border: none !important; } .print\\:shadow-none { box-shadow: none !important; } .print\\:w-full { w-full !important; } } `
    }} />{" "}
    </div>;
}