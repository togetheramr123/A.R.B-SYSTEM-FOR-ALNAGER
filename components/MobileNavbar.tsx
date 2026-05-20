"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, ShoppingCart, Boxes, Menu, FileText, Users, Users2, Headset, Settings, LogOut, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function MobileNavbar({ locale, userProfile }: { locale: string; userProfile?: any }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = useTranslations("Sidebar");

  const navItems = [
    {
      href: `/${locale}/dashboard`,
      label: t("dashboard") || "الرئيسية",
      icon: LayoutDashboard,
    },
    {
      href: `/${locale}/sales`,
      label: t("sales") || "المبيعات",
      icon: Store,
    },
    {
      href: `/${locale}/purchases`,
      label: t("purchases") || "المشتريات",
      icon: ShoppingCart,
    },
    {
      href: `/${locale}/inventory`,
      label: t("inventory") || "المخازن",
      icon: Boxes,
    },
  ];

  const moreItems = [
    {
      href: `/${locale}/accounting`,
      label: t("accounting") || "الحسابات",
      icon: FileText,
    },
    {
      href: `/${locale}/hr`,
      label: t("hr") || "الموارد البشرية",
      icon: Users,
    },
    {
      href: `/${locale}/contacts`,
      label: t("contacts") || "جهات الاتصال",
      icon: Users2,
    },
    {
      href: `/${locale}/crm/tickets`,
      label: t("crm") || "التذاكر / CRM",
      icon: Headset,
    },
    {
      href: `/${locale}/settings`,
      label: "الإعدادات",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 h-[56px] bg-white border-t border-slate-200 flex items-center justify-around z-40 md:hidden px-2 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
        {navItems.map((item, idx) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive ? "text-[#017E84]" : "text-slate-500"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </Link>
          );
        })}
        
        {/* More Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 text-slate-500 hover:text-[#017E84]"
          )}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold">المزيد</span>
        </button>
      </nav>

      {/* Drawer / Sheet Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Content */}
          <div className="relative w-72 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200" dir="rtl">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#017E84]/10 flex items-center justify-center overflow-hidden border border-[#017E84]/20">
                  {userProfile?.image ? (
                    <img src={userProfile.image} alt={userProfile?.name || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-[#017E84]" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">{userProfile?.name || 'مستخدم النظام'}</span>
                  <span className="text-[10px] text-slate-500">{userProfile?.email || ''}</span>
                </div>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">القوائم الإضافية</span>
              {moreItems.map((item, idx) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-sm font-medium",
                      isActive 
                        ? "bg-[#017E84]/10 text-[#017E84] font-bold" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => {
                  window.location.href = '/api/auth/logout';
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 font-medium text-sm transition-colors text-right"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
