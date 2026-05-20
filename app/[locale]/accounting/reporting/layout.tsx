import React from "react";
import { getSession } from "@/lib/auth";
import { checkAccess } from "@/lib/access";
import { redirect } from "next/navigation";
export default async function ReportingLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}) {
  const session = await getSession();
  const {
    locale
  } = await params;
  if (!session) {
    redirect(`/${locale}/login`);
  }
  /* We can assume reporting needs at least read access to account_move or journal */
  const hasAccess = await checkAccess("account_move", "read");
  if (!hasAccess && session.role !== "ADMIN") {
    /* Redirect to unauthorized or a safe page */redirect(`/${locale}/accounting?error=unauthorized`);
  }
  return <div className="reporting-wrapper"> {children} </div>;
}