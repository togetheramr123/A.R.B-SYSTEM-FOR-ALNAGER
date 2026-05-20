import { CostCenterClient } from "@/components/accounting/CostCenterClient";
export default async function CostCenterPage(props: {
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
        <CostCenterClient locale={locale} />{" "}
      </div>{" "}
    </div>;
}