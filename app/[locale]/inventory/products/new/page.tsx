import { ProductForm } from "@/components/inventory/ProductForm";
import { getSession } from "@/lib/auth"; /** * New Product Page * Supports pre-filling product name via ?name= query param * (used when navigating from Sales/Purchases/Invoices "إنشاء وتحرير") */
export default async function NewProductPage(props: {
  searchParams: Promise<{
    [key: string]: string | undefined;
  }>;
}) {
  const searchParams = await props.searchParams;
  const initialData: any = {};
  if (searchParams.name) {
    initialData.name = searchParams.name;
  }
  const session = await getSession();
  const userRole = session?.role || "USER";
  const canViewCost = session?.canViewCost ?? true;
  return <ProductForm initialData={Object.keys(initialData).length > 0 ? initialData : undefined} userRole={userRole} canViewCost={canViewCost} />;
}