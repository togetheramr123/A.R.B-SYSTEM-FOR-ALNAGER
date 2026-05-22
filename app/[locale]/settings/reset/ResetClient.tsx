'use client';

import React, { useState } from 'react';
import { AlertTriangle, Trash2, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { resetProductData } from '@/app/actions/resetProductData';

export default function ResetClient() {
  const [step, setStep] = useState(0); // 0=initial, 1=confirm, 2=processing, 3=done
  const [confirmText, setConfirmText] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleReset = async () => {
    if (confirmText !== 'تأكيد التصفير') {
      toast.error('يرجى كتابة "تأكيد التصفير" بالضبط للمتابعة');
      return;
    }

    setStep(2);

    try {
      const res = await resetProductData('RESET-PRODUCTS-CONFIRM');
      if (res.success) {
        setResult(res);
        setStep(3);
        toast.success(res.message || 'تم التصفير بنجاح!');
      } else {
        toast.error(res.error || 'فشل التصفير');
        setStep(1);
      }
    } catch (e: any) {
      toast.error(`خطأ: ${e.message}`);
      setStep(1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">

      {/* تحذير */}
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 flex gap-4">
        <ShieldAlert className="w-8 h-8 text-red-600 shrink-0 mt-1" />
        <div>
          <h2 className="text-xl font-bold text-red-800">⚠️ تصفير بيانات المنتجات والمخزون</h2>
          <p className="text-red-700 mt-2 text-sm leading-relaxed">
            هذا الإجراء سيقوم بحذف <strong>جميع</strong> البيانات التالية نهائياً:
          </p>
          <ul className="text-red-700 text-sm mt-3 space-y-1 list-disc list-inside">
            <li>جميع <strong>المنتجات (الأصناف)</strong> وبياناتها</li>
            <li>جميع <strong>فئات المنتجات</strong></li>
            <li>جميع <strong>أسعار قوائم الأسعار</strong></li>
            <li>جميع <strong>كميات المخزون</strong> (الأرصدة في اليد)</li>
            <li>جميع <strong>حركات المخزون</strong> وأوامر التسليم</li>
            <li>جميع <strong>معلومات الموردين</strong> المرتبطة بالمنتجات</li>
          </ul>
          <p className="text-red-700 mt-3 text-sm font-bold">
            ✅ سيتم الاحتفاظ بـ: الحسابات المحاسبية، الشركاء (العملاء/الموردين)، المستخدمين، القيود المحاسبية، الفواتير (بدون ربط المنتجات).
          </p>
        </div>
      </div>

      {/* الخطوة 0: زر البدء */}
      {step === 0 && (
        <button
          onClick={() => setStep(1)}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
        >
          <Trash2 className="w-6 h-6" />
          بدء عملية التصفير
        </button>
      )}

      {/* الخطوة 1: التأكيد */}
      {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-amber-700 bg-amber-50 p-3 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold">للتأكيد، اكتب &quot;تأكيد التصفير&quot; في الحقل أدناه:</span>
          </div>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='اكتب هنا: تأكيد التصفير'
            className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 text-center text-lg font-bold focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            dir="rtl"
          />
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={confirmText !== 'تأكيد التصفير'}
              className={`flex-1 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                confirmText === 'تأكيد التصفير'
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-5 h-5" />
              تأكيد وتنفيذ التصفير
            </button>
            <button
              onClick={() => { setStep(0); setConfirmText(''); }}
              className="px-6 py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* الخطوة 2: جاري التنفيذ */}
      {step === 2 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto" />
          <h3 className="text-xl font-bold text-slate-800">جاري تصفير البيانات...</h3>
          <p className="text-slate-500">يرجى الانتظار وعدم إغلاق الصفحة. قد تستغرق العملية بضع دقائق.</p>
        </div>
      )}

      {/* الخطوة 3: تم بنجاح */}
      {step === 3 && result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
          <h3 className="text-xl font-bold text-green-800">تم التصفير بنجاح! ✅</h3>
          <div className="text-green-700 text-sm space-y-1">
            <p>عدد المنتجات المحذوفة: <strong>{result.deletedProducts}</strong></p>
            <p>الفئات المتبقية: <strong>{result.remainingCategories}</strong></p>
          </div>
          <p className="text-green-600 font-medium mt-4">
            النظام جاهز الآن لاستيراد البيانات الحقيقية من صفحة الإعدادات → استيراد البيانات.
          </p>
          <a
            href="/ar/settings/import"
            className="inline-block mt-3 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
          >
            الانتقال لصفحة الاستيراد
          </a>
        </div>
      )}
    </div>
  );
}
