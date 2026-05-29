"use client";

import { toast } from "sonner";
import React, { useState, useEffect, use } from "react";
import { useTranslations } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Save, AlertCircle, Plus, Trash2, ArrowRight, FileText, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { getJournals, getChartOfAccounts, saveJournalEntry, getJournalEntry } from "@/app/actions/accounting";
import { getPartners } from "@/app/actions/inventory";
import { getCompanies } from "@/app/actions/company";
export default function JournalEntryDetailsPage(props: {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}) {
  const params = use(props.params);
  const locale = params.locale || "ar";
  const t = useTranslations("Accounting");
  const router = useRouter();
  const isNew = params.id === "new";
  const isReadOnly = !isNew;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // Form Data
  const [entry, setEntry] = useState<any>({
    date: new Date().toISOString().split("T")[0],
    journalId: "",
    partnerId: "",
    companyId: "",
    ref: "",
    state: "draft"
  }); // Ledger Items (Debit/Credit Lines);
  const [items, setItems] = useState<any[]>([{
    id: "1",
    accountId: "",
    partnerId: "",
    name: "",
    debit: 0,
    credit: 0
  }, {
    id: "2",
    accountId: "",
    partnerId: "",
    name: "",
    debit: 0,
    credit: 0
  }]); // Lookups
  const [journals, setJournals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const promises: any[] = [getJournals(), getChartOfAccounts(), getPartners(), getCompanies()];
        if (!isNew) {
          promises.push(getJournalEntry(params.id));
        }
        const results = await Promise.all(promises);
        const jData = results[0] || [];
        const aData = results[1] || [];
        const pData = results[2] || [];
        const cData = results[3] || [];
        const existingEntry = !isNew ? results[4] : null;
        console.log("Fetched existing entry:", existingEntry);
        setJournals(jData);
        setAccounts(aData);
        setPartners(pData);
        setCompanies(cData);
        if (isNew) {
          const defaultEntry: any = {};
          if (jData.length > 0) defaultEntry.journalId = jData[0].id;
          if (cData.length > 0) defaultEntry.companyId = cData[0].id;
          if (Object.keys(defaultEntry).length > 0) {
            setEntry((prev: any) => ({ ...prev, ...defaultEntry }));
          }
        } else if (existingEntry) {
          setEntry({
            date: existingEntry.date ? new Date(existingEntry.date).toISOString().split("T")[0] : "",
            journalId: existingEntry.journalId || "",
            partnerId: existingEntry.partnerId || "",
            companyId: existingEntry.companyId || "",
            ref: existingEntry.ref || "",
            state: existingEntry.state || "draft",
            name: existingEntry.name || "",
            invoice: existingEntry.invoice || null,
            payment: existingEntry.payment || null
          });
          if (existingEntry.items && existingEntry.items.length > 0) {
            setItems(existingEntry.items.map((i: any) => ({
              id: i.id,
              accountId: i.accountId || "",
              partnerId: existingEntry.partnerId || i.partnerId || "",
              name: i.name || "",
              debit: i.debit ? Number(i.debit) : 0,
              credit: i.credit ? Number(i.credit) : 0
            })));
          }
        }
      } catch (error: any) {
        console.error("Failed to load dependency data", error);
        toast.error("حدث خطأ أثناء تحميل البيانات: " + (error.message || String(error)));
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [isNew, params.id]); // Computed totals
  const totalDebit = items.reduce((sum, item) => sum + Number(item.debit || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + Number(item.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.001;
  const handleSave = async () => {
    if (!isBalanced) {
      toast.error("لا يمكن الحفظ: يجب أن يتساوى المدين والدائن");
      return;
    }
    if (!entry.journalId) {
      toast.error("يرجى اختيار يومية");
      return;
    }
    const validItems = items.filter(i => i.accountId && (Number(i.debit) > 0 || Number(i.credit) > 0));
    if (validItems.length < 2) {
      toast.error("يجب إدخال سطرين محاسبيين على الأقل (مدين ودائن)");
      return;
    }
    setSaving(true);
    try {
      const result = await saveJournalEntry({
        id: isNew ? "new" : params.id,
        ...entry,
        items: validItems
      });
      if (result.success) {
        router.push("/accounting/journal-entries");
      } else {
        toast.error(result.error || "فشل حفظ القيد المحاسبي");
      }
    } catch (error) {
      console.error("Save failed", error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };
  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id !== id) return item;
      const updatedItem = {
        ...item,
        [field]: value
      };
      if (field === "debit" && Number(value) > 0) updatedItem.credit = 0;
      if (field === "credit" && Number(value) > 0) updatedItem.debit = 0;
      return updatedItem;
    }));
  };
  const handleAddItem = () => {
    const newId = Math.random().toString(36).substring(7);
    const diff = totalDebit - totalCredit;
    setItems([...items, {
      id: newId,
      accountId: "",
      name: entry.ref || "",
      debit: diff < 0 ? Math.abs(diff) : 0,
      credit: diff > 0 ? diff : 0
    }]);
  };
  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };
  if (loading) return <div className="p-8 text-center text-slate-500">
        جاري تحميل القيد المحاسبي...
      </div>;
  return <div className="p-4" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          {!isReadOnly && <button onClick={handleSave} disabled={saving || !isBalanced} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
              {" "}
              <Save className="w-3.5 h-3.5" />{" "}
              {saving ? "جاري الحفظ..." : "حفظ"}{" "}
            </button>}{" "}
          <Link href="/accounting/journal-entries" className="text-slate-600 hover:bg-slate-100 rounded-sm px-3 py-1 text-xs font-medium transition-colors">
            {" "}
            تراجع{" "}
          </Link>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {" "}
        {/* Status Ribbon */}{" "}
        <div className="bg-white border-b px-8 py-3 flex items-center justify-between border-x border-t rounded-t-lg shadow-sm">
          {" "}
          <div className="flex gap-2 items-center">
            {" "}
            {entry.invoice && <Link href={`/${locale}/accounting/${entry.invoice.type === "out_invoice" ? "invoices" : "bills"}/${entry.invoice.id}`} className="text-sm font-bold bg-indigo-50 border border-indigo-200 shadow-sm px-4 py-1.5 rounded text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors">
                {" "}
                <FileText className="w-4 h-4" /> عرض الفاتورة{" "}
              </Link>}{" "}
            {entry.payment && <Link href={`/${locale}/accounting/payments`} className="text-sm font-bold bg-emerald-50 border border-emerald-200 shadow-sm px-4 py-1.5 rounded text-emerald-700 hover:bg-teal-50 flex items-center gap-1.5 transition-colors">
                {" "}
                <CreditCard className="w-4 h-4" /> عرض الدفعة{" "}
              </Link>}{" "}
            <button disabled className="text-sm font-semibold bg-white border shadow-sm px-4 py-1.5 rounded text-sky-700 opacity-50 cursor-not-allowed">
              {" "}
              ترحيل{" "}
            </button>{" "}
            <button disabled className="text-sm font-semibold bg-white border shadow-sm px-4 py-1.5 rounded text-slate-700 opacity-50 cursor-not-allowed">
              {" "}
              إلغاء القيد{" "}
            </button>{" "}
          </div>{" "}
          <div className="flex items-center">
            {" "}
            <span className={entry.state === "draft" ? "text-sky-600 font-bold px-3" : "text-slate-400 font-medium px-3"}>
              مسودة
            </span>{" "}
            <ArrowRight className="w-4 h-4 text-slate-300" />{" "}
            <span className={entry.state === "posted" ? "text-teal-700 font-bold px-3" : "text-slate-400 font-medium px-3"}>
              مُرحّل
            </span>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-white border border-slate-300 shadow-sm rounded-b-sm p-8 sm:p-12 min-h-[600px] mt-0 border-t-0">
          {" "}
          <div className="mb-8">
            {" "}
            <h1 className="text-3xl font-bold text-slate-800 mb-8">
              {" "}
              {isNew ? "قيد مسودة" : entry.name}{" "}
            </h1>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              {" "}
              {/* Right Column */}{" "}
              <div className="space-y-4">
                {" "}
                <div className="grid grid-cols-[120px_1fr] items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    اليومية
                  </label>{" "}
                  <select disabled={isReadOnly} value={entry.journalId} onChange={e => setEntry({
                  ...entry,
                  journalId: e.target.value
                })} className="w-full border-b border-slate-300 focus:border-sky-600 outline-none py-1.5 text-slate-900 bg-transparent transition-colors disabled:opacity-70">
                    {" "}
                    <option value="">-- اختر اليومية --</option>{" "}
                    {journals.map(j => <option key={j.id} value={j.id}>
                        {j.name} ({j.code})
                      </option>)}{" "}
                  </select>{" "}
                </div>{" "}
                <div className="grid grid-cols-[120px_1fr] items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    المرجع
                  </label>{" "}
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" disabled={isReadOnly} value={entry.ref} onChange={e => setEntry({
                  ...entry,
                  ref: e.target.value
                })} className="w-full border-b border-slate-300 focus:border-sky-600 outline-none py-1.5 text-slate-900 bg-transparent transition-colors disabled:opacity-70" placeholder="مثلاً: فاتورة #1234" />{" "}
                </div>{" "}
              </div>{" "}
              {/* Left Column */}{" "}
              <div className="space-y-4">
                {" "}
                <div className="grid grid-cols-[120px_1fr] items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    التاريخ المحاسبي
                  </label>{" "}
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" disabled={isReadOnly} value={entry.date} onChange={e => setEntry({
                  ...entry,
                  date: e.target.value
                })} className="w-full border-b border-slate-300 focus:border-sky-600 outline-none py-1.5 text-slate-900 bg-transparent transition-colors disabled:opacity-70" />{" "}
                </div>{" "}
                <div className="grid grid-cols-[120px_1fr] items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    الشركة / الفرع
                  </label>{" "}
                  <select disabled={isReadOnly} value={entry.companyId} onChange={e => setEntry({
                  ...entry,
                  companyId: e.target.value
                })} className="w-full border-b border-slate-300 focus:border-sky-600 outline-none py-1.5 text-slate-900 bg-transparent transition-colors disabled:opacity-70">
                    {" "}
                    {companies.map(c => <option key={c.id} value={c.id}>
                        {c.name}
                      </option>)}{" "}
                  </select>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Journal Items Tab */}{" "}
          <div className="mt-12">
            {" "}
            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
              عناصر اليومية (دفتر الأستاذ)
            </h2>{" "}
            {!isBalanced && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md flex items-center gap-2 text-sm font-medium">
                {" "}
                <AlertCircle className="w-4 h-4" /> القيد غير متوازن! الفرق:{" "}
                {Math.abs(totalDebit - totalCredit).toLocaleString()} LE{" "}
              </div>}{" "}
            <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
              {" "}
              <div className="overflow-x-auto">
                {" "}
                <table className="w-full text-right text-sm relative">
                  {" "}
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                    {" "}
                    <tr>
                      {" "}
                      <th className="px-4 py-3 min-w-[200px] text-right">
                        الحساب
                      </th>{" "}
                      <th className="px-4 py-3 min-w-[180px] text-right">
                        الشريك
                      </th>{" "}
                      <th className="px-4 py-3 min-w-[200px] text-right">
                        البيان (بطاقة عنوان)
                      </th>{" "}
                      <th className="px-4 py-3 w-[150px] text-left">مدين</th>{" "}
                      <th className="px-4 py-3 w-[150px] text-left">دائن</th>{" "}
                      <th className="px-4 py-3 w-[50px]"></th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody className="divide-y divide-slate-100">
                    {" "}
                    {items.map(item => <tr key={item.id} className="hover:bg-sky-50 transition-colors group">
                        {" "}
                        <td className="px-4 py-1.5">
                          {" "}
                          <select disabled={isReadOnly} value={item.accountId} onChange={e => handleItemChange(item.id, "accountId", e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-sky-500 focus:ring-0 px-0 py-1 text-sm font-medium disabled:opacity-100 disabled:appearance-none">
                            {" "}
                            <option value="">اختر الحساب...</option>{" "}
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>
                                {acc.code} {acc.name}
                              </option>)}{" "}
                          </select>{" "}
                        </td>{" "}
                        <td className="px-4 py-1.5">
                          {" "}
                          <select disabled={isReadOnly} value={item.partnerId || ""} onChange={e => handleItemChange(item.id, "partnerId", e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-sky-500 focus:ring-0 px-0 py-1 text-sm font-medium disabled:opacity-100 disabled:appearance-none">
                            {" "}
                            <option value="">--</option>{" "}
                            {partners.map(p => <option key={p.id} value={p.id}>
                                {p.name}
                              </option>)}{" "}
                          </select>{" "}
                        </td>{" "}
                        <td className="px-4 py-1.5">
                          {" "}
                          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" disabled={isReadOnly} value={item.name} onChange={e => handleItemChange(item.id, "name", e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-sky-500 focus:ring-0 px-0 py-1 text-sm disabled:opacity-100 disabled:cursor-default" placeholder="البيان..." />{" "}
                        </td>{" "}
                        <td className="px-4 py-1.5">
                          {" "}
                          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" disabled={isReadOnly} min="0" step="0.01" value={item.debit === 0 ? "" : item.debit} onChange={e => handleItemChange(item.id, "debit", e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-sky-500 focus:ring-0 px-0 py-1 text-sm text-left tabular-nums focus:bg-white disabled:opacity-100 disabled:cursor-default" placeholder="0.00" dir="ltr" />{" "}
                        </td>{" "}
                        <td className="px-4 py-1.5">
                          {" "}
                          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" disabled={isReadOnly} min="0" step="0.01" value={item.credit === 0 ? "" : item.credit} onChange={e => handleItemChange(item.id, "credit", e.target.value)} className="w-full bg-transparent border-0 border-b border-transparent focus:border-sky-500 focus:ring-0 px-0 py-1 text-sm text-left tabular-nums focus:bg-white disabled:opacity-100 disabled:cursor-default" placeholder="0.00" dir="ltr" />{" "}
                        </td>{" "}
                        <td className="px-4 py-1.5 text-left">
                          {" "}
                          {!isReadOnly && <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1" title="حذف السطر">
                              {" "}
                              <Trash2 className="w-4 h-4" />{" "}
                            </button>}{" "}
                        </td>{" "}
                      </tr>)}{" "}
                    {/* Totals Row */}{" "}
                    <tr className="bg-slate-800 text-white font-bold border-t-2 border-slate-300">
                      {" "}
                      <td colSpan={3} className="px-4 py-3 text-left text-white">
                        الإجمالي:
                      </td>{" "}
                      <td className={`px-4 py-3 text-left tabular-nums ${!isBalanced ? "text-rose-300" : ""}`}>
                        {" "}
                        {totalDebit.toLocaleString("en-US", {
                        minimumFractionDigits: 2
                      })}{" "}
                        LE{" "}
                      </td>{" "}
                      <td className={`px-4 py-3 text-left tabular-nums ${!isBalanced ? "text-rose-300" : ""}`}>
                        {" "}
                        {totalCredit.toLocaleString("en-US", {
                        minimumFractionDigits: 2
                      })}{" "}
                        LE{" "}
                      </td>{" "}
                      <td></td>{" "}
                    </tr>{" "}
                  </tbody>{" "}
                </table>{" "}
              </div>{" "}
              {!isReadOnly && <div className="p-3 border-t border-slate-100 bg-white">
                  {" "}
                  <button onClick={handleAddItem} className="text-sm font-medium text-sky-600 hover:text-sky-800 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-sky-50">
                    {" "}
                    <Plus className="w-4 h-4" /> إضافة سطر{" "}
                  </button>{" "}
                </div>}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}