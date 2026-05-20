"use client";
import React from "react";

import { toast } from "sonner";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import { Check, Plus, Trash2, Printer, Download, CreditCard, ShieldCheck, Undo, FileText, Info, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { EditableDynamicTable, Column } from "@/components/common/EditableDynamicTable";
import Link from "next/link";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
export function VendorBillForm() {
  const t = useTranslations("Accounting"); // and Purchases
  const locale = useLocale(); // Default to 'posted' to match USER request, normally would start as 'draft'
  const [status, setStatus] = useState("posted");
  const {
    register,
    control,
    handleSubmit,
    watch
  } = useForm({
    defaultValues: {
      vendor: "شركة النور",
      billReference: "INV/2026/001",
      autoComplete: "",
      billDate: "",
      accountingDate: "",
      paymentReference: "P01043",
      recipientBank: "",
      dueDate: "",
      journal: "فواتير الموردين",
      lines: [{
        type: "product",
        productId: "",
        label: "جوان مطاط (2)",
        assetCategory: "",
        account: "101000",
        qty: 10,
        uom: "Unit",
        price: 150,
        taxes: true
      }]
    }
  });
  const {
    fields,
    append,
    remove
  } = useFieldArray({
    control,
    name: "lines"
  });
  const lines = watch("lines");
  const untaxedAmount = lines.reduce((acc: number, line: any) => acc + (line.qty || 0) * (line.price || 0), 0);
  const taxes = lines.reduce((acc: number, line: any) => acc + (line.taxes ? (line.qty || 0) * (line.price || 0) * 0.14 : 0), 0);
  const total = untaxedAmount + taxes;
  const postBill = () => {
    setStatus("posted");
    toast.success("تم ترحيل فاتورة المورد!");
  };
  const registerPayment = () => {
    setStatus("paid");
    toast.success("تم تسجيل الدفعة بنجاح.", {
      duration: 10000
    });
  };
  const resetToDraft = () => {
    setStatus("draft");
  };
  const columns: Column[] = [{
    id: "product",
    label: "المنتج",
    required: true,
    minWidth: "200px",
    renderCell: (field, index, register) => <div className="flex flex-col gap-1">
          {" "}
          <input {...register(`lines.${index}.label`)} // Just use label for now to simulate the "rubber gasket"
      className="w-full p-1 font-bold bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm" placeholder="اختر منتج..." />{" "}
          <input type="hidden" {...register(`lines.${index}.type`)} />{" "}
        </div>
  }, {
    id: "label",
    label: "بطاقة عنوان",
    minWidth: "150px",
    renderCell: (field, index, register) => <input {...register(`lines.${index}.label`)} className="w-full p-1 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm" placeholder="وصف..." />
  }, {
    id: "asset",
    label: "فئة الأصول",
    defaultVisible: false,
    minWidth: "120px",
    renderCell: (field, index, register) => <input {...register(`lines.${index}.assetCategory`)} className="w-full p-1 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm" />
  }, {
    id: "account",
    label: "حساب",
    required: true,
    minWidth: "120px",
    renderCell: (field, index, register) => <input {...register(`lines.${index}.account`)} className="w-full p-1 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm font-mono text-slate-600" />
  }, {
    id: "qty",
    label: "الكمية",
    width: "80px",
    renderCell: (field: any, index: number, register: any, control: any) => <input type="number" step="0.01" {...register(`lines.${index}.qty`, {
      valueAsNumber: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = convertArabicToEnglishNumbers(e.target.value);
        control?._setValue(`lines.${index}.qty`, val ? parseFloat(val) : 0, {
          shouldValidate: true,
          shouldDirty: true
        });
      }
    })} className="w-full p-1 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm text-center font-bold text-slate-700" />
  }, {
    id: "price",
    label: "السعر",
    width: "100px",
    renderCell: (field: any, index: number, register: any, control: any) => <input type="number" step="0.01" {...register(`lines.${index}.price`, {
      valueAsNumber: true,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = convertArabicToEnglishNumbers(e.target.value);
        control?._setValue(`lines.${index}.price`, val ? parseFloat(val) : 0, {
          shouldValidate: true,
          shouldDirty: true
        });
      }
    })} className="w-full p-1 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-sm text-center" />
  }, {
    id: "taxes",
    label: "الضرائب",
    width: "100px",
    renderCell: (field, index, register) => <div className="flex justify-center">
          {" "}
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            {" "}
            <input type="checkbox" {...register(`lines.${index}.taxes`)} className="rounded border-slate-300" />{" "}
            14%{" "}
          </label>{" "}
        </div>
  }, {
    id: "subtotal",
    label: "الإجمالي",
    width: "100px",
    renderCell: (field, index, register) => {
      const qty = watch(`lines.${index}.qty`) || 0;
      const price = watch(`lines.${index}.price`) || 0;
      return <div className="text-center font-bold text-slate-800">
            {" "}
            {(qty * price).toLocaleString()}{" "}
          </div>;
    }
  }];
  return <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      {" "}
      {/* Top Breadcrumb / Nav */}{" "}
      <div className="bg-white px-4 py-2 border-b border-slate-200 flex justify-between items-center text-sm">
        {" "}
        <div className="flex items-center gap-2 text-slate-500">
          {" "}
          <Link href={`/${locale}/purchases`} className="hover:text-indigo-700">
            طلبات عروض الأسعار
          </Link>{" "}
          <span>/</span>{" "}
          <Link href="#" className="hover:text-indigo-700">
            P01043 (الى / الصندوق / 0017)
          </Link>{" "}
          <span>/</span>{" "}
          <span className="text-slate-800 font-bold">
            BILL/2026/01/0006
          </span>{" "}
        </div>{" "}
        <div className="flex gap-2 text-slate-700">
          {" "}
          <button className="flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded">
            {" "}
            <Printer className="w-4 h-4" /> <span>طباعة</span>{" "}
          </button>{" "}
          <button className="flex items-center gap-1 hover:bg-slate-100 px-2 py-1 rounded">
            {" "}
            <span>إجراء</span>{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Action Bar (Sticky) */}{" "}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-20">
        {" "}
        <div className="flex gap-2">
          {" "}
          {/* Draft Actions */}{" "}
          {status === "draft" && <button onClick={postBill} className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
              {" "}
              <Check className="w-4 h-4" /> تأكيد{" "}
            </button>}{" "}
          {/* Posted Actions */}{" "}
          {status === "posted" && <>
              {" "}
              <button onClick={registerPayment} className="bg-[#008784] hover:bg-[#00706d] text-white px-4 py-1.5 rounded-sm text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
                {" "}
                تسجيل الدفع{" "}
              </button>{" "}
              <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors">
                {" "}
                إضافة إشعار دائن{" "}
              </button>{" "}
              <button onClick={resetToDraft} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors">
                {" "}
                إعادة التعيين كمسودة{" "}
              </button>{" "}
            </>}{" "}
        </div>{" "}
        {/* Status Ribbon (Pipeline) */}{" "}
        <div className="flex items-center bg-white border border-slate-300 rounded-sm">
          {" "}
          {["draft", "posted", "paid"].map((step, index, arr) => {
          const isActive = status === step; // Determine visual state // If status is 'posted', draft is completed (past), posted is active (current), paid is future
          let stateClass = "text-slate-500 bg-slate-50"; // default future
          if (isActive) stateClass = "bg-[#008784] text-white"; // Active // Simple logic for "past" items (if posted, draft is past)
          if (status === "posted" && step === "draft") stateClass = "text-[#008784] bg-white";
          if (status === "paid") stateClass = "text-[#008784] bg-white";
          if (status === "paid" && step === "paid") stateClass = "bg-[#008784] text-white";
          return <div key={step} className={` flex items-center h-8 px-4 text-sm font-medium border-l border-slate-300 last:border-l-0 ${stateClass} `}>
                {" "}
                {step === "draft" ? "مسودة" : step === "posted" ? "تم الترحيل" : "مدفوعة"}{" "}
              </div>;
        })}{" "}
        </div>{" "}
      </div>{" "}
      {/* Alert Banner for Outstanding Debits */}{" "}
      {status === "posted" && <div className="bg-[#e5f6f6] border-b border-[#008784]/20 px-6 py-3 flex items-start gap-3">
          {" "}
          <Info className="w-5 h-5 text-[#008784] mt-0.5" />{" "}
          <div className="space-y-1">
            {" "}
            <p className="text-[#005c5a] text-sm font-semibold">
              {" "}
              لديك الديون المستحقة لهذا المورد. يمكنك تخصيصهم لتحديد حالة هذه
              الفاتورة كمدفوعة.{" "}
            </p>{" "}
            <button className="text-[#008784] text-sm font-bold hover:underline">
              عرض
            </button>{" "}
          </div>{" "}
        </div>}{" "}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {" "}
        {/* Smart Buttons Area */}{" "}
        <div className="flex justify-end mb-4">
          {" "}
          <button className="flex flex-col items-center justify-center bg-white border border-slate-300 rounded-sm w-[130px] h-[60px] hover:bg-slate-50 relative">
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <ShoppingCart className="w-5 h-5 text-slate-600" />{" "}
              <span className="font-bold text-lg text-slate-800">1</span>{" "}
            </div>{" "}
            <span className="text-xs text-slate-600">المشتريات</span>{" "}
          </button>{" "}
        </div>{" "}
        {/* Paper Layout */}{" "}
        <div className="bg-white p-8 rounded shadow-sm border border-slate-300 min-h-[600px]">
          {" "}
          <div className="mb-8 flex justify-between">
            {" "}
            <div>
              {" "}
              <div className="text-sm font-bold text-slate-500 mb-1">
                فاتورة المورد
              </div>{" "}
              <h1 className="text-4xl font-bold text-slate-900">
                {" "}
                {status === "draft" ? "مسودة" : "BILL/2026/01/0006"}{" "}
              </h1>{" "}
            </div>{" "}
          </div>{" "}
          {/* Top Fields */}{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 mb-8 group-read-only">
            {" "}
            {/* Left Column */}{" "}
            <div className="space-y-4">
              {" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  المورد
                </label>{" "}
                <input {...register("vendor")} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 font-bold text-slate-800 bg-transparent" placeholder="مثال: شركة النور" />{" "}
              </div>{" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  الرقم المرجعي
                </label>{" "}
                <input {...register("billReference")} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent" />{" "}
              </div>{" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-[#017E84] flex items-center gap-1">
                  {" "}
                  الإكمال التلقائي{" "}
                  <span className="text-slate-400 font-normal text-xs">
                    (?)
                  </span>{" "}
                </label>{" "}
                <input {...register("autoComplete")} className="w-full border-b border-indigo-200 focus:border-[#017E84] outline-none py-1 text-sm placeholder-indigo-300 bg-transparent" placeholder="اختر أمر شراء..." />{" "}
              </div>{" "}
            </div>{" "}
            {/* Right Column */}{" "}
            <div className="space-y-4">
              {" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  تاريخ الفاتورة
                </label>{" "}
                <input type="date" {...register("billDate")} className={`w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent ${!watch("billDate") ? "text-transparent focus:text-inherit" : ""}`} />{" "}
              </div>{" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  تاريخ المحاسبة
                </label>{" "}
                <input type="date" {...register("accountingDate")} className={`w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent ${!watch("accountingDate") ? "text-transparent focus:text-inherit" : ""}`} />{" "}
              </div>{" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  الرقم المرجعي للدفعة
                </label>{" "}
                <input {...register("paymentReference")} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent" />{" "}
              </div>{" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  البنك المستلم
                </label>{" "}
                <input {...register("recipientBank")} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent" />{" "}
              </div>{" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  تاريخ الاستحقاق
                </label>{" "}
                <input type="date" {...register("dueDate")} className={`w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent ${!watch("dueDate") ? "text-transparent focus:text-inherit" : ""}`} />{" "}
              </div>{" "}
              <div className="grid grid-cols-[140px_1fr] items-center">
                {" "}
                <label className="text-sm font-bold text-slate-900">
                  دفتر اليومية
                </label>{" "}
                <input {...register("journal")} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent" />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Tabs */}{" "}
          <div className="border-b border-slate-200 mb-6">
            {" "}
            <div className="flex gap-8">
              {" "}
              <button className="py-2 text-sm font-bold text-slate-900 border-b-2 border-[#017E84]">
                بنود الفاتورة
              </button>{" "}
              <button className="py-2 text-sm font-bold text-slate-500 hover:text-slate-800">
                عناصر اليومية
              </button>{" "}
              <button className="py-2 text-sm font-bold text-slate-500 hover:text-slate-800">
                معلومات أخرى
              </button>{" "}
            </div>{" "}
          </div>{" "}
          {/* Table */}{" "}
          <div className="mb-8">
            {" "}
            <EditableDynamicTable tableId="vendor_bill_lines" columns={columns} fields={fields} register={register} control={control} onRemove={remove} onAdd={() => append({
            type: "product",
            productId: "",
            label: "",
            assetCategory: "",
            account: "",
            qty: 1,
            uom: "",
            price: 0,
            taxes: false
          })} onAddSection={() => append({
            type: "section",
            label: "قسم جديد",
            productId: "",
            assetCategory: "",
            account: "",
            qty: 0,
            uom: "",
            price: 0,
            taxes: false
          })} onAddNote={() => append({
            type: "note",
            label: "ملاحظة جديدة",
            productId: "",
            assetCategory: "",
            account: "",
            qty: 0,
            uom: "",
            price: 0,
            taxes: false
          })} readOnly={status !== "draft"} // Lock table
          if posted />{" "}
          </div>{" "}
          {/* Footer Totals */}{" "}
          <div className="flex justify-end">
            {" "}
            <div className="w-1/3 min-w-[300px] space-y-3 bg-slate-50 p-4 rounded border border-slate-200">
              {" "}
              <div className="flex justify-between items-center text-slate-800 text-sm">
                {" "}
                <span className="font-semibold">
                  المبلغ غير شامل الضريبة:
                </span>{" "}
                <span>
                  {untaxedAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                  ج.م
                </span>{" "}
              </div>{" "}
              <div className="flex justify-between items-center text-slate-800 text-sm">
                {" "}
                <span className="font-semibold">الضرائب:</span>{" "}
                <span>
                  {taxes.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                  ج.م
                </span>{" "}
              </div>{" "}
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 border-t border-slate-300 pt-2 mt-2">
                {" "}
                <span>الإجمالي:</span>{" "}
                <span>
                  {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                  ج.م
                </span>{" "}
              </div>{" "}
              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2 border-t border-slate-300">
                {" "}
                <span>المستحق:</span>{" "}
                <span>
                  {total.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}{" "}
                  ج.م
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}