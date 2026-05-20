"use client";

import { useState, useEffect } from "react";
import { getBlockingNotifications, acknowledgeNotification, snoozeBlockingNotifications } from "@/app/actions/user_notifications";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
export function NotificationBlocker() {
  const [blockingNotifs, setBlockingNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchNotifications();
  }, []);
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const notifs = await getBlockingNotifications();
      setBlockingNotifs(notifs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeNotification(id);
      setBlockingNotifs(prev => prev.filter(n => n.id !== id));
      toast.success("تم تأكيد الإشعار");
    } catch (e) {
      toast.error("فشل تأكيد الإشعار");
    }
  };
  const handleSnooze = async () => {
    try {
      await snoozeBlockingNotifications();
      setBlockingNotifs([]);
      toast.success("تم تأجيل الإشعارات لمدة 3 ساعات");
    } catch (e) {
      toast.error("فشل التأجيل");
    }
  };
  if (loading || blockingNotifs.length === 0) return null;
  return <div className="fixed inset-0 z-[9999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 rtl">
      {" "}
      <div className="bg-white rounded-sm shadow-sm max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {" "}
        <div className="bg-red-600 px-6 py-5 flex items-center gap-3">
          {" "}
          <AlertCircle className="w-8 h-8 text-white animate-pulse" />{" "}
          <div>
            {" "}
            <h2 className="text-xl font-bold text-white">
              إيقاف إجباري: إشعارات هامة معلقة!
            </h2>{" "}
            <p className="text-red-100 text-sm mt-1">
              يوجد إشعارات إدارية مضى عليها 24 ساعة ولم تقم بتأكيد قراءتها. لن
              تتمكن من العمل على النظام حتى تؤكدها.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50">
          {" "}
          <div className="space-y-4">
            {" "}
            {blockingNotifs.map(notif => <div key={notif.id} className="bg-white p-4 rounded-sm shadow-sm border border-slate-200 flex items-start gap-4 transition-all hover:border-red-200 hover:shadow-md">
                {" "}
                <div className="p-2 bg-red-50 text-red-600 rounded-lg shrink-0">
                  {" "}
                  <AlertCircle className="w-5 h-5" />{" "}
                </div>{" "}
                <div className="flex-1">
                  {" "}
                  <h4 className="font-bold text-slate-800">
                    {notif.title}
                  </h4>{" "}
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-wrap">
                    {notif.message}
                  </p>{" "}
                  <div className="text-xs text-slate-400 mt-2">
                    {" "}
                    تاريخ الإشعار:{" "}
                    {new Date(notif.createdAt).toLocaleString("ar-EG")}{" "}
                  </div>{" "}
                  {notif.linkUrl && <a href={notif.linkUrl} target="_blank" className="text-[#017E84] hover:underline text-sm inline-block mt-2">
                      عرض التفاصيل &rarr;
                    </a>}{" "}
                </div>{" "}
                <button onClick={() => handleAcknowledge(notif.id)} className="shrink-0 flex flex-col items-center gap-1 text-slate-400 hover:text-green-600 transition-colors p-2 rounded-lg hover:bg-green-50">
                  {" "}
                  <CheckCircle className="w-8 h-8" />{" "}
                  <span className="text-xs font-bold">قرأتها وفهمتها</span>{" "}
                </button>{" "}
              </div>)}{" "}
          </div>{" "}
        </div>{" "}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-3">
          {" "}
          <button onClick={handleSnooze} className="px-4 py-2 flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg font-bold text-sm transition-colors">
            {" "}
            <Clock className="w-4 h-4" /> تأجيل للضرورة (3 ساعات){" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}