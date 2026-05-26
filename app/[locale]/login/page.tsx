"use client";

import { useActionState, use, useState } from "react";
import { login, verifyDemoPin } from "@/app/actions/login";
import { Loader2, Lock, User, ArrowRight, Play, Server, Beaker } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
const initialState = {
  error: ""
};
export default function LoginPage({
  params
}: {
  params: Promise<{
    locale: string;
  }>;
}) {
  /* @ts-ignore */const [state, formAction, isPending] = useActionState(login, initialState);
  const {
    locale
  } = use(params);

  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoPin, setDemoPin] = useState("");
  const [demoError, setDemoError] = useState("");
  const [isVerifyingDemo, setIsVerifyingDemo] = useState(false);

  const handleDemoAccess = async () => {
    setIsVerifyingDemo(true);
    setDemoError("");
    try {
      const result = await verifyDemoPin(demoPin);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        setDemoError(result.error || "الرقم السري غير صحيح");
      }
    } catch (err) {
      setDemoError("حدث خطأ في الاتصال");
    } finally {
      setIsVerifyingDemo(false);
    }
  };

  const isDemoMode = process.env.NEXT_PUBLIC_IS_DEMO === 'true';

  return <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/50 relative overflow-hidden">
      {isDemoMode && (
        <div className="absolute top-0 left-0 w-full bg-red-600 text-white text-center py-1.5 text-sm font-bold z-50 animate-pulse shadow-md">
          تحذير: أنت تعمل الآن على النسخة التجريبية (Demo Version) - للتدريب والاختبار فقط
        </div>
      )}
      
      {/* Abstract Shapes & Patterns Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[70vh] h-[70vh] rounded-full bg-[#714B67]/10 blur-3xl animate-pulse delay-700" />
        <div className="absolute top-[40%] -left-[10%] w-[50vh] h-[50vh] rounded-full bg-[#714B67]/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-[10%] right-[20%] w-[40vh] h-[40vh] rounded-full bg-[#714B67]/10 blur-3xl animate-pulse" />
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      </div>

      <div className="w-full max-w-md p-6 z-10 relative">
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-8 md:p-10 overflow-hidden relative group">
          {/* Decorative Top Line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#714B67]" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2 font-arabic">
              تسجيل الدخول
            </h1>
            <p className="text-slate-500 text-sm">
              مرحباً بك مجدداً في نظام Smart ERP
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="hidden" name="locale" value={locale} />
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block text-right">
                اسم المستخدم
              </label>
              <div className="relative group/input">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#714B67] transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                  type="text" 
                  name="username" 
                  required 
                  placeholder="أدخل اسم المستخدم" 
                  className="w-full pr-11 pl-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] outline-none transition-all duration-300 placeholder:text-slate-400 text-right text-slate-700" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 block text-right">
                كلمة المرور
              </label>
              <div className="relative group/input">
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#714B67] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                  type="password" 
                  name="password" 
                  required 
                  placeholder="••••••••" 
                  className="w-full pr-11 pl-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] outline-none transition-all duration-300 placeholder:text-slate-400 text-right text-slate-700" 
                />
              </div>
            </div>

            {state?.error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center animate-in fade-in slide-in-from-top-2">
                {state.error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isPending} 
              className="w-full bg-[#714B67] hover:bg-[#5e3e56] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#714B67]/10 hover:shadow-xl hover:shadow-[#714B67]/20 transition-all duration-300 flex items-center justify-center gap-2 group/btn disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="text-lg">دخول</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:-translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center flex flex-col items-center gap-4">
            {isDemoMode ? (
              <a 
                href={process.env.NEXT_PUBLIC_LIVE_URL || "https://a-r-b-system-for-alnager.onrender.com"}
                className="text-sm font-semibold text-[#714B67] hover:text-[#5e3e56] flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#714B67]/20 hover:bg-[#714B67]/5 transition-all duration-200"
              >
                <Server className="w-4 h-4" />
                العودة للنسخة الأصلية (Live)
              </a>
            ) : (
              <button 
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="text-sm font-semibold text-[#714B67] hover:text-[#5e3e56] flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#714B67]/20 hover:bg-[#714B67]/5 transition-all duration-200"
              >
                <Beaker className="w-4 h-4" />
                الدخول للنسخة التجريبية (Demo)
              </button>
            )}
            <p className="text-xs text-slate-400">
              © 2026 Smart ERP Solutions. Secured & Encrypted.
            </p>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl overflow-hidden rounded-2xl p-0" dir="rtl">
          <div className="absolute top-0 right-0 w-full h-1.5 bg-[#714B67]"></div>
          
          <DialogHeader className="pt-6 pb-2 px-6 text-right border-b-0 flex flex-col items-center">
            <div className="bg-[#714B67]/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-[#714B67]" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-800 text-center">النسخة التجريبية</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm text-center mt-1">
              يرجى إدخال الرقم السري الخاص بالشركة للوصول إلى بيئة الاختبار
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-2">
            <div className="space-y-4">
              <div className="relative group/input">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-[#714B67] transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} 
                  type="password" 
                  value={demoPin}
                  onChange={(e) => setDemoPin(e.target.value)}
                  placeholder="أدخل الرقم السري" 
                  onKeyDown={(e) => e.key === 'Enter' && handleDemoAccess()}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] outline-none transition-all duration-300 placeholder:text-slate-400 text-left tracking-widest text-lg font-mono"
                  dir="ltr"
                />
              </div>
              {demoError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm text-center animate-in fade-in slide-in-from-top-2">
                  {demoError}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 w-full">
              <button 
                type="button" 
                onClick={() => setIsDemoModalOpen(false)}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition-colors w-full sm:w-auto text-center"
              >
                إلغاء
              </button>
              <button 
                type="button" 
                onClick={handleDemoAccess}
                disabled={isVerifyingDemo || !demoPin}
                className="px-6 py-2.5 rounded-xl bg-[#714B67] hover:bg-[#5e3e56] text-white font-medium shadow-lg shadow-[#714B67]/10 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {isVerifyingDemo ? <Loader2 className="w-5 h-5 animate-spin" /> : 'دخول'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}