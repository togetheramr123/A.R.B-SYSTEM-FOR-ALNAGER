"use client";

import { useState, useEffect } from "react";
import { getSettlements } from "@/app/actions/cash-register";
import { FileText, CheckCircle2, XCircle, ArrowRightLeft } from "lucide-react";
export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getSettlements().then(data => {
      setSettlements(data);
      setLoading(false);
    });
  }, []);
  const formatNumber = (n: number) => n.toLocaleString("ar-EG", {
    minimumFractionDigits: 2
  });
  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };
  return <div className="p-6 max-w-6xl mx-auto">
      {" "}
      <div className="flex items-center justify-between mb-6">
        {" "}
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          {" "}
          <ArrowRightLeft className="w-6 h-6 text-[#017E84]" /> محاضر
          الترحيل{" "}
        </h1>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
        {" "}
        <table className="w-full text-sm">
          {" "}
          <thead>
            {" "}
            <tr className="bg-gray-50 border-b border-gray-200">
              {" "}
              <th className="px-4 py-3 text-right font-bold text-gray-700">
                الرقم
              </th>{" "}
              <th className="px-4 py-3 text-right font-bold text-gray-700">
                التاريخ
              </th>{" "}
              <th className="px-4 py-3 text-right font-bold text-gray-700">
                الصندوق
              </th>{" "}
              <th className="px-4 py-3 text-right font-bold text-gray-700">
                المستخدم
              </th>{" "}
              <th className="px-4 py-3 text-center font-bold text-gray-700">
                سندات القبض
              </th>{" "}
              <th className="px-4 py-3 text-center font-bold text-gray-700">
                سندات الصرف
              </th>{" "}
              <th className="px-4 py-3 text-center font-bold text-gray-700">
                الصافي المُرحَّل
              </th>{" "}
              <th className="px-4 py-3 text-center font-bold text-gray-700">
                عدد المعاملات
              </th>{" "}
              <th className="px-4 py-3 text-center font-bold text-gray-700">
                الحالة
              </th>{" "}
              <th className="px-4 py-3 text-right font-bold text-gray-700">
                نفّذ بواسطة
              </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody>
            {" "}
            {settlements.map((s, i) => <tr key={s.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/30 transition-colors border-b border-gray-100`}>
                {" "}
                <td className="px-4 py-3 font-numbers font-bold text-gray-900">
                  {s.name}
                </td>{" "}
                <td className="px-4 py-3 font-numbers text-gray-600 text-xs">
                  {formatDate(s.date)}
                </td>{" "}
                <td className="px-4 py-3 text-gray-900 font-medium">
                  {s.register?.name}
                </td>{" "}
                <td className="px-4 py-3 text-gray-700">
                  {s.user?.name || "—"}
                </td>{" "}
                <td className="px-4 py-3 text-center font-numbers text-green-700 font-bold">
                  {formatNumber(s.totalReceipts)}
                </td>{" "}
                <td className="px-4 py-3 text-center font-numbers text-red-600">
                  {formatNumber(s.totalDisbursements)}
                </td>{" "}
                <td className="px-4 py-3 text-center font-numbers font-bold text-gray-900">
                  {formatNumber(s.netAmount)}
                </td>{" "}
                <td className="px-4 py-3 text-center font-numbers text-gray-500">
                  {s._count?.transactions || 0}
                </td>{" "}
                <td className="px-4 py-3 text-center">
                  {" "}
                  {s.state === "done" ? <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                      {" "}
                      <CheckCircle2 className="w-3 h-3" /> مكتمل{" "}
                    </span> : <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      {" "}
                      <XCircle className="w-3 h-3" /> ملغي{" "}
                    </span>}{" "}
                </td>{" "}
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {s.performedBy?.name || "النظام"}
                </td>{" "}
              </tr>)}{" "}
            {settlements.length === 0 && !loading && <tr>
                {" "}
                <td colSpan={10} className="px-4 py-16 text-center text-gray-400">
                  {" "}
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />{" "}
                  <p>لا توجد محاضر ترحيل بعد</p>{" "}
                </td>{" "}
              </tr>}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
      {loading && <div className="text-center py-16">
          {" "}
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#017E84] mx-auto"></div>{" "}
          <p className="text-gray-400 mt-3 text-sm">جاري التحميل...</p>{" "}
        </div>}{" "}
    </div>;
}