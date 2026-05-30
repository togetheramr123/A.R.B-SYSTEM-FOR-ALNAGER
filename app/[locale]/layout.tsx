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

import { getNotifications } from "@/app/actions/notifications";
import { Toaster } from 'sonner';
import AIChatbot from '@/components/common/AIChatbot';
import FloatingNotes from '@/components/common/FloatingNotes';
import FloatingChatWidget from '@/components/chat/FloatingChatWidget';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NotificationBlocker } from '@/components/layout/NotificationBlocker';
import { ArabicNumeralsConverter } from '@/components/ArabicNumeralsConverter';
import { AutocompleteBlocker } from '@/components/AutocompleteBlocker';
import { ShiftTimerProvider } from '@/components/ShiftTimerProvider';

export const metadata: Metadata = {
  title: "سيستم ايه ار بى 2026",
  description: "Advanced ERP System 2026"
};
import { AppLayout } from "@/components/layout/AppLayout";

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
  const userRole = session?.role || 'USER';
  let userProfile = null;
  if (session?.userId) {
    userProfile = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, image: true }
    });
  }
  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("bg-gray-50/80 text-gray-900 font-sans antialiased", locale === 'ar' ? 'font-arabic' : 'font-sans')}>
        <NextIntlClientProvider messages={messages}>
          <NotificationBlocker />
          <Toaster position="top-center" theme="light" duration={2500} dir={locale === 'ar' ? 'rtl' : 'ltr'} toastOptions={{
            className: cn(locale === 'ar' ? 'font-arabic' : 'font-sans', '!bg-slate-100 !border !border-slate-200 !text-slate-600 !text-xs !py-2 !px-3 !min-h-0 !w-auto !max-w-fit !mx-auto !shadow-sm')
          }} />
          <AppLayout locale={locale} notifications={notifications} userProfile={userProfile} userRole={userRole}>
            <ShiftTimerProvider role={session?.role}>
              <ArabicNumeralsConverter />
              <AutocompleteBlocker />
              {children}
              <AIChatbot />
            </ShiftTimerProvider>
          </AppLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}