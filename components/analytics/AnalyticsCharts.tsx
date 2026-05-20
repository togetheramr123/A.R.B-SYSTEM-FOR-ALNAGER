"use client";

import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Package } from "lucide-react";
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444"];
export default function AnalyticsCharts({
  data,
  pieData,
  kpis,
  locale
}: {
  data: any[];
  pieData: any[];
  kpis: any[];
  locale: string;
}) {
  const t = useTranslations("Analytics");
  return <div className="space-y-8 pb-12">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {t("title")}
        </h1>{" "}
        <div className="flex gap-2">
          {" "}
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
            آخر 30 يوم
          </button>{" "}
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-md">
            تصدير تقرير
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* KPI Cards */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {" "}
        {kpis.map((kpi, i) => {
        const Icon = kpi.icon === "DollarSign" ? DollarSign : kpi.icon === "ShoppingBag" ? ShoppingBag : kpi.icon === "TrendingUp" ? TrendingUp : Package;
        return <div key={i} className="bg-white p-6 rounded-sm shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              {" "}
              <div className={`absolute top-0 right-0 w-2 h-full bg-blue-500/10 group-hover:bg-blue-500 transition-colors`} />{" "}
              <div className="flex justify-between items-start">
                {" "}
                <div>
                  {" "}
                  <p className="text-slate-500 text-sm font-medium mb-1">
                    {kpi.label}
                  </p>{" "}
                  <h3 className="text-2xl font-bold text-slate-900 line-clamp-1">
                    {kpi.value.toLocaleString()} ج.م
                  </h3>{" "}
                  <span className={`text-xs font-bold mt-2 inline-block ${kpi.growth.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    {" "}
                    {kpi.growth} مقارنة بالشهر السابق{" "}
                  </span>{" "}
                </div>{" "}
                <div className={`p-3 rounded-sm bg-blue-50 text-blue-600`}>
                  {" "}
                  <Icon className="w-6 h-6" />{" "}
                </div>{" "}
              </div>{" "}
            </div>;
      })}{" "}
      </div>{" "}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {" "}
        {/* Main Chart */}{" "}
        <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
          {" "}
          <h3 className="text-xl font-bold text-slate-800 mb-6">
            {t("monthlyPerformance")}
          </h3>{" "}
          <div className="h-[350px] w-full">
            {" "}
            <ResponsiveContainer width="100%" height="100%">
              {" "}
              <AreaChart data={data}>
                {" "}
                <defs>
                  {" "}
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    {" "}
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />{" "}
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />{" "}
                  </linearGradient>{" "}
                </defs>{" "}
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />{" "}
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{
                fill: "#64748b",
                fontSize: 12
              }} dy={10} />{" "}
                <YAxis axisLine={false} tickLine={false} tick={{
                fill: "#64748b",
                fontSize: 12
              }} dx={-10} />{" "}
                <Tooltip contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
              }} />{" "}
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />{" "}
                <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} fillOpacity={0} />{" "}
              </AreaChart>{" "}
            </ResponsiveContainer>{" "}
          </div>{" "}
        </div>{" "}
        {/* Pie Chart & Top Categories */}{" "}
        <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-100">
          {" "}
          <h3 className="text-xl font-bold text-slate-800 mb-6">
            {t("salesByCategory")}
          </h3>{" "}
          <div className="flex flex-col md:flex-row items-center h-[350px]">
            {" "}
            <div className="w-full h-full">
              {" "}
              <ResponsiveContainer width="100%" height="100%">
                {" "}
                <PieChart>
                  {" "}
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                    {" "}
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}{" "}
                  </Pie>{" "}
                  <Tooltip />{" "}
                </PieChart>{" "}
              </ResponsiveContainer>{" "}
            </div>{" "}
            <div className="w-full space-y-4">
              {" "}
              {pieData.map((d, i) => <div key={i} className="flex justify-between items-center text-sm">
                  {" "}
                  <div className="flex items-center gap-2">
                    {" "}
                    <div className="w-3 h-3 rounded-full" style={{
                  backgroundColor: COLORS[i % COLORS.length]
                }} />{" "}
                    <span className="text-slate-600 font-medium line-clamp-1">
                      {d.name}
                    </span>{" "}
                  </div>{" "}
                  <span className="font-bold text-slate-900">
                    {d.value.toLocaleString()} ج.م
                  </span>{" "}
                </div>)}{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}