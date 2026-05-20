"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getCashRegisterStatement, getCashRegister } from "@/app/actions/cash-register";
import { FileText, Printer, Download, Calendar, Filter, ChevronDown } from "lucide-react";
export default function CashRegisterStatementPage() {
  const params = useParams();
  const registerId = params.id as string;
  const [register, setRegister] = useState<any>(null);
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  /* Default: today */
  const today = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [includeOpening, setIncludeOpening] = useState(true);
  const loadStatement = useCallback(async () => {
    setLoading(true);
    try {
      const [reg, stmt] = await Promise.all([getCashRegister(registerId), getCashRegisterStatement(registerId, fromDate, toDate, includeOpening)]);
      setRegister(reg);
      setStatement(stmt);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [registerId, fromDate, toDate, includeOpening]);
  useEffect(() => {
    loadStatement();
  }, [loadStatement]);
  const formatNumber = (n: number) => n.toLocaleString("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const formatDate = (d: string | Date) => {
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };
  return <div className="p-4 max-w-[1100px] mx-auto">
      {" "}
      {/* Filter Bar */}{" "}
      <div className="bg-white rounded-sm border border-gray-200 p-4 mb-4 flex flex-wrap items-end gap-4 print:hidden">
        {" "}
        <div>
          {" "}
          <label className="block text-xs font-medium text-gray-600 mb-1">
            من تاريخ
          </label>{" "}
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#017E84] outline-none" />{" "}
        </div>{" "}
        <div>
          {" "}
          <label className="block text-xs font-medium text-gray-600 mb-1">
            إلى تاريخ
          </label>{" "}
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#017E84] outline-none" />{" "}
        </div>{" "}
        <label className="flex items-center gap-2 cursor-pointer pb-2">
          {" "}
          <input type="checkbox" checked={includeOpening} onChange={e => setIncludeOpening(e.target.checked)} className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84]" />{" "}
          <span className="text-sm text-gray-700">شمول الرصيد السابق</span>{" "}
        </label>{" "}
        <button onClick={loadStatement} className="bg-[#017E84] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-[#01686c] transition-colors">
          {" "}
          عرض{" "}
        </button>{" "}
        <button onClick={() => window.print()} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1.5">
          {" "}
          <Printer className="w-4 h-4" /> طباعة{" "}
        </button>{" "}
      </div>{" "}
      {/* Statement Report (Printable) */}{" "}
      {statement && <div className="bg-white rounded-sm border border-gray-200 overflow-hidden print:border-2 print:border-black print:rounded-none" id="cash-statement-print">
          {" "}
          {/* Report Header */}{" "}
          <div className="border-b-2 border-gray-800 p-5 text-center">
            {" "}
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              كشف حساب أستاذ للصندوق
            </h1>{" "}
            <div className="text-sm text-gray-600 space-y-0.5">
              {" "}
              <p>
                {" "}
                من صندوق : <strong>{statement.register.code}</strong> :{" "}
                {statement.register.name} الي صندوق :{" "}
                <strong>{statement.register.code}</strong> :{" "}
                {statement.register.name}{" "}
              </p>{" "}
              <p>
                {" "}
                من تاريخ :{" "}
                <strong>{fromDate.split("-").reverse().join("/")}</strong> : إلى
                تاريخ :{" "}
                <strong>{toDate.split("-").reverse().join("/")}</strong>{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {/* Table */}{" "}
          <table className="w-full text-sm border-collapse">
            {" "}
            <thead>
              {" "}
              <tr className="bg-gray-100 border-b-2 border-gray-400">
                {" "}
                <th rowSpan={2} className="border border-gray-400 px-3 py-2 text-right font-bold text-gray-800 w-32">
                  التاريخ
                </th>{" "}
                <th rowSpan={2} className="border border-gray-400 px-3 py-2 text-right font-bold text-gray-800">
                  البيان
                </th>{" "}
                <th rowSpan={2} className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-36">
                  الرصيد
                </th>{" "}
                <th colSpan={2} className="border border-gray-400 px-3 py-1.5 text-center font-bold text-gray-800">
                  حركة الفترة
                </th>{" "}
                <th rowSpan={2} className="border border-gray-400 px-3 py-2 text-center font-bold text-gray-800 w-28">
                  رقم المستند
                </th>{" "}
              </tr>{" "}
              <tr className="bg-gray-50 border-b-2 border-gray-400">
                {" "}
                <th className="border border-gray-400 px-3 py-1.5 text-center font-bold text-gray-700 w-28">
                  الدائن
                </th>{" "}
                <th className="border border-gray-400 px-3 py-1.5 text-center font-bold text-gray-700 w-28">
                  المدين
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody>
              {" "}
              {statement.lines.map((line: any, i: number) => <tr key={line.id} className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"} hover:bg-blue-50/30 transition-colors`}>
                  {" "}
                  <td className="border border-gray-300 px-3 py-2 text-xs text-gray-600 font-numbers whitespace-nowrap">
                    {formatDate(line.date)}
                  </td>{" "}
                  <td className="border border-gray-300 px-3 py-2 text-gray-900 font-medium">
                    {line.description}
                  </td>{" "}
                  <td className="border border-gray-300 px-3 py-2 text-center font-numbers font-bold text-gray-900">
                    {" "}
                    <span className="text-gray-900">
                      {formatNumber(Math.abs(line.balance))}
                    </span>{" "}
                    <span className="text-xs text-gray-500 mr-1">
                      {line.balanceType}
                    </span>{" "}
                  </td>{" "}
                  <td className="border border-gray-300 px-3 py-2 text-center font-numbers text-red-600">
                    {" "}
                    {line.credit > 0 ? formatNumber(line.credit) : "0.00"}{" "}
                  </td>{" "}
                  <td className="border border-gray-300 px-3 py-2 text-center font-numbers text-green-700 font-bold">
                    {" "}
                    {line.debit > 0 ? formatNumber(line.debit) : "0.00"}{" "}
                  </td>{" "}
                  <td className="border border-gray-300 px-3 py-2 text-center font-numbers text-xs text-gray-500">
                    {line.ref}
                  </td>{" "}
                </tr>)}{" "}
              {statement.lines.length === 0 && <tr>
                  {" "}
                  <td colSpan={6} className="border border-gray-300 px-3 py-8 text-center text-gray-400">
                    {" "}
                    لا توجد حركات في هذه الفترة{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
            {/* Totals Footer */}{" "}
            <tfoot>
              {" "}
              {/* إجمالي أول المدة */}{" "}
              <tr className="bg-gray-100 border-t-2 border-gray-400">
                {" "}
                <td colSpan={3} className="border border-gray-400 px-3 py-2 text-right font-bold text-gray-800">
                  {" "}
                  اجمالي اول المدة:{" "}
                </td>{" "}
                <td className="border border-gray-400 px-3 py-2 text-center font-numbers font-bold">
                  {" "}
                  {statement.openingBalance < 0 ? formatNumber(Math.abs(statement.openingBalance)) : "0.00"}{" "}
                </td>{" "}
                <td className="border border-gray-400 px-3 py-2 text-center font-numbers font-bold">
                  {" "}
                  {statement.openingBalance >= 0 ? formatNumber(statement.openingBalance) : "0.00"}{" "}
                </td>{" "}
                <td className="border border-gray-400"></td>{" "}
              </tr>{" "}
              {/* إجمالي الحركة */}{" "}
              <tr className="bg-gray-100">
                {" "}
                <td colSpan={3} className="border border-gray-400 px-3 py-2 text-right font-bold text-gray-800">
                  {" "}
                  اجمالي الحركة:{" "}
                </td>{" "}
                <td className="border border-gray-400 px-3 py-2 text-center font-numbers font-bold text-red-600">
                  {" "}
                  {formatNumber(statement.totalCredit)}{" "}
                </td>{" "}
                <td className="border border-gray-400 px-3 py-2 text-center font-numbers font-bold text-green-700">
                  {" "}
                  {formatNumber(statement.totalDebit)}{" "}
                </td>{" "}
                <td className="border border-gray-400"></td>{" "}
              </tr>{" "}
              {/* الرصيد النهائي */}{" "}
              <tr className="bg-gray-200 border-t-2 border-gray-500">
                {" "}
                <td colSpan={3} className="border border-gray-400 px-4 py-3 text-right">
                  {" "}
                  <span className="font-bold text-gray-900 text-base">
                    الرصيد
                  </span>{" "}
                </td>{" "}
                <td colSpan={2} className="border border-gray-400 px-4 py-3 text-center font-numbers font-bold text-lg text-gray-900">
                  {" "}
                  {formatNumber(Math.abs(statement.closingBalance))}{" "}
                  <span className="text-sm font-bold text-gray-600 mr-2">
                    {statement.closingBalanceType}
                  </span>{" "}
                </td>{" "}
                <td className="border border-gray-400"></td>{" "}
              </tr>{" "}
            </tfoot>{" "}
          </table>{" "}
        </div>}{" "}
      {loading && <div className="bg-white rounded-sm border border-gray-200 p-16 text-center">
          {" "}
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#017E84] mx-auto"></div>{" "}
          <p className="text-gray-400 mt-4 text-sm">جاري تحميل الكشف...</p>{" "}
        </div>}{" "}
      {/* Print Styles */}{" "}
      <style jsx global>{`
        @media print {
          body > *:not(#cash-statement-print) {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #cash-statement-print {
            border: 2px solid black !important;
            border-radius: 0 !important;
          }
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>{" "}
    </div>;
}