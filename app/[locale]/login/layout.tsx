import React from "react";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cn } from "@/lib/utils";
import { Toaster } from 'sonner';

export default async function LoginLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { children } = props;
  const { locale } = await props.params;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-50">
      {children}
    </div>
  );
}
