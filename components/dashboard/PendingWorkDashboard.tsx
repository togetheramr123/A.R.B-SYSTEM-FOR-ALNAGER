"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { getMyPendingWork, markMessageRead } from "@/app/actions/collection";
import { AlertTriangle, Clock, FileText, MessageCircle, Receipt, ChevronDown, ChevronUp, CheckCircle2, ExternalLink, Bell, ScrollText, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
interface PendingWorkData {
  collectionTasks: any[];
  draftInvoices: any[];
  draftQuotes: any[];
  messages: any[];
  overdueInvoices: any[];
}
export default function PendingWorkDashboard() {
  const locale = useLocale();
  const [data, setData] = useState<PendingWorkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>("overdue");
  useEffect(() => {
    getMyPendingWork().then(d => {
      setData(d);
      setLoading(false); // Auto-expand the most urgent section
      if (d.overdueInvoices.length > 0) setExpandedSection("overdue");else if (d.messages.length > 0) setExpandedSection("messages");else if (d.collectionTasks.length > 0) setExpandedSection("collection");else if (d.draftInvoices.length > 0) setExpandedSection("drafts");
    });
  }, []);
  if (loading) return null;
  if (!data) return null;
  const totalPending = data.collectionTasks.length + data.draftInvoices.length + data.draftQuotes.length + data.messages.length + data.overdueInvoices.length;
  if (totalPending === 0) return null;
  const formatDate = (d: any) => {
    if (!d) return "-";
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };
  const formatAmount = (n: number) => n.toLocaleString("ar-EG", {
    minimumFractionDigits: 2
  });
  const toggle = (key: string) => setExpandedSection(expandedSection === key ? null : key);
  const handleReadMessage = async (id: string) => {
    await markMessageRead(id);
    setData(prev => prev ? {
      ...prev,
      messages: prev.messages.map(m => m.id === id ? {
        ...m,
        isRead: true
      } : m)
    } : prev);
  };
  const sections = [{
    key: "overdue",
    title: "فواتير متأخرة عن السداد",
    icon: AlertTriangle,
    count: data.overdueInvoices.length,
    color: "text-red-600",
    bg: "bg-red-50",
    borderColor: "border-red-200"
  }, {
    key: "messages",
    title: "رسائل واردة",
    icon: MessageCircle,
    count: data.messages.length,
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderColor: "border-blue-200"
  }, {
    key: "collection",
    title: "فواتير تحتاج تحصيل",
    icon: Banknote,
    count: data.collectionTasks.length,
    color: "text-amber-600",
    bg: "bg-amber-50",
    borderColor: "border-amber-200"
  }, {
    key: "drafts",
    title: "مسودات معلقة",
    icon: ScrollText,
    count: data.draftInvoices.length + data.draftQuotes.length,
    color: "text-gray-600",
    bg: "bg-gray-50",
    borderColor: "border-gray-200"
  }].filter(s => s.count > 0);
  return <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden mb-8">
      {" "}
      {/* Header */}{" "}
      <div className="bg-[#714B67] px-6 py-4 border-b border-amber-100 flex items-center justify-between">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="bg-amber-100 p-2.5 rounded-sm">
            {" "}
            <Bell className="w-5 h-5 text-amber-700" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h2 className="font-bold text-gray-900 text-base">
              أعمالك المعلقة
            </h2>{" "}
            <p className="text-xs text-gray-500">
              {totalPending} عنصر يحتاج متابعتك
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <span className="bg-amber-200 text-amber-800 font-bold text-sm px-3 py-1 rounded-full">
          {totalPending}
        </span>{" "}
      </div>{" "}
      {/* Sections */}{" "}
      <div className="divide-y divide-gray-100">
        {" "}
        {sections.map(section => <div key={section.key}>
            {" "}
            {/* Section Header */}{" "}
            <button onClick={() => toggle(section.key)} className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/50 transition-colors">
              {" "}
              <div className="flex items-center gap-3">
                {" "}
                <div className={cn("p-1.5 rounded-lg", section.bg)}>
                  {" "}
                  <section.icon className={cn("w-4 h-4", section.color)} />{" "}
                </div>{" "}
                <span className="font-bold text-sm text-gray-800">
                  {section.title}
                </span>{" "}
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", section.bg, section.color)}>
                  {" "}
                  {section.count}{" "}
                </span>{" "}
              </div>{" "}
              {expandedSection === section.key ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}{" "}
            </button>{" "}
            {/* Section Content */}{" "}
            {expandedSection === section.key && <div className="px-6 pb-4">
                {" "}
                {/* Overdue Invoices */}{" "}
                {section.key === "overdue" && <div className="space-y-2">
                    {" "}
                    {data.overdueInvoices.map(inv => <Link key={inv.id} href={`/${locale}/accounting/invoices/${inv.id}`} className="flex items-center justify-between bg-red-50/50 border border-red-100 rounded-sm px-4 py-3 hover:bg-red-50 transition-colors group">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <FileText className="w-4 h-4 text-red-400" />{" "}
                          <div>
                            {" "}
                            <span className="font-bold text-sm text-gray-900">
                              {inv.name}
                            </span>{" "}
                            <span className="text-gray-500 text-sm mx-2">
                              {inv.partnerName}
                            </span>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-4">
                          {" "}
                          <span className="text-xs text-red-600 font-bold">
                            {" "}
                            متأخر {inv.daysOverdue} يوم{" "}
                          </span>{" "}
                          <span className="font-bold text-sm text-gray-900 font-numbers">
                            {" "}
                            {formatAmount(inv.amountResidual)} ج.م{" "}
                          </span>{" "}
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />{" "}
                        </div>{" "}
                      </Link>)}{" "}
                  </div>}{" "}
                {/* Messages */}{" "}
                {section.key === "messages" && <div className="space-y-2">
                    {" "}
                    {data.messages.map(msg => <div key={msg.id} className={cn("flex items-center justify-between rounded-sm px-4 py-3 border transition-colors", msg.isRead ? "bg-gray-50 border-gray-100" : "bg-blue-50/50 border-blue-100")}>
                        {" "}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {" "}
                          <MessageCircle className={cn("w-4 h-4 shrink-0", msg.isRead ? "text-gray-300" : "text-blue-500")} />{" "}
                          <div className="min-w-0">
                            {" "}
                            <div className="flex items-center gap-2">
                              {" "}
                              <span className="font-bold text-sm text-gray-700">
                                من: {msg.senderName}
                              </span>{" "}
                              {msg.invoiceRef && <Link href={`/${locale}/accounting/invoices/${msg.invoiceId}`} className="text-xs text-blue-600 font-bold hover:underline">
                                  {" "}
                                  {msg.invoiceRef}{" "}
                                </Link>}{" "}
                            </div>{" "}
                            <p className="text-xs text-gray-500 truncate">
                              {msg.message}
                            </p>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-3 shrink-0">
                          {" "}
                          {msg.amount && <span className="text-sm font-bold text-gray-900 font-numbers">
                              {formatAmount(msg.amount)} ج.م
                            </span>}{" "}
                          {!msg.isRead && <button onClick={() => handleReadMessage(msg.id)} className="text-xs text-blue-600 font-bold hover:text-blue-800">
                              {" "}
                              تم{" "}
                            </button>}{" "}
                          <Link href={`/${locale}/accounting/invoices/${msg.invoiceId}`}>
                            {" "}
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 hover:text-blue-500 transition-colors" />{" "}
                          </Link>{" "}
                        </div>{" "}
                      </div>)}{" "}
                  </div>}{" "}
                {/* Collection Tasks */}{" "}
                {section.key === "collection" && <div className="space-y-2">
                    {" "}
                    {data.collectionTasks.map(inv => <Link key={inv.id} href={`/${locale}/accounting/invoices/${inv.id}`} className="flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded-sm px-4 py-3 hover:bg-amber-50 transition-colors group">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <Receipt className="w-4 h-4 text-amber-500" />{" "}
                          <div>
                            {" "}
                            <span className="font-bold text-sm text-gray-900">
                              {inv.name}
                            </span>{" "}
                            <span className="text-gray-500 text-sm mx-2">
                              {inv.partnerName}
                            </span>{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-4">
                          {" "}
                          {inv.daysOverdue > 0 ? <span className="text-xs text-red-600 font-bold">
                              متأخر {inv.daysOverdue} يوم
                            </span> : inv.collectionDueDate ? <span className="text-xs text-gray-500">
                              سداد: {formatDate(inv.collectionDueDate)}
                            </span> : null}{" "}
                          <span className="font-bold text-sm text-gray-900 font-numbers">
                            {" "}
                            {formatAmount(inv.amountResidual)} ج.م{" "}
                          </span>{" "}
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500" />{" "}
                        </div>{" "}
                      </Link>)}{" "}
                  </div>}{" "}
                {/* Draft Invoices & Quotes */}{" "}
                {section.key === "drafts" && <div className="space-y-2">
                    {" "}
                    {data.draftInvoices.map(inv => <Link key={inv.id} href={`/${locale}/accounting/invoices/${inv.id}`} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-sm px-4 py-3 hover:bg-gray-100/50 transition-colors group">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <FileText className="w-4 h-4 text-gray-400" />{" "}
                          <span className="font-bold text-sm text-gray-800">
                            {inv.name}
                          </span>{" "}
                          <span className="text-gray-500 text-sm">
                            {inv.partnerName}
                          </span>{" "}
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold">
                            فاتورة مسودة
                          </span>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <span className="font-numbers text-sm text-gray-700">
                            {formatAmount(inv.amountTotal)} ج.م
                          </span>{" "}
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500" />{" "}
                        </div>{" "}
                      </Link>)}{" "}
                    {data.draftQuotes.map(q => <Link key={q.id} href={`/${locale}/sales/${q.id}`} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-sm px-4 py-3 hover:bg-gray-100/50 transition-colors group">
                        {" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <ScrollText className="w-4 h-4 text-gray-400" />{" "}
                          <span className="font-bold text-sm text-gray-800">
                            {q.name}
                          </span>{" "}
                          <span className="text-gray-500 text-sm">
                            {q.partnerName}
                          </span>{" "}
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                            عرض سعر
                          </span>{" "}
                        </div>{" "}
                        <div className="flex items-center gap-3">
                          {" "}
                          <span className="font-numbers text-sm text-gray-700">
                            {formatAmount(q.amountTotal)} ج.م
                          </span>{" "}
                          <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500" />{" "}
                        </div>{" "}
                      </Link>)}{" "}
                  </div>}{" "}
              </div>}{" "}
          </div>)}{" "}
      </div>{" "}
    </div>;
}