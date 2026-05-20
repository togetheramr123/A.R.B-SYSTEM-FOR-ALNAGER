"use client";

import { useState } from "react";
import Link from "next/link";
import { FileCheck, AlertTriangle, CheckCircle2, XCircle, Plus, Banknote, ArrowDownToLine, ArrowUpFromLine, Clock, Ban } from "lucide-react";
import { registerCheque, collectCheque, bounceCheque } from "@/app/actions/cheques";
const statusColors: Record<string, {
  bg: string;
  text: string;
  label: string;
}> = {
  draft: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    label: "مسودة"
  },
  registered: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "مسجل"
  },
  deposited: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
    label: "مودع"
  },
  collected: {
    bg: "bg-teal-50",
    text: "text-emerald-700",
    label: "محصّل"
  },
  bounced: {
    bg: "bg-red-100",
    text: "text-red-700",
    label: "مرفوض"
  },
  cancelled: {
    bg: "bg-slate-100",
    text: "text-slate-500",
    label: "ملغي"
  }
};
export function ChequesListClient({
  cheques,
  summary,
  locale
}: {
  cheques: any[];
  summary: any;
  locale: string;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const fmt = (n: number) => new Intl.NumberFormat("ar-EG", {
    minimumFractionDigits: 2
  }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("ar-EG");
  const filtered = filter === "all" ? cheques : cheques.filter(c => c.status === filter);
  const handleAction = async (id: string, action: "register" | "collect" | "bounce") => {
    setLoading(id);
    try {
      if (action === "register") await registerCheque(id);else if (action === "collect") await collectCheque(id);else if (action === "bounce") {
        const reason = prompt("سبب الرفض:");
        if (reason !== null) await bounceCheque(id, reason || undefined);
      }
      window.location.reload();
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(null);
  };
  return <div className="space-y-6">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-slate-900">
            إدارة الشيكات
          </h1>{" "}
          <p className="text-sm text-slate-500 mt-1">
            شيكات واردة وصادرة مع إشعارات الاستحقاق
          </p>{" "}
        </div>{" "}
        <Link href={`/${locale}/accounting/cheques/new`} className="bg-indigo-600 text-white px-5 py-2.5 rounded-sm text-sm font-bold hover:bg-indigo-700 transition flex items-center gap-2">
          {" "}
          <Plus className="w-4 h-4" /> شيك جديد{" "}
        </Link>{" "}
      </div>{" "}
      {/* Summary Cards */}{" "}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
          {" "}
          <Banknote className="w-5 h-5 text-slate-400 mx-auto mb-1" />{" "}
          <p className="text-xs text-slate-500 font-bold">إجمالي</p>{" "}
          <p className="text-xl font-bold text-slate-900">
            {summary.total}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
          {" "}
          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />{" "}
          <p className="text-xs text-slate-500 font-bold">مسجلة</p>{" "}
          <p className="text-xl font-bold text-blue-700">
            {summary.registeredCount}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
          {" "}
          <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />{" "}
          <p className="text-xs text-slate-500 font-bold">محصّلة</p>{" "}
          <p className="text-xl font-bold text-emerald-700">
            {summary.collectedCount}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
          {" "}
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />{" "}
          <p className="text-xs text-slate-500 font-bold">مرفوضة</p>{" "}
          <p className="text-xl font-bold text-red-700">
            {summary.bouncedCount}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
          {" "}
          <ArrowDownToLine className="w-5 h-5 text-emerald-400 mx-auto mb-1" />{" "}
          <p className="text-xs text-slate-500 font-bold">واردة معلقة</p>{" "}
          <p className="text-sm font-bold text-emerald-700">
            {fmt(summary.totalInboundPending)}
          </p>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 text-center">
          {" "}
          <ArrowUpFromLine className="w-5 h-5 text-red-400 mx-auto mb-1" />{" "}
          <p className="text-xs text-slate-500 font-bold">صادرة معلقة</p>{" "}
          <p className="text-sm font-bold text-red-700">
            {fmt(summary.totalOutboundPending)}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {summary.overdueCount > 0 && <div className="bg-red-50 border border-red-200 rounded-sm p-4 flex items-center gap-3">
          {" "}
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />{" "}
          <p className="text-sm text-red-800 font-bold">
            يوجد {summary.overdueCount} شيك متأخر عن الاستحقاق!
          </p>{" "}
        </div>}{" "}
      {/* Filter Tabs */}{" "}
      <div className="flex gap-2 flex-wrap">
        {" "}
        {[{
        key: "all",
        label: "الكل"
      }, {
        key: "draft",
        label: "مسودة"
      }, {
        key: "registered",
        label: "مسجل"
      }, {
        key: "collected",
        label: "محصّل"
      }, {
        key: "bounced",
        label: "مرفوض"
      }].map(f => <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${filter === f.key ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"}`}>
            {" "}
            {f.label}{" "}
          </button>)}{" "}
      </div>{" "}
      {/* Table */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
        {" "}
        <table className="w-full text-sm">
          {" "}
          <thead className="bg-slate-50 border-b border-slate-200">
            {" "}
            <tr>
              {" "}
              <th className="py-3 px-4 text-right font-bold text-slate-600">
                رقم الشيك
              </th>{" "}
              <th className="py-3 px-4 text-right font-bold text-slate-600">
                النوع
              </th>{" "}
              <th className="py-3 px-4 text-right font-bold text-slate-600">
                الشريك
              </th>{" "}
              <th className="py-3 px-4 text-right font-bold text-slate-600">
                المبلغ
              </th>{" "}
              <th className="py-3 px-4 text-right font-bold text-slate-600">
                تاريخ الاستحقاق
              </th>{" "}
              <th className="py-3 px-4 text-right font-bold text-slate-600">
                البنك
              </th>{" "}
              <th className="py-3 px-4 text-center font-bold text-slate-600">
                الحالة
              </th>{" "}
              <th className="py-3 px-4 text-center font-bold text-slate-600">
                إجراءات
              </th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody>
            {" "}
            {filtered.length === 0 ? <tr>
                {" "}
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  {" "}
                  <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" /> لا
                  توجد شيكات{" "}
                </td>{" "}
              </tr> : filtered.map(c => {
            const isOverdue = new Date(c.dueDate) < new Date() && ["registered", "deposited"].includes(c.status);
            const s = statusColors[c.status] || statusColors.draft;
            return <tr key={c.id} className={`border-b border-slate-100 hover:bg-slate-50 transition ${isOverdue ? "bg-red-50/30" : ""}`}>
                    {" "}
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {c.number}
                    </td>{" "}
                    <td className="py-3 px-4">
                      {" "}
                      <span className={`text-xs font-bold ${c.type === "inbound" ? "text-teal-700" : "text-red-600"}`}>
                        {" "}
                        {c.type === "inbound" ? "↓ وارد" : "↑ صادر"}{" "}
                      </span>{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-slate-700">
                      {c.partner?.name || "—"}
                    </td>{" "}
                    <td className="py-3 px-4 font-bold text-slate-900" dir="ltr">
                      {fmt(c.amount)}
                    </td>{" "}
                    <td className={`py-3 px-4 ${isOverdue ? "text-red-700 font-bold" : "text-slate-600"}`}>
                      {" "}
                      {fmtDate(c.dueDate)} {isOverdue && "⚠️"}{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {c.bankName || "—"}
                    </td>{" "}
                    <td className="py-3 px-4 text-center">
                      {" "}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
                        {" "}
                        {s.label}{" "}
                      </span>{" "}
                    </td>{" "}
                    <td className="py-3 px-4 text-center">
                      {" "}
                      <div className="flex items-center justify-center gap-1">
                        {" "}
                        {c.status === "draft" && <button onClick={() => handleAction(c.id, "register")} disabled={loading === c.id} className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold hover:bg-blue-200 transition disabled:opacity-50">
                            {" "}
                            تسجيل{" "}
                          </button>}{" "}
                        {(c.status === "registered" || c.status === "deposited") && <>
                            {" "}
                            <button onClick={() => handleAction(c.id, "collect")} disabled={loading === c.id} className="text-xs bg-teal-50 text-emerald-700 px-3 py-1 rounded-lg font-bold hover:bg-emerald-200 transition disabled:opacity-50">
                              {" "}
                              تحصيل{" "}
                            </button>{" "}
                            <button onClick={() => handleAction(c.id, "bounce")} disabled={loading === c.id} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold hover:bg-red-200 transition disabled:opacity-50">
                              {" "}
                              رفض{" "}
                            </button>{" "}
                          </>}{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>;
          })}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}