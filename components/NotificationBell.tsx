"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, AlertTriangle, Package, FileText, X, ExternalLink } from "lucide-react";
import Link from "next/link";
interface Notification {
  id: string;
  type: "overdue_invoice" | "low_stock";
  title: string;
  message: string;
  severity: "warning" | "danger" | "info";
  link: string;
  date: string;
}
export default function NotificationBell({
  notifications
}: {
  notifications: Notification[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const activeNotifications = notifications.filter(n => !dismissed.has(n.id));
  const dangerCount = activeNotifications.filter(n => n.severity === "danger").length;
  const totalCount = activeNotifications.length;
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const dismiss = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };
  const getIcon = (type: string) => {
    switch (type) {
      case "overdue_invoice":
        return <FileText className="w-4 h-4" />;
      case "low_stock":
        return <Package className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };
  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case "danger":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };
  return <div className="relative" ref={ref}>
      {" "}
      {/* Bell Button */}{" "}
      <button onClick={() => setIsOpen(!isOpen)} className={`relative p-2 rounded-lg transition-all duration-200 ${isOpen ? "bg-gray-100" : "hover:bg-gray-50"} ${totalCount > 0 ? "text-gray-700" : "text-gray-400"}`}>
        {" "}
        <Bell className="w-5 h-5" strokeWidth={totalCount > 0 ? 2.5 : 2} />{" "}
        {/* Badge */}{" "}
        {totalCount > 0 && <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1 ${dangerCount > 0 ? "bg-red-500 animate-pulse" : "bg-amber-500"}`}>
            {" "}
            {totalCount > 99 ? "99+" : totalCount}{" "}
          </span>}{" "}
      </button>{" "}
      {/* Dropdown */}{" "}
      {isOpen && <div className="absolute left-0 top-full mt-2 w-[380px] bg-white rounded-sm shadow-sm border border-gray-200 z-50 overflow-hidden" dir="rtl">
          {" "}
          {/* Header */}{" "}
          <div className="bg-gradient-to-l to-white px-4 py-3 border-b border-gray-100 flex justify-between items-center">
            {" "}
            <h3 className="text-sm font-bold text-gray-800">
              {" "}
              الإشعارات{" "}
              {totalCount > 0 && <span className="text-xs font-medium text-gray-400 mr-2">
                  ({totalCount})
                </span>}{" "}
            </h3>{" "}
            {totalCount > 0 && <button onClick={() => {
          const allIds = activeNotifications.map(n => n.id);
          setDismissed(new Set(allIds));
        }} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
                {" "}
                تجاهل الكل{" "}
              </button>}{" "}
          </div>{" "}
          {/* Body */}{" "}
          <div className="max-h-[400px] overflow-y-auto">
            {" "}
            {activeNotifications.length === 0 ? <div className="p-8 text-center">
                {" "}
                <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />{" "}
                <p className="text-sm text-gray-400 font-medium">
                  لا توجد إشعارات جديدة
                </p>{" "}
              </div> : activeNotifications.map(notification => <div key={notification.id} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors group ${getSeverityStyles(notification.severity)} border-r-4`}>
                  {" "}
                  <div className="mt-0.5">
                    {" "}
                    {getIcon(notification.type)}{" "}
                  </div>{" "}
                  <div className="flex-1 min-w-0">
                    {" "}
                    <p className="text-xs font-bold truncate">
                      {notification.title}
                    </p>{" "}
                    <p className="text-[11px] opacity-75 mt-0.5 leading-relaxed">
                      {notification.message}
                    </p>{" "}
                    <Link href={notification.link} className="text-[10px] font-bold mt-1 inline-flex items-center gap-1 hover:underline" onClick={() => setIsOpen(false)}>
                      {" "}
                      عرض التفاصيل <ExternalLink className="w-3 h-3" />{" "}
                    </Link>{" "}
                  </div>{" "}
                  <button onClick={() => dismiss(notification.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 p-1">
                    {" "}
                    <X className="w-3.5 h-3.5" />{" "}
                  </button>{" "}
                </div>)}{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}