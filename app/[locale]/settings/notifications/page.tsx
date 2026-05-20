"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Bell, ArrowRight, Save, Mail, MessageSquare, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getNotificationRules, updateNotificationRule } from "@/app/actions/notification_engine";
import { getGroups } from "@/app/actions/settings"; // We will use this to get available groups
export default function NotificationsSettingsPage() {
  const locale = useLocale();
  const t = useTranslations("Settings");
  const [rules, setRules] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const loadData = async () => {
      const [fetchedRules, fetchedGroups] = await Promise.all([getNotificationRules(), getGroups()]);
      setRules(fetchedRules);
      setGroups(fetchedGroups);
      setLoading(false);
    };
    loadData();
  }, []);
  const handleToggle = (id: string, currentValue: boolean) => {
    setRules(rules.map(r => r.id === id ? {
      ...r,
      isActive: !currentValue
    } : r));
  };
  const handleTargetChange = (id: string, newType: string) => {
    setRules(rules.map(r => r.id === id ? {
      ...r,
      targetType: newType
    } : r));
  };
  const handleRoleChange = (id: string, roleId: string) => {
    setRules(rules.map(r => r.id === id ? {
      ...r,
      targetRoles: roleId
    } : r));
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all modified rules sequentially (in a real app, maybe a batch update)
      for (const rule of rules) {
        await updateNotificationRule(rule.id, {
          isActive: rule.isActive,
          targetType: rule.targetType,
          targetRoles: rule.targetRoles,
          targetUsers: rule.targetUsers
        });
      }
      toast.success("تم حفظ إعدادات الإشعارات بنجاح (Notification Settings Saved)");
    } catch (e) {
      toast.error("حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return <div className="p-8 text-center text-slate-500">
        جاري تحميل قواعد الإشعارات... (Loading...)
      </div>;
  }
  const emailRules = rules.filter(r => r.category === "email");
  const inAppRules = rules.filter(r => r.category === "in_app");
  const criticalRules = rules.filter(r => r.category === "critical");
  const renderRuleCard = (rule: any) => {
    return <div key={rule.id} className={`flex flex-col md:flex-row md:items-start gap-4 p-4 rounded-lg border ${rule.isCritical ? "bg-red-50 border-red-200" : "bg-white border-slate-200"} shadow-sm hover:border-sky-300 transition-colors`}>
        {" "}
        <div className="flex-1 flex items-start gap-3">
          {" "}
          <input type="checkbox" className={`mt-1 w-4 h-4 rounded border-slate-300 ${rule.isCritical ? "text-red-600 focus:ring-red-500 cursor-not-allowed" : "text-amber-500 focus:ring-amber-500 cursor-pointer"}`} checked={rule.isActive || rule.isCritical} onChange={() => !rule.isCritical && handleToggle(rule.id, rule.isActive)} disabled={rule.isCritical} />{" "}
          <div>
            {" "}
            <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              {" "}
              {rule.title}{" "}
              {rule.isCritical && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  إجباري (Critical)
                </span>}{" "}
            </div>{" "}
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              {rule.description}
            </div>{" "}
            <div className="text-[10px] text-slate-400 mt-2 font-mono">
              {rule.eventCode}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Target Configuration */}{" "}
        <div className="w-full md:w-64 flex flex-col gap-2 border-t md:border-t-0 md:border-r border-slate-100 pt-3 md:pt-0 md:pr-4">
          {" "}
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            الاستهداف (Targeting)
          </label>{" "}
          <select value={rule.targetType} onChange={e => handleTargetChange(rule.id, e.target.value)} className="w-full text-xs border border-slate-300 rounded p-1.5 outline-none focus:border-sky-500" disabled={rule.isCritical}>
            {" "}
            <option value="all_admins">كل المدراء (All Admins)</option>{" "}
            <option value="specific_roles">
              مجموعة معينة (Specific Group)
            </option>{" "}
            <option value="specific_users">
              مستخدمين محددين (Specific Users)
            </option>{" "}
            <option value="direct_manager">
              المدير المباشر (Direct Manager)
            </option>{" "}
          </select>{" "}
          {rule.targetType === "specific_roles" && <select value={rule.targetRoles || ""} onChange={e => handleRoleChange(rule.id, e.target.value)} className="w-full text-xs border border-sky-300 bg-sky-50 rounded p-1.5 outline-none focus:border-sky-500">
              {" "}
              <option value="">-- اختر المجموعة (Select Group) --</option>{" "}
              {groups.map(g => <option key={g.id} value={g.id}>
                  {g.name} ({g.category})
                </option>)}{" "}
            </select>}{" "}
          {rule.targetType === "specific_users" && <input type="text" placeholder="أدخل User IDs..." value={rule.targetUsers || ""} onChange={e => setRules(rules.map(r => r.id === rule.id ? {
          ...r,
          targetUsers: e.target.value
        } : r))} className="w-full text-xs border border-sky-300 bg-sky-50 rounded p-1.5 outline-none focus:border-sky-500" />}{" "}
        </div>{" "}
      </div>;
  };
  return <div className="p-4">
      {" "}
      <TopPortal>
        {" "}
        <div className="flex items-center gap-2">
          {" "}
          <button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-sm px-4 py-1.5 text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
            {" "}
            <Save className="w-4 h-4" />{" "}
            {saving ? "جاري الحفظ..." : "حفظ التعديلات (Save Rules)"}{" "}
          </button>{" "}
          <Link href={`/${locale}/settings`} className="text-slate-600 hover:bg-slate-100 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 border border-transparent hover:border-slate-200">
            {" "}
            <ArrowRight className="w-4 h-4" /> رجوع للإعدادات{" "}
          </Link>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {" "}
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
          {" "}
          <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row items-center gap-4 justify-between">
            {" "}
            <div className="flex items-center gap-4">
              {" "}
              <div className="w-12 h-12 bg-amber-100 rounded-sm flex items-center justify-center shadow-inner">
                {" "}
                <Bell className="w-6 h-6 text-amber-600" />{" "}
              </div>{" "}
              <div>
                {" "}
                <h1 className="text-xl font-bold text-slate-900">
                  إدارة الإشعارات المركزية (Notification Rules Engine)
                </h1>{" "}
                <p className="text-sm text-slate-500 mt-1">
                  تحديد من يستقبل الإشعارات الداخلية ورسائل البريد بشكل
                  ديناميكي.
                </p>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          <div className="p-6 space-y-10">
            {" "}
            {/* Section: Critical Alerts */}{" "}
            {criticalRules.length > 0 && <section className="space-y-4">
                {" "}
                <h2 className="text-lg font-bold text-red-700 flex items-center gap-2 border-b border-red-100 pb-2">
                  {" "}
                  <ShieldAlert className="w-5 h-5 text-red-500" /> إنذارات أمنية
                  حرجة (Critical System Alerts){" "}
                </h2>{" "}
                <div className="grid gap-4">
                  {" "}
                  {criticalRules.map(renderRuleCard)}{" "}
                </div>{" "}
              </section>}{" "}
            {/* Section: In-App Alerts */}{" "}
            {inAppRules.length > 0 && <section className="space-y-4">
                {" "}
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  {" "}
                  <MessageSquare className="w-5 h-5 text-slate-400" /> التنبيهات
                  الداخلية وإشعارات العمليات (In-App Workflow Alerts){" "}
                </h2>{" "}
                <div className="grid gap-4">
                  {" "}
                  {inAppRules.map(renderRuleCard)}{" "}
                </div>{" "}
              </section>}{" "}
            {/* Section: Email Alerts */}{" "}
            {emailRules.length > 0 && <section className="space-y-4">
                {" "}
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                  {" "}
                  <Mail className="w-5 h-5 text-slate-400" /> إشعارات البريد
                  الإلكتروني (Email Notifications){" "}
                </h2>{" "}
                <div className="grid gap-4">
                  {" "}
                  {emailRules.map(renderRuleCard)}{" "}
                </div>{" "}
              </section>}{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}