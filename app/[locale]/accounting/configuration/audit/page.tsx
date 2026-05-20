import { getAuditLogs } from "@/app/actions/audit";
import { AuditLogClient } from "@/components/accounting/AuditLogClient";
export default async function AuditPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const logs = await getAuditLogs({
    limit: 200
  });
  return <div className="p-6 bg-[#F5F6FA] min-h-full" dir="rtl">
      {" "}
      <div className="max-w-7xl mx-auto">
        {" "}
        <AuditLogClient logs={JSON.parse(JSON.stringify(logs))} locale={locale} />{" "}
      </div>{" "}
    </div>;
}