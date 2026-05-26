"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import NextTopLoader from 'nextjs-toploader';
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/CommandPalette";
import { LiveClock } from "@/components/LiveClock";
import { NavigationTracker } from "@/components/NavigationTracker";
import { MobileNavbar } from "@/components/MobileNavbar";
import { NarrowSidebar } from "@/components/NarrowSidebar";
import { OdooBreadcrumbs as Breadcrumbs } from "@/components/ui/OdooBreadcrumbs";
import FloatingNotes from '@/components/common/FloatingNotes';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';

export function AppLayout({
  children,
  locale,
  notifications,
  userProfile,
  userRole
}: {
  children: React.ReactNode;
  locale: string;
  notifications: any[];
  userProfile?: any;
  userRole: string;
}) {
  const pathname = usePathname();
  const tCommon = useTranslations('Common');
  const isDemoMode = process.env.NEXT_PUBLIC_IS_DEMO === 'true';

  // Normalize path to check if it's the login or splash page
  const pathnameWithoutLocale = pathname ? pathname.replace(/^\/(ar|en)/, '') : '';
  const isPublicOrSplash = pathnameWithoutLocale === '' || pathnameWithoutLocale === '/' || pathnameWithoutLocale === '/login' || pathnameWithoutLocale.startsWith('/login');
  const isPrintPage = pathnameWithoutLocale.endsWith('/print');

  if (isPublicOrSplash || isPrintPage) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col relative print:bg-white">
        {!isPrintPage && <NextTopLoader color="#4f46e5" showSpinner={false} height={3} shadow="0 0 10px #4f46e5,0 0 5px #4f46e5" />}
        <main className="flex-1 flex flex-col relative w-full print:p-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f0f2f5] pb-[56px] md:pb-0">
      <NextTopLoader color="#4f46e5" showSpinner={false} height={3} shadow="0 0 10px #4f46e5,0 0 5px #4f46e5" />
      <NavigationTracker locale={locale} />
      <CommandPalette />
      <NarrowSidebar locale={locale} userProfile={userProfile} userRole={userRole} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out relative">
        {isDemoMode && (
          <div className="bg-red-600 text-white text-center py-1.5 text-xs font-bold font-arabic z-50 sticky top-0 flex items-center justify-center gap-2 shadow-md shrink-0 h-8">
            <span>⚠️ تنبيه: أنت تعمل الآن على النسخة التجريبية (Demo) - للتدريب والتجربة فقط.</span>
            <span className="hidden sm:inline">|</span>
            <a href="https://a-r-b-system-for-alnager.onrender.com" className="underline hover:text-red-100 flex items-center gap-1 font-bold">
              العودة للنسخة الأصلية الحقيقية (Live) ↩
            </a>
          </div>
        )}
        <header className={cn(
          "bg-white border-b border-gray-200 h-[48px] sticky z-30 px-4 flex items-center justify-between shadow-sm shrink-0",
          isDemoMode ? "top-8" : "top-0"
        )}>
          <div className="flex items-center h-full">
            <div className="w-8 h-8 mx-2 rounded shrink-0 bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </div>
            <div id="module-nav-portal" className="hidden lg:flex items-center h-full" />
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>
            <LiveClock />
            {userProfile?.id && <FloatingNotes />}
            {userProfile?.id && <FloatingChatWidget currentUserId={userProfile.id} />}
          </div>
        </header>
        <div className={cn(
          "bg-white border-b border-slate-300 min-h-[56px] sticky z-20 flex items-center justify-between px-4 sm:px-6 w-full shrink-0",
          isDemoMode ? "top-[80px]" : "top-[48px]"
        )}>
          <div className="flex items-center flex-1 gap-4">
            <Breadcrumbs locale={locale} />
            <div id="breadcrumb-actions-portal" className="flex items-center mr-4 gap-2 empty:hidden"></div>
          </div>
          <div id="top-actions-portal" className="flex items-center justify-end gap-2 shrink-0 empty:hidden"></div>
        </div>
        <main className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative w-full bg-slate-100">
          {children}
        </main>
      </div>
      <MobileNavbar locale={locale} userProfile={userProfile} userRole={userRole} />
    </div>
  );
}
