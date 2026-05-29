import { SaleOrderForm } from "@/components/sales/SaleOrderForm";
import { getSession } from "@/lib/auth";
import { getUserGroupPermissions } from "@/app/actions/settings";
export const dynamic = "force-dynamic";
export default async function NewSaleOrderPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const session = await getSession();
  const userRole = session?.role || "USER";
  const permissions = await getUserGroupPermissions();
  const canViewCustomerDetails = userRole === "ADMIN" || permissions._isAdmin || permissions.cust_view_details || false;
  const canEditUomFactor = userRole === "ADMIN" || permissions._isAdmin || permissions.inv_edit_uom_factor || false;
  // Render an empty form — no DB record is created until first save
  return <SaleOrderForm defaultEditing={true} userRole={userRole} canViewCustomerDetails={canViewCustomerDetails} canEditUomFactor={canEditUomFactor} />;
}