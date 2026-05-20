"use client";

import { useActionState } from "react";
import { portalLogin } from "@/app/actions/portalAuth";
import { Loader2, Lock, Phone, ShoppingBag } from "lucide-react";
const initialState = {
  error: ""
};
export default function PortalLoginPage() {
  /* @ts-ignore */const [state, formAction, isPending] = useActionState(portalLogin, initialState);
  return <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 relative overflow-hidden" dir="rtl">
      {" "}
      {/* Animated Background */}{" "}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {" "}
        <div className="absolute -top-1/4 -right-1/4 w-[80vh] h-[80vh] rounded-full bg-[#714B67] blur-3xl animate-pulse" />{" "}
        <div className="absolute top-1/2 -left-1/4 w-[60vh] h-[60vh] rounded-full bg-[#714B67] blur-3xl animate-pulse" style={{
        animationDelay: "1s"
      }} />{" "}
        <div className="absolute -bottom-1/4 right-1/3 w-[50vh] h-[50vh] rounded-full bg-[#714B67] blur-3xl animate-pulse" style={{
        animationDelay: "2s"
      }} />{" "}
        {/* Grid Pattern */}{" "}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />{" "}
      </div>{" "}
      <div className="w-full max-w-md p-6 z-10 relative">
        {" "}
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 shadow-sm rounded-sm p-8 md:p-10 overflow-hidden relative">
          {" "}
          {/* Decorative Top Gradient */}{" "}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#714B67]" />{" "}
          {/* Logo/Icon */}{" "}
          <div className="flex justify-center mb-6">
            {" "}
            <div className="w-16 h-16 rounded-sm bg-[#714B67] flex items-center justify-center shadow-sm ">
              {" "}
              <ShoppingBag className="w-8 h-8 text-white" />{" "}
            </div>{" "}
          </div>{" "}
          <div className="text-center mb-8">
            {" "}
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
              {" "}
              بوابة التجّار{" "}
            </h1>{" "}
            <p className="text-slate-400 text-sm">
              {" "}
              سجّل دخولك لتصفح المنتجات وإرسال طلباتك{" "}
            </p>{" "}
          </div>{" "}
          <form action={formAction} className="space-y-5">
            {" "}
            <div className="space-y-2">
              {" "}
              <label className="text-sm font-medium text-slate-300 block">
                {" "}
                اسم المستخدم{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {" "}
                  <Phone className="w-5 h-5" />{" "}
                </div>{" "}
                <input type="text" name="username" required autoComplete="username" placeholder="ادخل اسم المستخدم أو رقم الهاتف" className="w-full pr-11 pl-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all duration-300 placeholder:text-slate-600 text-white text-sm" />{" "}
              </div>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <label className="text-sm font-medium text-slate-300 block">
                {" "}
                كلمة المرور{" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {" "}
                  <Lock className="w-5 h-5" />{" "}
                </div>{" "}
                <input type="password" name="password" required autoComplete="current-password" placeholder="••••••••" className="w-full pr-11 pl-4 py-3.5 bg-white/[0.06] border border-white/10 rounded-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 outline-none transition-all duration-300 placeholder:text-slate-600 text-white text-sm" />{" "}
              </div>{" "}
            </div>{" "}
            {state?.error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm text-red-400 text-sm text-center animate-in fade-in">
                {" "}
                {state.error}{" "}
              </div>}{" "}
            <button type="submit" disabled={isPending} className="w-full bg-[#714B67] hover: hover: text-white font-bold py-3.5 rounded-sm shadow-sm hover: transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0">
              {" "}
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <span className="text-base">تسجيل الدخول</span>}{" "}
            </button>{" "}
          </form>{" "}
          <div className="mt-8 text-center">
            {" "}
            <p className="text-xs text-slate-600">
              {" "}
              للحصول على حساب، تواصل مع الشركة{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}