import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { getAllPayments } from "@/app/actions/payments";
import { Plus, Search, Receipt } from "lucide-react";
import { TopPortal } from "@/components/common/TopPortal";
export default async function ReceiptsListPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const payments = await getAllPayments("inbound");
  const { getSession } = await import('@/lib/auth');
  const session = await getSession();
  const canCreateFreeVouchers = session?.canCreateFreeVouchers ?? true;
  return <div className="p-4" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        {canCreateFreeVouchers && (
          <Link href={`/${locale}/accounting/payments/new?type=inbound`} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
            {" "}
            <Plus className="w-3.5 h-3.5" /> جديد{" "}
          </Link>
        )}
      </TopPortal>{" "}
      {payments.length === 0 ? <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          {" "}
          <Receipt className="w-16 h-16 text-slate-300 mx-auto mb-4" />{" "}
          <h3 className="text-lg font-bold text-slate-700 mb-2">
            لا توجد سندات قبض
          </h3>{" "}
          <p className="text-slate-500 text-sm mb-4">
            أنشئ سند قبض جديد لتسجيل المبالغ المحصلة من العملاء
          </p>{" "}
          {canCreateFreeVouchers && (
            <Link href={`/${locale}/accounting/payments/new?type=inbound`} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm font-medium inline-flex items-center gap-2">
              {" "}
              <Plus className="w-4 h-4" /> سند قبض جديد{" "}
            </Link>
          )}
        </div> : <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
          {" "}
          <table className="w-full text-right text-sm">
            {" "}
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              {" "}
              <tr>
                {" "}
                <th className="py-2.5 px-4 font-bold">التاريخ</th>{" "}
                <th className="py-2.5 px-4 font-bold">رقم السند</th>{" "}
                <th className="py-2.5 px-4 font-bold">العميل</th>{" "}
                <th className="py-2.5 px-4 font-bold">الخزنة/البنك</th>{" "}
                <th className="py-2.5 px-4 font-bold">المبلغ</th>{" "}
                <th className="py-2.5 px-4 font-bold">البيان</th>{" "}
                <th className="py-2.5 px-4 font-bold">الحالة</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {payments.map((pay: any) => <tr key={pay.id} className="hover:bg-green-50/50 group cursor-pointer">
                  {" "}
                  <td className="py-2 px-4 text-slate-600">
                    {" "}
                    {new Date(pay.date).toLocaleDateString("en-CA")}{" "}
                  </td>{" "}
                  <td className="py-2 px-4 font-medium text-green-700">
                    {" "}
                    <Link href={`/${locale}/accounting/payments/${pay.id}`}>
                      {" "}
                      {pay.name}{" "}
                    </Link>{" "}
                  </td>{" "}
                  <td className="py-2 px-4 text-slate-800">
                    {" "}
                    {pay.partner?.name || "-"}{" "}
                  </td>{" "}
                  <td className="py-2 px-4 text-slate-600">
                    {" "}
                    {pay.journal?.name || "-"}{" "}
                  </td>{" "}
                  <td className="py-2 px-4 font-bold text-green-700">
                    {" "}
                    {Number(pay.amount).toLocaleString("en-US")} ج.م{" "}
                  </td>{" "}
                  <td className="py-2 px-4 text-slate-500 text-xs max-w-[200px] truncate">
                    {" "}
                    {pay.ref || "-"}{" "}
                  </td>{" "}
                  <td className="py-2 px-4">
                    {" "}
                    <span className={`px-2 py-0.5 rounded text-xs ${pay.state === "posted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {" "}
                      {pay.state === "posted" ? "مرحل" : "مسودة"}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>}{" "}
    </div>;
}