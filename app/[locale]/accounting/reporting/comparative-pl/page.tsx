import { ComparativePLClient } from "@/components/accounting/ComparativePLClient";
export default async function ComparativePLPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  return <div className="p-6 bg-[#F5F6FA] min-h-full" dir="rtl">
      {" "}
      <div className="max-w-6xl mx-auto">
        {" "}
        <ComparativePLClient locale={locale} />{" "}
      </div>{" "}
    </div>;
}