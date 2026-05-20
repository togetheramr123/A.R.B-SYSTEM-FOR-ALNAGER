import { redirect } from "next/navigation";
export default async function ProfitLossRedirect(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  redirect(`/${locale}/accounting/reporting/profit_and_loss`);
}