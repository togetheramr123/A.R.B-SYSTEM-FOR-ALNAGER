"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Briefcase, Landmark, PieChart } from "lucide-react";
interface CashFlowProps {
  data: {
    operating: number;
    investing: number;
    financing: number;
    netIncrease: number;
  };
  from: string;
  to: string;
}
export function CashFlowReport({
  data,
  from,
  to
}: CashFlowProps) {
  return <div className="space-y-8">
      {" "}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {" "}
        <Card>
          {" "}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {" "}
            <CardTitle className="text-xs font-bold uppercase text-gray-400">
              أنشطة تشغيلية
            </CardTitle>{" "}
            <Briefcase className="h-4 w-4 text-gray-400" />{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className={`text-2xl font-bold ${data.operating >= 0 ? "text-green-600" : "text-red-600"}`}>
              {" "}
              {data.operating.toFixed(2)}{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {" "}
            <CardTitle className="text-xs font-bold uppercase text-gray-400">
              أنشطة استثمارية
            </CardTitle>{" "}
            <PieChart className="h-4 w-4 text-gray-400" />{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className={`text-2xl font-bold ${data.investing >= 0 ? "text-green-600" : "text-red-600"}`}>
              {" "}
              {data.investing.toFixed(2)}{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card>
          {" "}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {" "}
            <CardTitle className="text-xs font-bold uppercase text-gray-400">
              أنشطة تمويلية
            </CardTitle>{" "}
            <Landmark className="h-4 w-4 text-gray-400" />{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className={`text-2xl font-bold ${data.financing >= 0 ? "text-green-600" : "text-red-600"}`}>
              {" "}
              {data.financing.toFixed(2)}{" "}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="bg-gray-900 text-white">
          {" "}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {" "}
            <CardTitle className="text-xs font-bold uppercase text-gray-400">
              صافي التغير
            </CardTitle>{" "}
            {data.netIncrease >= 0 ? <TrendingUp className="h-4 w-4 text-green-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className="text-2xl font-bold">
              {data.netIncrease.toFixed(2)}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm border shadow-sm p-8 space-y-6">
        {" "}
        <h3 className="text-xl font-bold border-b pb-4">
          قائمة التدفقات النقدية
        </h3>{" "}
        <div className="space-y-4">
          {" "}
          <SectionRow label="التدفقات النقدية من الأنشطة التشغيلية" value={data.operating} isHeader />{" "}
          <div className="pl-6 space-y-1 text-sm text-gray-500">
            {" "}
            <p>
              تشمل صافي الدخل المعدل بالبنود غير النقدية والتغيرات في رأس المال
              العامل.
            </p>{" "}
          </div>{" "}
          <SectionRow label="التدفقات النقدية من الأنشطة الاستثمارية" value={data.investing} isHeader />{" "}
          <div className="pl-6 space-y-1 text-sm text-gray-500">
            {" "}
            <p>شراء وبيع الأصول الثابتة والاستثمارات طويلة الأجل.</p>{" "}
          </div>{" "}
          <SectionRow label="التدفقات النقدية من الأنشطة التمويلية" value={data.financing} isHeader />{" "}
          <div className="pl-6 space-y-1 text-sm text-gray-500">
            {" "}
            <p>القروض، وسداد الديون، والمعاملات المتعلقة بحقوق الملكية.</p>{" "}
          </div>{" "}
          <div className="pt-6 border-t mt-6">
            {" "}
            <SectionRow label="صافي الزيادة (أو النقص) في النقدية" value={data.netIncrease} isTotal />{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}
function SectionRow({
  label,
  value,
  isHeader = false,
  isTotal = false
}: any) {
  return <div className={`flex justify-between items-center ${isHeader ? "font-bold" : ""} ${isTotal ? "text-lg font-bold" : ""}`}>
      {" "}
      <span>{label}</span>{" "}
      <span className={value < 0 ? "text-red-600" : ""}>
        {value.toFixed(2)}
      </span>{" "}
    </div>;
}