import React from "react";
import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TrendingUp, TrendingDown, AlertTriangle, UserX, ShieldCheck } from "lucide-react";
export default async function PerformanceDashboardPage({
  params
}: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await params;
  const session = await getSession();
  /* Only managers should see this (in a real app, check role) */
  const users = await prisma.user.findMany({
    include: {
      performanceLogs: {
        orderBy: {
          createdAt: "desc"
        },
        take: 10
      }
    },
    orderBy: {
      efficiencyScore: "asc"
    }
  });
  return <div className="bg-[#f8fafc] w-full min-h-screen py-6 px-4" dir="rtl">
      {" "}
      <div className="max-w-7xl mx-auto">
        {" "}
        <div className="flex items-center justify-between mb-8">
          {" "}
          <div>
            {" "}
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {" "}
              <ShieldCheck className="w-7 h-7 text-[#017E84]" /> تقارير المُوجّه
              الذكي وكفاءة الموظفين{" "}
            </h1>{" "}
            <p className="text-slate-500 mt-1">
              تابع تقييم أداء الموظفين والأخطاء المتكررة لتحديد الاحتياجات
              التدريبية.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {" "}
          {users.map(user => {
          const isDanger = user.efficiencyScore < 80;
          const isWarning = user.efficiencyScore >= 80 && user.efficiencyScore < 95;
          const isExcellent = user.efficiencyScore >= 95;
          return <div key={user.id} className={`bg-white rounded-lg shadow-sm border-t-4 p-5 ${isDanger ? "border-red-500" : isWarning ? "border-yellow-400" : "border-green-500"}`}>
                {" "}
                <div className="flex justify-between items-start mb-4">
                  {" "}
                  <div>
                    {" "}
                    <h3 className="font-bold text-lg text-slate-800">
                      {user.name || user.email}
                    </h3>{" "}
                    <p className="text-sm text-slate-500">{user.role}</p>{" "}
                  </div>{" "}
                  <div className={`flex flex-col items-end ${isDanger ? "text-red-600" : isWarning ? "text-yellow-600" : "text-green-600"}`}>
                    {" "}
                    <div className="flex items-center gap-1 font-bold text-xl">
                      {" "}
                      {user.efficiencyScore.toFixed(1)}%{" "}
                      {isDanger ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}{" "}
                    </div>{" "}
                    <span className="text-xs font-medium">
                      مؤشر الكفاءة
                    </span>{" "}
                  </div>{" "}
                </div>{" "}
                {user.lockedUntil && new Date(user.lockedUntil) > new Date() && <div className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded mb-4 flex items-center gap-1 font-bold">
                      {" "}
                      <UserX className="w-4 h-4" /> الموظف موقوف مؤقتاً (تجاوز
                      الأخطاء الحرجة){" "}
                    </div>}{" "}
                <div>
                  {" "}
                  <h4 className="text-sm font-bold text-slate-700 mb-2 border-b pb-1">
                    آخر الأخطاء المرصودة:
                  </h4>{" "}
                  {user.performanceLogs.length === 0 ? <p className="text-sm text-slate-400 italic">
                      لا توجد أخطاء مسجلة، أداء ممتاز!
                    </p> : <ul className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {" "}
                      {user.performanceLogs.map(log => <li key={log.id} className="bg-slate-50 p-2 rounded text-sm border border-slate-100 flex items-start gap-2">
                          {" "}
                          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${log.severity >= 4 ? "text-red-500" : "text-yellow-500"}`} />{" "}
                          <div>
                            {" "}
                            <p className="font-medium text-slate-800">
                              {log.context}
                            </p>{" "}
                            <p className="text-xs text-slate-500 mt-0.5">
                              النوع: {log.errorType} | الخطورة: {log.severity}/5
                            </p>{" "}
                          </div>{" "}
                        </li>)}{" "}
                    </ul>}{" "}
                </div>{" "}
                {isDanger && <button className="mt-4 w-full bg-red-50 text-red-700 py-2 rounded-md text-sm font-bold border border-red-200 hover:bg-red-100 transition-colors">
                    {" "}
                    توجيه طلب إعادة تدريب{" "}
                  </button>}{" "}
              </div>;
        })}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}