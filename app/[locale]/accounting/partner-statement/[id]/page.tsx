import { getPartnerStatement } from "@/app/actions/reporting";
import { PartnerStatementPrint } from "@/components/accounting/PartnerStatementPrint";
export default async function PartnerStatementPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    state?: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const {
    from,
    to,
    state
  } = await props.searchParams;
  const statement = await getPartnerStatement(id, from, to, state);
  return <div className="min-h-full bg-white" dir="rtl">
      {" "}
      <PartnerStatementPrint statement={JSON.parse(JSON.stringify(statement))} locale={locale} />{" "}
    </div>;
}