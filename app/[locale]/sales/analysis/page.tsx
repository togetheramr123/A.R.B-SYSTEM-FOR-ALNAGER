import { getServerPivotData } from "@/app/actions/reports";
import { PivotTable } from "@/components/common/PivotTable";
import { BarChart3, TrendingUp, Calendar as CalendarIcon, Filter } from "lucide-react";
import Link from "next/link";
export default async function SalesAnalysisPage() {
  /* We send initially the default cube */const data = await getServerPivotData(["salesperson", "month"], "subtotal");
  const availableFields = [{
    key: "salesperson",
    label: "المندوب"
  }, {
    key: "customer",
    label: "العميل"
  }, {
    key: "product",
    label: "المنتج"
  }, {
    key: "category",
    label: "فئة المنتج"
  }, {
    key: "month",
    label: "الشهر"
  }, {
    key: "year",
    label: "السنة"
  }, {
    key: "status",
    label: "الحالة"
  }, /* Measures */{
    key: "subtotal",
    label: "الإجمالي (غير شامل الضريبة)"
  }, {
    key: "qty",
    label: "الكمية"
  }, {
    key: "discount",
    label: "الخصم"
  }, {
    key: "priceUnit",
    label: "السعر"
  }];
  return <div className="p-4" dir="rtl">
      {" "}
      <div className="space-y-6">
        {" "}
        {/* Header Section */}{" "}
        <div className="flex justify-between items-end mb-4">
          {" "}
          <div>
            {" "}
            <h1 className="text-2xl sm:text-3xl font-normal text-slate-900 flex items-center gap-3">
              {" "}
              <BarChart3 className="w-8 h-8 text-indigo-600" />{" "}
              <span className="font-bold">تحليل المبيعات</span>{" "}
            </h1>{" "}
            <p className="text-slate-500 text-sm mt-1 mb-0">
              عرض متعدد الأبعاد للمبيعات حسب المندوبين، المنتجات، والعملاء.
            </p>{" "}
          </div>{" "}
        </div>{" "}
        {/* Pivot Engine Container */}{" "}
        <div className="h-[65vh] w-full">
          {" "}
          <PivotTable initialData={data} availableFields={availableFields} defaultRowFields={["salesperson"]} defaultColFields={["month"]} measureField="subtotal" />{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}