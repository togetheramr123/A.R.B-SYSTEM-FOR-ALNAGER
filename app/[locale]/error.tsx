"use client";

import { useEffect, useState } from "react";
import { AlertCircle, RefreshCcw, Home, Copy, Check, ChevronDown, ChevronUp, Bug, Clock, Globe, Monitor } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);
  const [timestamp] = useState(new Date().toLocaleString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }));

  useEffect(() => {
    console.error("⚠️ خطأ في النظام:", error);
  }, [error]);

  // Translate common errors to Arabic
  const getArabicError = (msg: string): { title: string; detail: string; code: string } => {
    if (!msg) return { title: "خطأ غير معروف", detail: "حدث خطأ لم يتمكن النظام من تحديده.", code: "UNKNOWN" };

    if (msg.includes("is not defined")) {
      const varName = msg.split(" is not defined")[0].trim();
      return {
        title: "خطأ في كود الصفحة",
        detail: `متغير "${varName}" غير معرّف. هذا خطأ برمجي يحتاج إصلاح من المطور.`,
        code: "REF_ERROR"
      };
    }
    if (msg.includes("Cannot read properties of undefined") || msg.includes("Cannot read properties of null")) {
      const prop = msg.match(/reading '([^']+)'/)?.[1] || "غير محدد";
      return {
        title: "خطأ في قراءة البيانات",
        detail: `النظام حاول قراءة خاصية "${prop}" من قيمة فارغة. قد تكون البيانات غير موجودة أو لم يتم تحميلها.`,
        code: "NULL_REF"
      };
    }
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("fetch failed")) {
      return {
        title: "فشل الاتصال بالخادم",
        detail: "تعذر الوصول للخادم. تأكد من اتصالك بالإنترنت. إذا المشكلة مستمرة، الخادم قد يكون متوقف.",
        code: "NETWORK"
      };
    }
    if (msg.includes("Unique constraint failed")) {
      return {
        title: "بيانات مكررة",
        detail: "تحاول حفظ سجل موجود بالفعل (مثل كود حساب أو رقم فاتورة مكرر).",
        code: "DUPLICATE"
      };
    }
    if (msg.includes("Invalid `prisma.")) {
      const model = msg.match(/prisma\.(\w+)/)?.[1] || "";
      return {
        title: "خطأ في قاعدة البيانات",
        detail: `خطأ في استعلام "${model}". قد يكون هناك حقل غير موجود أو بيانات غير صالحة.`,
        code: "DB_QUERY"
      };
    }
    if (msg.includes("Record to update not found") || msg.includes("Record to delete does not exist")) {
      return {
        title: "السجل غير موجود",
        detail: "السجل الذي تحاول تعديله أو حذفه لم يعد موجوداً. ربما تم حذفه من قبل مستخدم آخر.",
        code: "NOT_FOUND"
      };
    }
    if (msg.includes("Transaction already closed") || msg.includes("timeout")) {
      return {
        title: "انتهت مهلة العملية",
        detail: "العملية استغرقت وقتاً أطول من المسموح. حاول مرة أخرى أو قسّم البيانات لأجزاء أصغر.",
        code: "TIMEOUT"
      };
    }
    if (msg.includes("Unauthorized") || msg.includes("غير مصرح")) {
      return {
        title: "غير مصرح لك",
        detail: "ليس لديك صلاحية لتنفيذ هذا الإجراء. تواصل مع المسؤول.",
        code: "AUTH"
      };
    }
    if (msg.includes("INSUFFICIENT_STOCK") || msg.includes("رصيد غير كافٍ")) {
      return {
        title: "رصيد مخزن غير كافي",
        detail: "الكمية المطلوبة غير متوفرة في المخزن.",
        code: "STOCK"
      };
    }
    if (msg.includes("Hydration") || msg.includes("hydrat")) {
      return {
        title: "خطأ في تحميل الصفحة",
        detail: "حدث تعارض أثناء تحميل الصفحة. اضغط 'حاول مرة أخرى'.",
        code: "HYDRATION"
      };
    }
    if (msg.includes("ChunkLoadError") || msg.includes("Loading chunk")) {
      return {
        title: "فشل تحميل جزء من الصفحة",
        detail: "تعذر تحميل ملف مطلوب. أعد تحميل الصفحة بالكامل (Ctrl+Shift+R).",
        code: "CHUNK"
      };
    }

    return {
      title: "خطأ تقني",
      detail: msg,
      code: "GENERAL"
    };
  };

  const errorInfo = getArabicError(error.message);
  const currentPage = typeof window !== 'undefined' ? window.location.pathname : '';
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const browserName = userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : userAgent.includes('Safari') ? 'Safari' : 'متصفح آخر';

  // Build a copyable error report
  const errorReport = `🔴 تقرير خطأ - نظام ERP
━━━━━━━━━━━━━━━━━━━━━━
📋 نوع الخطأ: ${errorInfo.title}
🏷️ كود الخطأ: ${errorInfo.code}
📝 التفاصيل: ${errorInfo.detail}
📄 الصفحة: ${currentPage}
🕐 الوقت: ${timestamp}
🌐 المتصفح: ${browserName}
${error.digest ? `🔑 Digest: ${error.digest}` : ''}
━━━━━━━━━━━━━━━━━━━━━━
💻 الخطأ الأصلي: ${error.message}
${error.stack ? `\n📚 Stack:\n${error.stack.split('\n').slice(0, 5).join('\n')}` : ''}`;

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(errorReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = errorReport;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden border border-red-100">
        
        {/* Header */}
        <div className="bg-gradient-to-l from-red-50 to-red-100 p-6 flex flex-col items-center border-b border-red-200">
          <div className="w-16 h-16 bg-white text-red-500 rounded-full flex items-center justify-center mb-4 shadow-md border-2 border-red-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-red-800 text-center mb-1">
            {errorInfo.title}
          </h2>
          <div className="bg-red-200/60 text-red-700 text-[11px] font-mono font-bold px-3 py-1 rounded-full mt-1">
            كود: {errorInfo.code}
          </div>
        </div>

        {/* Error Details */}
        <div className="p-5">
          {/* Arabic description */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-900 font-bold leading-relaxed">
              ⚠️ {errorInfo.detail}
            </p>
          </div>

          {/* Technical info card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold">الصفحة:</span>
              <span className="font-mono text-[11px] text-slate-500 truncate" dir="ltr">{currentPage}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold">الوقت:</span>
              <span className="font-mono text-[11px] text-slate-500">{timestamp}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold">المتصفح:</span>
              <span className="text-[11px] text-slate-500">{browserName}</span>
            </div>
            {error.digest && (
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Bug className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-bold">معرّف:</span>
                <span className="font-mono text-[11px] text-slate-500" dir="ltr">{error.digest}</span>
              </div>
            )}
          </div>

          {/* Original error (collapsible) */}
          <div className="mb-4">
            <button 
              onClick={() => setShowStack(!showStack)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors w-full"
            >
              {showStack ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span className="font-bold">الخطأ الأصلي (للمطور)</span>
            </button>
            {showStack && (
              <div className="mt-2 bg-slate-900 rounded-lg p-3 overflow-auto max-h-48">
                <p className="text-[11px] text-red-400 font-mono mb-2" dir="ltr">{error.message}</p>
                {error.stack && (
                  <pre className="text-[10px] text-slate-400 font-mono whitespace-pre-wrap break-all" dir="ltr">
                    {error.stack.split('\n').slice(1, 8).join('\n')}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Copy report button */}
          <button
            onClick={copyReport}
            className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all mb-4 ${
              copied 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'تم النسخ! ✅ أرسل التقرير للمطور' : '📋 نسخ تقرير الخطأ (لإرساله للمطور)'}
          </button>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 bg-[#017E84] text-white py-2.5 px-4 rounded-lg font-bold text-sm hover:bg-[#016069] active:scale-[0.98] transition-all shadow-sm"
            >
              <RefreshCcw className="w-4 h-4" />
              حاول مرة أخرى
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-300 py-2.5 px-4 rounded-lg font-bold text-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              <Home className="w-4 h-4" />
              الرئيسية
            </Link>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <p className="mt-6 text-xs text-slate-400 text-center max-w-sm leading-relaxed">
        💡 <strong>نصيحة:</strong> خذ سكرينشوت لهذه الصفحة أو اضغط "نسخ تقرير الخطأ" وأرسله للمطور لمساعدتك بسرعة.
      </p>
    </div>
  );
}