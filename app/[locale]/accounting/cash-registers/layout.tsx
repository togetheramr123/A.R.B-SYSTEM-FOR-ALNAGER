import React from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CashRegistersLayout(props: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}) {
  const { children } = props;
  const { locale } = await props.params;

  const session = await getSession();
  
  if (session?.canAccessTreasury === false) {
    redirect(`/${locale}/accounting`);
  }

  return <>{children}</>;
}
