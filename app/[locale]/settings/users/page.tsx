"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { getUsers, deleteUser } from "@/app/actions/settings";
import { toast } from "sonner";

export default function UsersPage() {
  const t = useTranslations("Settings");
  const locale = useLocale();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (id: string, name: string, role: string) => {
    if (role === "ADMIN") {
      toast.error("لا يمكن حذف مدير النظام");
      return;
    }
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${name}"؟`)) return;
    setDeletingId(id);
    try {
      const result = await deleteUser(id);
      if (result.success) {
        toast.success(`تم حذف "${name}" بنجاح`);
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        toast.error(result.error || "فشل الحذف");
      }
    } catch {
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-4">
      <TopPortal>
        <Link href={`/${locale}/settings/users/new`} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> جديد
        </Link>
      </TopPortal>

      <div className="w-full max-w-6xl space-y-4">
        {/* Search */}
        <div className="flex items-center bg-white border border-slate-300 rounded-sm">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="البحث عن المستخدمين..." className="w-full pr-9 pl-4 py-2 text-sm outline-none bg-transparent" />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-sm border border-slate-300 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">جاري تحميل المستخدمين...</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-600">
                <tr>
                  <th className="px-4 py-2.5 text-right font-semibold">الاسم</th>
                  <th className="px-4 py-2.5 text-right font-semibold">الهاتف / الإيميل</th>
                  <th className="px-4 py-2.5 text-right font-semibold">الصلاحية</th>
                  <th className="px-4 py-2.5 text-right font-semibold">آخر تسجيل دخول</th>
                  <th className="px-4 py-2.5 text-right font-semibold w-32">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div dir="ltr" className="text-right text-xs">{user.phone || user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === "ADMIN" ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {user.role === "ADMIN" ? "مدير النظام" : "مستخدم"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {user.lastLogin || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/${locale}/settings/users/${user.id}`} className="text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1">
                          <Edit className="w-3.5 h-3.5" /> تعديل
                        </Link>
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => handleDelete(user.id, user.name, user.role)}
                            disabled={deletingId === user.id}
                            className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center gap-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deletingId === user.id ? "..." : "حذف"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                      لا يوجد مستخدمون.
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