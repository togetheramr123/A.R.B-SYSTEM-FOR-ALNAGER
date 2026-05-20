import { redirect } from "next/navigation";
export default async function BalanceSheetRedirect(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  redirect(`/${locale}/accounting/reporting/balance_sheet`);
}