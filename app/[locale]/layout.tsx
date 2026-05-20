import React from "react";
import type { Metadata } from "next";
import "../globals.css";
import "@/styles/odoo-form.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cn } from "@/lib/utils";
import { NarrowSidebar } from "@/components/NarrowSidebar";
import { OdooBreadcrumbs as Breadcrumbs } from "@/components/ui/OdooBreadcrumbs";
import { useTranslations } from 'next-intl';
import { Cairo, Inter } from "next/font/google";
import { getNotifications } from "@/app/actions/notifications";
import { Toaster } from 'sonner';
import AIChatbot from '@/components/common/AIChatbot';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationBlocker } from '@/components/layout/NotificationBlocker';
import { ArabicNumeralsConverter } from '@/components/ArabicNumeralsConverter';
import { ShiftTimerProvider } from '@/components/ShiftTimerProvider';
const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo"
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});
export const metadata: Metadata = {
  title: "سيستم ايه ار بى 2026",
  description: "Advanced ERP System 2026"
};
export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    children
  } = props;
  const {
    locale
  } = await props.params;
  const messages = await getMessages();
  let notifications: any[] = [];
  {
    notifications = await getNotifications();
  }
  const session = await getSession();
  let userProfile = null;
  if (session?.userId) {
    userProfile = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, image: true }
    });
  }
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <body className={cn("bg-gray-50/80 text-gray-900 font-sans antialiased", locale === 'ar' ? 'font-arabic' : 'font-sans')}>
        <NextIntlClientProvider messages={messages}>
          <NotificationBlocker />
          <Toaster position="top-center" theme="light" duration={2500} dir={locale === 'ar' ? 'rtl' : 'ltr'} toastOptions={{
            className: cn(locale === 'ar' ? 'font-arabic' : 'font-sans', '!bg-slate-100 !border !border-slate-200 !text-slate-600 !text-xs !py-2 !px-3 !min-h-0 !w-auto !max-w-fit !mx-auto !shadow-sm')
          }} />
          <LayoutContent locale={locale} notifications={notifications} userProfile={userProfile}>
            <ShiftTimerProvider role={session?.role}>
              <ArabicNumeralsConverter />
              {children}
              <AIChatbot />
              {session?.userId && <FloatingChatWidget currentUserId={session.userId} />}
            </ShiftTimerProvider>
          </LayoutContent>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import { CommandPalette } from "@/components/CommandPalette";
import { LiveClock } from "@/components/LiveClock";
import { NavigationTracker } from "@/components/NavigationTracker"; // Separate component to use hooks

import NextTopLoader from 'nextjs-toploader';

function LayoutContent({
  children,
  locale,
  notifications,
  userProfile
}: {
  children: React.ReactNode;
  locale: string;
  notifications: any[];
  userProfile?: any;
}) {
  const tCommon = useTranslations('Common');
  return (
    <div className="min-h-screen flex bg-[#f0f2f5]">
      <NextTopLoader color="#4f46e5" showSpinner={false} height={3} shadow="0 0 10px #4f46e5,0 0 5px #4f46e5" />
      <NavigationTracker locale={locale} />
      <CommandPalette />
      <NarrowSidebar locale={locale} userProfile={userProfile} />
      <div className="flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out relative">
        <header className="bg-white border-b border-gray-200 h-[48px] sticky top-0 z-30 px-4 flex items-center justify-between shadow-sm shrink-0">
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
          </div>
        </header>
        <div className="bg-white border-b border-slate-300 min-h-[56px] sticky top-[48px] z-20 flex items-center justify-between px-4 sm:px-6 w-full shrink-0">
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
    </div>
  );
}