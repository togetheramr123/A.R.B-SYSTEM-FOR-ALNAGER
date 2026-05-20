import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import { PortalHomePage } from "@/components/portal/PortalHomePage";
import { getPortalBanners } from "@/app/actions/portal";
export default async function PortalPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) {
    redirect("/portal/login");
  }
  const banners = await getPortalBanners();
  return <PortalHomePage user={portalUser} banners={banners} />;
}