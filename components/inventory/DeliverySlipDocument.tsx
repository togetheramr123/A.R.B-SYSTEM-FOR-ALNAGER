import React from "react";
interface DeliverySlipProps {
  picking: any;
  locale: string;
}
export default function DeliverySlipDocument({
  picking,
  locale,
}: DeliverySlipProps) {
  const isRtl = locale === "ar";
  const company = picking.company || {
    name: "Company Name",
  };
  const partner = picking.partner || {};
  const getTitle = () => {
    if (picking.pickingType === "INCOMING")
      return isRtl ? "سند استلام" : "Reception Note";
    if (picking.pickingType === "OUTGOING")
      return isRtl ? "سند تسلييم" : "Delivery Slip";
    return isRtl ? "تحويل مخزني" : "Internal Transfer";
  };
  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
    );
  };
  return (
    <div
      className={`w-full bg-white text-black text-sm p-8 ${isRtl ? "rtl" : "ltr"} font-sans`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {" "}
      {}{" "}
      <div className="flex justify-between items-start mb-12">
        {" "}
        <div className="w-1/2">
          {" "}
          {}{" "}
          <div className="text-2xl font-bold text-slate-800">
            {company.name}
          </div>{" "}
          {}{" "}
        </div>{" "}
        <div
          className={`w-1/2 ${isRtl ? "text-left" : "text-right"} text-slate-600`}
        >
          {" "}
          {} <p>مدير الشركة</p>{" "}
        </div>{" "}
      </div>{" "}
      {}{" "}
      <div className="mb-12">
        {" "}
        <h1 className="text-4xl font-light text-slate-900 mb-6">
          {" "}
          {getTitle()} <span className="font-bold">{picking.name}</span>{" "}
        </h1>{" "}
        <div className="flex gap-16">
          {" "}
          <div className="w-1/2">
            {" "}
            <h3 className="text-slate-500 font-bold mb-1 border-b border-slate-200 pb-1">
              {" "}
              {isRtl ? "عنوان التوصيل" : "Delivery Address"}{" "}
            </h3>{" "}
            <div className="text-slate-800 mt-2">
              {" "}
              {partner.name ? (
                <>
                  {" "}
                  <p className="font-bold text-lg">{partner.name}</p>{" "}
                  <p>{partner.address}</p> <p>{partner.phone}</p>{" "}
                </>
              ) : (
                <p className="italic text-slate-400">
                  {isRtl ? "لا يوجد عنوان محدد" : "No address specified"}
                </p>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <div className="w-1/2 pt-6">
            {" "}
            <div className="grid grid-cols-2 gap-y-2">
              {" "}
              <div className="text-slate-500">
                {isRtl ? "التاريخ المجدول:" : "Scheduled Date:"}
              </div>{" "}
              <div className="font-bold">
                {formatDate(picking.scheduledDate)}
              </div>{" "}
              {picking.origin && (
                <>
                  {" "}
                  <div className="text-slate-500">
                    {isRtl ? "المصدر:" : "Source:"}
                  </div>{" "}
                  <div className="font-bold">{picking.origin}</div>{" "}
                </>
              )}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {}{" "}
        <div className="mt-8 flex items-center gap-4 text-slate-600">
          {" "}
          <div>
            {" "}
            <span className="font-bold">{isRtl ? "من:" : "From:"}</span>{" "}
            {picking.location?.name}{" "}
          </div>{" "}
          <div className="text-slate-400">➔</div>{" "}
          <div>
            {" "}
            <span className="font-bold">{isRtl ? "إلى:" : "To:"}</span>{" "}
            {picking.locationDest?.name}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {}{" "}
      <table className="w-full mb-8 border-collapse">
        {" "}
        <thead>
          {" "}
          <tr className="border-b-2 border-slate-800 text-slate-900 font-bold">
            {" "}
            <th className={`py-2 ${isRtl ? "text-right" : "text-left"} w-1/2`}>
              {isRtl ? "المنتج" : "Product"}
            </th>{" "}
            <th className="py-2 text-center">
              {isRtl ? "الكمية المحجوزة" : "Reserved"}
            </th>{" "}
            <th className="py-2 text-center">
              {isRtl ? "الكمية المنفذة" : "Done"}
            </th>{" "}
          </tr>{" "}
        </thead>{" "}
        <tbody className="text-slate-700">
          {" "}
          {picking.moves.map((move: any) => (
            <tr key={move.id} className="border-b border-slate-100">
              {" "}
              <td className={`py-3 ${isRtl ? "text-right" : "text-left"}`}>
                {" "}
                <p className="font-medium text-slate-900">
                  {move.product.name}
                </p>{" "}
              </td>{" "}
              <td className="py-3 text-center">{move.quantity}</td>{" "}
              <td className="py-3 text-center font-bold text-slate-900">
                {" "}
                {} {picking.state === "done" ? move.quantity : 0}{" "}
              </td>{" "}
            </tr>
          ))}{" "}
        </tbody>{" "}
      </table>{" "}
      {}{" "}
      <div className="mt-24 border-t border-slate-200 pt-8 flex justify-between">
        {" "}
        <div className="w-1/3 border-t border-black pt-2 text-center text-sm">
          {" "}
          {isRtl ? "توقيع المستلم" : "Receiver Signature"}{" "}
        </div>{" "}
        <div className="w-1/3 border-t border-black pt-2 text-center text-sm">
          {" "}
          {isRtl ? "توقيع أمين المخزن" : "Storekeeper Signature"}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
