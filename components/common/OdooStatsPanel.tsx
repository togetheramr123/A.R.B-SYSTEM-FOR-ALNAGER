"use client";

export function OdooStatsPanel() {
  return <div className="bg-white border-b border-slate-200 p-4 flex flex-col md:flex-row gap-6 text-sm text-slate-700">
      {" "}
      {/* Left Side: Stats Grid */}{" "}
      <div className="flex-1 grid grid-cols-2 gap-y-4 gap-x-12">
        {" "}
        {/* Stat 1 */}{" "}
        <div>
          {" "}
          <div className="font-bold text-slate-900 text-lg">
            1,183,338.35 ج.م
          </div>{" "}
          <div className="text-slate-500">المشتريات خلال آخر 7 أيام</div>{" "}
        </div>{" "}
        {/* Stat 2 */}{" "}
        <div>
          {" "}
          <div className="font-bold text-slate-900 text-lg">
            331,513.01 ج.م
          </div>{" "}
          <div className="text-slate-500">متوسط قيمة الطلب</div>{" "}
        </div>{" "}
        {/* Stat 3 */}{" "}
        <div>
          {" "}
          <div className="font-bold text-slate-900 text-lg">0</div>{" "}
          <div className="text-slate-500">
            طلبات عروض الأسعار
            <br />
            التي قد تم إرسالها خلال
            <br />
            الـ 7 أيام الماضية
          </div>{" "}
        </div>{" "}
        {/* Stat 4 */}{" "}
        <div>
          {" "}
          <div className="font-bold text-slate-900 text-lg">0.15 أيام</div>{" "}
          <div className="text-slate-500">المهلة حتى الشراء</div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Right Side: Pipeline Dashboard */}{" "}
      <div className="flex-1 flex">
        {" "}
        <div className="flex-1 bg-[#5F8DAB] text-white flex flex-col items-center justify-center p-2 border-r border-white/20">
          {" "}
          <div className="text-lg font-bold">1</div> <div>متأخر</div>{" "}
          <div className="mt-2 text-xs opacity-80">1</div>{" "}
        </div>{" "}
        <div className="flex-1 bg-[#5F8DAB] text-white flex flex-col items-center justify-center p-2 border-r border-white/20">
          {" "}
          <div className="text-lg font-bold">0</div> <div>قيد الانتظار</div>{" "}
          <div className="mt-2 text-xs opacity-80">0</div>{" "}
        </div>{" "}
        <div className="flex-1 bg-[#5F8DAB] text-white flex flex-col items-center justify-center p-2">
          {" "}
          <div className="text-lg font-bold">1</div> <div>بانتظار الإرسال</div>{" "}
          <div className="mt-2 text-xs opacity-80">1</div>{" "}
        </div>{" "}
        <div className="w-24 bg-white border border-slate-200 text-slate-600 flex flex-col items-center justify-center p-2 text-center text-xs font-medium ml-2 rounded-r-sm">
          {" "}
          كافة طلبات <br /> عروض <br /> الأسعار{" "}
        </div>{" "}
        <div className="w-24 bg-white border border-slate-200 text-slate-600 flex flex-col items-center justify-center p-2 text-center text-xs font-medium border-l-0 rounded-l-sm">
          {" "}
          طلبات <br /> عروض <br /> الأسعار{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}