"use client";

import { useState, useEffect } from "react";
import { Bell, X, Send, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getSystemUsers, sendManualNotification } from "@/app/actions/user_notifications";
interface UserOption {
  id: string;
  name: string | null;
  role: string;
}
interface NotifyButtonProps {
  resourceModel: string;
  resourceId: string;
  resourceName: string;
}
export default function NotifyButton({
  resourceModel,
  resourceId,
  resourceName
}: NotifyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [targetType, setTargetType] = useState<"MANAGER" | "GENERAL_MANAGER" | "ALL" | "SPECIFIC">("MANAGER");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [grantViewOnly, setGrantViewOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isOpen && users.length === 0) {
      getSystemUsers().then(setUsers);
    }
  }, [isOpen, users.length]);
  const handleSend = async (viaWhatsApp: boolean = false) => {
    if (targetType === "SPECIFIC" && !selectedUserId) {
      toast.error("الرجاء اختيار الموظف المطلوب");
      return;
    }
    setLoading(true);
    try {
      const res = await sendManualNotification({
        targetType,
        targetUserId: selectedUserId,
        resourceModel,
        resourceId,
        resourceName,
        message,
        grantViewOnly
      });
      if (res?.success) {
        toast.success("تم الإرسال بنجاح");
        setIsOpen(false);
        if (viaWhatsApp && res.linkUrl) {
          const textMessage = message || `مرحباً، يرجى مراجعة المستند المرفق.`;
          const fullUrl = `${window.location.origin}${window.location.pathname.startsWith("/ar") || window.location.pathname.startsWith("/en") ? "" : "/ar"}${res.linkUrl.startsWith("/") ? "" : "/"}${res.linkUrl}`;
          /* Using WhatsApp Markdown formatting (*Bold*, _Italic_) and Emojis */
          let finalMessage = `🏢 *إشعار من النظام*\n\n`;
          finalMessage += `${textMessage}\n\n`;
          finalMessage += `📄 *المستند:* _${resourceName}_\n`;
          if (grantViewOnly) {
            finalMessage += `🔒 *الصلاحية:* عرض فقط (مؤقت لـ 7 أيام)\n`;
            finalMessage += `🔗 *رابط الوصول السريع:*\n${fullUrl}`;
          } else {
            finalMessage += `🔗 *رابط المستند للتعديل والمراجعة:*\n${fullUrl}`;
          }
          const waUrl = `https://wa.me/?text=${encodeURIComponent(finalMessage)}`;
          window.open(waUrl, "_blank");
        }
        setMessage("");
        setGrantViewOnly(false);
      } else {
        toast.error(res?.error || "حدث خطأ أثناء الإرسال");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };
  return <div className="relative">
      {" "}
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1.5 px-3 py-1.5 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-sm text-[13px] font-medium transition-colors" type="button">
        {" "}
        <Bell className="w-4 h-4" /> إرسال إشعار{" "}
      </button>{" "}
      {isOpen && <>
          {" "}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />{" "}
          <div className="absolute top-full right-0 mt-1 w-[320px] bg-white border border-slate-200 shadow-sm rounded-sm z-50 p-4">
            {" "}
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              {" "}
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                {" "}
                <Bell className="w-4 h-4 text-[#017E84]" /> إرسال إشعار{" "}
              </h3>{" "}
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                {" "}
                <X className="w-4 h-4" />{" "}
              </button>{" "}
            </div>{" "}
            <div className="space-y-3">
              {" "}
              <div>
                {" "}
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  إلى من تريد الإرسال؟
                </label>{" "}
                <select value={targetType} onChange={e => setTargetType(e.target.value as any)} className="w-full text-sm border-slate-300 rounded focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]">
                  {" "}
                  <option value="MANAGER">المدير المباشر</option>{" "}
                  <option value="GENERAL_MANAGER">المدير العام</option>{" "}
                  <option value="ALL">جميع الزملاء</option>{" "}
                  <option value="SPECIFIC">موظف محدد...</option>{" "}
                </select>{" "}
              </div>{" "}
              {targetType === "SPECIFIC" && <div>
                  {" "}
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    اختر الموظف
                  </label>{" "}
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full text-sm border-slate-300 rounded focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84]">
                    {" "}
                    <option value="">-- اختر موظف --</option>{" "}
                    {users.map(u => <option key={u.id} value={u.id}>
                        {u.name || u.id} ({u.role})
                      </option>)}{" "}
                  </select>{" "}
                </div>}{" "}
              <div>
                {" "}
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  رسالة مخصصة (اختياري)
                </label>{" "}
                <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="مثال: يرجى مراجعة هذا المستند..." className="w-full text-sm border-slate-300 rounded focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84] h-20 resize-none" />{" "}
              </div>{" "}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                {" "}
                <label className="flex items-start gap-2 cursor-pointer">
                  {" "}
                  <input type="checkbox" checked={grantViewOnly} onChange={e => setGrantViewOnly(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-[#017E84] focus:ring-[#017E84]" />{" "}
                  <div>
                    {" "}
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {" "}
                      <ShieldAlert className="w-3 h-3 text-amber-500" /> منح
                      صلاحية "رؤية فقط"{" "}
                    </span>{" "}
                    <p className="text-slate-500 mt-1 leading-relaxed">
                      {" "}
                      إذا كان المستلم ليس لديه صلاحية دخول النظام/القسم، تفعيل
                      هذا الخيار سيسمح له برؤية هذا المستند كصورة فقط.{" "}
                    </p>{" "}
                  </div>{" "}
                </label>{" "}
              </div>{" "}
              <div className="flex gap-2 pt-2">
                {" "}
                <button onClick={() => handleSend(false)} disabled={loading || targetType === "SPECIFIC" && !selectedUserId} className="flex-1 flex justify-center items-center gap-2 bg-[#017E84] hover:bg-[#016A6F] text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-50">
                  {" "}
                  {loading ? "جاري..." : <>
                      {" "}
                      <Bell className="w-4 h-4" /> إشعار داخلي{" "}
                    </>}{" "}
                </button>{" "}
                <button onClick={() => handleSend(true)} disabled={loading || targetType === "SPECIFIC" && !selectedUserId} className="flex-1 flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium transition-colors disabled:opacity-50" title="إرسال عبر واتساب">
                  {" "}
                  {loading ? "جاري..." : <>
                      {" "}
                      <Send className="w-4 h-4" /> واتساب{" "}
                    </>}{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </>}{" "}
    </div>;
}