import React from "react";
interface InvoiceDocumentProps {
  invoice: any;
  locale: string;
}
export default function InvoiceDocument({
  invoice,
  locale
}: InvoiceDocumentProps) {
  const isRtl = locale === "ar";
  const company = invoice.company || {};
  const partner = invoice.partner || {};
  const isCustomer = invoice.type === "out_invoice";
  const title = isCustomer ? locale === "ar" ? "فاتورة" : "Invoice" : locale === "ar" ? "فاتورة مورد" : "Vendor Bill";
  const formatDate = (date: Date | string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US");
  };
  return <div className={`w-full bg-white text-black text-sm p-8 ${isRtl ? "rtl" : "ltr"} font-sans`} dir={isRtl ? "rtl" : "ltr"}>
      {" "}
      {/* Header: Logo & Company Info */}{" "}
      <div className="flex justify-between items-start mb-12">
        {" "}
        <div className="w-1/2">
          {" "}
          {/* Logo Placeholder - standard Odoo size */}{" "}
          {true ? <img src={company.logoUrl || '/hsn-logo.png'} alt="HSN GROUP" className="max-h-[80px] object-contain" /> : <div className="text-2xl font-bold text-slate-800">
              {company.name || "Company Name"}
            </div>}{" "}
        </div>{" "}
        <div className={`w-1/2 ${isRtl ? "text-left" : "text-right"} text-slate-600`}>
          {" "}
          <p>{company.phone}</p> <p>{company.email}</p>{" "}
          <p>
            {[company.street, company.street2, company.city, company.country].filter(Boolean).join(", ")}
          </p>{" "}
          <p>
            {company.taxId && (isRtl ? `س.ت: ${company.taxId}` : `Tax ID: ${company.taxId}`)}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Title & Customer Info */}{" "}
      <div className="mb-12">
        {" "}
        <h1 className="text-4xl font-light text-slate-900 mb-6">
          {" "}
          {title} <span className="font-bold">{invoice.name}</span>{" "}
        </h1>{" "}
        <div className="flex gap-16">
          {" "}
          <div className="w-1/2">
            {" "}
            <h3 className="text-slate-500 font-bold mb-1 border-b border-slate-200 pb-1">
              {" "}
              {isCustomer ? isRtl ? "العميل" : "Customer" : isRtl ? "المورد" : "Vendor"}{" "}
            </h3>{" "}
            <div className="text-slate-800">
              {" "}
              <p className="font-bold text-lg">{partner.name}</p>{" "}
              <p>
                {[partner.street, partner.street2, partner.city, partner.country].filter(Boolean).join(", ")}
              </p>{" "}
              <p>{partner.phone}</p>{" "}
              {partner.vat && <p>{isRtl ? `ض.ق.م: ${partner.vat}` : `VAT: ${partner.vat}`}</p>}{" "}
            </div>{" "}
          </div>{" "}
          <div className="w-1/2 pt-6">
            {" "}
            <div className="grid grid-cols-2 gap-y-2">
              {" "}
              <div className="text-slate-500">
                {isRtl ? "تاريخ الفاتورة:" : "Invoice Date:"}
              </div>{" "}
              <div className="font-bold">{formatDate(invoice.dateInvoice)}</div>{" "}
              {invoice.dateDue && <>
                  {" "}
                  <div className="text-slate-500">
                    {isRtl ? "تاريخ الاستحقاق:" : "Due Date:"}
                  </div>{" "}
                  <div className="font-bold">
                    {formatDate(invoice.dateDue)}
                  </div>{" "}
                </>}{" "}
              {invoice.invoiceOrigin && <>
                  {" "}
                  <div className="text-slate-500">
                    {isRtl ? "المصدر:" : "Source:"}
                  </div>{" "}
                  <div className="font-bold">{invoice.invoiceOrigin}</div>{" "}
                </>}{" "}
              {invoice.internalReference && <>
                  {" "}
                  <div className="text-slate-500">
                    {isRtl ? "مرجع:" : "Reference:"}
                  </div>{" "}
                  <div className="font-bold">
                    {invoice.internalReference}
                  </div>{" "}
                </>}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Lines Table - Odoo Light Style */}{" "}
      <table className="w-full mb-8 border-collapse">
        {" "}
        <thead>
          {" "}
          <tr className="border-b-2 border-slate-800 text-slate-900 font-bold">
            {" "}
            <th className={`py-2 ${isRtl ? "text-right" : "text-left"} w-1/2`}>
              {isRtl ? "الوصف" : "Description"}
            </th>{" "}
            <th className="py-2 text-center">
              {isRtl ? "الكمية" : "Quantity"}
            </th>{" "}
            <th className="py-2 text-center">
              {isRtl ? "السعر" : "Unit Price"}
            </th>{" "}
            {/* <th className="py-2 text-center">{isRtl ? 'الضرائب' : 'Taxes'}</th> */}{" "}
            <th className={`py-2 ${isRtl ? "text-left" : "text-right"}`}>
              {isRtl ? "المجموع" : "Amount"}
            </th>{" "}
          </tr>{" "}
        </thead>{" "}
        <tbody className="text-slate-700">
          {" "}
          {invoice.lines.map((line: any) => <tr key={line.id} className="border-b border-slate-100">
              {" "}
              <td className={`py-3 ${isRtl ? "text-right" : "text-left"}`}>
                {line.name}
              </td>{" "}
              <td className="py-3 text-center">{line.quantity}</td>{" "}
              <td className="py-3 text-center">
                {line.priceUnit.toLocaleString(undefined, {
              minimumFractionDigits: 2
            })}
              </td>{" "}
              <td className={`py-3 ${isRtl ? "text-left" : "text-right"} font-medium text-slate-900`}>
                {" "}
                {line.priceSubtotal.toLocaleString(undefined, {
              minimumFractionDigits: 2
            })}{" "}
              </td>{" "}
            </tr>)}{" "}
        </tbody>{" "}
      </table>{" "}
      {/* Totals Section */}{" "}
      <div className="flex justify-end mb-12">
        {" "}
        <div className="w-1/3 min-w-[300px]">
          {" "}
          <div className="flex justify-between py-2 border-b border-slate-100">
            {" "}
            <span className="text-slate-600">
              {isRtl ? "الإجمالي قبل الضريبة" : "Untaxed Amount"}
            </span>{" "}
            <span className="font-medium">
              {invoice.amountUntaxed.toLocaleString(undefined, {
              minimumFractionDigits: 2
            })}
            </span>{" "}
          </div>{" "}
          <div className="flex justify-between py-2 border-b border-slate-100">
            {" "}
            <span className="text-slate-600">
              {isRtl ? "الضريبة" : "Tax"}
            </span>{" "}
            <span className="font-medium">
              {invoice.amountTax.toLocaleString(undefined, {
              minimumFractionDigits: 2
            })}
            </span>{" "}
          </div>{" "}
          <div className="flex justify-between py-3 border-t-2 border-slate-800 mt-2 text-lg font-bold text-slate-900">
            {" "}
            <span>{isRtl ? "الإجمالي" : "Total"}</span>{" "}
            <span>
              {invoice.amountTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2
            })}{" "}
              {company.currency || "EGP"}
            </span>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Terms & Conditions */}{" "}
      {invoice.narration && <div className="border-t border-slate-200 pt-4 text-slate-500 text-xs">
          {" "}
          <p className="font-bold mb-1">
            {isRtl ? "الشروط والأحكام:" : "Terms & Conditions:"}
          </p>{" "}
          <p>{invoice.narration}</p>{" "}
        </div>}{" "}
      {!invoice.narration && <div className="border-t border-slate-200 pt-4 text-slate-500 text-xs text-center">
          {" "}
          <p>
            {isRtl ? "نشكركم على تعاملكم معنا." : "Thank you for your business."}
          </p>{" "}
        </div>}{" "}
    </div>;
}