import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAdminStatementRequests } from "@/app/actions/portalAccount";
import StatementRequestsClient from "./StatementRequestsClient";
export default async function AdminStatementRequestsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const session = await getSession();
  if (!session || !["ADMIN", "ACCOUNTANT"].includes(session.role)) redirect(`/${locale}`);
  const requests = await getAdminStatementRequests();
  return <div className="p-6">
      {" "}
      <div className="mb-6">
        {" "}
        <h1 className="text-2xl font-bold text-gray-800">
          طلبات كشوفات الحساب (بوابة التجار)
        </h1>{" "}
        <p className="text-gray-500 text-sm mt-1">
          عرض والرد على طلبات كشوفات الحساب الواردة من التجار عبر التطبيق.
        </p>{" "}
      </div>{" "}
      <StatementRequestsClient initialRequests={requests} />{" "}
    </div>;
}