"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { getGroups, deleteGroup } from "@/app/actions/settings";
import { toast } from "sonner";

export default function GroupsPage() {
  const t = useTranslations("Settings");
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGroups = async () => {
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error("Failed to load groups", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف الدور "${name}"؟\nسيتم حذف جميع الصلاحيات المرتبطة به.`)) return;
    setDeletingId(id);
    try {
      const result = await deleteGroup(id);
      if (result.success) {
        toast.success(`تم حذف الدور "${name}" بنجاح`);
        setGroups(prev => prev.filter(g => g.id !== id));
      } else {
        toast.error(result.error || "فشل حذف الدور");
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4">
      <TopPortal>
        <Link href="/settings/groups/new" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> جديد
        </Link>
      </TopPortal>

      <div className="w-full max-w-6xl space-y-4">
        {/* Search */}
        <div className="flex items-center bg-white border border-slate-300 rounded-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" placeholder="البحث في الأدوار..." className="w-full pr-9 pl-4 py-2 text-sm outline-none bg-transparent" />
          </div>
        </div>

        {/* Groups Table */}
        <div className="bg-white rounded-sm border border-slate-300 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">جاري تحميل الأدوار...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 text-right font-semibold">اسم الدور</th>
                  <th className="px-4 py-2.5 text-right font-semibold">الفئة</th>
                  <th className="px-4 py-2.5 text-right font-semibold">المستخدمون</th>
                  <th className="px-4 py-2.5 text-right font-semibold w-32">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {groups.map(group => (
                  <tr key={group.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-sm bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {group.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{group.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {group.category || "عام"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {group.userCount} مستخدم
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/settings/groups/${group.id}`} className="text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5" /> تعديل
                        </Link>
                        <button
                          onClick={() => handleDelete(group.id, group.name)}
                          disabled={deletingId === group.id}
                          className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingId === group.id ? "..." : "حذف"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                      لا توجد أدوار مسجلة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}