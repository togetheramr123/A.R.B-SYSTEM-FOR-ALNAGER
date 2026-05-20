"use client";

import React, { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { getOpeningBalancesData, saveOpeningBalances } from "@/app/actions/opening_balances";
import { Scale, Save, CheckCircle2, ArrowRight, Building2, UserCircle2, Landmark } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
export default function OpeningBalancesPage() {
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [registers, setRegisters] = useState<any[]>([]);
  const [partnerBalances, setPartnerBalances] = useState<Record<string, number>>({});
  const [registerBalances, setRegisterBalances] = useState<Record<string, number>>({});
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOpeningBalancesData();
      setPartners(data.partners);
      setRegisters(data.registers);
    } catch (e) {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };
  const handlePartnerChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setPartnerBalances(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
  };
  const handleRegisterChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setRegisterBalances(prev => ({
      ...prev,
      [id]: isNaN(num) ? 0 : num
    }));
  };
  const totalPartnerDebits = Object.values(partnerBalances).filter(v => v > 0).reduce((a, b) => a + b, 0);
  const totalPartnerCredits = Object.values(partnerBalances).filter(v => v < 0).reduce((a, b) => a + Math.abs(b), 0);
  const totalRegisterDebits = Object.values(registerBalances).filter(v => v > 0).reduce((a, b) => a + b, 0);
  const totalRegisterCredits = Object.values(registerBalances).filter(v => v < 0).reduce((a, b) => a + Math.abs(b), 0);
  const grandTotalDebit = totalPartnerDebits + totalRegisterDebits;
  const grandTotalCredit = totalPartnerCredits + totalRegisterCredits;
  const difference = grandTotalDebit - grandTotalCredit;
  const handleSave = async () => {
    setSaving(true);
    try {
      const payloadPartners = Object.entries(partnerBalances).filter(([_, bal]) => bal !== 0).map(([id, balance]) => {
        const p = partners.find(x => x.id === id);
        return {
          partnerId: id,
          balance,
          type: p?.type === "vendor" ? "payable" : "receivable" as "payable" | "receivable"
        };
      });
      const payloadRegisters = Object.entries(registerBalances).filter(([_, bal]) => bal !== 0).map(([id, balance]) => ({
        registerId: id,
        balance
      }));
      if (payloadPartners.length === 0 && payloadRegisters.length === 0) {
        toast.error("الرجاء إدخال رصيد واحد على الأقل");
        setSaving(false);
        return;
      }
      const entry = await saveOpeningBalances({
        partners: payloadPartners,
        registers: payloadRegisters
      });
      toast.success("تم إنشاء قيد الأرصدة الافتتاحية كمسودة بنجاح"); // Redirect to the newly created journal entry for review
      router.push(`/${locale}/accounting/journal-entries/${entry.id}`);
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ أثناء الحفظ");
      setSaving(false);
    }
  };
  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">
        جاري تحميل الحسابات...
      </div>;
  return <div className="p-4 pb-24">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-md disabled:opacity-50">
            {" "}
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}{" "}
            {saving ? "جاري الحفظ..." : "حفظ كمسودة (مراجعة القيد)"}{" "}
          </button>{" "}
          <Link href={`/${locale}/dashboard`} className="text-slate-600 hover:bg-slate-100 rounded-lg px-4 py-2 text-sm font-medium transition-colors border border-slate-200 bg-white">
            {" "}
            إلغاء{" "}
          </Link>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {" "}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
          {" "}
          <div className="bg-gray-50 p-6 flex items-center gap-4 text-white">
            {" "}
            <div className="w-12 h-12 bg-white/10 rounded-sm flex items-center justify-center backdrop-blur-sm">
              {" "}
              <Scale className="w-6 h-6 text-white" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h1 className="text-2xl font-bold tracking-tight">
                إعداد الأرصدة الافتتاحية
              </h1>{" "}
              <p className="text-sm text-slate-300 mt-1 font-medium">
                {" "}
                أدخل الأرصدة القديمة للحسابات، وسيقوم النظام بتوليد قيد يومية
                متوازن آلياً لمراجعته.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {" "}
          {/* Bank/Cash Section */}{" "}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
            {" "}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
              {" "}
              <Landmark className="w-5 h-5 text-teal-700" />{" "}
              <h2 className="font-bold text-slate-800 text-lg">
                الخزائن والبنوك
              </h2>{" "}
            </div>{" "}
            <div className="p-4 flex-1 space-y-3">
              {" "}
              <p className="text-xs text-slate-500 mb-4 font-bold">
                {" "}
                أدخل الرصيد الفعلي الموجود في كل خزينة/بنك لحظة بدء النظام.
                (موجب = رصيد متاح).{" "}
              </p>{" "}
              {registers.map(reg => <div key={reg.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {" "}
                  <span className="font-bold text-sm text-slate-700">
                    {reg.name}
                  </span>{" "}
                  <div className="flex items-center gap-2">
                    {" "}
                    <input type="number" placeholder="0.00" className="w-32 px-3 py-1.5 text-left border border-slate-300 rounded-md text-sm font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none" onChange={e => handleRegisterChange(reg.id, e.target.value)} />{" "}
                    <span className="text-xs font-bold text-slate-400">
                      ريال
                    </span>{" "}
                  </div>{" "}
                </div>)}{" "}
              {registers.length === 0 && <div className="text-center text-slate-400 text-sm font-bold p-4">
                  لا توجد خزائن مسجلة.
                </div>}{" "}
            </div>{" "}
          </div>{" "}
          {/* Partners Section */}{" "}
          <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex flex-col">
            {" "}
            <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center gap-2">
              {" "}
              <Building2 className="w-5 h-5 text-blue-600" />{" "}
              <h2 className="font-bold text-slate-800 text-lg">
                العملاء والموردين
              </h2>{" "}
            </div>{" "}
            <div className="p-4 flex-1 space-y-3 max-h-[500px] overflow-y-auto">
              {" "}
              <p className="text-xs text-slate-500 mb-4 font-bold">
                {" "}
                أدخل مديونية كل عميل (موجب = عليه فلوس) ومستحقات كل مورد (سالب =
                له فلوس).{" "}
              </p>{" "}
              {partners.map(p => <div key={p.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 hover:bg-blue-50/50 transition-colors">
                  {" "}
                  <div className="flex items-center gap-2">
                    {" "}
                    <UserCircle2 className="w-4 h-4 text-slate-400" />{" "}
                    <div className="flex flex-col">
                      {" "}
                      <span className="font-bold text-sm text-slate-700">
                        {p.name}
                      </span>{" "}
                      <span className="text-[10px] text-slate-400 font-bold">
                        {p.type === "customer" ? "عميل" : "مورد"}
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="flex items-center gap-2">
                    {" "}
                    <input type="number" placeholder="0.00" className={`w-32 px-3 py-1.5 text-left border rounded-md text-sm font-mono outline-none ${(partnerBalances[p.id] || 0) < 0 ? "border-rose-300 text-red-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500" : "border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`} onChange={e => handlePartnerChange(p.id, e.target.value)} />{" "}
                    <span className="text-xs font-bold text-slate-400">
                      ريال
                    </span>{" "}
                  </div>{" "}
                </div>)}{" "}
              {partners.length === 0 && <div className="text-center text-slate-400 text-sm font-bold p-4">
                  لا يوجد شركاء مسجلين.
                </div>}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Summary Footer */}{" "}
        <div className="fixed bottom-0 left-0 right-0 lg:right-64 bg-slate-900 border-t border-slate-800 text-white p-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          {" "}
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {" "}
            <div className="flex items-center gap-8">
              {" "}
              <div className="flex flex-col">
                {" "}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  إجمالي المدين (Debit)
                </span>{" "}
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {grandTotalDebit.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                </span>{" "}
              </div>{" "}
              <div className="flex flex-col">
                {" "}
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  إجمالي الدائن (Credit)
                </span>{" "}
                <span className="text-xl font-mono font-bold text-rose-400">
                  {grandTotalCredit.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                </span>{" "}
              </div>{" "}
            </div>{" "}
            <div className="flex items-center gap-4 bg-slate-800 px-6 py-2 rounded-sm border border-slate-700">
              {" "}
              <div className="flex flex-col items-end">
                {" "}
                <span className="text-[10px] text-slate-400 font-bold">
                  حساب موازنة الأرصدة (Equity)
                </span>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <span className="text-lg font-mono font-bold text-white">
                    {" "}
                    {Math.abs(difference).toLocaleString("en-US", {
                    minimumFractionDigits: 2
                  })}{" "}
                  </span>{" "}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${difference > 0 ? "bg-rose-500/20 text-rose-300" : "bg-emerald-500/20 text-emerald-300"}`}>
                    {" "}
                    {difference > 0 ? "دائن" : difference < 0 ? "مدين" : "متوازن"}{" "}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}