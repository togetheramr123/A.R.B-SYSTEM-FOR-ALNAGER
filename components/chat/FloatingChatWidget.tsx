"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle, X, Send, Minimize2, Maximize, Video, Phone, Mic, Paperclip, Users, AlertCircle, StopCircle
} from "lucide-react";
import {
  getChatContacts, getChatHistory, sendChatMessage, updatePresence, sendMeetingInvite, getChatRooms, createChatRoom
} from "@/app/actions/chat";
import VideoCallModal from "./VideoCallModal";
import MessageBubble from "./MessageBubble";
import { toast } from "sonner";

export default function FloatingChatWidget({ currentUserId }: { currentUserId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  
  const [activeChat, setActiveChat] = useState<any>(null); // can be user or room
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [activeMeetingRoom, setActiveMeetingRoom] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [totalUnread, setTotalUnread] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Create Group State
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/notification.mp3");
    }
  }, []);

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((e) => console.error("Audio play failed", e));
    }
  };

  const fetchData = async () => {
    try {
      const [usersData, roomsData] = await Promise.all([
        getChatContacts(),
        getChatRooms()
      ]);
      setContacts(Array.isArray(usersData) ? usersData : []);
      setRooms(Array.isArray(roomsData) ? roomsData : []);
      
      const unread = (Array.isArray(usersData) ? usersData : []).reduce(
        (sum, c) => sum + (c.unreadCount || 0),
        0,
      );
      if (unread > totalUnread) playNotification();
      setTotalUnread(unread);
    } catch (e) {
      console.error("Chat data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const pingPresence = async () => {
      try {
        await updatePresence();
      } catch (e) {}
    };
    pingPresence();
    const interval = setInterval(() => {
      fetchData();
      pingPresence();
    }, 5000);
    return () => clearInterval(interval);
  }, [totalUnread]);

  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      const history = await getChatHistory(activeChat.id, activeChat.isGroup ? activeChat.id : undefined);
      if (messages.length > 0 && history.length > messages.length) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.senderId !== currentUserId) playNotification();
      }
      setMessages(history);
      scrollToBottom();
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload/chat", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, attachment?: any) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !attachment && !activeChat) return;

    const text = newMessage;
    setNewMessage(""); 

    // Optimistic
    const tempMessage = {
      id: "temp-" + Date.now(),
      content: text,
      senderId: currentUserId,
      receiverId: activeChat.isGroup ? null : activeChat.id,
      roomId: activeChat.isGroup ? activeChat.id : null,
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      fileName: attachment?.fileName,
      isRead: false,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    scrollToBottom();

    await sendChatMessage(
      activeChat.isGroup ? null : activeChat.id,
      text,
      activeChat.isGroup ? activeChat.id : undefined,
      attachment?.url,
      attachment?.type,
      attachment?.fileName
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    toast.loading("جاري الرفع...", { id: "uploading" });
    const data = await uploadFile(file);
    toast.dismiss("uploading");
    
    if (data?.success) {
      await handleSendMessage(undefined, data);
    } else {
      toast.error("فشل رفع الملف");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const file = new File([audioBlob], "voice-message.webm", { type: 'audio/webm' });
        
        toast.loading("جاري إرسال التسجيل...", { id: "uploading_voice" });
        const data = await uploadFile(file);
        toast.dismiss("uploading_voice");
        
        if (data?.success) {
          await handleSendMessage(undefined, data);
        } else {
          toast.error("فشل إرسال التسجيل");
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone error", err);
      if (err.name === 'NotAllowedError') {
         toast.error("تم رفض الوصول للميكروفون، يرجى تفعيله من إعدادات المتصفح");
      } else {
         toast.error("المتصفح لا يدعم التسجيل (تأكد من استخدام اتصال آمن HTTPS أو تفعيل الصلاحيات)");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) {
      toast.error("يرجى إدخال اسم المجموعة واختيار موظف واحد على الأقل");
      return;
    }
    try {
      const room = await createChatRoom(newGroupName, selectedUsers);
      toast.success("تم إنشاء المجموعة بنجاح");
      setIsCreatingGroup(false);
      setNewGroupName("");
      setSelectedUsers([]);
      fetchData();
      setActiveChat(room);
    } catch (e) {
      toast.error("فشل إنشاء المجموعة");
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);
  const closeChat = () => {
    setIsOpen(false);
    setActiveChat(null);
  };

  const handleStartCall = async () => {
    if (!activeChat) return;
    const roomName = `erp-meet-${activeChat.id}-${Date.now()}`; 
    const text = `[MEETING_INVITE]${roomName}`;
    
    await sendChatMessage(
      activeChat.isGroup ? null : activeChat.id,
      text,
      activeChat.isGroup ? activeChat.id : undefined
    );
    setActiveMeetingRoom(roomName);
  };

  return (
    <>
      {activeMeetingRoom && (
        <VideoCallModal
          roomName={activeMeetingRoom}
          userName={contacts.find((c) => c.id === currentUserId)?.name || "موظف"}
          onClose={() => setActiveMeetingRoom(null)}
        />
      )}
      
      <button
        onClick={toggleChat}
        className="relative w-8 h-8 bg-[#714B67] text-white rounded-lg flex items-center justify-center shadow-sm hover:bg-[#5b3c53] transition-colors"
      >
        {isOpen ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
        {!isOpen && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 border border-white text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
            {totalUnread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-6 left-6 z-[9999] flex flex-col items-start font-sans" dir="rtl">
          <div className={`bg-white border border-slate-200 shadow-2xl rounded-sm flex flex-col overflow-hidden animate-in fade-in transition-all duration-300 ${isMaximized ? "fixed inset-4 sm:inset-10 m-auto z-[10000] w-[95vw] sm:w-[800px] h-[95vh] sm:h-[85vh] max-h-[900px]" : "w-[360px] h-[550px]"}`}>
            {/* Header */}
            <div className="bg-[#714B67] p-4 text-white flex justify-between items-center shadow-md z-10">
              {activeChat ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setActiveChat(null)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                      <Minimize2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setIsMaximized(!isMaximized)} className="hover:bg-white/20 p-1 rounded-full transition-colors" title={isMaximized ? "تصغير" : "تكبير"}>
                      <Maximize className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{activeChat.name}</span>
                        {!activeChat.isGroup && (
                          <div className={`w-2 h-2 rounded-full ${activeChat.isOnline ? "bg-emerald-400" : "bg-slate-300"}`}></div>
                        )}
                      </div>
                      <span className="text-[10px] text-blue-100 opacity-90">
                        {activeChat.isGroup ? "مجموعة عمل" : activeChat.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleStartCall} className="hover:bg-white/20 p-1.5 rounded-full transition-colors bg-white/10" title="مكالمة فيديو/صوت">
                      <Video className="w-4 h-4" />
                    </button>
                    <button onClick={closeChat} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center w-full">
                  <div>
                    <h3 className="font-bold text-lg">الماسنجر الداخلي</h3>
                    <p className="text-xs text-blue-100 opacity-90">تواصل مع زملائك بأمان</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsMaximized(!isMaximized)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors" title={isMaximized ? "تصغير" : "تكبير"}>
                      <Maximize className="w-4 h-4" />
                    </button>
                    <button onClick={closeChat} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Retention Warning */}
            {!activeChat && (
              <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex gap-2 items-center text-amber-800 text-[10px]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>الرسائل والمرفقات الأقدم من 40 يوماً تُحذف تلقائياً من السيرفر.</span>
              </div>
            )}

            {/* Tabs */}
            {!activeChat && (
              <div className="flex border-b border-slate-200 bg-slate-50">
                <button
                  onClick={() => { setActiveTab("users"); setIsCreatingGroup(false); }}
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === "users" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  الموظفين
                </button>
                <button
                  onClick={() => { setActiveTab("groups"); setIsCreatingGroup(false); }}
                  className={`flex-1 py-2 text-xs font-bold ${activeTab === "groups" ? "text-blue-600 border-b-2 border-blue-600 bg-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  المجموعات
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 bg-slate-50 overflow-y-auto">
              {!activeChat ? (
                <div className="p-2 space-y-1">
                  {loading ? (
                    <div className="p-6 text-center text-slate-400 text-sm font-bold">جاري التحميل...</div>
                  ) : activeTab === "users" ? (
                    contacts.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-sm font-bold">لا يوجد موظفين مسجلين.</div>
                    ) : (
                      contacts.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => setActiveChat(contact)}
                          className="w-full flex items-center justify-between p-3 hover:bg-white rounded-sm transition-all border border-transparent hover:border-slate-100 hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                {contact.name?.substring(0, 1)}
                              </div>
                              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${contact.isOnline ? "bg-emerald-500" : "bg-slate-300"}`}></div>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="font-bold text-sm text-slate-800">{contact.name}</span>
                              <span className="text-[10px] font-medium text-slate-400">{contact.role}</span>
                            </div>
                          </div>
                          {contact.unreadCount > 0 && (
                            <span className="bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                              {contact.unreadCount}
                            </span>
                          )}
                        </button>
                      ))
                    )
                  ) : (
                    // Groups Tab
                    <div className="p-2">
                      {isCreatingGroup ? (
                        <div className="bg-white p-3 border border-slate-200 rounded-sm shadow-sm">
                          <h4 className="font-bold text-sm mb-3">إنشاء مجموعة جديدة</h4>
                          <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                            type="text" 
                            placeholder="اسم المجموعة..." 
                            value={newGroupName} 
                            onChange={e => setNewGroupName(e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 rounded-sm mb-3 focus:border-blue-500 outline-none"
                          />
                          <div className="text-xs font-bold text-slate-600 mb-2">اختر الأعضاء:</div>
                          <div className="max-h-32 overflow-y-auto border border-slate-100 p-2 rounded-sm mb-3">
                            {contacts.map(c => (
                              <label key={c.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 cursor-pointer">
                                <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                                  type="checkbox" 
                                  checked={selectedUsers.includes(c.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedUsers([...selectedUsers, c.id]);
                                    else setSelectedUsers(selectedUsers.filter(id => id !== c.id));
                                  }}
                                />
                                <span className="text-xs">{c.name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={handleCreateGroup} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded-sm hover:bg-blue-700">إنشاء</button>
                            <button onClick={() => setIsCreatingGroup(false)} className="flex-1 bg-slate-200 text-slate-700 text-xs py-1.5 rounded-sm hover:bg-slate-300">إلغاء</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setIsCreatingGroup(true)} className="w-full flex items-center justify-center gap-2 p-2 mb-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-sm hover:bg-indigo-100 transition-colors text-sm font-bold">
                            <Users className="w-4 h-4" /> إنشاء مجموعة جديدة
                          </button>
                          {rooms.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">لا توجد مجموعات حتى الآن.</div>
                          ) : (
                            rooms.map((room) => (
                              <button
                                key={room.id}
                                onClick={() => setActiveChat(room)}
                                className="w-full flex items-center justify-between p-3 hover:bg-white rounded-sm transition-all border border-transparent hover:border-slate-100 hover:shadow-sm mb-1"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                                    <Users className="w-5 h-5" />
                                  </div>
                                  <div className="flex flex-col items-start">
                                    <span className="font-bold text-sm text-slate-800">{room.name}</span>
                                    <span className="text-[10px] font-medium text-slate-400">{room.participants?.length || 0} أعضاء</span>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Messages Area
                <div className="p-4 flex flex-col gap-4">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-400 text-xs mt-10 font-medium">هذه بداية المحادثة مع {activeChat.name}</div>
                  )}
                  {messages.map((msg) => (
                    <MessageBubble 
                      key={msg.id} 
                      msg={msg} 
                      isMe={msg.senderId === currentUserId} 
                      currentUserId={currentUserId}
                      setActiveMeetingRoom={setActiveMeetingRoom}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Footer Input */}
            {activeChat && (
              <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
                <form onSubmit={(e) => handleSendMessage(e)} className="flex items-end gap-2">
                  <div className="flex-1 relative bg-slate-50 border border-slate-200 rounded-2xl flex items-center pr-2 pl-2 shadow-inner focus-within:border-blue-400 transition-colors">
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-full" title="إرفاق ملف">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="اكتب رسالة..."
                      className="flex-1 bg-transparent border-none py-3 px-2 text-sm focus:outline-none focus:ring-0 resize-none h-[44px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    
                    {isRecording ? (
                      <button type="button" onClick={stopRecording} className="p-2 text-rose-500 animate-pulse transition-colors rounded-full" title="إيقاف التسجيل">
                        <StopCircle className="w-5 h-5" />
                      </button>
                    ) : (
                      <button type="button" onClick={startRecording} className="p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-full" title="تسجيل رسالة صوتية">
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !isRecording) || isRecording}
                    className="bg-blue-600 text-white w-[44px] h-[44px] rounded-full flex justify-center items-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex-shrink-0"
                  >
                    <Send className="w-4 h-4 rtl:-scale-x-100" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
