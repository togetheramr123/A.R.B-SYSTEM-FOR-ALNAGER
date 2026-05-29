"use client";
import React from "react";

import { useState, useEffect } from "react";
import { getChatterMessages, addChatterMessage, ChatterModel } from "@/app/actions/chatter";
import { getChatContacts, sendChatMessage } from "@/app/actions/chat";
import { MessageSquare, Clock, Send, Paperclip, Share2, Clipboard, MessageCircle, UserCheck, Users, CheckCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";
interface ChatterProps {
  model: ChatterModel;
  id: string;
}
export function Chatter({
  model,
  id
}: ChatterProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"message" | "note" | "activities">("message");
  const [isFollowing, setIsFollowing] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState<{file: File, id?: string, isUploading: boolean}[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [chatContacts, setChatContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [showContactsDropdown, setShowContactsDropdown] = useState(false);

  const loadMessages = async () => {
    setIsLoading(true);
    const data = await getChatterMessages(model, id);
    setMessages(data || []);
    setIsLoading(false);
  };
  
  const loadContacts = async () => {
    const contacts = await getChatContacts();
    setChatContacts(contacts || []);
  };

  useEffect(() => {
    if (id) {
      loadMessages();
      loadContacts();
    }
  }, [id, model]);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const newFiles = Array.from(e.target.files).map(file => ({ file, isUploading: true }));
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    for (const item of newFiles) {
      try {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('model', model);
        formData.append('recordId', id);
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (data.success) {
          setAttachedFiles(prev => prev.map(p => p.file === item.file ? { ...p, isUploading: false, id: data.attachment.id } : p));
        } else {
          toast.error("فشل رفع الملف: " + data.error);
          setAttachedFiles(prev => prev.filter(p => p.file !== item.file));
        }
      } catch (err) {
        toast.error("حدث خطأ أثناء الرفع");
        setAttachedFiles(prev => prev.filter(p => p.file !== item.file));
      }
    }
  };

  const handleSend = async () => {
    if (!newMsg.trim() && attachedFiles.length === 0) return;
    if (attachedFiles.some(f => f.isUploading)) {
       toast.error("يرجى الانتظار حتى يكتمل رفع الملفات");
       return;
    }

    setIsSubmitting(true);
    const attachmentIds = attachedFiles.map(f => f.id).filter(Boolean) as string[];
    const res = await addChatterMessage(model, id, newMsg, false, attachmentIds);
    if (res.error) {
      toast.error(res.error);
    } else {
      // If a contact is selected, send them a message via Messenger
      if (selectedContact && activeTab === "message") {
         const url = window.location.href;
         const chatMsg = `مرحباً، تم إرسال هذا المستند لك للاطلاع:\n${url}\n\nرسالة المرفق:\n${newMsg}`;
         await sendChatMessage(selectedContact, chatMsg);
         toast.success("تم الإرسال عبر الماسنجر الداخلي");
      }

      setNewMsg("");
      setAttachedFiles([]);
      setSelectedContact("");
      loadMessages();
      toast.success(activeTab === "note" ? "تم تسجيل الملاحظة" : "تم إرسال الرسالة");
    }
    setIsSubmitting(false);
  };
  const handleShareWhatsApp = () => {
    const url = window.location.href;
    const text = encodeURIComponent(`مرحباً، أرجو مراجعة هذا المستند:\n\n${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("تم التوجيه للواتساب");
  };
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ الرابط للحافظة");
  };
  return <div className="bg-white rounded-none shadow-sm border border-slate-200 mt-6 overflow-hidden w-full">
      {" "}
      {/* Odoo-style Chatter Header Tabs + Footer */}{" "}
      <div className="bg-white border-b border-slate-200">
        {" "}
        {/* Top tabs: إرسال رسالة | ملاحظة | الأنشطة */}{" "}
        <div className="flex items-center border-b border-slate-200" dir="rtl">
          {" "}
          <button onClick={() => setActiveTab("message")} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "message" ? "bg-[#017E84] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            {" "}
            إرسال رسالة{" "}
          </button>{" "}
          <button onClick={() => setActiveTab("note")} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "note" ? "bg-[#017E84] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            {" "}
            ملاحظة{" "}
          </button>{" "}
          <button onClick={() => setActiveTab("activities")} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold transition-colors ${activeTab === "activities" ? "bg-[#017E84] text-white" : "text-slate-600 hover:bg-slate-50"}`}>
            {" "}
            <Clock className="w-4 h-4" /> الأنشطة{" "}
          </button>{" "}
          {/* Spacer */} <div className="flex-1" />{" "}
          {/* Right side: WhatsApp + Copy */}{" "}
          <div className="flex items-center gap-1 px-2">
            {" "}
            <button onClick={handleShareWhatsApp} className="p-2 text-slate-400 hover:text-green-600 transition-colors" title="إرسال WhatsApp">
              {" "}
              <MessageCircle className="w-4 h-4" />{" "}
            </button>{" "}
            <button onClick={handleCopyLink} className="p-2 text-slate-400 hover:text-slate-700 transition-colors" title="نسخ الرابط">
              {" "}
              <Clipboard className="w-4 h-4" />{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Compose area - only for message/note */}{" "}
        {activeTab !== "activities" && <div className="p-4">
            {" "}
            <div className="relative">
              {" "}
              <textarea value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder={activeTab === "message" ? "اكتب رسالة للمتابعين..." : "اكتب ملاحظة داخلية..."} className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all min-h-[80px]" dir="rtl" />{" "}
              
              {/* Internal Messenger Selector (Only if sending a message) */}
              {activeTab === "message" && (
                <div className="relative mt-2 px-2">
                   <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">إرسال عبر الماسنجر:</span>
                      <button 
                         onClick={() => setShowContactsDropdown(!showContactsDropdown)}
                         className="text-xs flex items-center justify-between min-w-[150px] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                      >
                         <span className="truncate">
                           {selectedContact ? chatContacts.find(c => c.id === selectedContact)?.name : "اختر مستخدم..."}
                         </span>
                         <ChevronDown className="w-3 h-3 text-slate-400" />
                      </button>
                      {selectedContact && (
                        <button onClick={() => setSelectedContact("")} className="text-red-500 hover:text-red-700 text-xs">إلغاء</button>
                      )}
                   </div>
                   
                   {showContactsDropdown && (
                     <div className="absolute top-full right-0 mt-1 w-[200px] bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-[150px] overflow-y-auto">
                       {chatContacts.map(contact => (
                         <button 
                           key={contact.id}
                           onClick={() => { setSelectedContact(contact.id); setShowContactsDropdown(false); }}
                           className="w-full text-right px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0 truncate"
                         >
                           {contact.name}
                         </button>
                       ))}
                     </div>
                   )}
                </div>
              )}

              {/* Attached files preview */}
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-10 mt-2 px-2">
                  {attachedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-xs border border-slate-200">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{file.file.name}</span>
                      {file.isUploading ? (
                        <span className="animate-pulse text-blue-500 text-[10px]">جاري الرفع...</span>
                      ) : (
                        <button onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 mr-1">×</button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="absolute left-3 bottom-3 flex items-center gap-2">
                {" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-slate-600 p-1" title="إرفاق ملف">
                  {" "}
                  <Paperclip className="w-5 h-5" />{" "}
                </button>{" "}
                <button onClick={handleSend} disabled={isSubmitting || (!newMsg.trim() && attachedFiles.length === 0)} className="bg-[#017E84] hover:bg-[#016668] text-white rounded px-4 py-1.5 text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-colors">
                  {" "}
                  <Send className="w-4 h-4" /> إرسال{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
          </div>}{" "}
        {/* Activities tab placeholder */}{" "}
        {activeTab === "activities" && <div className="p-6 text-center text-slate-400 text-sm">
            {" "}
            <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" /> لا توجد
            أنشطة مجدولة{" "}
          </div>}{" "}
      </div>{" "}
      {/* Message Thread */}{" "}
      <div className="p-4 bg-slate-50 space-y-4 max-h-[600px] overflow-y-auto">
        {" "}
        {isLoading ? <div className="text-center text-slate-400 text-sm py-8 animate-pulse">
            جاري تحميل السجل...
          </div> : messages.length === 0 ? <div className="text-center text-slate-400 text-sm py-8">
            لا توجد رسائل سابقة. كن أول من يكتب!
          </div> : messages.map(msg => <div key={msg.id} className="flex gap-4">
              {" "}
              {/* Avatar */}{" "}
              <div className="shrink-0 pt-1">
                {" "}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${msg.type === "notification" ? "bg-slate-400" : "bg-slate-700"}`}>
                  {" "}
                  {msg.type === "notification" ? <Clock className="w-5 h-5" /> : msg.subject ? msg.subject.charAt(0).toUpperCase() : "?"}{" "}
                </div>{" "}
              </div>{" "}
              {/* Content */}{" "}
              <div className="flex-1 space-y-1">
                {" "}
                <div className="flex items-center gap-1.5 mb-1">
                  {" "}
                  <span className="font-bold text-slate-800 text-sm">
                    {msg.subject || "System"}
                  </span>{" "}
                  <span className="text-xs text-slate-400">-</span>{" "}
                  <span className="text-xs text-slate-400" dir="ltr">
                    {new Date(msg.createdAt).toLocaleString("ar-EG", {
                hour12: true
              })}
                  </span>{" "}
                </div>{" "}
                {msg.type === "notification" ? <div className="text-sm text-slate-700">
                    {" "}
                    <div dangerouslySetInnerHTML={{
              __html: msg.body
            }} className="prose prose-sm prose-slate max-w-none" />{" "}
                    {msg.trackingValues && msg.trackingValues.length > 0 && <ul className="mt-2 space-y-1 list-disc list-inside marker:text-slate-400">
                        {" "}
                        {msg.trackingValues.map((track: any) => <li key={track.id} className="text-[13px]">
                            {" "}
                            <span className="font-medium text-slate-800" dir="ltr">
                              {track.newValue}
                            </span>{" "}
                            <span className="mx-2 text-slate-400">⬅</span>{" "}
                            <span className="text-slate-500 line-through" dir="ltr">
                              {track.oldValue}
                            </span>{" "}
                            <span className="mx-2 text-slate-500 italic">
                              ({track.fieldDesc})
                            </span>{" "}
                          </li>)}{" "}
                      </ul>}{" "}
                  </div> : <div className="bg-white border text-sm text-slate-800 px-3 py-2 rounded-lg shadow-sm mt-1 inline-block">
                    {" "}
                    <div className="whitespace-pre-wrap">{msg.body}</div>
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-3">
                        {msg.attachments.map((att: any) => {
                          const isImage = att.fileType?.startsWith('image/') || att.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                          return (
                            <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block border border-slate-200 rounded-md overflow-hidden hover:border-blue-400 hover:shadow-sm transition-all group bg-white">
                              {isImage ? (
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover" />
                                  <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[10px] px-1.5 py-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                    {att.fileName}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 px-3 py-2 w-32">
                                  <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                  <span className="text-xs text-slate-700 truncate" title={att.fileName}>{att.fileName}</span>
                                </div>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>} 
              </div> 
            </div>)}{" "}
      </div>{" "}
      {/* Odoo-style Footer: متابع ✓ | 👤 1 | 📎 */}{" "}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-slate-200" dir="rtl">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <button type="button" onClick={() => setIsFollowing(!isFollowing)} className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${isFollowing ? "text-green-600" : "text-slate-500 hover:text-green-600"}`}>
            {" "}
            {isFollowing ? <CheckCircle className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}{" "}
            {isFollowing ? "متابع" : "متابعة"}{" "}
          </button>{" "}
          <span className="flex items-center gap-1 text-slate-500 text-sm">
            {" "}
            <Users className="w-4 h-4" />{" "}
            <span className="font-numbers">1</span>{" "}
          </span>{" "}
          <button className="text-slate-400 hover:text-slate-600 transition-colors">
            {" "}
            <Paperclip className="w-4 h-4" />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}