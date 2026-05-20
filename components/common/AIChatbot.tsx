"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, User, ChevronDown, Minimize2, Maximize2, Loader2 } from "lucide-react";
export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<{
    role: "assistant" | "user";
    content: string;
  }[]>([{
    role: "assistant",
    content: "مرحباً! أنا المساعد الذكي الخاص بك في نظام ERP. كيف يمكنني مساعدتك اليوم؟"
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userText = input.trim();
    setInput("");
    setMessages(prev => [...prev, {
      role: "user",
      content: userText
    }]);
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText,
          history: messages
        })
      });
      if (!res.ok) throw new Error("Failed to fetch response");
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.reply
      }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "عذراً، واجهت مشكلة في الاتصال. يرجى المحاولة لاحقاً."
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  if (!isOpen) {
    return <button onClick={() => {
      setIsOpen(true);
      setIsMinimized(false);
    }} className="fixed bottom-6 left-6 2xl:bottom-12 2xl:left-12 z-[100] w-14 h-14 bg-[#017E84] hover:bg-indigo-700 text-white rounded-full shadow-sm flex items-center justify-center transition-transform hover:scale-105" title="المساعد الذكي" dir="rtl">
        {" "}
        <Bot className="w-7 h-7" />{" "}
      </button>;
  }
  return <div dir="rtl" className={`fixed left-6 2xl:left-12 z-[100] bg-white border border-slate-200 shadow-sm rounded-sm flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isMinimized ? "bottom-6 2xl:bottom-12 w-[380px] h-[60px]" : "bottom-6 2xl:bottom-12 w-[380px] h-[600px] max-h-[85vh]"}`}>
      {" "}
      {/* Header */}{" "}
      <div className="bg-[#017E84] text-white px-4 py-3 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="bg-white/20 p-1.5 rounded-lg">
            {" "}
            <Bot className="w-5 h-5" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="font-bold text-sm">مساعد ERP الذكي</h3>{" "}
            <p className="text-indigo-100 text-xs text-right">
              متصل دائماً
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-1">
          {" "}
          <button onClick={e => {
          e.stopPropagation();
          setIsMinimized(!isMinimized);
        }} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            {" "}
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}{" "}
          </button>{" "}
          <button onClick={e => {
          e.stopPropagation();
          setIsOpen(false);
        }} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            {" "}
            <X className="w-4 h-4" />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Chat Body */}{" "}
      {!isMinimized && <>
          {" "}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {" "}
            {messages.map((msg, i) => <div key={i} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                {" "}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-[#017E84]/20 text-[#017E84]"}`}>
                  {" "}
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}{" "}
                </div>{" "}
                <div className={`px-4 py-2.5 rounded-sm max-w-[80%] text-sm ${msg.role === "user" ? "bg-[#017E84] text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"}`}>
                  {" "}
                  {msg.content}{" "}
                </div>{" "}
              </div>)}{" "}
            {isLoading && <div className="flex items-start gap-3">
                {" "}
                <div className="w-8 h-8 rounded-full bg-[#017E84]/20 text-[#017E84] flex items-center justify-center shrink-0">
                  {" "}
                  <Loader2 className="w-4 h-4 animate-spin" />{" "}
                </div>{" "}
                <div className="px-4 py-3 bg-white border border-slate-200 rounded-sm rounded-tl-sm shadow-sm flex items-center gap-1">
                  {" "}
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>{" "}
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>{" "}
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>{" "}
                </div>{" "}
              </div>}{" "}
            <div ref={messagesEndRef} />{" "}
          </div>{" "}
          {/* Input Area */}{" "}
          <div className="p-3 bg-white border-t border-slate-200">
            {" "}
            <div className="flex items-end gap-2 bg-slate-100 rounded-sm p-1.5 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
              {" "}
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }} placeholder="اكتب سؤالك هنا..." className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 resize-none text-sm py-2.5 px-3 outline-none" rows={1} />{" "}
              <button onClick={handleSend} disabled={!input.trim() || isLoading} className="shrink-0 w-10 h-10 bg-[#017E84] hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center transition-colors mb-0.5 mr-1">
                {" "}
                <Send className="w-4 h-4 rtl:-scale-x-100" />{" "}
              </button>{" "}
            </div>{" "}
            <div className="text-center mt-2">
              {" "}
              <span className="text-[10px] text-slate-400">
                Powered by Replit AI Agent
              </span>{" "}
            </div>{" "}
          </div>{" "}
        </>}{" "}
    </div>;
}