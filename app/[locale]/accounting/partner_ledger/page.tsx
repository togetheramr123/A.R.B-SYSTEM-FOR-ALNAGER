"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getPartnerLedgerSimple as getPartnerLedger } from "@/app/actions/accounting";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, FileText, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
export default function PartnerLedgerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("partnerId");
  const partnerName = searchParams.get("partnerName");
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<{
    items: any[];
    balance: number;
  }>({
    items: [],
    balance: 0
  });
  const locale = params.locale;
  useEffect(() => {
    if (partnerId) {
      loadLedger();
    }
  }, [partnerId]);
  const loadLedger = async () => {
    setLoading(true);
    try {
      const data = await getPartnerLedger(partnerId!);
      setLedger(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  if (!partnerId) {
    return <div className="p-8">Please select a partner.</div>;
  }
  return <div className="p-4 space-y-6 print-ledger" dir={locale === "ar" ? "rtl" : "ltr"}>
      {" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print-ledger { padding: 0 !important; background: white !important; } .no-print { display: none !important; } .print-header { display: block !important; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; } .print-header h2 { font-size: 18px; font-weight: 900; margin: 0; } .print-header p { font-size: 12px; margin: 4px 0 0; color: #555; } table { border-collapse: collapse; width: 100%; font-size: 11px; } th, td { border: 1px solid #ccc !important; padding: 6px 8px !important; } th { background: #f0f0f0 !important; font-weight: 700; } .print-footer { display: block !important; text-align: center; margin-top: 20px; font-size: 10px; color: #888; border-top: 1px solid #ccc; padding-top: 8px; } @page { size: A4 landscape; margin: 15mm; } } .print-header, .print-footer { display: none; } `}</style>{" "}
      {/* Print-only Header */}{" "}
      <div className="print-header">
        {" "}
        <h2>كشف حساب: {partnerName || ""}</h2>{" "}
        <p>
          التاريخ: {new Date().toLocaleDateString("ar-EG")} | الرصيد:{" "}
          {formatCurrency(ledger.balance)}
        </p>{" "}
      </div>{" "}
      {/* Header */}{" "}
      <div className="flex items-center justify-between no-print">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <Link href={`/${locale}/inventory/partners`} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            {" "}
            <ArrowLeft className="w-6 h-6 text-slate-600" />{" "}
          </Link>{" "}
          <div>
            {" "}
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              {" "}
              <FileText className="w-6 h-6 text-blue-600" /> كشف حساب:{" "}
              {partnerName || "Unknown"}{" "}
            </h1>{" "}
            <p className="text-slate-500 text-sm">
              {" "}
              جميع الحركات المالية المسجلة (فواتير، دفعات){" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-3">
          {" "}
          <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
            {" "}
            <Printer className="w-4 h-4" /> طباعة الكشف{" "}
          </button>{" "}
          <Card className="bg-white border-[#dadce0] shadow-sm">
            {" "}
            <CardContent className="p-4 flex items-center gap-4">
              {" "}
              <div className="text-sm font-medium text-slate-500">
                الرصيد الحالي
              </div>{" "}
              <div className={`text-xl font-bold ${ledger.balance > 0 ? "text-red-600" : "text-green-600"}`} dir="ltr">
                {" "}
                {formatCurrency(ledger.balance)}{" "}
              </div>{" "}
            </CardContent>{" "}
          </Card>{" "}
        </div>{" "}
      </div>{" "}
      {/* Ledger Table */}{" "}
      <Card className="border-[#dadce0] shadow-sm bg-white">
        {" "}
        <CardContent className="p-0">
          {" "}
          <Table>
            {" "}
            <TableHeader className="bg-slate-50">
              {" "}
              <TableRow>
                {" "}
                <TableHead className="text-right">التاريخ</TableHead>{" "}
                <TableHead className="text-right">دفتر اليومية</TableHead>{" "}
                <TableHead className="text-right">قيد اليومية</TableHead>{" "}
                <TableHead className="text-right">حساب</TableHead>{" "}
                <TableHead className="text-right">الشريك</TableHead>{" "}
                <TableHead className="text-right">بطاقة عنوان</TableHead>{" "}
                <TableHead className="text-left">المدين</TableHead>{" "}
                <TableHead className="text-left">الدائن</TableHead>{" "}
                {/* <TableHead className="text-left w-24">الرصيد</TableHead> */}{" "}
              </TableRow>{" "}
            </TableHeader>{" "}
            <TableBody>
              {" "}
              {loading ? <TableRow>
                  {" "}
                  <TableCell colSpan={8} className="h-24 text-center">
                    {" "}
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      {" "}
                      <Loader2 className="w-4 h-4 animate-spin" /> جاري
                      التحميل...{" "}
                    </div>{" "}
                  </TableCell>{" "}
                </TableRow> : ledger.items.length === 0 ? <TableRow>
                  {" "}
                  <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                    {" "}
                    لا توجد حركات مسجلة لهذا العميل/المورد.{" "}
                  </TableCell>{" "}
                </TableRow> : ledger.items.map(item => <TableRow key={item.id} className="hover:bg-slate-50 transition-colors group">
                    {" "}
                    <TableCell className="font-medium">
                      {" "}
                      {new Date(item.date).toLocaleDateString("ar-EG")}{" "}
                    </TableCell>{" "}
                    <TableCell className="text-slate-600">
                      {" "}
                      {item.journalName}{" "}
                    </TableCell>{" "}
                    <TableCell className="font-mono text-xs text-indigo-600 cursor-pointer hover:underline">
                      {" "}
                      {item.entryName}{" "}
                    </TableCell>{" "}
                    <TableCell className="text-sm">
                      {" "}
                      {item.accountCode} {item.accountName}{" "}
                    </TableCell>{" "}
                    <TableCell className="text-slate-700">
                      {" "}
                      {item.partnerName}{" "}
                    </TableCell>{" "}
                    <TableCell className="text-slate-700 max-w-[300px] truncate" title={item.label}>
                      {" "}
                      {item.label}{" "}
                    </TableCell>{" "}
                    <TableCell className="text-left font-mono font-medium text-slate-700">
                      {" "}
                      {item.debit > 0 ? `${item.debit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} LE` : "0.00 LE"}{" "}
                    </TableCell>{" "}
                    <TableCell className="text-left font-mono font-medium text-slate-700">
                      {" "}
                      {item.credit > 0 ? `${item.credit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} LE` : "0.00 LE"}{" "}
                    </TableCell>{" "}
                  </TableRow>)}{" "}
            </TableBody>{" "}
          </Table>{" "}
        </CardContent>{" "}
      </Card>{" "}
      {/* Print-only Footer */}{" "}
      <div className="print-footer">
        {" "}
        تم إصدار هذا الكشف بواسطة نظام ERP —{" "}
        {new Date().toLocaleDateString("ar-EG")}{" "}
      </div>{" "}
    </div>;
}