"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, Lock, CheckCircle2 } from "lucide-react";
import { createInventoryAdjustment } from "@/app/actions/inventory-adjustments";
import { toast } from "sonner";
export function AdjustmentsListClient({
  initialData,
  locale
}: {
  initialData: any[];
  locale: string;
}) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const record = await createInventoryAdjustment({});
      router.push(`/${locale}/inventory/adjustments/${record.id}`);
    } catch (e: any) {
      toast.error(e.message || "فشل إنشاء محضر جرد");
      setIsCreating(false);
    }
  };
  return <div className="space-y-6 text-right" dir="rtl">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <button onClick={handleCreate} disabled={isCreating} className="bg-[#017E84] text-white px-4 py-2 rounded-sm font-bold flex items-center gap-2 hover:bg-[#006A6F] transition-colors">
          {" "}
          <Plus className="w-5 h-5" />{" "}
          {isCreating ? "جاري الإنشاء..." : "إنشاء محضر جرد جديد"}{" "}
        </button>{" "}
      </div>{" "}
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden">
        {" "}
        <table className="w-full text-sm">
          {" "}
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            {" "}
            <tr>
              {" "}
              <th className="px-4 py-3 text-right font-bold">
                رقم المحضر (Reference)
              </th>{" "}
              <th className="px-4 py-3 text-right font-bold">التاريخ</th>{" "}
              <th className="px-4 py-3 text-right font-bold">المستودع</th>{" "}
              <th className="px-4 py-3 text-right font-bold">المسؤول</th>{" "}
              <th className="px-4 py-3 text-right font-bold">الحالة</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {initialData.length === 0 ? <tr>
                {" "}
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  لا توجد محاضر جرد حالياً.
                </td>{" "}
              </tr> : initialData.map(adj => <tr key={adj.id} onClick={() => router.push(`/${locale}/inventory/adjustments/${adj.id}`)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                  {" "}
                  <td className="px-4 py-3 font-medium text-[#017E84]">
                    {adj.name}
                  </td>{" "}
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(adj.date).toLocaleDateString("ar-EG")}
                  </td>{" "}
                  <td className="px-4 py-3 text-slate-600">
                    {adj.warehouse?.name || "كل المستودعات"}
                  </td>{" "}
                  <td className="px-4 py-3 text-slate-600">
                    {adj.user?.name || "غير محدد"}
                  </td>{" "}
                  <td className="px-4 py-3">
                    {" "}
                    {adj.status === "draft" && <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {" "}
                        <Clock className="w-3.5 h-3.5" /> مسودة{" "}
                      </span>}{" "}
                    {adj.status === "active" && <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {" "}
                        <CheckCircle2 className="w-3.5 h-3.5" /> معتمد (مهلة
                        التعديل){" "}
                      </span>}{" "}
                    {adj.status === "locked" && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {" "}
                        <Lock className="w-3.5 h-3.5" /> مقفل نهائياً{" "}
                      </span>}{" "}
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}