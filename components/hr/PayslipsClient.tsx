"use client";

import { toast } from "sonner";
import { useState } from "react";
import { createPayslip, confirmPayslip } from "@/app/actions/hr";
import { Receipt, Check, X, Plus, User, Calendar, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
export default function PayslipsClient({
  payslips,
  employees,
  locale
}: {
  payslips: any[];
  employees: any[];
  locale: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: "",
    dateFrom: "",
    dateTo: ""
  });
  const handleCreate = async () => {
    if (!form.employeeId || !form.dateFrom || !form.dateTo) return;
    setLoading(true);
    try {
      await createPayslip(form);
      setForm({
        employeeId: "",
        dateFrom: "",
        dateTo: ""
      });
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };
  const handleConfirm = async (id: string) => {
    setConfirming(id);
    try {
      await confirmPayslip(id);
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setConfirming(null);
    }
  };
  return <div className="p-6 space-y-6 pb-20">
      {" "}
      {/* Page Header */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-gray-900">
            كشوف المرتبات
          </h1>{" "}
          <p className="text-sm text-gray-500 mt-1">
            {payslips.length} كشف مرتب
          </p>{" "}
        </div>{" "}
        <button onClick={() => setShowForm(true)} className="bg-gray-800 text-white px-5 py-2.5 rounded-sm text-sm font-bold hover:bg-gray-900 transition-all flex items-center gap-2 shadow-sm">
          {" "}
          <Plus className="w-4 h-4" /> كشف مرتب جديد{" "}
        </button>{" "}
      </div>{" "}
      {/* Create Form */}{" "}
      {showForm && <div className="bg-white rounded-sm border border-gray-200 shadow-md p-6 animate-in fade-in duration-200">
          {" "}
          <div className="flex items-center justify-between mb-5">
            {" "}
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              {" "}
              <Receipt className="w-5 h-5 text-slate-500" /> إنشاء كشف مرتب
              جديد{" "}
            </h3>{" "}
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              {" "}
              <X className="w-5 h-5" />{" "}
            </button>{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                الموظف
              </label>{" "}
              <select value={form.employeeId} onChange={e => setForm({
            ...form,
            employeeId: e.target.value
          })} className="w-full border border-gray-200 rounded-sm px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all bg-white">
                {" "}
                <option value="">اختر موظف...</option>{" "}
                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>)}{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                من تاريخ
              </label>{" "}
              <input type="date" value={form.dateFrom} onChange={e => setForm({
            ...form,
            dateFrom: e.target.value
          })} className="w-full border border-gray-200 rounded-sm px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all" />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                إلى تاريخ
              </label>{" "}
              <input type="date" value={form.dateTo} onChange={e => setForm({
            ...form,
            dateTo: e.target.value
          })} className="w-full border border-gray-200 rounded-sm px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="mt-4 flex gap-2">
            {" "}
            <button onClick={handleCreate} disabled={loading || !form.employeeId || !form.dateFrom || !form.dateTo} className="bg-[#017E84] text-white px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
              {" "}
              {loading ? "جاري الإنشاء..." : "إنشاء"}{" "}
            </button>{" "}
            <button onClick={() => setShowForm(false)} className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-gray-200 transition-all">
              {" "}
              إلغاء{" "}
            </button>{" "}
          </div>{" "}
        </div>}{" "}
      {/* Payslips Table */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50/50">
              {" "}
              <tr>
                {" "}
                <th className="px-6 py-4 text-right">المرجع</th>{" "}
                <th className="px-6 py-4 text-right">الموظف</th>{" "}
                <th className="px-6 py-4 text-right">القسم</th>{" "}
                <th className="px-6 py-4 text-right">الفترة</th>{" "}
                <th className="px-6 py-4 text-right">الراتب الأساسي</th>{" "}
                <th className="px-6 py-4 text-right">الإجمالي</th>{" "}
                <th className="px-6 py-4 text-right">الصافي</th>{" "}
                <th className="px-6 py-4 text-right">الحالة</th>{" "}
                <th className="px-6 py-4 text-right">إجراءات</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {payslips.map((slip: any) => <tr key={slip.id} className="hover:bg-gray-50/50 transition-all">
                  {" "}
                  <td className="px-6 py-4">
                    {" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <Receipt className="w-4 h-4 text-slate-500" />{" "}
                      <span className="font-bold text-blue-600 text-sm">
                        {slip.name}
                      </span>{" "}
                    </div>{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <div className="w-7 h-7 bg-[#017E84]/10 rounded-lg flex items-center justify-center">
                        {" "}
                        <User className="w-3.5 h-3.5 text-[#017E84]" />{" "}
                      </div>{" "}
                      <span className="text-sm font-medium text-gray-700">
                        {slip.employee?.name || "-"}
                      </span>{" "}
                    </div>{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {slip.employee?.department?.name || "-"}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {" "}
                    {new Date(slip.dateFrom).toLocaleDateString("en-CA")} —{" "}
                    {new Date(slip.dateTo).toLocaleDateString("en-CA")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                    {" "}
                    {Number(slip.basicWage).toLocaleString("en-US")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                    {" "}
                    {Number(slip.gross).toLocaleString("en-US")}{" "}
                  </td>{" "}
                  <td className="px-6 py-4 font-bold text-gray-900 text-sm">
                    {" "}
                    {Number(slip.net).toLocaleString("en-US")}{" "}
                    <span className="text-[10px] text-gray-400">EGP</span>{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-md border", slip.state === "done" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100")}>
                      {" "}
                      {slip.state === "done" ? "مؤكد" : "مسودة"}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="px-6 py-4">
                    {" "}
                    {slip.state === "draft" && <button onClick={() => handleConfirm(slip.id)} disabled={confirming === slip.id} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-teal-50 transition-all flex items-center gap-1.5 disabled:opacity-50">
                        {" "}
                        <Check className="w-3.5 h-3.5" />{" "}
                        {confirming === slip.id ? "جاري..." : "تأكيد"}{" "}
                      </button>}{" "}
                    {slip.state === "done" && slip.journalEntry && <span className="text-[10px] text-gray-400 font-medium">
                        {" "}
                        قيد: {slip.journalEntry.name}{" "}
                      </span>}{" "}
                  </td>{" "}
                </tr>)}{" "}
              {payslips.length === 0 && <tr>
                  {" "}
                  <td colSpan={9} className="px-6 py-16 text-center">
                    {" "}
                    <div className="w-14 h-14 bg-gray-100 rounded-sm mx-auto mb-3 flex items-center justify-center">
                      {" "}
                      <Receipt className="w-7 h-7 text-gray-300" />{" "}
                    </div>{" "}
                    <h3 className="text-base font-bold text-gray-700 mb-1">
                      لا توجد كشوف مرتبات
                    </h3>{" "}
                    <p className="text-sm text-gray-400">
                      أنشئ كشف مرتب جديد لأحد الموظفين
                    </p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}