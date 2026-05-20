"use client";

import { useEffect } from "react";
import { setEnvironment } from "@/app/actions/set-environment";
import { Building2, Loader2 } from "lucide-react";
export default function HomePage({
  params,
}: {
  params: {
    locale: string;
  };
}) {
  useEffect(() => {
    // redirect to real company
    setEnvironment("real", "ar");
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {" "}
      <div className="max-w-lg w-full space-y-8 text-center">
        {" "}
        <div className="space-y-4">
          {" "}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            {" "}
            نظام <span className="text-blue-600">2026</span>{" "}
          </h1>{" "}
          <p className="text-gray-500">نظام إدارة المؤسسات الذكية</p>{" "}
        </div>{" "}
        <div className="bg-white p-10 rounded-sm shadow-sm border border-gray-100">
          {" "}
          <div className="bg-blue-50 p-4 rounded-sm inline-flex mx-auto mb-6">
            {" "}
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />{" "}
          </div>{" "}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            جاري الدخول...
          </h3>{" "}
          <p className="text-gray-500 text-sm">
            سيتم توجيهك إلى لوحة التحكم...
          </p>{" "}
          <button
            onClick={() => setEnvironment("real", "ar")}
            className="mt-6 bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-sm font-bold text-sm transition-colors shadow-sm"
          >
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <Building2 className="w-5 h-5" /> <span>الدخول للنظام</span>{" "}
            </div>{" "}
          </button>{" "}
        </div>{" "}
        <div className="text-center">
          {" "}
          <p className="text-xs text-gray-400">
            © 2026 Smart ERP Solutions. All rights reserved.
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
