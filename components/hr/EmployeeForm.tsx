"use client";

import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createEmployee, getAllDepartments } from "@/app/actions/hr";
import { User, Briefcase, Building2, Mail, Phone, Banknote, ArrowRight, CloudUpload, RotateCcw } from "lucide-react";
import Link from "next/link";
import { serializeDecimal } from "@/lib/serialize";
export function EmployeeForm({
  locale,
  departments
}: {
  locale: string;
  departments: any[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    jobTitle: "",
    email: "",
    phone: "",
    departmentId: "",
    wage: ""
  });
  const updateField = (field: string, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const onSubmit = async () => {
    if (!form.name) return;
    setLoading(true);
    try {
      await createEmployee(form);
      router.push(`/${locale}/hr/employees`);
      router.refresh();
    } catch (e) {
      toast.error("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };
  return <div className="p-6 space-y-6 pb-20">
      {" "}
      {/* Breadcrumb */}{" "}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {" "}
        <Link href={`/${locale}/hr/employees`} className="hover:text-[#017E84] transition-colors font-medium">
          الموظفين
        </Link>{" "}
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />{" "}
        <span className="font-bold text-gray-900">موظف جديد</span>{" "}
      </div>{" "}
      {/* Form Card */}{" "}
      <div className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden w-full">
        {" "}
        {/* Header */}{" "}
        <div className="h-24 bg-[#714B67] relative">
          {" "}
          <div className="absolute -bottom-6 right-8">
            {" "}
            <div className="w-14 h-14 bg-white rounded-sm shadow-sm flex items-center justify-center border-2 border-white">
              {" "}
              <User className="w-7 h-7 text-indigo-400" />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="p-8 pt-12 space-y-6">
          {" "}
          <h1 className="text-xl font-bold text-gray-900">
            إضافة موظف جديد
          </h1>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {" "}
            <div className="md:col-span-2">
              {" "}
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {" "}
                <User className="w-3.5 h-3.5" /> الاسم الكامل *{" "}
              </label>{" "}
              <input value={form.name} onChange={e => updateField("name", e.target.value)} placeholder="ادخل اسم الموظف..." className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all" autoFocus />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {" "}
                <Briefcase className="w-3.5 h-3.5" /> المسمى الوظيفي{" "}
              </label>{" "}
              <input value={form.jobTitle} onChange={e => updateField("jobTitle", e.target.value)} placeholder="مثال: محاسب" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all" />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {" "}
                <Building2 className="w-3.5 h-3.5" /> القسم{" "}
              </label>{" "}
              <select value={form.departmentId} onChange={e => updateField("departmentId", e.target.value)} className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all bg-white">
                {" "}
                <option value="">بدون قسم</option>{" "}
                {departments.map((dept: any) => <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>)}{" "}
              </select>{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {" "}
                <Mail className="w-3.5 h-3.5" /> البريد الإلكتروني{" "}
              </label>{" "}
              <input type="email" value={form.email} onChange={e => updateField("email", e.target.value)} placeholder="example@company.com" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all" dir="ltr" />{" "}
            </div>{" "}
            <div>
              {" "}
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {" "}
                <Phone className="w-3.5 h-3.5" /> رقم الهاتف{" "}
              </label>{" "}
              <input type="tel" value={form.phone} onChange={e => updateField("phone", e.target.value)} placeholder="01xxxxxxxxx" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all" dir="ltr" />{" "}
            </div>{" "}
            <div className="md:col-span-2">
              {" "}
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                {" "}
                <Banknote className="w-3.5 h-3.5" /> الراتب الشهري (ينشئ عقد
                تلقائياً){" "}
              </label>{" "}
              <div className="relative">
                {" "}
                <input type="number" value={form.wage} onChange={e => updateField("wage", e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-sm px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all pl-16" dir="ltr" />{" "}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  EGP
                </span>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {form.name && <div className="pt-4 border-t border-gray-100 flex gap-2 items-center">
              {" "}
              <button onClick={onSubmit} disabled={loading || !form.name} title="حفظ" className="p-1.5 text-slate-400 hover:text-[#017E84] rounded-sm hover:bg-[#017E84]/10 transition-colors disabled:opacity-50">
                {" "}
                <CloudUpload className="w-5 h-5" />{" "}
              </button>{" "}
              <Link href={`/${locale}/hr/employees`} title="تجاهل / عودة" className="p-1.5 text-slate-400 hover:text-red-600 rounded-sm hover:bg-red-50 transition-colors">
                {" "}
                <RotateCcw className="w-5 h-5" />{" "}
              </Link>{" "}
            </div>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}