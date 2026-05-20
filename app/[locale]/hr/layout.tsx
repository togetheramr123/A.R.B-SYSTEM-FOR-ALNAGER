import React from "react";
import { HRHeader } from "@/components/hr/HRHeader";
export default async function HRLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await params;
  return <>
      {" "}
      <HRHeader locale={locale} /> {children}{" "}
    </>;
}