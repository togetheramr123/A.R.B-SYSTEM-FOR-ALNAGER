import { getPortalUser } from "@/lib/portalAuth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getAccountStatements } from "@/app/actions/portalAccount";
import PortalAccountClient from "@/components/portal/PortalAccountClient";
export default async function AccountPage() {
  const portalUser = await getPortalUser();
  if (!portalUser) redirect("/portal/login");
  const statements = await getAccountStatements();
  return <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
      {" "}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        {" "}
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          {" "}
          <Link href="/portal" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            {" "}
            <ArrowRight className="w-4 h-4" />{" "}
          </Link>{" "}
          <h1 className="text-sm font-bold text-slate-800 flex-1">
            كشف الحساب
          </h1>{" "}
        </div>{" "}
      </header>{" "}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {" "}
        <PortalAccountClient initialStatements={statements} />{" "}
      </div>{" "}
    </div>;
}