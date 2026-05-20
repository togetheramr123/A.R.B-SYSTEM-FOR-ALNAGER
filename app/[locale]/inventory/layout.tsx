import React from "react";
import InventoryHeader from "@/components/inventory/InventoryHeader";
export default async function InventoryLayout(props: {
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
  return <>
      {" "}
      <InventoryHeader locale={locale} /> {children}{" "}
    </>;
}