"use client";
import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPettyCashExpense } from "@/app/actions/petty-cash";
import { toast } from "sonner";
import { Receipt, Save, RotateCcw, Banknote, CalendarDays, FileText, Wallet } from "lucide-react";
type Props = {
  expenseAccounts: {
    id: string;
    code: string;
    name: string;
  }[];
  cashJournals: {
    id: string;
    name: string;
    defaultAccount?: {
      name: string;
    } | null;
  }[];
  locale: string;
};
export function PettyCashForm({
  expenseAccounts,
  cashJournals,
  locale
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    expenseAccountId: "",
    journalId: cashJournals[0]?.id || ""
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount || !form.expenseAccountId || !form.journalId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    setLoading(true);
    try {
      const result = await createPettyCashExpense({
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        expenseAccountId: form.expenseAccountId,
        journalId: form.journalId
      });
      if (result.success) {
        toast.success("تم تسجيل المصروف النثري بنجاح");
        setForm({
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          expenseAccountId: "",
          journalId: cashJournals[0]?.id || ""
        });
        router.refresh();
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setLoading(false);
    }
  };
  return <div className="bg-white border border-slate-300 shadow-sm rounded-lg max-w-2xl w-full">
      {" "}
      {/* Header */}{" "}
      <div className="border-b border-slate-200 p-4 flex items-center gap-3 bg-slate-50 rounded-t-lg">
        {" "}
        <div className="p-2 bg-amber-100 rounded-lg">
          {" "}
          <Banknote className="w-5 h-5 text-amber-700" />{" "}
        </div>{" "}
        <div>
          {" "}
          <h2 className="font-bold text-slate-800 text-lg">
            مصروف نثري / عُهدة
          </h2>{" "}
          <p className="text-xs text-slate-500">
            تسجيل مصروف نقدي صغير مع إنشاء القيد المحاسبي تلقائياً
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Form */}{" "}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {" "}
        {/* Description */}{" "}
        <div>
          {" "}
          <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
            {" "}
            <FileText className="w-4 h-4 text-slate-400" /> البيان / الوصف{" "}
            <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <input type="text" value={form.description} onChange={e => setForm({
          ...form,
          description: e.target.value
        })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="مثال: شراء أدوات مكتبية، وقود سيارة، ضيافة..." />{" "}
        </div>{" "}
        <div className="grid grid-cols-2 gap-6">
          {" "}
          {/* Amount */}{" "}
          <div>
            {" "}
            <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
              {" "}
              <Wallet className="w-4 h-4 text-slate-400" /> المبلغ (ج.م){" "}
              <span className="text-red-500">*</span>{" "}
            </label>{" "}
            <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({
            ...form,
            amount: e.target.value
          })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-bold focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="0.00" />{" "}
          </div>{" "}
          {/* Date */}{" "}
          <div>
            {" "}
            <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
              {" "}
              <CalendarDays className="w-4 h-4 text-slate-400" /> التاريخ{" "}
              <span className="text-red-500">*</span>{" "}
            </label>{" "}
            <input type="date" value={form.date} onChange={e => setForm({
            ...form,
            date: e.target.value
          })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" />{" "}
          </div>{" "}
        </div>{" "}
        {/* Expense Account */}{" "}
        <div>
          {" "}
          <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
            {" "}
            <Receipt className="w-4 h-4 text-slate-400" /> حساب المصروف{" "}
            <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <select value={form.expenseAccountId} onChange={e => setForm({
          ...form,
          expenseAccountId: e.target.value
        })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
            {" "}
            <option value="">(اختر حساب المصروف)</option>{" "}
            {expenseAccounts.map(acc => <option key={acc.id} value={acc.id}>
                {acc.code} — {acc.name}
              </option>)}{" "}
          </select>{" "}
          <p className="text-xs text-slate-400 mt-1">
            يتم خصم المبلغ من هذا الحساب (حساب مدين)
          </p>{" "}
        </div>{" "}
        {/* Cash Journal */}{" "}
        <div>
          {" "}
          <label className="text-sm font-bold text-slate-700 mb-1 flex items-center gap-2">
            {" "}
            <Banknote className="w-4 h-4 text-slate-400" /> دفتر الخزينة
            (النقدية) <span className="text-red-500">*</span>{" "}
          </label>{" "}
          <select value={form.journalId} onChange={e => setForm({
          ...form,
          journalId: e.target.value
        })} className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none bg-white">
            {" "}
            <option value="">(اختر الدفتر النقدي)</option>{" "}
            {cashJournals.map(j => <option key={j.id} value={j.id}>
                {j.name} {j.defaultAccount ? `(${j.defaultAccount.name})` : ""}
              </option>)}{" "}
          </select>{" "}
          <p className="text-xs text-slate-400 mt-1">
            يتم إضافة المبلغ كدائن في حساب الخزينة (سند صرف نقدي)
          </p>{" "}
        </div>{" "}
        {/* Info Callout */}{" "}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex gap-2">
          {" "}
          <span className="font-bold mt-0.5">ℹ️</span>{" "}
          <span>
            عند الحفظ، يتم تلقائياً: إنشاء <strong>سند صرف</strong> +{" "}
            <strong>قيد يومية مُرحل</strong> (مدين: حساب المصروف / دائن: حساب
            الخزينة).
          </span>{" "}
        </div>{" "}
        {/* Actions */}{" "}
        <div className="flex items-center gap-3 pt-2">
          {" "}
          <button type="submit" disabled={loading} className="bg-[#017E84] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50">
            {" "}
            <Save className="w-4 h-4" />{" "}
            {loading ? "جاري الحفظ..." : "حفظ وترحيل"}{" "}
          </button>{" "}
          <button type="button" onClick={() => router.push(`/${locale}/accounting/petty-cash`)} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2">
            {" "}
            <RotateCcw className="w-4 h-4" /> إلغاء{" "}
          </button>{" "}
        </div>{" "}
      </form>{" "}
    </div>;
}