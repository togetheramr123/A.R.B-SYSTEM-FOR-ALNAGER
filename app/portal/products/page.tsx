import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import { getPortalProducts } from "@/app/actions/portal";
import { PortalProductsPage } from "@/components/portal/PortalProductsPage";
export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
  }>;
}) {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");
  const params = await searchParams;
  const {
    products,
    categories
  } = await getPortalProducts({
    categoryId: params.category,
    search: params.search
  });
  return <PortalProductsPage products={products} categories={categories} user={portalUser} initialCategory={params.category} initialSearch={params.search} />;
}