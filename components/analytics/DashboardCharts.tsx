"use client";

import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
interface ChartProps {
  data: any[];
  type: "area" | "bar" | "pie";
  dataKey?: string;
  xKey?: string;
  height?: number;
  color?: string;
  gradientId?: string;
}
export function DashboardChart({
  data,
  type,
  dataKey = "value",
  xKey = "name",
  height = 250,
  color = "#3b82f6",
  gradientId = "colorGrad"
}: ChartProps) {
  if (type === "area") {
    return <ResponsiveContainer width="100%" height={height}>
        {" "}
        <AreaChart data={data} margin={{
        top: 10,
        right: 10,
        left: 0,
        bottom: 0
      }}>
          {" "}
          <defs>
            {" "}
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              {" "}
              <stop offset="5%" stopColor={color} stopOpacity={0.15} />{" "}
              <stop offset="95%" stopColor={color} stopOpacity={0} />{" "}
            </linearGradient>{" "}
          </defs>{" "}
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />{" "}
          <XAxis dataKey={xKey} tick={{
          fontSize: 11,
          fill: "#9ca3af"
        }} axisLine={false} tickLine={false} />{" "}
          <YAxis tick={{
          fontSize: 11,
          fill: "#9ca3af"
        }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />{" "}
          <Tooltip contentStyle={{
          backgroundColor: "#1f2937",
          border: "none",
          borderRadius: "12px",
          color: "#fff",
          fontSize: "12px",
          fontWeight: "bold",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }} formatter={(value: any) => [Number(value).toLocaleString("en-US") + " ج.م", ""]} />{" "}
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} />{" "}
        </AreaChart>{" "}
      </ResponsiveContainer>;
  }
  if (type === "bar") {
    return <ResponsiveContainer width="100%" height={height}>
        {" "}
        <BarChart data={data} margin={{
        top: 10,
        right: 10,
        left: 0,
        bottom: 0
      }}>
          {" "}
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />{" "}
          <XAxis dataKey={xKey} tick={{
          fontSize: 11,
          fill: "#9ca3af"
        }} axisLine={false} tickLine={false} />{" "}
          <YAxis tick={{
          fontSize: 11,
          fill: "#9ca3af"
        }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />{" "}
          <Tooltip contentStyle={{
          backgroundColor: "#1f2937",
          border: "none",
          borderRadius: "12px",
          color: "#fff",
          fontSize: "12px",
          fontWeight: "bold",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
        }} formatter={(value: any) => [Number(value).toLocaleString("en-US") + " ج.م", ""]} />{" "}
          <Bar dataKey="sales" fill="#3b82f6" radius={[6, 6, 0, 0]} name="مبيعات" />{" "}
          <Bar dataKey="purchases" fill="#f59e0b" radius={[6, 6, 0, 0]} name="مشتريات" />{" "}
        </BarChart>{" "}
      </ResponsiveContainer>;
  }
  if (type === "pie") {
    return <ResponsiveContainer width="100%" height={height}>
        {" "}
        <PieChart>
          {" "}
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey={dataKey} nameKey={xKey} paddingAngle={3} strokeWidth={0}>
            {" "}
            {data.map((_: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}{" "}
          </Pie>{" "}
          <Tooltip contentStyle={{
          backgroundColor: "#1f2937",
          border: "none",
          borderRadius: "12px",
          color: "#fff",
          fontSize: "12px",
          fontWeight: "bold"
        }} formatter={(value: any) => [Number(value).toLocaleString("en-US") + " ج.م", ""]} />{" "}
        </PieChart>{" "}
      </ResponsiveContainer>;
  }
  return null;
}