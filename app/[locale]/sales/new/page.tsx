import { SaleOrderForm } from "@/components/sales/SaleOrderForm";
import { getSession } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function NewSaleOrderPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const session = await getSession();
  const userRole = session?.role || "USER";
  // Render an empty form — no DB record is created until first save
  return <SaleOrderForm defaultEditing={true} userRole={userRole} />;
}