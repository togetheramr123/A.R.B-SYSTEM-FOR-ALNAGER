import React from "react";
import { PurchasesHeader } from "@/components/purchases/PurchasesHeader";
export default async function PurchasesLayout(props: {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const children = props.children;
  return <>
      {" "}
      <PurchasesHeader locale={locale} /> {children}{" "}
    </>;
}