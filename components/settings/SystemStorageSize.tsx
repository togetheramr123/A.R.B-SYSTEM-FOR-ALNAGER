"use client";

import { useState, useEffect } from "react";
import { Database, HardDrive, LayoutGrid, Loader2 } from "lucide-react";
import { getDatabaseStorageStats } from "@/app/actions/archiving";
export function SystemStorageSize() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    getDatabaseStorageStats().then(data => {
      setStats(data);
      setIsLoading(false);
    });
  }, []);
  if (isLoading) {
    return <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 flex justify-center items-center h-32 mb-6">
        {" "}
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />{" "}
      </div>;
  }
  if (!stats) return null;
  return <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-6 mb-6">
      {" "}
      <div className="flex items-center gap-3 mb-6">
        {" "}
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-sm flex items-center justify-center">
          {" "}
          <HardDrive className="w-6 h-6" />{" "}
        </div>{" "}
        <div>
          {" "}
          <h2 className="text-lg font-bold text-slate-800">
            حجم مساحة النظام بقاعدة البيانات
          </h2>{" "}
          <p className="text-sm text-slate-500 mt-0.5">
            تفصيل السجلات لكل قسم في النظام
          </p>{" "}
        </div>{" "}
        <div className="mr-auto text-left">
          {" "}
          <div className="text-2xl font-bold text-slate-800 font-numbers">
            {stats.totalSizeMB.toFixed(2)} MB
          </div>{" "}
          <div className="text-xs text-slate-400 font-bold">
            الحجم الإجمالي الفعلي
          </div>{" "}
        </div>{" "}
      </div>{" "}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {" "}
        {Object.values(stats.sections).map((section: any, idx) => <div key={idx} className={`rounded-sm p-4 border border-slate-100 ${section.bg}`}>
            {" "}
            <div className={`mb-3 ${section.color}`}>
              {" "}
              <LayoutGrid className="w-5 h-5" />{" "}
            </div>{" "}
            <div className="text-2xl font-bold text-slate-800 font-numbers mb-1">
              {" "}
              {section.records.toLocaleString()}{" "}
            </div>{" "}
            <div className="text-xs font-bold text-slate-600">
              {" "}
              {section.label}{" "}
            </div>{" "}
          </div>)}{" "}
      </div>{" "}
    </div>;
}