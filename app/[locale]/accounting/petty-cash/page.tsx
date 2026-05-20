import { getExpenseAccounts, getCashJournals } from "@/app/actions/petty-cash";
import { PettyCashForm } from "@/components/accounting/PettyCashForm";
export default async function PettyCashPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const [expenseAccounts, cashJournals] = await Promise.all([getExpenseAccounts(), getCashJournals()]);
  return <div className="p-6" dir="rtl">
      {" "}
      <PettyCashForm expenseAccounts={expenseAccounts} cashJournals={cashJournals} locale={locale} />{" "}
    </div>;
}