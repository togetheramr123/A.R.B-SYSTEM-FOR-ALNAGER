import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import { getPortalProducts } from "@/app/actions/portal";
import { PortalProductsPage } from "@/components/portal/PortalProductsPage";
export default async function FavoritesPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");
  const {
    products,
    categories
  } = await getPortalProducts({
    favoriteOnly: true
  });
  return <PortalProductsPage products={products} categories={categories} user={portalUser} />;
}