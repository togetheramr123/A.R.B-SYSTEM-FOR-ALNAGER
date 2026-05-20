import React from "react";
import AccountingHeader from "@/components/accounting/AccountingHeader";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function AccountingLayout(props: {
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
  /* Security: Only ADMIN users can access the accounting module */
  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login`);
  }
  if (session.role !== "ADMIN") {
    redirect(`/${locale}/dashboard?error=unauthorized_accounting`);
  }
  return <>
      {" "}
      <AccountingHeader locale={locale} canAccessTreasury={session.canAccessTreasury ?? true} /> {children}{" "}
    </>;
}