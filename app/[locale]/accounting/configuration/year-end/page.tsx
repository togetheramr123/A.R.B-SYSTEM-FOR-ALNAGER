import { getYearEndClosings, getLockSettings } from "@/app/actions/year-end";
import { YearEndClient } from "@/components/accounting/YearEndClient";
export default async function YearEndPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const closings = await getYearEndClosings();
  const lockSettings = await getLockSettings();
  return <div className="p-6 bg-[#F5F6FA] min-h-full" dir="rtl">
      {" "}
      <div className="max-w-5xl mx-auto">
        {" "}
        <YearEndClient closings={JSON.parse(JSON.stringify(closings))} lockSettings={JSON.parse(JSON.stringify(lockSettings))} locale={locale} />{" "}
      </div>{" "}
    </div>;
}