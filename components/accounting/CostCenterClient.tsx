"use client";

import { useState } from "react";
import { PieChart, ChevronDown, ChevronUp, Loader2, Building2 } from "lucide-react";
import { getCostCenterReport } from "@/app/actions/reporting";
export function CostCenterClient({
  locale
}: {
  locale: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const fmt = (n: number) => new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("ar-EG");
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await getCostCenterReport(from || undefined, to || undefined);
      setData(result);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };
  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);else next.add(id);
    setExpanded(next);
  };
  const totalBalance = data.reduce((s, c) => s + c.balance, 0);
  const totalDebit = data.reduce((s, c) => s + c.totalDebit, 0);
  const totalCredit = data.reduce((s, c) => s + c.totalCredit, 0);
  return <div className="space-y-6">
      {" "}
      <div className="flex items-center gap-3">
        {" "}
        <div className="w-10 h-10 bg-violet-100 rounded-sm flex items-center justify-center">
          {" "}
          <PieChart className="w-5 h-5 text-violet-600" />{" "}
        </div>{" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-slate-900">
            تقرير مراكز التكلفة
          </h1>{" "}
          <p className="text-sm text-slate-500">
            تحليل حركات الحسابات التحليلية
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Filters */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
        {" "}
        <div className="flex gap-4 items-end">
          {" "}
          <div className="flex-1">
            {" "}
            <label className="text-xs text-slate-500 mb-1 block">من</label>{" "}
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
          </div>{" "}
          <div className="flex-1">
            {" "}
            <label className="text-xs text-slate-500 mb-1 block">
              إلى
            </label>{" "}
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
          </div>{" "}
          <button onClick={handleGenerate} disabled={loading} className="bg-violet-600 text-white px-8 py-2.5 rounded-sm text-sm font-bold hover:bg-violet-700 transition disabled:opacity-50 flex items-center gap-2">
            {" "}
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PieChart className="w-4 h-4" />}{" "}
            عرض{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Results */}{" "}
      {data.length > 0 && <>
          {" "}
          {/* Summary */}{" "}
          <div className="grid grid-cols-3 gap-4">
            {" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
              {" "}
              <p className="text-xs text-slate-500 font-bold mb-1">
                عدد مراكز التكلفة
              </p>{" "}
              <p className="text-2xl font-bold text-slate-900">
                {data.length}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
              {" "}
              <p className="text-xs text-slate-500 font-bold mb-1">
                إجمالي مدين
              </p>{" "}
              <p className="text-xl font-bold text-red-700">
                {fmt(totalDebit)}
              </p>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
              {" "}
              <p className="text-xs text-slate-500 font-bold mb-1">
                إجمالي دائن
              </p>{" "}
              <p className="text-xl font-bold text-emerald-700">
                {fmt(totalCredit)}
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {/* Centers */}{" "}
          <div className="space-y-3">
            {" "}
            {data.map(center => {
          const isExpanded = expanded.has(center.id);
          const balancePct = totalBalance !== 0 ? Math.abs(center.balance / totalBalance) * 100 : 0;
          return <div key={center.id} className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
                  {" "}
                  <button onClick={() => toggleExpand(center.id)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition">
                    {" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                        {" "}
                        <Building2 className="w-4 h-4 text-violet-600" />{" "}
                      </div>{" "}
                      <div className="text-right">
                        {" "}
                        <p className="text-sm font-bold text-slate-800">
                          {center.name}
                        </p>{" "}
                        {center.code && <p className="text-[10px] text-slate-400 font-mono">
                            {center.code}
                          </p>}{" "}
                      </div>{" "}
                    </div>{" "}
                    <div className="flex items-center gap-6">
                      {" "}
                      <div className="text-left">
                        {" "}
                        <p className="text-xs text-slate-400">مدين</p>{" "}
                        <p className="text-sm font-bold text-red-700 font-numbers">
                          {fmt(center.totalDebit)}
                        </p>{" "}
                      </div>{" "}
                      <div className="text-left">
                        {" "}
                        <p className="text-xs text-slate-400">دائن</p>{" "}
                        <p className="text-sm font-bold text-emerald-700 font-numbers">
                          {fmt(center.totalCredit)}
                        </p>{" "}
                      </div>{" "}
                      <div className="text-left min-w-[100px]">
                        {" "}
                        <p className="text-xs text-slate-400">الرصيد</p>{" "}
                        <p className={`text-sm font-bold font-numbers ${center.balance >= 0 ? "text-red-700" : "text-emerald-700"}`}>
                          {" "}
                          {fmt(center.balance)}{" "}
                        </p>{" "}
                      </div>{" "}
                      <div className="w-[60px]">
                        {" "}
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          {" "}
                          <div className="h-full bg-violet-500 rounded-full transition-all" style={{
                      width: `${Math.min(balancePct, 100)}%`
                    }} />{" "}
                        </div>{" "}
                        <p className="text-[10px] text-slate-400 text-center mt-0.5">
                          {balancePct.toFixed(1)}%
                        </p>{" "}
                      </div>{" "}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}{" "}
                    </div>{" "}
                  </button>{" "}
                  {isExpanded && center.items.length > 0 && <div className="border-t border-slate-100 max-h-80 overflow-y-auto">
                      {" "}
                      <table className="w-full text-xs">
                        {" "}
                        <thead className="bg-slate-50 sticky top-0">
                          {" "}
                          <tr>
                            {" "}
                            <th className="py-2 px-4 text-right font-bold text-slate-500">
                              التاريخ
                            </th>{" "}
                            <th className="py-2 px-4 text-right font-bold text-slate-500">
                              القيد
                            </th>{" "}
                            <th className="py-2 px-4 text-right font-bold text-slate-500">
                              الحساب
                            </th>{" "}
                            <th className="py-2 px-4 text-left font-bold text-slate-500">
                              مدين
                            </th>{" "}
                            <th className="py-2 px-4 text-left font-bold text-slate-500">
                              دائن
                            </th>{" "}
                          </tr>{" "}
                        </thead>{" "}
                        <tbody>
                          {" "}
                          {center.items.map((item: any, i: number) => <tr key={i} className="border-t border-slate-100">
                              {" "}
                              <td className="py-1.5 px-4 text-slate-500 font-numbers">
                                {fmtDate(item.date)}
                              </td>{" "}
                              <td className="py-1.5 px-4 font-bold text-slate-700">
                                {item.entryName}
                              </td>{" "}
                              <td className="py-1.5 px-4 text-slate-600">
                                {item.accountName}
                              </td>{" "}
                              <td className="py-1.5 px-4 text-left font-numbers font-bold text-red-600">
                                {item.debit > 0 ? fmt(item.debit) : ""}
                              </td>{" "}
                              <td className="py-1.5 px-4 text-left font-numbers font-bold text-teal-700">
                                {item.credit > 0 ? fmt(item.credit) : ""}
                              </td>{" "}
                            </tr>)}{" "}
                        </tbody>{" "}
                      </table>{" "}
                    </div>}{" "}
                </div>;
        })}{" "}
          </div>{" "}
        </>}{" "}
      {!loading && data.length === 0 && <div className="bg-white rounded-sm shadow-sm border border-slate-200 py-16 text-center">
          {" "}
          <PieChart className="w-10 h-10 text-slate-300 mx-auto mb-3" />{" "}
          <p className="text-sm text-slate-400">
            اضغط "عرض" لتحميل بيانات مراكز التكلفة
          </p>{" "}
        </div>}{" "}
    </div>;
}