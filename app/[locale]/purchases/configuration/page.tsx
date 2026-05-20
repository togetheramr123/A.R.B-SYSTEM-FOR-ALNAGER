import React from "react";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
export default function PurchasesConfigurationPage() {
  return <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      {" "}
      <div className="bg-white border rounded-lg shadow-sm p-8">
        {" "}
        <div className="flex items-center gap-3 mb-6 border-b pb-4">
          {" "}
          <Settings className="w-6 h-6 text-slate-500" />{" "}
          <h1 className="text-2xl font-bold text-slate-800">
            تهيئة المشتريات
          </h1>{" "}
        </div>{" "}
        <div className="text-slate-600">
          {" "}
          <p className="mb-4">
            إعدادات المشتريات ستكون متاحة هنا قريباً. تشمل هذه الشاشة:
          </p>{" "}
          <ul className="list-disc list-inside space-y-2 mr-4 text-sm text-slate-500">
            {" "}
            <li>إعدادات أوامر الشراء والموافقات</li> <li>إدارة وحدات القياس</li>{" "}
            <li>إعدادات قواعد إعادة الطلب التلقائية</li>{" "}
          </ul>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}