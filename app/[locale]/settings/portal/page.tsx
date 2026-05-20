import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminBanners } from "@/app/actions/portalSettings";
import PortalSettingsClient from "./PortalSettingsClient";
import { Smartphone } from "lucide-react";
export default async function AdminPortalSettingsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const session = await getSession();
  if (!session || !["ADMIN", "MANAGER"].includes(session.role)) redirect(`/${locale}/settings`);
  const banners = await getAdminBanners();
  return <div className="p-6">
      {" "}
      <div className="mb-6 flex items-center gap-3">
        {" "}
        <div className="w-10 h-10 bg-[#714B67]/10 text-[#714B67] rounded-sm flex items-center justify-center">
          {" "}
          <Smartphone className="w-5 h-5" />{" "}
        </div>{" "}
        <div>
          {" "}
          <h1 className="text-2xl font-bold text-gray-800">
            إعدادات بوابة التجار
          </h1>{" "}
          <p className="text-gray-500 text-sm mt-1">
            التحكم في البنرات الإعلانية المعروضة للتجار في التطبيق
          </p>{" "}
        </div>{" "}
      </div>{" "}
      <PortalSettingsClient initialBanners={banners} />{" "}
    </div>;
}