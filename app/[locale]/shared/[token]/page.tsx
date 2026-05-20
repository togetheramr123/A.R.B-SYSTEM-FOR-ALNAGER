import {
  resolveShareLink,
  fetchSharedResource,
} from "@/app/actions/user_notifications";
import { notFound, redirect } from "next/navigation";
import { ShieldAlert, FileText, Printer, Lock } from "lucide-react";
export default async function SharedRecordView({
  params,
}: {
  params: {
    token: string;
    locale: string;
  };
}) {
  const res = await resolveShareLink(params.token);
  if (res.error || !res.link) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
        dir="rtl"
      >
        {" "}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-red-100 max-w-md w-full text-center">
          {" "}
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />{" "}
          <h1 className="text-xl font-bold text-slate-800 mb-2">
            تعذر الوصول للمستند
          </h1>{" "}
          <p className="text-slate-600 mb-6">
            {res.error || "الرابط غير صالح"}
          </p>{" "}
          <a
            href={`/${params.locale}`}
            className="text-[#017E84] hover:underline font-medium"
          >
            العودة للصفحة الرئيسية
          </a>{" "}
        </div>{" "}
      </div>
    );
  }
  const { resourceModel, resourceId } = res.link;
  const data = await fetchSharedResource(resourceModel, resourceId);
  if (!data) return notFound();

  const typedData = data as any;
  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8" dir="rtl">
      {" "}
      <div className="max-w-5xl mx-auto bg-white rounded-sm shadow-sm overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0">
        {" "}
        {}{" "}
        <div className="bg-[#017E84] text-white px-6 py-4 flex items-center justify-between print:hidden">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <Lock className="w-5 h-5 text-teal-100" />{" "}
            <div>
              {" "}
              <h1 className="font-bold text-lg leading-tight">
                وضع القراءة فقط
              </h1>{" "}
              <p className="text-teal-100 text-xs">
                تم منحك صلاحية رؤية هذا المستند مؤقتاً.
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors font-medium text-sm">
            <Printer className="w-4 h-4" />{" "}
            <span className="hidden sm:inline">طباعة</span>{" "}
          </button>{" "}
        </div>{" "}
        {}{" "}
        <div className="p-8">
          {" "}
          <div className="mb-8 border-b-2 border-slate-800 pb-4 flex justify-between items-end">
            {" "}
            <div>
              {" "}
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {typedData.name}
              </div>{" "}
              <div className="text-slate-500 font-medium">
                {" "}
                {resourceModel === "SaleOrder"
                  ? "أمر مبيعات"
                  : resourceModel === "PurchaseOrder"
                    ? "أمر شراء"
                    : "سجل منتج"}{" "}
              </div>{" "}
            </div>{" "}
            {typedData.partner && (
              <div className="text-left border border-slate-200 p-3 rounded bg-slate-50 min-w-[200px]">
                {" "}
                <div className="text-xs text-slate-500 font-bold mb-1">
                  العميل / المورد
                </div>{" "}
                <div className="font-bold text-slate-800">
                  {typedData.partner.name}
                </div>{" "}
                {typedData.partner.phone && (
                  <div className="text-sm text-slate-600 mt-1">
                    {typedData.partner.phone}
                  </div>
                )}{" "}
              </div>
            )}{" "}
          </div>{" "}
          {}{" "}
          {typedData.lines && typedData.lines.length > 0 && (
            <div className="overflow-x-auto mb-8">
              {" "}
              <table className="w-full text-right border-collapse">
                {" "}
                <thead>
                  {" "}
                  <tr className="bg-slate-800 text-white text-sm">
                    {" "}
                    <th className="p-3 font-bold rounded-tr-lg">
                      المنتج / الوصف
                    </th>{" "}
                    <th className="p-3 font-bold">الكمية</th>{" "}
                    <th className="p-3 font-bold">السعر</th>{" "}
                    <th className="p-3 font-bold">الخصم</th>{" "}
                    <th className="p-3 font-bold rounded-tl-lg">
                      الإجمالي
                    </th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody className="divide-y divide-slate-200">
                  {" "}
                  {typedData.lines.map((line: any) => (
                    <tr
                      key={line.id}
                      className="text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {" "}
                      <td className="p-3">
                        {line.description || line.product?.name || "-"}
                      </td>{" "}
                      <td className="p-3 font-medium font-numbers" dir="ltr">
                        {line.quantity?.toFixed(2) ||
                          line.qty?.toFixed(2) ||
                          "0.00"}
                      </td>{" "}
                      <td className="p-3 font-medium font-numbers" dir="ltr">
                        {line.priceUnit?.toFixed(2) || "0.00"}
                      </td>{" "}
                      <td className="p-3 font-medium font-numbers" dir="ltr">
                        {line.discount1 || line.discount || 0}%
                      </td>{" "}
                      <td
                        className="p-3 font-bold text-slate-900 font-numbers"
                        dir="ltr"
                      >
                        {" "}
                        {(
                          (line.quantity || line.qty || 0) *
                          (line.priceUnit || 0) *
                          (1 - (line.discount1 || line.discount || 0) / 100)
                        ).toFixed(2)}{" "}
                      </td>{" "}
                    </tr>
                  ))}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>
          )}{" "}
          {}{" "}
          {typedData.amountTotal !== undefined && (
            <div className="flex justify-end border-t border-slate-200 pt-6">
              {" "}
              <div className="w-full max-w-sm space-y-3">
                {" "}
                <div className="flex justify-between text-slate-600">
                  {" "}
                  <span>المبلغ قبل الضريبة:</span>{" "}
                  <span className="font-numbers font-medium" dir="ltr">
                    {typedData.amountUntaxed?.toFixed(2) || "0.00"}
                  </span>{" "}
                </div>{" "}
                <div className="flex justify-between text-slate-600">
                  {" "}
                  <span>الضرائب:</span>{" "}
                  <span className="font-numbers font-medium" dir="ltr">
                    {typedData.amountTax?.toFixed(2) || "0.00"}
                  </span>{" "}
                </div>{" "}
                <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-3">
                  {" "}
                  <span>الإجمالي:</span>{" "}
                  <span className="font-numbers" dir="ltr">
                    {typedData.amountTotal?.toFixed(2) || "0.00"}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>
          )}{" "}
          {}{" "}
          <div className="mt-16 text-center text-slate-400 text-xs font-medium print:block">
            {" "}
            هذا المستند معروض بصلاحية "للقراءة فقط" عبر نظام الإشعارات. <br />{" "}
            {new Date().toLocaleString("ar-EG")}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {} <PrintTrigger />{" "}
    </div>
  );
}
function PrintTrigger() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: ` document.querySelector('button')?.addEventListener('click', () => window.print()); `,
      }}
    />
  );
}
