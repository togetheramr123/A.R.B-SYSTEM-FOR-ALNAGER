"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, DollarSign, Percent } from "lucide-react";
interface TaxReportProps {
  data: {
    outputTax: number;
    inputTax: number;
    netTax: number;
    details: any[];
  };
  from: string;
  to: string;
}
export function TaxReport({
  data,
  from,
  to
}: TaxReportProps) {
  return <div className="space-y-6">
      {" "}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {" "}
        <Card className="bg-blue-50/30 border-blue-100">
          {" "}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {" "}
            <CardTitle className="text-sm font-medium text-blue-800">
              ضريبة المخرجات (المبيعات)
            </CardTitle>{" "}
            <ArrowUp className="h-4 w-4 text-blue-600" />{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className="text-2xl font-bold text-blue-900">
              {data.outputTax.toFixed(2)}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className="bg-orange-50/30 border-orange-100">
          {" "}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {" "}
            <CardTitle className="text-sm font-medium text-orange-800">
              ضريبة المدخلات (المشتريات)
            </CardTitle>{" "}
            <ArrowDown className="h-4 w-4 text-orange-600" />{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className="text-2xl font-bold text-orange-900">
              {data.inputTax.toFixed(2)}
            </div>{" "}
          </CardContent>{" "}
        </Card>{" "}
        <Card className={`border-2 ${data.netTax >= 0 ? "bg-green-50/30 border-green-100" : "bg-red-50/30 border-red-100"}`}>
          {" "}
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            {" "}
            <CardTitle className="text-sm font-medium">
              صافي الضريبة المستحقة
            </CardTitle>{" "}
            <DollarSign className="h-4 w-4" />{" "}
          </CardHeader>{" "}
          <CardContent>
            {" "}
            <div className={`text-2xl font-bold ${data.netTax >= 0 ? "text-green-900" : "text-red-900"}`}>
              {" "}
              {data.netTax.toFixed(2)}{" "}
            </div>{" "}
            <p className="text-xs text-muted-foreground mt-1">
              {" "}
              {data.netTax >= 0 ? "مستحقة للهيئة" : "ضريبة قابلة للاسترداد"}{" "}
            </p>{" "}
          </CardContent>{" "}
        </Card>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm border shadow-sm overflow-hidden">
        {" "}
        <div className="p-6 border-b bg-gray-50/50">
          {" "}
          <h3 className="text-lg font-semibold">تفاصيل حسب الحساب</h3>{" "}
        </div>{" "}
        <Table>
          {" "}
          <TableHeader>
            {" "}
            <TableRow>
              {" "}
              <TableHead>كود الحساب</TableHead>{" "}
              <TableHead>اسم الحساب</TableHead> <TableHead>النوع</TableHead>{" "}
              <TableHead className="text-right">المبلغ</TableHead>{" "}
            </TableRow>{" "}
          </TableHeader>{" "}
          <TableBody>
            {" "}
            {data.details.map((detail, idx) => <TableRow key={idx}>
                {" "}
                <TableCell className="font-mono text-xs">
                  {detail.code}
                </TableCell>{" "}
                <TableCell className="font-medium">{detail.name}</TableCell>{" "}
                <TableCell className="capitalize text-xs">
                  ضريبة {detail.type === "output" ? "مخرجات" : "مدخلات"}
                </TableCell>{" "}
                <TableCell className={`text-right font-bold ${detail.amount >= 0 ? "text-blue-900" : "text-orange-900"}`}>
                  {" "}
                  {Math.abs(detail.amount).toFixed(2)}{" "}
                </TableCell>{" "}
              </TableRow>)}{" "}
          </TableBody>{" "}
        </Table>{" "}
      </div>{" "}
    </div>;
}