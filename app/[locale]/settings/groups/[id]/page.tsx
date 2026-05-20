"use client";

import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Save, AlertCircle, Plus, ShoppingCart, Package, Calculator, Users, FileText, Wallet, BarChart3, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { getGroupWithAccessRights, saveGroup } from "@/app/actions/settings";
import { useRouter, useParams } from "next/navigation";

// Module permission definitions - organized by business area
const MODULE_SECTIONS = [
  {
    id: "sales",
    title: "المبيعات",
    icon: ShoppingCart,
    color: "sky",
    permissions: [
      { key: "sales_view", label: "رؤية قائمة أوامر البيع", desc: "الاطلاع على جميع أوامر البيع المسجلة" },
      { key: "sales_create", label: "إنشاء أمر بيع جديد", desc: "إضافة أوامر بيع جديدة للعملاء" },
      { key: "sales_edit", label: "تعديل أمر البيع", desc: "تعديل الكميات والأسعار والخصومات" },
      { key: "sales_delete", label: "حذف أمر البيع", desc: "حذف أوامر البيع المسودة" },
      { key: "sales_confirm", label: "تأكيد أمر البيع", desc: "تحويل المسودة إلى أمر مؤكد" },
      { key: "sales_cancel", label: "إلغاء أمر البيع", desc: "إلغاء أوامر البيع المؤكدة" },
      { key: "sales_view_cost", label: "رؤية التكلفة وهامش الربح", desc: "عرض سعر التكلفة والمارجن في أوامر البيع" },
      { key: "sales_change_price", label: "تعديل أسعار البيع", desc: "السماح بتغيير سعر الوحدة يدوياً" },
      { key: "sales_give_discount", label: "منح خصم", desc: "السماح بإضافة خصم على سطور البيع" },
      { key: "sales_print", label: "طباعة عرض السعر / الفاتورة", desc: "طباعة أو تحميل PDF للأوامر" },
    ]
  },
  {
    id: "customers",
    title: "العملاء",
    icon: Users,
    color: "indigo",
    permissions: [
      { key: "cust_view", label: "رؤية قائمة العملاء", desc: "الاطلاع على بيانات العملاء" },
      { key: "cust_create", label: "إنشاء عميل جديد", desc: "إضافة عميل جديد للنظام" },
      { key: "cust_edit", label: "تعديل بيانات العميل", desc: "تعديل الاسم والهاتف والعنوان" },
      { key: "cust_commercial", label: "التعامل مع العملاء التجاريين (آجل)", desc: "الوصول لعملاء الحساب التجاري" },
      { key: "cust_cash", label: "التعامل مع العملاء النقديين (كاش)", desc: "الوصول لعملاء الدفع الفوري" },
      { key: "cust_view_balance", label: "رؤية رصيد العميل", desc: "عرض المبالغ المستحقة والمدفوعة" },
      { key: "cust_view_ledger", label: "رؤية كشف حساب العميل", desc: "الدخول على الأستاذ المساعد للعميل" },
    ]
  },
  {
    id: "purchases",
    title: "المشتريات",
    icon: Package,
    color: "amber",
    permissions: [
      { key: "purch_view", label: "رؤية قائمة أوامر الشراء", desc: "الاطلاع على جميع أوامر الشراء" },
      { key: "purch_create", label: "إنشاء أمر شراء جديد", desc: "إضافة أوامر شراء جديدة" },
      { key: "purch_edit", label: "تعديل أمر الشراء", desc: "تعديل الكميات والأسعار" },
      { key: "purch_confirm", label: "تأكيد أمر الشراء", desc: "تحويل المسودة إلى أمر مؤكد" },
      { key: "purch_delete", label: "حذف أمر الشراء", desc: "حذف أوامر الشراء المسودة" },
      { key: "purch_view_cost", label: "رؤية تكلفة الشراء", desc: "عرض أسعار التكلفة من الموردين" },
    ]
  },
  {
    id: "inventory",
    title: "المخزون",
    icon: Package,
    color: "emerald",
    permissions: [
      { key: "inv_view", label: "رؤية المنتجات والمخزون", desc: "عرض قائمة المنتجات والكميات المتوفرة" },
      { key: "inv_create_product", label: "إنشاء منتج جديد", desc: "إضافة أصناف جديدة للمخزون" },
      { key: "inv_edit_product", label: "تعديل بيانات المنتج", desc: "تعديل الأسعار والوصف والصور" },
      { key: "inv_view_picking", label: "رؤية حركات المخزون", desc: "الاطلاع على عمليات الاستلام والتسليم" },
      { key: "inv_validate_picking", label: "تصديق حركة المخزون", desc: "تأكيد استلام أو تسليم البضاعة" },
      { key: "inv_adjust", label: "جرد / تعديل المخزون", desc: "إجراء جرد يدوي وتعديل الكميات" },
      { key: "inv_negative", label: "السماح بصرف بالسالب", desc: "البيع حتى لو الكمية المتوفرة صفر" },
      { key: "inv_view_cost", label: "رؤية تكلفة المنتج", desc: "عرض سعر التكلفة في شاشة المنتج" },
      { key: "inv_scrap", label: "إنشاء إتلاف", desc: "إتلاف كميات تالفة من المخزون" },
    ]
  },
  {
    id: "accounting",
    title: "المحاسبة",
    icon: Calculator,
    color: "violet",
    permissions: [
      { key: "acc_view_invoices", label: "رؤية الفواتير", desc: "الاطلاع على فواتير العملاء والموردين" },
      { key: "acc_create_invoice", label: "إنشاء فاتورة", desc: "إنشاء فاتورة يدوية" },
      { key: "acc_print_invoice", label: "طباعة الفاتورة", desc: "طباعة أو تحميل PDF للفاتورة" },
      { key: "acc_cancel_invoice", label: "إلغاء فاتورة", desc: "إلغاء فاتورة مسجلة" },
      { key: "acc_view_journal", label: "رؤية القيود اليومية", desc: "الاطلاع على دفتر اليومية" },
      { key: "acc_create_journal", label: "إنشاء قيد يدوي", desc: "تسجيل قيد يومي يدوياً" },
      { key: "acc_view_reports", label: "رؤية التقارير المالية", desc: "ميزان المراجعة وكشف الحسابات" },
    ]
  },
  {
    id: "payments",
    title: "المدفوعات والسندات",
    icon: Wallet,
    color: "teal",
    permissions: [
      { key: "pay_receipt_from_invoice", label: "سند قبض من الفاتورة", desc: "تحصيل مبلغ مرتبط بفاتورة محددة" },
      { key: "pay_payment_from_invoice", label: "سند صرف من الفاتورة", desc: "دفع مبلغ مرتبط بفاتورة مورد" },
      { key: "pay_free_receipt", label: "سند قبض حر (بدون فاتورة)", desc: "تحصيل مبلغ غير مرتبط بفاتورة" },
      { key: "pay_free_payment", label: "سند صرف حر (بدون فاتورة)", desc: "صرف مبلغ غير مرتبط بفاتورة" },
      { key: "pay_access_treasury", label: "الدخول على الخزينة", desc: "رؤية دفاتر الصندوق والبنك" },
      { key: "pay_view_cheques", label: "رؤية الشيكات", desc: "الاطلاع على سجل الشيكات" },
      { key: "pay_manage_cheques", label: "إدارة الشيكات", desc: "تسجيل وتحصيل وإلغاء الشيكات" },
    ]
  },
  {
    id: "hr",
    title: "الموارد البشرية",
    icon: Users,
    color: "rose",
    permissions: [
      { key: "hr_view_employees", label: "رؤية الموظفين", desc: "الاطلاع على قائمة الموظفين" },
      { key: "hr_manage_contracts", label: "إدارة العقود", desc: "إنشاء وتعديل عقود الموظفين" },
      { key: "hr_view_payslips", label: "رؤية كشوف الرواتب", desc: "الاطلاع على رواتب الموظفين" },
      { key: "hr_manage_payslips", label: "إصدار كشوف الرواتب", desc: "إنشاء وتسجيل مسيرات الرواتب" },
    ]
  },
  {
    id: "reports",
    title: "التقارير والإحصائيات",
    icon: BarChart3,
    color: "orange",
    permissions: [
      { key: "rep_sales", label: "تقارير المبيعات", desc: "رؤية إحصائيات وتحليلات المبيعات" },
      { key: "rep_purchases", label: "تقارير المشتريات", desc: "رؤية إحصائيات المشتريات" },
      { key: "rep_inventory", label: "تقارير المخزون", desc: "رؤية تقارير حركة المخزون والجرد" },
      { key: "rep_financial", label: "التقارير المالية", desc: "ميزان المراجعة وقائمة الدخل" },
      { key: "rep_partner_ledger", label: "كشف حساب الشركاء", desc: "الأستاذ المساعد للعملاء والموردين" },
    ]
  },
  {
    id: "system",
    title: "النظام والإعدادات",
    icon: Shield,
    color: "slate",
    permissions: [
      { key: "sys_manage_users", label: "إدارة المستخدمين", desc: "إنشاء وتعديل حسابات المستخدمين" },
      { key: "sys_manage_roles", label: "إدارة الأدوار والصلاحيات", desc: "تعديل صلاحيات الأدوار" },
      { key: "sys_settings", label: "الإعدادات العامة", desc: "تعديل إعدادات الشركة والنظام" },
      { key: "sys_beta", label: "الوصول للنسخة التجريبية", desc: "رؤية الميزات الجديدة قيد التطوير" },
    ]
  },
];

