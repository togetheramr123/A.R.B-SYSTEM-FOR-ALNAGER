"use client";
import React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { createCashTransaction, getVisibleRegisters } from "@/app/actions/cash-register";
import { getAllPartners } from "@/app/actions/partner";
import { Receipt, CreditCard } from "lucide-react";
export default function NewCashTransactionPage() {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const transactionType = searchParams.get("type") || "receipt";
  /* ?type=receipt or ?type=disbursement */
  const isReceipt = transactionType === "receipt";
  const title = isReceipt ? "سند قبض جديد" : "سند صرف جديد";
  const icon = isReceipt ? <Receipt className="w-6 h-6 text-green-600" /> : <CreditCard className="w-6 h-6 text-red-500" />;
  const [registers, setRegisters] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    registerId: "",
    amount: "",
    description: "",
    ref: "",
    partnerId: "",
    date: today
  });
  useEffect(() => {
    getVisibleRegisters().then(regs => {
      setRegisters(regs);
      if (regs.length === 1) setForm(f => ({
        ...f,
        registerId: regs[0].id
      }));
    });
    getAllPartners().then(p => setPartners(p));
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("أدخل مبلغ صحيح");
      return;
    }
    if (!form.description.trim()) {
      toast.error("أدخل البيان");
      return;
    }
    setSaving(true);
    try {
      await createCashTransaction({
        type: isReceipt ? "receipt" : "disbursement",
        amount: parseFloat(form.amount),
        description: form.description.trim(),
        ref: form.ref.trim() || undefined,
        partnerId: form.partnerId || undefined,
        registerId: form.registerId || undefined,
        date: form.date
      });
      toast.success(isReceipt ? "تم إنشاء سند القبض ✅" : "تم إنشاء سند الصرف ✅");
      router.push(`/${locale}/accounting/cash-registers`);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };
  return <div className="p-6 max-w-2xl mx-auto">
      {" "}
      {/* Type Toggle */}{" "}
      <div className="flex items-center gap-2 mb-5">
        {" "}
        <button onClick={() => router.replace(`/${locale}/accounting/cash-registers/new-transaction?type=receipt`)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${isReceipt ? "bg-green-600 text-white shadow-md" : "bg-white border border-gray-300 text-gray-600 hover:bg-green-50"}`}>
          {" "}
          <Receipt className="w-4 h-4" /> سند قبض{" "}
        </button>{" "}
        <button onClick={() => router.replace(`/${locale}/accounting/cash-registers/new-transaction?type=disbursement`)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${!isReceipt ? "bg-red-600 text-white shadow-md" : "bg-white border border-gray-300 text-gray-600 hover:bg-red-50"}`}>
          {" "}
          <CreditCard className="w-4 h-4" /> سند صرف{" "}
        </button>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
        {" "}
        {/* Header */}{" "}
        <div className={`px-6 py-4 border-b ${isReceipt ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
          {" "}
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-3">
            {" "}
            {icon} {title}{" "}
          </h1>{" "}
        </div>{" "}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {" "}
          <div>
            {" "}
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              الصندوق / الخزينة
            </label>{" "}
            <select value={form.registerId} onChange={e => setForm(f => ({
            ...f,
            registerId: e.target.value
          }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#017E84] outline-none bg-white">
              {" "}
              <option value="">— خزينتي الافتراضية —</option>{" "}
              {registers.map(r => <option key={r.id} value={r.id}>
                  {r.code} — {r.name}
                </option>)}{" "}
            </select>{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              المبلغ *
            </label>{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({
            ...f,
            amount: e.target.value
          }))} placeholder="0.00" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-lg font-bold font-numbers focus:ring-2 focus:ring-[#017E84] outline-none" required />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              البيان *
            </label>{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={form.description} onChange={e => setForm(f => ({
            ...f,
            description: e.target.value
          }))} placeholder={isReceipt ? "مثال: عميل نقدي أو اسم العميل" : "مثال: مصاريف نقل"} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#017E84] outline-none" required />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              العميل / المورد
            </label>{" "}
            <select value={form.partnerId} onChange={e => setForm(f => ({
            ...f,
            partnerId: e.target.value
          }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#017E84] outline-none bg-white">
              {" "}
              <option value="">— بدون —</option>{" "}
              {partners.map((p: any) => <option key={p.id} value={p.id}>
                  {p.name}
                </option>)}{" "}
            </select>{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              رقم المستند المرجعي
            </label>{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={form.ref} onChange={e => setForm(f => ({
            ...f,
            ref: e.target.value
          }))} placeholder="مثال: 1/Sal/12115" className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-numbers focus:ring-2 focus:ring-[#017E84] outline-none" />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              التاريخ
            </label>{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" value={form.date} onChange={e => setForm(f => ({
            ...f,
            date: e.target.value
          }))} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#017E84] outline-none" />{" "}
          </div>{" "}
          <div className="flex items-center gap-3 pt-3">
            {" "}
            <button type="submit" disabled={saving} className={`flex-1 font-bold py-3 rounded-lg transition-colors text-white disabled:opacity-50 ${isReceipt ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
              {" "}
              {saving ? "جاري الحفظ..." : isReceipt ? "تسجيل سند القبض" : "تسجيل سند الصرف"}{" "}
            </button>{" "}
            <button type="button" onClick={() => router.back()} className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              {" "}
              إلغاء{" "}
            </button>{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
    </div>;
}