"use client";

import { toast } from "sonner";
import { useState } from "react";
import { createDepartment } from "@/app/actions/hr";
import { Building2, Plus, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
export default function DepartmentsPageClient({
  departments,
  locale
}: {
  departments: any[];
  locale: string;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await createDepartment({
        name: name.trim()
      });
      setName("");
      setShowForm(false);
      router.refresh();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setLoading(false);
    }
  };
  const colors = [" ", " ", " ", " ", " ", " "];
  return <div className="p-6 space-y-6 pb-20">
      {" "}
      {/* Page Header */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-gray-900">الأقسام</h1>{" "}
          <p className="text-sm text-gray-500 mt-1">
            {departments.length} قسم
          </p>{" "}
        </div>{" "}
        <button onClick={() => setShowForm(true)} className="bg-gray-800 text-white px-5 py-2.5 rounded-sm text-sm font-bold hover:bg-gray-900 transition-all flex items-center gap-2 shadow-sm">
          {" "}
          <Plus className="w-4 h-4" /> قسم جديد{" "}
        </button>{" "}
      </div>{" "}
      {/* Inline Create Form */}{" "}
      {showForm && <div className="bg-white rounded-sm border border-gray-200 shadow-md p-6 animate-in fade-in duration-200">
          {" "}
          <div className="flex items-center justify-between mb-4">
            {" "}
            <h3 className="font-bold text-gray-900">إضافة قسم جديد</h3>{" "}
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              {" "}
              <X className="w-5 h-5" />{" "}
            </button>{" "}
          </div>{" "}
          <div className="flex gap-3">
            {" "}
            <input value={name} onChange={e => setName(e.target.value)} placeholder="اسم القسم..." className="flex-1 border border-gray-200 rounded-sm px-4 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none transition-all" onKeyDown={e => e.key === "Enter" && handleCreate()} autoFocus />{" "}
            <button onClick={handleCreate} disabled={loading || !name.trim()} className="bg-[#017E84] text-white px-6 py-2.5 rounded-sm text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all">
              {" "}
              {loading ? "جاري الحفظ..." : "حفظ"}{" "}
            </button>{" "}
          </div>{" "}
        </div>}{" "}
      {/* Departments Grid */}{" "}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {" "}
        {departments.map((dept: any, idx: number) => {
        const colorClass = colors[idx % colors.length];
        const count = dept._count?.employees || dept.employees?.length || 0;
        return <div key={dept.id} className="bg-white rounded-sm border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
              {" "}
              <div className={cn("h-3 bg-gradient-to-r", colorClass)} />{" "}
              <div className="p-6">
                {" "}
                <div className="flex items-center gap-3 mb-4">
                  {" "}
                  <div className="p-3 bg-gray-50 rounded-sm">
                    {" "}
                    <Building2 className="w-5 h-5 text-gray-600" />{" "}
                  </div>{" "}
                  <h3 className="text-base font-bold text-gray-900">
                    {dept.name}
                  </h3>{" "}
                </div>{" "}
                <div className="flex items-center gap-2 text-gray-500">
                  {" "}
                  <Users className="w-4 h-4" />{" "}
                  <span className="text-sm font-medium">{count} موظف</span>{" "}
                </div>{" "}
              </div>{" "}
            </div>;
      })}{" "}
        {departments.length === 0 && <div className="col-span-full text-center py-16">
            {" "}
            <div className="w-16 h-16 bg-gray-100 rounded-sm mx-auto mb-4 flex items-center justify-center">
              {" "}
              <Building2 className="w-8 h-8 text-gray-300" />{" "}
            </div>{" "}
            <h3 className="text-lg font-bold text-gray-700 mb-1">
              لا توجد أقسام
            </h3>{" "}
            <p className="text-sm text-gray-400 mb-4">أضف أول قسم للبدء</p>{" "}
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 rounded-sm text-sm font-bold hover:bg-gray-900 transition-all">
              {" "}
              <Plus className="w-4 h-4" /> إضافة قسم{" "}
            </button>{" "}
          </div>}{" "}
      </div>{" "}
    </div>;
}