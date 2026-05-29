"use client";

import { useState } from "react";
import { History, Search, User, FileText, Calendar } from "lucide-react";
const actionLabels: Record<string, {
  label: string;
  color: string;
}> = {
  create: {
    label: "إنشاء",
    color: "bg-teal-50 text-emerald-700"
  },
  update: {
    label: "تعديل",
    color: "bg-blue-100 text-blue-700"
  },
  delete: {
    label: "حذف",
    color: "bg-red-100 text-red-700"
  },
  post: {
    label: "ترحيل",
    color: "bg-indigo-100 text-indigo-700"
  },
  cancel: {
    label: "إلغاء",
    color: "bg-orange-100 text-orange-700"
  },
  lock: {
    label: "قفل",
    color: "bg-amber-100 text-amber-700"
  },
  unlock: {
    label: "فتح",
    color: "bg-teal-100 text-teal-700"
  },
  close_year: {
    label: "إقفال سنوي",
    color: "bg-purple-100 text-purple-700"
  },
  reverse_close_year: {
    label: "عكس إقفال",
    color: "bg-pink-100 text-pink-700"
  },
  reconcile: {
    label: "تسوية",
    color: "bg-cyan-100 text-cyan-700"
  },
  collect: {
    label: "تحصيل",
    color: "bg-teal-50 text-emerald-700"
  },
  bounce: {
    label: "رفض",
    color: "bg-red-100 text-red-700"
  }
};
export function AuditLogClient({
  logs,
  locale
}: {
  logs: any[];
  locale: string;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modelFilter, setModelFilter] = useState("all");
  const models = [...new Set(logs.map(l => l.model))];
  const filtered = logs.filter(l => {
    if (modelFilter !== "all" && l.model !== modelFilter) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      return (l.recordName || "").toLowerCase().includes(s) || (l.userName || "").toLowerCase().includes(s) || (l.model || "").toLowerCase().includes(s);
    }
    return true;
  });
  return <div className="space-y-6">
      {" "}
      <div className="flex items-center gap-3">
        {" "}
        <div className="w-10 h-10 bg-violet-100 rounded-sm flex items-center justify-center">
          {" "}
          <History className="w-5 h-5 text-violet-600" />{" "}
        </div>{" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-slate-900">
            سجل المراجعة
          </h1>{" "}
          <p className="text-sm text-slate-500">
            كل العمليات المحاسبية مسجلة هنا
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Filters */}{" "}
      <div className="flex gap-3 items-center">
        {" "}
        <div className="relative flex-1 max-w-sm">
          {" "}
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" placeholder="بحث بالاسم أو المستخدم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pr-10 pl-4 py-2 border border-slate-300 rounded-lg text-sm" />{" "}
        </div>{" "}
        <select value={modelFilter} onChange={e => setModelFilter(e.target.value)} className="border border-slate-300 rounded-lg px-4 py-2 text-sm bg-white">
          {" "}
          <option value="all">كل الأنواع</option>{" "}
          {models.map(m => <option key={m} value={m}>
              {m}
            </option>)}{" "}
        </select>{" "}
      </div>{" "}
      {/* Logs */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
        {" "}
        {filtered.length === 0 ? <div className="py-16 text-center text-slate-400">
            {" "}
            <History className="w-10 h-10 mx-auto mb-2 opacity-30" />{" "}
            <p className="text-sm">لا توجد سجلات</p>{" "}
          </div> : <div className="divide-y divide-slate-100">
            {" "}
            {filtered.map(log => {
          const a = actionLabels[log.action] || {
            label: log.action,
            color: "bg-slate-100 text-slate-700"
          };
          return <div key={log.id} className="px-5 py-3 hover:bg-slate-50 transition flex items-start gap-4">
                  {" "}
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {" "}
                    <User className="w-4 h-4 text-slate-500" />{" "}
                  </div>{" "}
                  <div className="flex-1 min-w-0">
                    {" "}
                    <div className="flex items-center gap-2 mb-0.5">
                      {" "}
                      <span className="text-sm font-bold text-slate-800">
                        {log.userName || "النظام"}
                      </span>{" "}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.color}`}>
                        {" "}
                        {a.label}{" "}
                      </span>{" "}
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                        {" "}
                        {log.model}{" "}
                      </span>{" "}
                    </div>{" "}
                    <p className="text-xs text-slate-600">
                      {" "}
                      {log.recordName || log.recordId}{" "}
                    </p>{" "}
                    {log.newValues && <pre className="text-[10px] text-slate-400 mt-1 truncate max-w-xl font-mono">
                        {" "}
                        {log.newValues.length > 120 ? log.newValues.substring(0, 120) + "..." : log.newValues}{" "}
                      </pre>}{" "}
                  </div>{" "}
                  <div className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                    {" "}
                    <Calendar className="w-3 h-3" />{" "}
                    {new Date(log.createdAt).toLocaleDateString("ar-EG")}{" "}
                    {new Date(log.createdAt).toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit"
              })}{" "}
                  </div>{" "}
                </div>;
        })}{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}