"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Store, Boxes, FileText, Users, Settings, Users2, BookOpen, Headset, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { NotificationBell } from "@/components/layout/NotificationBell";
export function NarrowSidebar({
  locale,
  userProfile
}: {
  locale: string;
  userProfile?: { id: string, name: string | null, email: string | null, image: string | null } | null;
}) {
  const pathname = usePathname();
  const t = useTranslations("Sidebar"); // assuming we have this
  const mainModules = [{
    href: `/${locale}/dashboard`,
    label: t("dashboard") || "اللوحة الرئيسية",
    icon: LayoutDashboard,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }, {
    href: `/${locale}/sales`,
    label: t("sales") || "المبيعات",
    icon: Store,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }, {
    href: `/${locale}/purchases`,
    label: t("purchases") || "المشتريات",
    icon: ShoppingCart,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }, {
    href: `/${locale}/inventory`,
    label: t("inventory") || "المخازن",
    icon: Boxes,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }, {
    href: `/${locale}/accounting`,
    label: t("accounting") || "الحسابات",
    icon: FileText,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }, {
    href: `/${locale}/hr`,
    label: t("hr") || "الموارد البشرية",
    icon: Users,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }, {
    href: `/${locale}/contacts`,
    label: t("contacts") || "جهات الاتصال",
    icon: Users2,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }, {
    href: `/${locale}/crm/tickets`,
    label: t("crm") || "التذاكر / CRM",
    icon: Headset,
    color: "text-[#017E84]",
    activeBg: "bg-[#017E84]/10",
    hover: "hover:bg-slate-50 hover:text-slate-800"
  }];
  return <aside className="hidden md:flex w-[68px] bg-white h-screen flex-col border-l border-gray-200/80 z-50 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] sticky top-0">
      {" "}
      {/* Logo area */}{" "}
      <div className="h-[48px] flex items-center justify-center border-b border-gray-100 shrink-0">
        {" "}
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shadow-sm">
          {" "}
          <span className="text-white font-bold text-xs">26</span>{" "}
        </div>{" "}
      </div>{" "}
      {/* Notifications (Outside scrollable area to prevent clipping) */}{" "}
      <div className="py-2 flex justify-center shrink-0 border-b border-gray-50 z-50">
        {" "}
        <NotificationBell />{" "}
      </div>{" "}
      {/* Apps List */}{" "}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col items-center gap-4 custom-scrollbar" style={{
      scrollbarWidth: "none"
    }}>
        {" "}
        {mainModules.map((mod, idx) => {
        const isActive = pathname.startsWith(mod.href);
        const Icon = mod.icon;
        return <Link key={idx} href={mod.href} onClick={() => useBreadcrumbStore.getState().reset()} className="relative group flex justify-center">
              {" "}
              <div className={cn("w-11 h-11 rounded-sm flex items-center justify-center transition-all duration-200", isActive ? `${mod.activeBg} ${mod.color} shadow-sm ring-1 ring-black/5` : `text-slate-500 bg-transparent ${mod.hover}`)}>
                {" "}
                <Icon className={cn("w-5 h-5 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} strokeWidth={isActive ? 2.5 : 2} />{" "}
              </div>{" "}
              {/* Tooltip */}{" "}
              <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                {" "}
                {mod.label}{" "}
                <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800" />{" "}
              </div>{" "}
            </Link>;
      })}{" "}
      </div>{" "}
      {/* Bottom Section (Catalogs + Settings) */}{" "}
      <div className="py-4 border-t border-gray-100 flex flex-col items-center gap-4 shrink-0">
        {" "}
        {/* Catalogs */}{" "}
        <Link href={`/${locale}/catalogs`} className="relative group flex justify-center">
          {" "}
          <div className={cn("w-11 h-11 rounded-sm flex items-center justify-center transition-all duration-200", pathname.includes("/catalogs") ? "bg-teal-50 text-teal-600 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:bg-teal-50 hover:text-teal-600")}>
            {" "}
            <BookOpen className={cn("w-5 h-5", pathname.includes("/catalogs") ? "scale-110" : "group-hover:scale-110 transition-transform duration-200")} strokeWidth={pathname.includes("/catalogs") ? 2.5 : 2} />{" "}
          </div>{" "}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {" "}
            الكتالوجات{" "}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800" />{" "}
          </div>{" "}
        </Link>{" "}
        <Link href={`/${locale}/settings`} className="relative group flex justify-center">
          {" "}
          <div className={cn("w-11 h-11 rounded-sm flex items-center justify-center transition-all duration-200", pathname.includes("/settings") ? "bg-slate-100 text-slate-800 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800")}>
            {" "}
            <Settings className={cn("w-5 h-5", pathname.includes("/settings") ? "scale-110 animate-none" : "group-hover:rotate-90 transition-transform duration-300")} strokeWidth={pathname.includes("/settings") ? 2.5 : 2} />{" "}
          </div>{" "}
          {/* Tooltip */}{" "}
          <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-bold rounded shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {" "}
            الإعدادات{" "}
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 border-4 border-transparent border-l-slate-800" />{" "}
          </div>{" "}
        </Link>{" "}
        {/* Profile Dropdown */}
        <div className="relative group">
          <div className="w-9 h-9 rounded-full bg-[#017E84]/10 border-2 border-white ring-2 ring-indigo-50 shadow-sm cursor-pointer hover:ring-indigo-200 transition-all overflow-hidden flex items-center justify-center">
            {userProfile?.image ? (
              <img src={userProfile.image} alt={userProfile?.name || ''} className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-[#015e63]" />
            )}
          </div>
          
          <div className="absolute bottom-0 right-full mr-4 w-56 bg-white rounded-sm border border-slate-200 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] py-1">
            <div className="px-4 py-3 border-b border-slate-100 mb-1 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex shrink-0 items-center justify-center overflow-hidden border border-slate-200">
                {userProfile?.image ? (
                  <img src={userProfile.image} alt={userProfile?.name || ''} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || 'مستخدم النظام'}</span>
                <span className="text-xs text-slate-500 truncate">{userProfile?.email || 'حسابي'}</span>
              </div>
            </div>
            <Link href={`/${locale}/settings/users`} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <Settings className="w-4 h-4" /> إعدادات الحساب
            </Link>
            <div className="h-px bg-slate-100 my-1"></div>
            <button 
              onClick={() => {
                window.location.href = '/api/auth/logout';
              }} 
              className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-right"
            >
              <LogOut className="w-4 h-4" /> تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </aside>;
}