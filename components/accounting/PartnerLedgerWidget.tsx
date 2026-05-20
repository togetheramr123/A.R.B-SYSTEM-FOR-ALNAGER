"use client";

import { useState, useEffect } from "react";
import { getPartnerLedgerWidgetData } from "@/app/actions/accounting";
import { ChevronDown, ChevronUp, History, User } from "lucide-react";
import Link from "next/link";
interface LedgerItem {
  id: string;
  date: Date | string;
  name: string;
  ref: string;
  debit: number;
  credit: number;
  balance: number;
  createdBy: string;
}
export default function PartnerLedgerWidget({
  partnerId,
  locale
}: {
  partnerId: string;
  locale: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    totalBalance: number;
    items: LedgerItem[];
    partnerName: string;
  } | null>(null);
  useEffect(() => {
    if (!partnerId || !isExpanded) return;
    const fetchData = async () => {
      setLoading(true);
      const result = await getPartnerLedgerWidgetData(partnerId);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setData({
          totalBalance: result.totalBalance || 0,
          items: result.items || [],
          partnerName: result.partnerName || ""
        });
      }
      setLoading(false);
    };
    fetchData();
  }, [partnerId, isExpanded]);
  if (!partnerId) return null;
  return <div className="w-full mt-6 bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden" dir={locale === "ar" ? "rtl" : "ltr"}>
      {" "}
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200">
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <History className="w-5 h-5 text-sky-600" />{" "}
          <span className="font-bold text-slate-800 text-lg">
            كشف الحساب المصغر (آخر المعاملات)
          </span>{" "}
        </div>{" "}
        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}{" "}
      </button>{" "}
      {isExpanded && <div className="p-4">
          {" "}
          {loading ? <div className="flex justify-center p-8">
              {" "}
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>{" "}
            </div> : error ? <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-sm">
              {" "}
              {error}{" "}
            </div> : data ? <div className="space-y-6">
              {" "}
              {/* Summary Card */}{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {" "}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-sm flex items-center justify-between">
                  {" "}
                  <div className="flex items-center gap-2">
                    {" "}
                    <User className="w-5 h-5 text-slate-500" />{" "}
                    <span className="font-medium text-slate-700">
                      العميل / المورد:
                    </span>{" "}
                  </div>{" "}
                  <span className="font-bold text-slate-900">
                    {data.partnerName}
                  </span>{" "}
                </div>{" "}
                <div className={`p-4 border rounded-sm flex items-center justify-between ${data.totalBalance > 0 ? "bg-green-50 border-green-200" : data.totalBalance < 0 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                  {" "}
                  <span className="font-medium text-slate-700">
                    الرصيد الإجمالي:
                  </span>{" "}
                  <span className={`font-bold text-lg ${data.totalBalance > 0 ? "text-green-700" : data.totalBalance < 0 ? "text-red-700" : "text-slate-700"}`} dir="ltr">
                    {" "}
                    {data.totalBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}{" "}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
              {/* Transactions Table */}{" "}
              <div className="overflow-x-auto border border-slate-200 rounded-sm">
                {" "}
                <table className="w-full text-sm text-right">
                  {" "}
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    {" "}
                    <tr>
                      {" "}
                      <th className="px-4 py-3 font-bold">التاريخ</th>{" "}
                      <th className="px-4 py-3 font-bold">
                        رقم القيد / الفاتورة
                      </th>{" "}
                      <th className="px-4 py-3 font-bold">البيان / المرجع</th>{" "}
                      <th className="px-4 py-3 font-bold">مدين (له)</th>{" "}
                      <th className="px-4 py-3 font-bold">دائن (عليه)</th>{" "}
                      <th className="px-4 py-3 font-bold">الرصيد التراكمي</th>{" "}
                      <th className="px-4 py-3 font-bold">بواسطة</th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {data.items.length === 0 ? <tr>
                        {" "}
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                          {" "}
                          لا توجد حركات مالية مسجلة لهذا الحساب.{" "}
                        </td>{" "}
                      </tr> : data.items.map(item => <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                          {" "}
                          <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                            {" "}
                            {new Date(item.date).toLocaleDateString("ar-EG")}{" "}
                          </td>{" "}
                          <td className="px-4 py-2 font-medium text-slate-800">
                            {" "}
                            {item.name}{" "}
                          </td>{" "}
                          <td className="px-4 py-2 text-slate-600">
                            {" "}
                            {item.ref}{" "}
                          </td>{" "}
                          <td className="px-4 py-2 text-slate-800" dir="ltr">
                            {" "}
                            {item.debit > 0 ? item.debit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : "-"}{" "}
                          </td>{" "}
                          <td className="px-4 py-2 text-slate-800" dir="ltr">
                            {" "}
                            {item.credit > 0 ? item.credit.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }) : "-"}{" "}
                          </td>{" "}
                          <td className="px-4 py-2 font-bold text-slate-900" dir="ltr">
                            {" "}
                            {item.balance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{" "}
                          </td>{" "}
                          <td className="px-4 py-2 text-slate-600">
                            {" "}
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                              {" "}
                              {item.createdBy}{" "}
                            </span>{" "}
                          </td>{" "}
                        </tr>)}{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>{" "}
              <div className="flex justify-end mt-4">
                {" "}
                <Link href={`/${locale}/accounting/partner-ledger?partner=${partnerId}`} className="text-sm text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1">
                  {" "}
                  عرض كشف الحساب الكامل &larr;{" "}
                </Link>{" "}
              </div>{" "}
            </div> : null}{" "}
        </div>}{" "}
    </div>;
}