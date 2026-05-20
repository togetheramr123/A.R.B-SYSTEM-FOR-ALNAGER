import { ProfitAndLossReport } from "@/components/accounting/ProfitAndLossReport";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Accounting");
  return {
    title: `Profit & Loss | ${t("title", {
      fallback: "Accounting"
    })}`
  };
}
export default function ProfitAndLossPage() {
  return <div className="container mx-auto px-4 py-8 max-w-7xl">
      {" "}
      <ProfitAndLossReport />{" "}
    </div>;
}