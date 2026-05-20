import { getCheques, getChequesSummary } from "@/app/actions/cheques";
import { ChequesListClient } from "@/components/accounting/ChequesListClient";
export default async function ChequesPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const cheques = await getCheques();
  const summary = await getChequesSummary();
  return <div className="p-6 bg-[#F5F6FA] min-h-full" dir="rtl">
      {" "}
      <div className="max-w-7xl mx-auto">
        {" "}
        <ChequesListClient cheques={JSON.parse(JSON.stringify(cheques))} summary={summary} locale={locale} />{" "}
      </div>{" "}
    </div>;
}