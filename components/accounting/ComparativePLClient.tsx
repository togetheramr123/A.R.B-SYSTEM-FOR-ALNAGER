"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, ArrowRight, BarChart3, Loader2 } from "lucide-react";
import { getComparativeProfitLoss } from "@/app/actions/reporting";
export function ComparativePLClient({
  locale
}: {
  locale: string;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const currentYear = new Date().getFullYear();
  const [currentFrom, setCurrentFrom] = useState(`${currentYear}-01-01`);
  const [currentTo, setCurrentTo] = useState(`${currentYear}-12-31`);
  const [previousFrom, setPreviousFrom] = useState(`${currentYear - 1}-01-01`);
  const [previousTo, setPreviousTo] = useState(`${currentYear - 1}-12-31`);
  const fmt = (n: number) => new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await getComparativeProfitLoss(new Date(currentFrom), new Date(currentTo), new Date(previousFrom), new Date(previousTo));
      setData(result);
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };
  const ChangeIndicator = ({
    value,
    pct
  }: {
    value: number;
    pct: number;
  }) => {
    if (Math.abs(value) < 0.01) return <span className="text-xs text-slate-400">—</span>;
    const isPositive = value > 0;
    return <div className="flex items-center gap-1">
        {" "}
        {isPositive ? <TrendingUp className="w-3 h-3 text-teal-700" /> : <TrendingDown className="w-3 h-3 text-red-600" />}{" "}
        <span className={`text-xs font-bold ${isPositive ? "text-teal-700" : "text-red-600"}`}>
          {" "}
          {pct > 0 ? "+" : ""}
          {pct}%{" "}
        </span>{" "}
      </div>;
  };
  return <div className="space-y-6">
      {" "}
      <div className="flex items-center gap-3">
        {" "}
        <div className="w-10 h-10 bg-indigo-100 rounded-sm flex items-center justify-center">
          {" "}
          <BarChart3 className="w-5 h-5 text-indigo-600" />{" "}
        </div>{" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-slate-900">
            تقرير أرباح وخسائر مقارن
          </h1>{" "}
          <p className="text-sm text-slate-500">
            مقارنة أداء فترتين ماليتين
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Filters */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
        {" "}
        <div className="grid grid-cols-2 gap-6">
          {" "}
          <div>
            {" "}
            <h3 className="text-sm font-bold text-indigo-700 mb-3">
              الفترة الحالية
            </h3>{" "}
            <div className="flex gap-3">
              {" "}
              <div className="flex-1">
                {" "}
                <label className="text-xs text-slate-500 mb-1 block">
                  من
                </label>{" "}
                <input type="date" value={currentFrom} onChange={e => setCurrentFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
              </div>{" "}
              <div className="flex-1">
                {" "}
                <label className="text-xs text-slate-500 mb-1 block">
                  إلى
                </label>{" "}
                <input type="date" value={currentTo} onChange={e => setCurrentTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="text-sm font-bold text-slate-500 mb-3">
              الفترة السابقة
            </h3>{" "}
            <div className="flex gap-3">
              {" "}
              <div className="flex-1">
                {" "}
                <label className="text-xs text-slate-500 mb-1 block">
                  من
                </label>{" "}
                <input type="date" value={previousFrom} onChange={e => setPreviousFrom(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
              </div>{" "}
              <div className="flex-1">
                {" "}
                <label className="text-xs text-slate-500 mb-1 block">
                  إلى
                </label>{" "}
                <input type="date" value={previousTo} onChange={e => setPreviousTo(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <button onClick={handleGenerate} disabled={loading} className="mt-4 w-full bg-indigo-600 text-white py-2.5 rounded-sm text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
          {" "}
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}{" "}
          {loading ? "جاري التحميل..." : "عرض التقرير المقارن"}{" "}
        </button>{" "}
      </div>{" "}
      {/* Results */}{" "}
      {data && <div className="space-y-6">
          {" "}
          {/* Summary Cards */}{" "}
          <div className="grid grid-cols-3 gap-4">
            {" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
              {" "}
              <div className="flex justify-between items-start mb-2">
                {" "}
                <p className="text-xs text-teal-700 font-bold">
                  إجمالي الإيرادات
                </p>{" "}
                <ChangeIndicator value={data.changes.income} pct={data.changes.incomePct} />{" "}
              </div>{" "}
              <div className="flex items-baseline gap-3">
                {" "}
                <p className="text-xl font-bold text-emerald-700">
                  {fmt(data.current.totalIncome)}
                </p>{" "}
                <ArrowRight className="w-3 h-3 text-slate-400" />{" "}
                <p className="text-sm text-slate-400">
                  {fmt(data.previous.totalIncome)}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-5">
              {" "}
              <div className="flex justify-between items-start mb-2">
                {" "}
                <p className="text-xs text-red-600 font-bold">
                  إجمالي المصروفات
                </p>{" "}
                <ChangeIndicator value={data.changes.expenses} pct={data.changes.expensesPct} />{" "}
              </div>{" "}
              <div className="flex items-baseline gap-3">
                {" "}
                <p className="text-xl font-bold text-red-700">
                  {fmt(data.current.totalExpenses)}
                </p>{" "}
                <ArrowRight className="w-3 h-3 text-slate-400" />{" "}
                <p className="text-sm text-slate-400">
                  {fmt(data.previous.totalExpenses)}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            <div className={`bg-white rounded-sm shadow-sm border ${data.current.netProfit >= 0 ? "border-blue-200" : "border-amber-200"} p-5`}>
              {" "}
              <div className="flex justify-between items-start mb-2">
                {" "}
                <p className={`text-xs font-bold ${data.current.netProfit >= 0 ? "text-blue-600" : "text-amber-600"}`}>
                  {" "}
                  {data.current.netProfit >= 0 ? "صافي الربح" : "صافي الخسارة"}{" "}
                </p>{" "}
                <ChangeIndicator value={data.changes.profit} pct={data.changes.profitPct} />{" "}
              </div>{" "}
              <div className="flex items-baseline gap-3">
                {" "}
                <p className={`text-xl font-bold ${data.current.netProfit >= 0 ? "text-blue-700" : "text-amber-700"}`}>
                  {" "}
                  {fmt(Math.abs(data.current.netProfit))}{" "}
                </p>{" "}
                <ArrowRight className="w-3 h-3 text-slate-400" />{" "}
                <p className="text-sm text-slate-400">
                  {fmt(Math.abs(data.previous.netProfit))}
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Detail Tables */}{" "}
          <div className="grid grid-cols-1 gap-6">
            {" "}
            {/* Income */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
              {" "}
              <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                {" "}
                <h3 className="text-sm font-bold text-emerald-800">
                  الإيرادات
                </h3>{" "}
              </div>{" "}
              <table className="w-full text-sm">
                {" "}
                <thead className="bg-slate-50 border-b">
                  {" "}
                  <tr>
                    {" "}
                    <th className="py-2 px-4 text-right text-slate-600 font-bold">
                      الحساب
                    </th>{" "}
                    <th className="py-2 px-4 text-left text-indigo-600 font-bold">
                      الفترة الحالية
                    </th>{" "}
                    <th className="py-2 px-4 text-left text-slate-400 font-bold">
                      الفترة السابقة
                    </th>{" "}
                    <th className="py-2 px-4 text-left text-slate-600 font-bold">
                      الفرق
                    </th>{" "}
                    <th className="py-2 px-4 text-center text-slate-600 font-bold">
                      %
                    </th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {data.income.map((line: any) => <tr key={line.accountId} className="border-b border-slate-100 hover:bg-slate-50">
                      {" "}
                      <td className="py-2 px-4 font-medium text-slate-800">
                        {line.code} {line.name}
                      </td>{" "}
                      <td className="py-2 px-4 text-left font-numbers font-bold text-slate-900">
                        {fmt(line.currentBalance)}
                      </td>{" "}
                      <td className="py-2 px-4 text-left font-numbers text-slate-400">
                        {fmt(line.previousBalance)}
                      </td>{" "}
                      <td className={`py-2 px-4 text-left font-numbers font-bold ${line.change >= 0 ? "text-teal-700" : "text-red-600"}`}>
                        {" "}
                        {line.change >= 0 ? "+" : ""}
                        {fmt(line.change)}{" "}
                      </td>{" "}
                      <td className="py-2 px-4 text-center">
                        {" "}
                        <ChangeIndicator value={line.change} pct={line.changePct} />{" "}
                      </td>{" "}
                    </tr>)}{" "}
                  {data.income.length === 0 && <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        لا توجد بيانات
                      </td>
                    </tr>}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>{" "}
            {/* Expenses */}{" "}
            <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
              {" "}
              <div className="bg-red-50 px-5 py-3 border-b border-red-100">
                {" "}
                <h3 className="text-sm font-bold text-red-800">
                  المصروفات
                </h3>{" "}
              </div>{" "}
              <table className="w-full text-sm">
                {" "}
                <thead className="bg-slate-50 border-b">
                  {" "}
                  <tr>
                    {" "}
                    <th className="py-2 px-4 text-right text-slate-600 font-bold">
                      الحساب
                    </th>{" "}
                    <th className="py-2 px-4 text-left text-indigo-600 font-bold">
                      الفترة الحالية
                    </th>{" "}
                    <th className="py-2 px-4 text-left text-slate-400 font-bold">
                      الفترة السابقة
                    </th>{" "}
                    <th className="py-2 px-4 text-left text-slate-600 font-bold">
                      الفرق
                    </th>{" "}
                    <th className="py-2 px-4 text-center text-slate-600 font-bold">
                      %
                    </th>{" "}
                  </tr>{" "}
                </thead>{" "}
                <tbody>
                  {" "}
                  {data.expenses.map((line: any) => <tr key={line.accountId} className="border-b border-slate-100 hover:bg-slate-50">
                      {" "}
                      <td className="py-2 px-4 font-medium text-slate-800">
                        {line.code} {line.name}
                      </td>{" "}
                      <td className="py-2 px-4 text-left font-numbers font-bold text-slate-900">
                        {fmt(line.currentBalance)}
                      </td>{" "}
                      <td className="py-2 px-4 text-left font-numbers text-slate-400">
                        {fmt(line.previousBalance)}
                      </td>{" "}
                      <td className={`py-2 px-4 text-left font-numbers font-bold ${line.change <= 0 ? "text-teal-700" : "text-red-600"}`}>
                        {" "}
                        {line.change >= 0 ? "+" : ""}
                        {fmt(line.change)}{" "}
                      </td>{" "}
                      <td className="py-2 px-4 text-center">
                        {" "}
                        <ChangeIndicator value={-line.change} pct={-line.changePct} />{" "}
                      </td>{" "}
                    </tr>)}{" "}
                  {data.expenses.length === 0 && <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        لا توجد بيانات
                      </td>
                    </tr>}{" "}
                </tbody>{" "}
              </table>{" "}
            </div>{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}