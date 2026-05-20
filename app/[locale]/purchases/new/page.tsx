import { PurchaseOrderForm } from "@/components/purchases/PurchaseOrderForm";
export const dynamic = "force-dynamic";
export default async function NewPurchaseOrderPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  // Render an empty form — no DB record is created until first save
  return <PurchaseOrderForm defaultEditing={true} />;
}