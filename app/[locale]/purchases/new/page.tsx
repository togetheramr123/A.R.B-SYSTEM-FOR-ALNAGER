import { PurchaseOrderForm } from "@/components/purchases/PurchaseOrderForm";
import { getSession } from "@/lib/auth";
import { getUserGroupPermissions } from "@/app/actions/settings";
export const dynamic = "force-dynamic";
export default async function NewPurchaseOrderPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const session = await getSession();
  const permissions = await getUserGroupPermissions();
  const canEditUomFactor = session?.role === "ADMIN" || permissions._isAdmin || permissions.inv_edit_uom_factor || false;
  // Render an empty form — no DB record is created until first save
  return <PurchaseOrderForm defaultEditing={true} canEditUomFactor={canEditUomFactor} />;
}