import { getAnalyticAccounts } from "@/app/actions/analytic";
import AnalyticAccountsClient from "@/components/accounting/AnalyticAccountsClient";
export default async function AnalyticAccountsPage() {
  const accounts = await getAnalyticAccounts();
  return <AnalyticAccountsClient accounts={accounts} />;
}