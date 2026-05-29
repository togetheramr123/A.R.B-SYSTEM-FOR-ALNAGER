"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { getAllCashRegisters, getVisibleRegisters, createCashRegister, performSettlement, getUsersWithCashPermissions } from "@/app/actions/cash-register";
import { Wallet, Plus, RefreshCw, ArrowRightLeft, FileText, Settings2, Users, Landmark, ChevronLeft } from "lucide-react";
export default function CashRegistersPage() {
  const router = useRouter();
  const locale = useLocale();
  const [registers, setRegisters] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [regs, usrs] = await Promise.all([getAllCashRegisters(), getUsersWithCashPermissions()]);
      setRegisters(regs);
      setUsers(usrs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const handleSettle = async (registerId: string, registerName: string) => {
    if (!confirm(`هل تريد ترحيل خزينة "${registerName}" الآن؟`)) return;
    setSettling(registerId);
    try {
      const result = await performSettlement(registerId);
      if (result?.success) {
        toast.success("تم الترحيل بنجاح ✅");
        loadData();
      } else {
        toast.info(result?.message || "لا توجد معاملات للترحيل");
      }
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setSettling(null);
    }
  };
  const mainRegister = registers.find(r => r.isMain);
  const userRegisters = registers.filter(r => !r.isMain);
  return <div className="p-6 max-w-7xl mx-auto">
      {" "}
      {/* Header */}{" "}
      <div className="flex items-center justify-between mb-8">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {" "}
            <Landmark className="w-7 h-7 text-[#017E84]" /> إدارة الخزائن{" "}
          </h1>{" "}
          <p className="text-sm text-gray-500 mt-1">
            إنشاء وإدارة الصناديق والخزائن والصلاحيات
          </p>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <button onClick={() => router.push(`/${locale}/accounting/cash-registers/settlements`)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            {" "}
            <FileText className="w-4 h-4" /> محاضر الترحيل{" "}
          </button>{" "}
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#017E84] text-white rounded-lg text-sm font-bold hover:bg-[#01686c] transition-colors">
            {" "}
            <Plus className="w-4 h-4" /> إنشاء صندوق{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Main Register Card */}{" "}
      {mainRegister && <div className="bg-gradient-to-br from-[#017E84] to-[#015f63] text-white rounded-sm p-6 mb-6 shadow-sm">
          {" "}
          <div className="flex items-center justify-between">
            {" "}
            <div>
              {" "}
              <p className="text-white/70 text-sm font-medium">
                خزينة الحسابات الرئيسية
              </p>{" "}
              <h2 className="text-3xl font-bold mt-1 font-numbers">
                {" "}
                {mainRegister.balance.toLocaleString("ar-EG", {
              minimumFractionDigits: 2
            })}{" "}
              </h2>{" "}
              <p className="text-white/60 text-xs mt-1">
                {mainRegister.code} — {mainRegister.name}
              </p>{" "}
            </div>{" "}
            <div className="bg-white/20 rounded-sm p-3">
              {" "}
              <Landmark className="w-8 h-8" />{" "}
            </div>{" "}
          </div>{" "}
        </div>}{" "}
      {/* User Registers Grid */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {" "}
        {userRegisters.map(reg => <div key={reg.id} className="bg-white rounded-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            {" "}
            <div className="flex items-center justify-between mb-3">
              {" "}
              <div className="flex items-center gap-2">
                {" "}
                <div className="bg-amber-50 text-amber-600 rounded-lg p-2">
                  {" "}
                  <Wallet className="w-5 h-5" />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h3 className="font-bold text-gray-900 text-sm">
                    {reg.name}
                  </h3>{" "}
                  <p className="text-xs text-gray-500">
                    {reg.code} — {reg.user?.name || "غير مرتبط"}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${reg.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {" "}
                {reg.active ? "نشط" : "معطل"}{" "}
              </span>{" "}
            </div>{" "}
            <div className="text-2xl font-bold text-gray-900 font-numbers mb-4">
              {" "}
              {reg.balance.toLocaleString("ar-EG", {
            minimumFractionDigits: 2
          })}{" "}
              <span className="text-xs text-gray-400 font-normal mr-1">
                ج.م
              </span>{" "}
            </div>{" "}
            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              {" "}
              <button onClick={() => router.push(`/${locale}/accounting/cash-registers/${reg.id}/statement`)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#017E84] hover:bg-gray-50 py-2 rounded-lg transition-colors">
                {" "}
                <FileText className="w-3.5 h-3.5" /> كشف الحساب{" "}
              </button>{" "}
              <button onClick={() => handleSettle(reg.id, reg.name)} disabled={settling === reg.id} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 py-2 rounded-lg transition-colors disabled:opacity-50">
                {" "}
                {settling === reg.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}{" "}
                ترحيل{" "}
              </button>{" "}
            </div>{" "}
          </div>)}{" "}
        {userRegisters.length === 0 && !loading && <div className="col-span-full text-center py-16 text-gray-400">
            {" "}
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />{" "}
            <p className="font-medium">لا توجد خزائن مستخدمين</p>{" "}
            <p className="text-sm">
              اضغط "إنشاء صندوق" لإنشاء خزينة جديدة
            </p>{" "}
          </div>}{" "}
      </div>{" "}
      {/* Create Modal */}{" "}
      {showCreateModal && <CreateRegisterModal users={users} onClose={() => setShowCreateModal(false)} onCreated={() => {
      setShowCreateModal(false);
      loadData();
    }} />}{" "}
    </div>;
}
function CreateRegisterModal({
  users,
  onClose,
  onCreated
}: {
  users: any[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState("");
  const [isMain, setIsMain] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("أدخل اسم الخزينة");
      return;
    }
    setSaving(true);
    try {
      await createCashRegister({
        name: name.trim(),
        code: code.trim() || undefined,
        userId: userId || undefined,
        isMain
      });
      toast.success("تم إنشاء الخزينة بنجاح ✅");
      onCreated();
    } catch (e: any) {
      toast.error(e.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }; // Users without cash registers
  const availableUsers = users.filter(u => !u.cashRegister);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      {" "}
      <div className="bg-white rounded-sm shadow-sm w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {" "}
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          {" "}
          <Plus className="w-5 h-5 text-[#017E84]" /> إنشاء صندوق جديد{" "}
        </h2>{" "}
        <div className="space-y-4">
          {" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم الخزينة *
            </label>{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: خزينة المبيعات / أحمد" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#017E84] focus:border-transparent outline-none" />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الكود
            </label>{" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} value={code} onChange={e => setCode(e.target.value)} placeholder="تلقائي إذا فارغ" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#017E84] focus:border-transparent outline-none" />{" "}
          </div>{" "}
          <div>
            {" "}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المستخدم المرتبط
            </label>{" "}
            <select value={userId} onChange={e => setUserId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#017E84] focus:border-transparent outline-none">
              {" "}
              <option value="">— بدون مستخدم (خزينة عامة) —</option>{" "}
              {availableUsers.map(u => <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>)}{" "}
            </select>{" "}
          </div>{" "}
          <label className="flex items-center gap-2 cursor-pointer">
            {" "}
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isMain} onChange={e => setIsMain(e.target.checked)} className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84]" />{" "}
            <span className="text-sm text-gray-700 font-medium">
              خزينة الحسابات الرئيسية
            </span>{" "}
          </label>{" "}
        </div>{" "}
        <div className="flex items-center gap-3 mt-6">
          {" "}
          <button onClick={handleCreate} disabled={saving} className="flex-1 bg-[#017E84] text-white font-bold py-2.5 rounded-lg hover:bg-[#01686c] transition-colors disabled:opacity-50">
            {" "}
            {saving ? "جاري الإنشاء..." : "إنشاء"}{" "}
          </button>{" "}
          <button onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            {" "}
            إلغاء{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}