export default function GroupDetailsPage() {
  const t = useTranslations("Settings");
  const routeParams = useParams();
  const pageId = routeParams.id as string;
  const [group, setGroup] = useState<any>(null);
  const [accessRights, setAccessRights] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string>("");
  const isNew = pageId === "new";
  const router = useRouter();

  useEffect(() => {
    const loadGroup = async () => {
      if (isNew) {
        setGroup({
          name: "",
          category: "عام"
        });
        // Initialize all permissions to false for new groups
        const initial: Record<string, boolean> = {};
        MODULE_SECTIONS.forEach(s => s.permissions.forEach(p => initial[p.key] = false));
        setPermissions(initial);
        // Expand all sections by default for new
        const expanded: Record<string, boolean> = {};
        MODULE_SECTIONS.forEach(s => expanded[s.id] = true);
        setExpandedSections(expanded);
        setLoading(false);
        return;
      }
      try {
        const data = await getGroupWithAccessRights(pageId);
        if (data) {
          setGroup({
            id: data.id,
            name: data.name,
            category: data.category,
          });
          setAccessRights(data.accessRights || []);
          
          // Load stored permissions from JSON field
          const stored: Record<string, boolean> = {};
          const saved = (data as any).parsedPermissions || {};
          MODULE_SECTIONS.forEach(s => s.permissions.forEach(p => {
            stored[p.key] = saved[p.key] ?? false;
          }));
          setPermissions(stored);
          
          // Expand sections that have at least one enabled permission
          const expanded: Record<string, boolean> = {};
          MODULE_SECTIONS.forEach(section => {
            const hasAny = section.permissions.some(p => stored[p.key]);
            expanded[section.id] = hasAny;
          });
          setExpandedSections(expanded);

          // Save snapshot for dirty tracking
          setSavedSnapshot(JSON.stringify({ name: data.name, category: data.category, permissions: stored }));
        }
      } catch (error) {
        console.error("Failed to load group", error);
      } finally {
        setLoading(false);
      }
    };
    loadGroup();
  }, [pageId, isNew]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const groupId = isNew ? "new" : pageId;
      console.log("[handleSave] Saving group with ID:", groupId, "name:", group?.name);
      const result = await saveGroup({
        id: groupId,
        name: group.name,
        category: group.category,
        permissions: permissions,
        canPrintInvoices: permissions.acc_print_invoice,
        canChangePrices: permissions.sales_change_price,
        canAllowNegativeInventory: permissions.inv_negative,
        canAccessBeta: permissions.sys_beta,
        accessRights: accessRights
      });
      console.log("[handleSave] Result:", result);
      if (result.success) {
        if (isNew) {
          router.push(`/settings/groups/${result.group?.id}`);
        } else {
          toast.success("تم حفظ الصلاحيات بنجاح");
          // Update snapshot so isDirty becomes false
          setSavedSnapshot(JSON.stringify({ name: group.name, category: group.category, permissions }));
          setIsDirty(false);
        }
      } else {
        toast.error(result.error || "فشل حفظ التغييرات");
      }
    } catch (error: any) {
      console.error("Save failed", error);
      toast.error("حدث خطأ: " + (error?.message || "غير معروف"));
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
    setIsDirty(true);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const toggleAllInSection = (sectionId: string, value: boolean) => {
    const section = MODULE_SECTIONS.find(s => s.id === sectionId);
    if (!section) return;
    const updated = { ...permissions };
    section.permissions.forEach(p => updated[p.key] = value);
    setPermissions(updated);
    setIsDirty(true);
  };

  const getSectionCount = (sectionId: string) => {
    const section = MODULE_SECTIONS.find(s => s.id === sectionId);
    if (!section) return { enabled: 0, total: 0 };
    const enabled = section.permissions.filter(p => permissions[p.key]).length;
    return { enabled, total: section.permissions.length };
  };

  if (loading) return <div className="p-8 text-center text-slate-500">
        جاري تحميل تفاصيل الدور...
      </div>;
  
  return <div className="p-4">
      {" "}
      <TopPortal>
        {" "}
        {(isDirty || isNew) && <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button onClick={() => { window.location.reload(); }} className="text-slate-600 hover:bg-slate-100 rounded-sm px-3 py-1 text-xs font-medium transition-colors">
            تراجع
          </button>
        </div>}{" "}
      </TopPortal>{" "}
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {" "}
        <div className="bg-white border border-slate-300 shadow-sm rounded-sm p-8 sm:p-12">
          {" "}
          {/* Header */}
          <div className="mb-8 border-b pb-6">
            {" "}
            <h1 className="text-2xl font-bold text-slate-800 mb-6">
              {" "}
              {isNew ? "إنشاء دور جديد" : "تعديل الدور والصلاحيات"}{" "}
            </h1>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              {" "}
              <div className="space-y-4">
                {" "}
                <div className="grid grid-cols-[100px_1fr] items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    اسم الدور
                  </label>{" "}
                  <input type="text" value={group?.name} onChange={e => { setGroup({
                  ...group,
                  name: e.target.value
                }); setIsDirty(true); }} className="w-full border-b border-slate-300 focus:border-sky-600 outline-none py-1.5 text-slate-900 font-medium bg-transparent transition-colors" placeholder="مثال: مندوب مبيعات" />{" "}
                </div>{" "}
                <div className="grid grid-cols-[100px_1fr] items-center">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    الفئة
                  </label>{" "}
                  <select value={group?.category} onChange={e => { setGroup({
                  ...group,
                  category: e.target.value
                }); setIsDirty(true); }} className="w-full border-b border-slate-300 focus:border-sky-600 outline-none py-1.5 text-sm text-slate-900 bg-transparent transition-colors appearance-none">
                      {" "}
                      <option value="عام">عام</option>{" "}
                      <option value="المخزون">المخزون</option>{" "}
                      <option value="المبيعات">المبيعات</option>{" "}
                      <option value="المشتريات">المشتريات</option>{" "}
                      <option value="المحاسبة">المحاسبة</option>{" "}
                      <option value="الموارد البشرية">الموارد البشرية</option>{" "}
                    </select>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}

          {/* Permission Sections - Odoo Style */}
          <div className="space-y-0 border border-slate-300 rounded-sm overflow-hidden">
            {MODULE_SECTIONS.map((section, idx) => {
              const { enabled, total } = getSectionCount(section.id);
              const isExpanded = expandedSections[section.id];
              const Icon = section.icon;
              const allEnabled = enabled === total;

              return (
                <div key={section.id} className={idx > 0 ? "border-t border-slate-300" : ""}>
                  {/* Section Header */}
                  <div 
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    <div className="flex items-center gap-2.5">
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      <Icon className="w-4 h-4 text-slate-500" />
                      <h3 className="font-semibold text-sm text-slate-800">{section.title}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${enabled > 0 ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {enabled} / {total}
                      </span>
                    </div>
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllInSection(section.id, !allEnabled);
                        }}
                        className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
                      >
                        {allEnabled ? "إلغاء الكل" : "تفعيل الكل"}
                      </button>
                    )}
                  </div>


                  {/* Section Body */}
                  {isExpanded && (
                    <div className="divide-y divide-slate-200 bg-white">
                      {section.permissions.map(perm => (
                        <label
                          key={perm.key}
                          className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={permissions[perm.key] || false}
                            onChange={() => togglePermission(perm.key)}
                            className="w-4 h-4 rounded cursor-pointer accent-slate-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800">{perm.label}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{perm.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="mt-4 px-4 py-3 bg-slate-50 rounded-sm border border-slate-200 text-xs text-slate-500">
            {Object.values(permissions).filter(Boolean).length} صلاحية مفعّلة من أصل {Object.keys(permissions).length}
          </div>

        </div>{" "}
      </div>{" "}
    </div>;
}