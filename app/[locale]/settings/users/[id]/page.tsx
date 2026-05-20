"use client";

import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import { Save, User, Camera } from "lucide-react";
import { getUser, getGroups, saveUser, getUsers } from "@/app/actions/settings";
import { useRouter, useParams } from "next/navigation";

export default function UserDetailsPage() {
  const t = useTranslations("Settings");
  const routeParams = useParams();
  const pageId = routeParams?.id as string;
  const [user, setUser] = useState<any>(null);
  const [availableGroups, setAvailableGroups] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const isNew = pageId === "new";
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const groups = await getGroups();
        setAvailableGroups(groups);
        const users = await getUsers();
        setAllUsers(users);
        if (isNew) {
          setUser({
            name: "", email: "", phone: "", whatsapp: "", image: "",
            managerId: "", password: "", role: "USER",
            enforceNotificationBlock: true, canSellFractions: false,
            canViewCost: true, allowedCustomerType: "ALL",
            canCreateFreeVouchers: true, canAccessTreasury: true
          });
          setSelectedGroupIds([]);
          setIsDirty(true);
          setLoading(false);
          return;
        }
        const data = await getUser(pageId);
        if (data) {
          setUser({
            id: data.id, name: data.name, email: data.email,
            phone: data.phone || "", whatsapp: data.whatsapp || "",
            image: data.image || "", managerId: data.managerId || "",
            role: data.role,
            enforceNotificationBlock: data.enforceNotificationBlock ?? true,
            canSellFractions: data.canSellFractions ?? false,
            canViewCost: data.canViewCost ?? true,
            allowedCustomerType: data.allowedCustomerType || "ALL",
            canCreateFreeVouchers: data.canCreateFreeVouchers ?? true,
            canAccessTreasury: data.canAccessTreasury ?? true
          });
          setSelectedGroupIds(data.groups.map((g: any) => g.id));
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [pageId, isNew]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        id: isNew ? "new" : user.id,
        name: user.name, email: user.email, phone: user.phone,
        whatsapp: user.whatsapp, image: user.image,
        managerId: user.managerId, password: user.password,
        role: user.role, enforceNotificationBlock: user.enforceNotificationBlock,
        canSellFractions: user.canSellFractions, canViewCost: user.canViewCost,
        allowedCustomerType: user.allowedCustomerType,
        canCreateFreeVouchers: user.canCreateFreeVouchers,
        canAccessTreasury: user.canAccessTreasury,
        groupIds: selectedGroupIds
      };
      const result = await saveUser(payload);
      if (result.success) {
        if (isNew) {
          router.push(`/settings/users/${result.user?.id}`);
        } else {
          toast.success("تم حفظ بيانات المستخدم بنجاح");
          setIsDirty(false);
        }
      } else {
        toast.error(result.error || "فشل حفظ التغييرات");
      }
    } catch (error) {
      console.error("Save failed", error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  };

  const markDirty = () => setIsDirty(true);

  const updateUser = (field: string, value: any) => {
    setUser((prev: any) => ({ ...prev, [field]: value }));
    markDirty();
  };

  const toggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
    markDirty();
  };

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">جاري تحميل بيانات المستخدم...</div>;

  return (
    <div className="p-4">
      <TopPortal>
        {(isDirty || isNew) && (
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={() => window.location.reload()} className="text-slate-600 hover:bg-slate-100 rounded-sm px-3 py-1 text-xs font-medium transition-colors">
              تراجع
            </button>
          </div>
        )}
      </TopPortal>

      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white border border-slate-300 rounded-sm">
          {/* Header Section */}
          <div className="flex items-start gap-5 p-6 border-b border-slate-200">
            {/* Avatar */}
            <div className="relative w-20 h-20 rounded-sm bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden shrink-0 group">
              {user?.image ? (
                <img src={user.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
              <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = ev => { updateUser("image", ev.target?.result as string); };
                    reader.readAsDataURL(file);
                  }
                }} />
              </label>
            </div>

            {/* Main Fields */}
            <div className="flex-1 space-y-3">
              {/* Name */}
              <div className="grid grid-cols-[100px_1fr] items-center">
                <label className="text-sm font-semibold text-slate-600 text-right pl-3">الاسم</label>
                <input type="text" value={user?.name || ""} onChange={e => updateUser("name", e.target.value)}
                  className="w-full border-b border-slate-300 focus:border-slate-600 outline-none py-1 text-base font-medium text-slate-900 bg-transparent transition-colors"
                  placeholder="مثال: أحمد محمود" />
              </div>
              {/* Password */}
              <div className="grid grid-cols-[100px_1fr] items-center">
                <label className="text-sm font-semibold text-slate-600 text-right pl-3">
                  كلمة المرور {isNew ? "" : "(اتركه فارغاً)"}
                </label>
                <input type="text" inputMode="numeric" value={user?.password || ""} onChange={e => {
                  const converted = e.target.value
                    .replace(/[٠-٩]/g, (d: string) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
                    .replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
                    .replace(/[^0-9]/g, '');
                  updateUser("password", converted);
                }}
                  className="w-full border-b border-slate-300 focus:border-slate-600 outline-none py-1 text-slate-800 bg-transparent transition-colors text-left tracking-[0.3em] font-mono"
                  placeholder={isNew ? "مثال: 1234" : "اتركه فارغاً"} dir="ltr" />
              </div>
              {/* Phone */}
              <div className="grid grid-cols-[100px_1fr] items-center">
                <label className="text-sm font-semibold text-slate-600 text-right pl-3">رقم الهاتف</label>
                <input type="text" value={user?.phone || ""} onChange={e => updateUser("phone", e.target.value)}
                  className="w-full border-b border-slate-300 focus:border-slate-600 outline-none py-1 text-slate-800 bg-transparent transition-colors text-left"
                  placeholder="05xxxxxxxxx" dir="ltr" />
              </div>
              {/* WhatsApp */}
              <div className="grid grid-cols-[100px_1fr] items-center">
                <label className="text-sm font-semibold text-slate-600 text-right pl-3">رقم الواتساب</label>
                <div className="flex items-center gap-2 w-full">
                  <input type="text" value={user?.whatsapp || ""} onChange={e => updateUser("whatsapp", e.target.value)}
                    className="w-full border-b border-slate-300 focus:border-slate-600 outline-none py-1 text-slate-800 bg-transparent transition-colors text-left"
                    placeholder="05xxxxxxxxx" dir="ltr" />
                  <button onClick={() => updateUser("whatsapp", user?.phone)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium whitespace-nowrap underline">
                    نسخ الهاتف
                  </button>
                </div>
              </div>
              {/* Manager */}
              <div className="grid grid-cols-[100px_1fr] items-center">
                <label className="text-sm font-semibold text-slate-600 text-right pl-3">المدير المباشر</label>
                <select value={user?.managerId || ""} onChange={e => updateUser("managerId", e.target.value)}
                  className="w-full border-b border-slate-300 focus:border-slate-600 outline-none py-1 text-slate-800 bg-transparent transition-colors appearance-none">
                  <option value="">-- بدون مدير --</option>
                  {allUsers.filter(u => u.id !== user?.id).map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              {/* Email */}
              <div className="grid grid-cols-[100px_1fr] items-center">
                <label className="text-sm font-semibold text-slate-600 text-right pl-3">الإيميل</label>
                <input type="email" value={user?.email || ""} onChange={e => updateUser("email", e.target.value)}
                  className="w-full border-b border-slate-300 focus:border-slate-600 outline-none py-1 text-slate-800 bg-transparent transition-colors text-left"
                  placeholder="user@company.com" dir="ltr" />
              </div>
            </div>
          </div>

          {/* Access Rights Section */}
          <div className="p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">صلاحيات الوصول والأدوار</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
              {/* Left Column - User Type & Custom Permissions */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">نوع المستخدم</div>
                <div className="border border-slate-200 rounded-sm overflow-hidden">
                  <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-200">
                    <input type="radio" name="role" value="USER" checked={user?.role === "USER"}
                      onChange={() => updateUser("role", "USER")} className="w-4 h-4 cursor-pointer accent-slate-800" />
                    <div>
                      <div className="font-medium text-sm text-slate-800">مستخدم داخلي</div>
                      <div className="text-xs text-slate-400">مستخدم عادي بصلاحيات محددة بناءً على المجموعات.</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <input type="radio" name="role" value="ADMIN" checked={user?.role === "ADMIN"}
                      onChange={() => updateUser("role", "ADMIN")} className="w-4 h-4 cursor-pointer accent-slate-800" />
                    <div>
                      <div className="font-medium text-sm text-slate-800">مدير النظام</div>
                      <div className="text-xs text-slate-400">صلاحيات كاملة. يتخطى قواعد المجموعات.</div>
                    </div>
                  </label>
                </div>

                {/* Custom permissions */}
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2">صلاحيات مخصصة</div>
                <div className="border border-slate-200 rounded-sm overflow-hidden divide-y divide-slate-200">
                  <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={user?.enforceNotificationBlock ?? true}
                      onChange={e => updateUser("enforceNotificationBlock", e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-slate-800" />
                    <div>
                      <div className="font-medium text-sm text-slate-800">الإيقاف الإجباري للإشعارات</div>
                      <div className="text-xs text-slate-400">إيقاف الحساب مؤقتاً عند تجاهل الإشعارات.</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={user?.canSellFractions ?? false}
                      onChange={e => updateUser("canSellFractions", e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-slate-800" />
                    <div>
                      <div className="font-medium text-sm text-slate-800">بيع الكسور العشرية</div>
                      <div className="text-xs text-slate-400">بيع كميات بكسور (مثل 0.5 متر).</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={user?.canViewCost ?? true}
                      onChange={e => updateUser("canViewCost", e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-slate-800" />
                    <div>
                      <div className="font-medium text-sm text-slate-800">رؤية التكلفة والأرباح</div>
                      <div className="text-xs text-slate-400">رؤية تكلفة المنتجات وهوامش الربح.</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={user?.canCreateFreeVouchers ?? true}
                      onChange={e => updateUser("canCreateFreeVouchers", e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-slate-800" />
                    <div>
                      <div className="font-medium text-sm text-slate-800">إنشاء سندات حرة</div>
                      <div className="text-xs text-slate-400">سندات قبض وصرف بدون ربطها بفاتورة.</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer px-3 py-2.5 hover:bg-slate-50 transition-colors">
                    <input type="checkbox" checked={user?.canAccessTreasury ?? true}
                      onChange={e => updateUser("canAccessTreasury", e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-slate-800" />
                    <div>
                      <div className="font-medium text-sm text-slate-800">دفتر الخزينة / البنك</div>
                      <div className="text-xs text-slate-400">رؤية أرصدة الخزينة والحركات المالية.</div>
                    </div>
                  </label>
                  <div className="px-3 py-2.5">
                    <div className="font-medium text-sm text-slate-800 mb-1">نوع العملاء المسموح</div>
                    <select value={user?.allowedCustomerType || "ALL"} onChange={e => updateUser("allowedCustomerType", e.target.value)}
                      className="border border-slate-300 rounded-sm px-2 py-1 text-xs bg-white w-full max-w-xs">
                      <option value="ALL">جميع العملاء</option>
                      <option value="CASH">نقدي فقط</option>
                      <option value="COMMERCIAL">تجاري فقط</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Group Assignments */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">صلاحيات التطبيقات</div>
                {availableGroups.length === 0 ? (
                  <div className="text-sm text-slate-400 p-3 border border-slate-200 rounded-sm">
                    لا توجد أدوار محددة بعد.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-sm overflow-hidden max-h-[500px] overflow-y-auto">
                    {Object.entries(
                      availableGroups.reduce((acc: any, group: any) => {
                        const cat = group.category || "عام";
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(group);
                        return acc;
                      }, {})
                    ).map(([category, groups]: any) => (
                      <div key={category}>
                        <div className="bg-slate-100 px-3 py-2 font-semibold text-xs text-slate-600 border-b border-slate-200 sticky top-0">
                          {category}
                        </div>
                        <div className="divide-y divide-slate-100">
                          {groups.map((group: any) => (
                            <label key={group.id} className="flex items-center gap-3 cursor-pointer px-3 py-2 hover:bg-slate-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedGroupIds.includes(group.id)}
                                onChange={() => toggleGroup(group.id)}
                                className="w-4 h-4 cursor-pointer rounded accent-slate-800"
                              />
                              <span className="text-sm text-slate-700 font-medium">{group.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}