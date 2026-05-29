"use client";

import { useState } from "react";
import { Lock, Unlock, CalendarOff, CalendarCheck, CheckCircle2, XCircle, RotateCcw, AlertTriangle, Shield } from "lucide-react";
import { previewYearEndClosing, performYearEndClosing, reverseYearEndClosing, setPeriodLockDate, setAdvisorLockDate, removePeriodLockDate } from "@/app/actions/year-end";
export function YearEndClient({
  closings,
  lockSettings,
  locale
}: {
  closings: any[];
  lockSettings: any;
  locale: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [preview, setPreview] = useState<any>(null);
  const [lockDate, setLockDate] = useState(lockSettings?.periodLockDate?.split("T")[0] || "");
  const [advisorLock, setAdvisorLock] = useState(lockSettings?.advisorLockDate?.split("T")[0] || "");
  const currentYear = new Date().getFullYear();
  const years = Array.from({
    length: 5
  }, (_, i) => currentYear - i);
  const handlePreview = async () => {
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const result = await previewYearEndClosing(selectedYear);
      if ((result as any).error) {
        setError((result as any).error);
      } else {
        setPreview(result);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  const handleClose = async () => {
    if (!confirm(`هل أنت متأكد من إقفال السنة المالية ${selectedYear}؟ سيتم إنشاء قيد الإقفال وقفل الفترة تلقائياً.`)) return;
    setLoading(true);
    setError("");
    try {
      const result = (await performYearEndClosing(selectedYear)) as any;
      if (result.success) {
        setSuccess(`تم إقفال السنة المالية ${selectedYear} بنجاح! صافي الربح: ${result.netProfit.toLocaleString("ar-EG")}`);
        setPreview(null);
        window.location.reload();
      } else {
        setError(result.error);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  const handleReverse = async (year: number) => {
    if (!confirm(`هل أنت متأكد من عكس إقفال السنة ${year}؟`)) return;
    setLoading(true);
    try {
      const result = (await reverseYearEndClosing(year)) as any;
      if (result.success) {
        setSuccess(`تم عكس إقفال ${year}`);
        window.location.reload();
      } else {
        setError(result.error);
      }
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  const handleSetLock = async () => {
    if (!lockDate) return;
    setLoading(true);
    try {
      await setPeriodLockDate(lockDate);
      setSuccess("تم قفل الفترة بنجاح");
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  const handleSetAdvisorLock = async () => {
    if (!advisorLock) return;
    setLoading(true);
    try {
      await setAdvisorLockDate(advisorLock);
      setSuccess("تم قفل المدير المالي بنجاح");
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  const handleRemoveLock = async () => {
    if (!confirm("هل أنت متأكد من إزالة قفل الفترة؟")) return;
    setLoading(true);
    try {
      await removePeriodLockDate();
      setSuccess("تم إزالة القفل");
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  const fmt = (n: number) => new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(n);
  return <div className="space-y-8">
      {" "}
      {/* Header */}{" "}
      <div>
        {" "}
        <h1 className="text-2xl font-bold text-slate-900">
          إقفال السنة المالية وقفل الفترات
        </h1>{" "}
        <p className="text-sm text-slate-500 mt-1">
          إقفال حسابات الإيرادات والمصروفات وترحيل الأرباح المحتجزة
        </p>{" "}
      </div>{" "}
      {error && <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center gap-3">
          {" "}
          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />{" "}
          <p className="text-sm text-red-800">{error}</p>{" "}
        </div>}{" "}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 flex items-center gap-3">
          {" "}
          <CheckCircle2 className="w-5 h-5 text-teal-700 flex-shrink-0" />{" "}
          <p className="text-sm text-emerald-800">{success}</p>{" "}
        </div>}{" "}
      {/* ===== Year-End Closing Section ===== */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
        {" "}
        <div className="flex items-center gap-3 mb-6">
          {" "}
          <div className="w-10 h-10 bg-indigo-100 rounded-sm flex items-center justify-center">
            {" "}
            <CalendarOff className="w-5 h-5 text-indigo-600" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h2 className="text-lg font-bold text-slate-800">
              إقفال سنة مالية
            </h2>{" "}
            <p className="text-xs text-slate-500">
              اختر السنة ثم اعرض المعاينة قبل التأكيد
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-4 mb-6">
          {" "}
          <select value={selectedYear} onChange={e => {
          setSelectedYear(Number(e.target.value));
          setPreview(null);
        }} className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-bold bg-white">
            {" "}
            {years.map(y => <option key={y} value={y}>
                {y}
              </option>)}{" "}
          </select>{" "}
          <button onClick={handlePreview} disabled={loading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50">
            {" "}
            {loading ? "جاري التحميل..." : "معاينة الإقفال"}{" "}
          </button>{" "}
        </div>{" "}
        {/* Preview */}{" "}
        {preview && !preview.error && <div className="space-y-4">
            {" "}
            <div className="grid grid-cols-3 gap-4">
              {" "}
              <div className="bg-emerald-50 rounded-sm p-4 text-center">
                {" "}
                <p className="text-xs text-teal-700 font-bold mb-1">
                  إجمالي الإيرادات
                </p>{" "}
                <p className="text-xl font-bold text-emerald-700">
                  {fmt(preview.totalIncome)}
                </p>{" "}
              </div>{" "}
              <div className="bg-red-50 rounded-sm p-4 text-center">
                {" "}
                <p className="text-xs text-red-600 font-bold mb-1">
                  إجمالي المصروفات
                </p>{" "}
                <p className="text-xl font-bold text-red-700">
                  {fmt(preview.totalExpenses)}
                </p>{" "}
              </div>{" "}
              <div className={`${preview.isProfit ? "bg-blue-50" : "bg-amber-50"} rounded-sm p-4 text-center`}>
                {" "}
                <p className={`text-xs ${preview.isProfit ? "text-blue-600" : "text-amber-600"} font-bold mb-1`}>
                  {" "}
                  {preview.isProfit ? "صافي الربح" : "صافي الخسارة"}{" "}
                </p>{" "}
                <p className={`text-xl font-bold ${preview.isProfit ? "text-blue-700" : "text-amber-700"}`}>
                  {" "}
                  {fmt(Math.abs(preview.netProfit))}{" "}
                </p>{" "}
              </div>{" "}
            </div>{" "}
            {/* Detail Tables */}{" "}
            <div className="grid grid-cols-2 gap-4">
              {" "}
              <div>
                {" "}
                <h4 className="text-sm font-bold text-slate-700 mb-2">
                  حسابات الإيرادات ({preview.incomeLines.length})
                </h4>{" "}
                <div className="bg-slate-50 rounded-lg max-h-60 overflow-y-auto">
                  {" "}
                  <table className="w-full text-xs">
                    {" "}
                    <thead>
                      <tr className="text-slate-500">
                        <th className="py-2 px-3 text-right">الحساب</th>
                        <th className="py-2 px-3 text-left">الرصيد</th>
                      </tr>
                    </thead>{" "}
                    <tbody>
                      {" "}
                      {preview.incomeLines.map((line: any) => <tr key={line.accountId} className="border-t border-slate-200">
                          {" "}
                          <td className="py-1.5 px-3 font-medium">
                            {line.code} {line.name}
                          </td>{" "}
                          <td className="py-1.5 px-3 text-left font-bold text-emerald-700">
                            {fmt(line.balance)}
                          </td>{" "}
                        </tr>)}{" "}
                    </tbody>{" "}
                  </table>{" "}
                </div>{" "}
              </div>{" "}
              <div>
                {" "}
                <h4 className="text-sm font-bold text-slate-700 mb-2">
                  حسابات المصروفات ({preview.expenseLines.length})
                </h4>{" "}
                <div className="bg-slate-50 rounded-lg max-h-60 overflow-y-auto">
                  {" "}
                  <table className="w-full text-xs">
                    {" "}
                    <thead>
                      <tr className="text-slate-500">
                        <th className="py-2 px-3 text-right">الحساب</th>
                        <th className="py-2 px-3 text-left">الرصيد</th>
                      </tr>
                    </thead>{" "}
                    <tbody>
                      {" "}
                      {preview.expenseLines.map((line: any) => <tr key={line.accountId} className="border-t border-slate-200">
                          {" "}
                          <td className="py-1.5 px-3 font-medium">
                            {line.code} {line.name}
                          </td>{" "}
                          <td className="py-1.5 px-3 text-left font-bold text-red-700">
                            {fmt(line.balance)}
                          </td>{" "}
                        </tr>)}{" "}
                    </tbody>{" "}
                  </table>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              {" "}
              <AlertTriangle className="w-5 h-5 text-amber-500" />{" "}
              <p className="text-xs text-slate-600">
                سيتم إنشاء قيد إقفال وترحيل{" "}
                {preview.isProfit ? "الربح" : "الخسارة"} إلى حساب الأرباح
                المحتجزة. هذا الإجراء قابل للعكس.
              </p>{" "}
            </div>{" "}
            <button onClick={handleClose} disabled={loading} className="w-full bg-red-600 text-white py-3 rounded-sm text-sm font-bold hover:bg-red-700 transition disabled:opacity-50">
              {" "}
              {loading ? "جاري الإقفال..." : `⚡ تأكيد إقفال ${selectedYear}`}{" "}
            </button>{" "}
          </div>}{" "}
        {/* Previous Closings */}{" "}
        {closings.length > 0 && <div className="mt-6 pt-6 border-t border-slate-200">
            {" "}
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              سجل الإقفال
            </h3>{" "}
            <div className="space-y-2">
              {" "}
              {closings.map((c: any) => <div key={c.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
                  {" "}
                  <div className="flex items-center gap-3">
                    {" "}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.status === "confirmed" ? "bg-teal-50" : "bg-slate-200"}`}>
                      {" "}
                      {c.status === "confirmed" ? <CheckCircle2 className="w-4 h-4 text-teal-700" /> : <XCircle className="w-4 h-4 text-slate-400" />}{" "}
                    </div>{" "}
                    <div>
                      {" "}
                      <span className="text-sm font-bold text-slate-800">
                        {c.fiscalYear}
                      </span>{" "}
                      <span className={`mr-2 text-xs px-2 py-0.5 rounded-full ${c.status === "confirmed" ? "bg-teal-50 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                        {" "}
                        {c.status === "confirmed" ? "مقفل" : "تم العكس"}{" "}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-4">
                    {" "}
                    <span className="text-xs text-slate-500">
                      {" "}
                      ربح:{" "}
                      <span className="font-bold text-slate-800">
                        {fmt(Number(c.netProfit))}
                      </span>{" "}
                    </span>{" "}
                    {c.status === "confirmed" && <button onClick={() => handleReverse(c.fiscalYear)} className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1">
                        {" "}
                        <RotateCcw className="w-3 h-3" /> عكس{" "}
                      </button>}{" "}
                  </div>{" "}
                </div>)}{" "}
            </div>{" "}
          </div>}{" "}
      </div>{" "}
      {/* ===== Period Lock Section ===== */}{" "}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        {/* Period Lock */}{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
          {" "}
          <div className="flex items-center gap-3 mb-4">
            {" "}
            <div className="w-10 h-10 bg-amber-100 rounded-sm flex items-center justify-center">
              {" "}
              <Lock className="w-5 h-5 text-amber-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h2 className="text-base font-bold text-slate-800">
                قفل الفترة (للمستخدمين)
              </h2>{" "}
              <p className="text-xs text-slate-500">
                يمنع المستخدمين العاديين من إنشاء قيود قبل هذا التاريخ
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {lockSettings?.periodLockDate && <div className="bg-amber-50 rounded-lg p-3 mb-4 flex items-center justify-between">
              {" "}
              <span className="text-sm font-bold text-amber-800">
                {" "}
                🔒 مقفل حتى:{" "}
                {new Date(lockSettings.periodLockDate).toLocaleDateString("ar-EG")}{" "}
              </span>{" "}
              <button onClick={handleRemoveLock} className="text-xs text-red-600 hover:underline font-bold flex items-center gap-1">
                {" "}
                <Unlock className="w-3 h-3" /> إزالة{" "}
              </button>{" "}
            </div>}{" "}
          <div className="flex gap-3">
            {" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" value={lockDate} onChange={e => setLockDate(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
            <button onClick={handleSetLock} disabled={!lockDate || loading} className="bg-amber-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition disabled:opacity-50">
              {" "}
              قفل{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Advisor Lock */}{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6">
          {" "}
          <div className="flex items-center gap-3 mb-4">
            {" "}
            <div className="w-10 h-10 bg-red-100 rounded-sm flex items-center justify-center">
              {" "}
              <Shield className="w-5 h-5 text-red-600" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h2 className="text-base font-bold text-slate-800">
                قفل المدير المالي
              </h2>{" "}
              <p className="text-xs text-slate-500">
                يمنع الجميع بما فيهم المدير من التعديل قبل هذا التاريخ
              </p>{" "}
            </div>{" "}
          </div>{" "}
          {lockSettings?.advisorLockDate && <div className="bg-red-50 rounded-lg p-3 mb-4">
              {" "}
              <span className="text-sm font-bold text-red-800">
                {" "}
                🔐 قفل نهائي حتى:{" "}
                {new Date(lockSettings.advisorLockDate).toLocaleDateString("ar-EG")}{" "}
              </span>{" "}
            </div>}{" "}
          {lockSettings?.fiscalYearLockDate && <div className="bg-slate-50 rounded-lg p-3 mb-4">
              {" "}
              <span className="text-sm font-bold text-slate-700">
                {" "}
                📅 قفل السنة المالية:{" "}
                {new Date(lockSettings.fiscalYearLockDate).toLocaleDateString("ar-EG")}{" "}
              </span>{" "}
            </div>}{" "}
          <div className="flex gap-3">
            {" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" value={advisorLock} onChange={e => setAdvisorLock(e.target.value)} className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />{" "}
            <button onClick={handleSetAdvisorLock} disabled={!advisorLock || loading} className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition disabled:opacity-50">
              {" "}
              قفل نهائي{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}