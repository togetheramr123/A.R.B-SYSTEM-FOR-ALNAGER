"use client";

import { useState } from "react";
import Link from "next/link";
interface PurchaseOrderTabsProps {
  order: any;
  locale: string;
}
export function PurchaseOrderTabs({
  order,
  locale
}: PurchaseOrderTabsProps) {
  const [activeTab, setActiveTab] = useState<"lines" | "otherInfo">("lines");
  return <div className="mt-8">
      {" "}
      {/* Tab Headers — Interactive Notebook */}{" "}
      <div className="border-b border-slate-300 flex text-sm">
        {" "}
        <button onClick={() => setActiveTab("lines")} className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === "lines" ? "border-sky-600 text-sky-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
          {" "}
          المنتجات{" "}
        </button>{" "}
        <button onClick={() => setActiveTab("otherInfo")} className={`px-4 py-2 border-b-2 font-medium transition-colors ${activeTab === "otherInfo" ? "border-sky-600 text-sky-700" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
          {" "}
          معلومات أخرى{" "}
        </button>{" "}
      </div>{" "}
      {/* Tab Content */}{" "}
      <div className="py-4">
        {" "}
        {activeTab === "lines" && <ProductLinesTab order={order} locale={locale} />}{" "}
        {activeTab === "otherInfo" && <OtherInfoTab order={order} />}{" "}
      </div>{" "}
    </div>;
} // ─── Tab 1: Product Lines ───────────────────────────────────────────────
function ProductLinesTab({
  order,
  locale
}: {
  order: any;
  locale: string;
}) {
  return <>
      {" "}
      <div className="overflow-x-auto">
        {" "}
        <table className="w-full text-right text-sm">
          {" "}
          <thead className="text-slate-500 font-medium border-b border-slate-200">
            {" "}
            <tr>
              {" "}
              <th className="py-2 pr-4 font-bold text-slate-700 text-right">
                المنتج
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-right">
                الوصف
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-center">
                الكمية
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-center">
                تم الاستلام
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-center">
                مفوتر
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-center">
                وحدة القياس
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-left">
                سعر الوحدة
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-center">
                خصم %
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-left">
                صافي السعر
              </th>{" "}
              <th className="py-2 px-2 font-bold text-slate-700 text-left">
                الضرائب
              </th>{" "}
              <th className="py-2 pl-4 font-bold text-slate-700 text-left">
                المجموع
              </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {order.lines.map((line: any) => {
            const discount = Number(line.discount || 0);
            const priceUnit = Number(line.priceUnit);
            const netPrice = priceUnit * (1 - discount / 100);
            return <tr key={line.id} className="group hover:bg-slate-50">
                  {" "}
                  <td className="py-2.5 pr-4 align-top text-sky-700 text-right">
                    {" "}
                    {line.product ? <Link href={`/${locale}/inventory/products/${line.product.id}`} className="hover:underline">
                        {" "}
                        {line.product.name}{" "}
                      </Link> : line.name}{" "}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-slate-600 text-right">
                    {line.name}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-center text-slate-900">
                    {Number(line.quantity).toLocaleString("en-US")}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-center text-slate-500">
                    {Number(line.qtyReceived || 0).toLocaleString("en-US")}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-center text-slate-500">
                    {Number(line.qtyInvoiced || 0).toLocaleString("en-US")}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-center text-slate-500">
                    {line.product?.uomName || "وحدة"}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-left text-slate-900">
                    {priceUnit.toFixed(2)}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-center text-slate-500">
                    {discount > 0 ? `${discount.toFixed(1)}%` : "-"}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-left text-slate-900">
                    {netPrice.toFixed(2)}
                  </td>{" "}
                  <td className="py-2.5 px-2 align-top text-left text-slate-500">
                    -
                  </td>{" "}
                  <td className="py-2.5 pl-4 align-top text-left text-slate-900 font-medium">
                    {Number(line.priceSubtotal).toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}{" "}
                    LE
                  </td>{" "}
                </tr>;
          })}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
      {/* Totals */}{" "}
      <div className="flex justify-start mt-4">
        {" "}
        <div className="w-1/3 min-w-[250px] space-y-2 text-sm border-t-2 border-slate-200 pt-4">
          {" "}
          <div className="flex justify-between text-slate-700">
            {" "}
            <span>غير شامل الضريبة:</span>{" "}
            <span>
              {Number(order.amountUntaxed).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              LE
            </span>{" "}
          </div>{" "}
          <div className="flex justify-between text-slate-700">
            {" "}
            <span>الضرائب:</span>{" "}
            <span>
              {Number(order.amountTax).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              LE
            </span>{" "}
          </div>{" "}
          <div className="flex justify-between text-slate-900 font-bold text-lg border-t border-slate-300 pt-2">
            {" "}
            <span>الإجمالي:</span>{" "}
            <span>
              {Number(order.amountTotal).toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              LE
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </>;
} // ─── Tab 2: Other Info — Matching Odoo Purchase Order Other Info ────────
function OtherInfoTab({
  order
}: {
  order: any;
}) {
  return <div className="grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
      {" "}
      {/* ─── المشتريات ─── */}{" "}
      <div>
        {" "}
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">
          المشتريات
        </h3>{" "}
        <div className="space-y-2.5">
          {" "}
          <InfoRow label="المشتري" value={order.user?.name} />{" "}
          <InfoRow label="الشركة" value={order.company?.name || order.entreprise?.name} />{" "}
          <InfoRow label="مرجع المصدر" value={order.origin} />{" "}
        </div>{" "}
      </div>{" "}
      {/* ─── الفوترة ─── */}{" "}
      <div>
        {" "}
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">
          الفوترة
        </h3>{" "}
        <div className="space-y-2.5">
          {" "}
          <InfoRow label="شروط الدفع" value={order.paymentTerm?.name} />{" "}
          <InfoRow label="الوضع المالي" value={order.fiscalPosition?.name} />{" "}
          <InfoRow label="العملة" value={order.currency || "EGP"} />{" "}
        </div>{" "}
      </div>{" "}
      {/* ─── التوصيل ─── */}{" "}
      <div>
        {" "}
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">
          التوصيل
        </h3>{" "}
        <div className="space-y-2.5">
          {" "}
          <InfoRow label="الشرط التجاري" value={order.incoterm} />{" "}
          <InfoRow label="موقع الوصول" value={order.incotermsLocation} />{" "}
          <InfoRow label="التاريخ المتوقع" value={order.dateOrder ? new Date(order.dateOrder).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }) : null} />{" "}
          <InfoRow label="حالة الاستلام" value={order.receiptStatus} badge={order.receiptStatus ? getReceiptBadgeColor(order.receiptStatus) : undefined} />{" "}
        </div>{" "}
      </div>{" "}
      {/* ─── Entreprise ─── */}{" "}
      <div>
        {" "}
        <h3 className="text-sm font-bold text-slate-800 mb-3 pb-1 border-b border-slate-200">
          Entreprise
        </h3>{" "}
        <div className="space-y-2.5">
          {" "}
          <InfoRow label="الفرع" value={order.entreprise?.name} highlight />{" "}
        </div>{" "}
      </div>{" "}
    </div>;
} // ─── Helper Components ────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  highlight,
  badge
}: {
  label: string;
  value?: string | null;
  highlight?: boolean;
  badge?: string;
}) {
  return <div className="flex items-center justify-between py-1">
      {" "}
      <label className="text-slate-700 font-medium">{label}</label>{" "}
      {badge ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>
          {" "}
          {value}{" "}
        </span> : <span className={`text-slate-900 ${highlight ? "text-sky-700 font-medium" : ""}`}>
          {" "}
          {value || <span className="text-slate-400">—</span>}{" "}
        </span>}{" "}
    </div>;
}
function getReceiptBadgeColor(status: string): string {
  switch (status) {
    case "تم الاستلام بالكامل":
      return "bg-green-100 text-green-800";
    case "جزئي":
      return "bg-yellow-100 text-yellow-800";
    case "لم يتم":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}