import React from "react";
import { SalesHeader } from "@/components/sales/SalesHeader";
export default async function SalesLayout(props: {
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
      <SalesHeader locale={locale} /> {children}{" "}
    </>;
}