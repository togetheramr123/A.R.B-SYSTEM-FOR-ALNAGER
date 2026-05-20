import React from "react";
import { getTranslations } from "next-intl/server";
import { Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import Link from "next/link";
export default async function LockedPage({
  params
}: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await params;
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {" "}
      <div className="bg-white max-w-md w-full rounded-lg shadow-sm border border-red-100 p-8 text-center">
        {" "}
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          {" "}
          <Lock className="w-10 h-10" />{" "}
        </div>{" "}
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          تم تعليق الجلسة مؤقتاً
        </h1>{" "}
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-md my-6 flex items-start gap-3 text-right">
          {" "}
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />{" "}
          <div>
            {" "}
            <p className="font-bold text-sm mb-1">
              المُوجّه الذكي (Smart Coach)
            </p>{" "}
            <p className="text-sm">
              لقد لاحظ النظام تكرار أخطاء حرجة أو انخفاضاً سريعاً في دقة
              البيانات المدخلة في الجلسة الحالية. تم إيقاف جلستك لمدة{" "}
              <strong>3 دقائق</strong> حرصاً على سلامة البيانات ولإعطائك فرصة
              للتركيز.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="text-sm text-slate-600 mb-8 border-t border-slate-100 pt-6">
          {" "}
          <p className="mb-2">
            💡 تم إرسال إشعار تلقائي لمدير النظام مع تقرير كامل بتفاصيل الأخطاء
            (عبر الواتساب).
          </p>{" "}
          <p>
            يرجى قراءة دليل الاستخدام الخاص بالشاشة التي كنت تعمل عليها لتجنب
            تكرار هذه الأخطاء ورفع مؤشر كفاءتك.
          </p>{" "}
        </div>{" "}
        <Link href={`/${locale}`} className="inline-flex items-center justify-center gap-2 w-full bg-[#017E84] text-white py-3 px-4 rounded-md font-bold hover:bg-teal-800 transition-colors">
          {" "}
          <ShieldCheck className="w-5 h-5" /> العودة للرئيسية (بعد انتهاء
          المدة){" "}
        </Link>{" "}
      </div>{" "}
    </div>;
}