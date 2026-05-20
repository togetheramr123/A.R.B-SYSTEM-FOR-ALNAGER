"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Search, Mail, Filter } from "lucide-react";
import { getTickets } from "@/app/actions/crm";
export default function TicketsPage() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const data = await getTickets();
        setTickets(data);
      } catch (error) {
        console.error("Failed to load tickets", error);
      } finally {
        setLoading(false);
      }
    };
    loadTickets();
  }, []);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-sky-100 text-sky-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "closed":
        return "bg-teal-50 text-emerald-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "مفتوحة";
      case "pending":
        return "قيد المعالجة";
      case "closed":
        return "مغلقة";
      default:
        return status;
    }
  };
  return <div className="p-4">
      {" "}
      <TopPortal>
        {" "}
        <div />{" "}
      </TopPortal>{" "}
      <div className="w-full max-w-7xl space-y-6">
        {" "}
        <div className="flex items-center justify-between mb-4">
          {" "}
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            {" "}
            <Mail className="w-6 h-6 text-sky-600" /> صندوق الوارد
            (التذاكر){" "}
          </h1>{" "}
        </div>{" "}
        {/* Search and Filter Bar */}{" "}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          {" "}
          <div className="relative w-full max-w-md border-b border-slate-300 focus-within:border-sky-600 transition-colors">
            {" "}
            <Search className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
            <input type="text" placeholder="البحث في التذاكر..." className="w-full pl-10 pr-6 py-1.5 text-sm outline-none bg-transparent" />{" "}
          </div>{" "}
          <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600 font-medium">
            {" "}
            <Filter className="w-4 h-4" /> تصفية{" "}
          </button>{" "}
        </div>{" "}
        {/* Tickets List */}{" "}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {" "}
          {loading ? <div className="p-8 text-center text-slate-500">
              جاري تحميل التذاكر...
            </div> : <table className="w-full text-left text-sm whitespace-nowrap">
              {" "}
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                {" "}
                <tr>
                  {" "}
                  <th className="px-6 py-3 text-right w-32">الرقم</th>{" "}
                  <th className="px-6 py-3 text-right">الموضوع</th>{" "}
                  <th className="px-6 py-3 text-right">المرسل</th>{" "}
                  <th className="px-6 py-3 text-right">الموظف المسؤول</th>{" "}
                  <th className="px-6 py-3 text-right w-32">الحالة</th>{" "}
                  <th className="px-6 py-3 text-right w-40">التاريخ</th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-slate-100">
                {" "}
                {tickets.map(ticket => <tr key={ticket.id} className="hover:bg-sky-50 transition-colors group cursor-pointer" onClick={() => window.location.href = `/${locale}/crm/tickets/${ticket.id}`}>
                    {" "}
                    <td className="px-6 py-4 font-mono text-slate-500">
                      {ticket.number}
                    </td>{" "}
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {ticket.subject}
                    </td>{" "}
                    <td className="px-6 py-4">
                      {" "}
                      <div className="text-slate-900">
                        {ticket.senderName || ticket.partnerName || "عميل"}
                      </div>{" "}
                      <div className="text-xs text-slate-500" dir="ltr">
                        {ticket.senderEmail}
                      </div>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 text-slate-600">
                      {ticket.assigneeName}
                    </td>{" "}
                    <td className="px-6 py-4">
                      {" "}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(ticket.status)}`}>
                        {" "}
                        {getStatusLabel(ticket.status)}{" "}
                      </span>{" "}
                    </td>{" "}
                    <td className="px-6 py-4 text-slate-500">
                      {" "}
                      {new Date(ticket.createdAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                })}{" "}
                    </td>{" "}
                  </tr>)}{" "}
                {tickets.length === 0 && <tr>
                    {" "}
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      {" "}
                      <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />{" "}
                      لا توجد تذاكر حالياً. الصندوق فارغ!{" "}
                    </td>{" "}
                  </tr>}{" "}
              </tbody>{" "}
            </table>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}