import { notFound } from "next/navigation";
import { getAccount, getAccountBalance } from "@/app/actions/accounts";
import { getAccountTags, getTaxesSimple, getJournalsSimple } from "@/app/actions/accounting";
import { AccountForm } from "@/components/accounting/AccountForm";
export default async function AccountDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  let account = null;
  let balance = {
    debit: 0,
    credit: 0,
    balance: 0
  };
  if (id !== "new") {
    account = await getAccount(id);
    if (!account) notFound();
    balance = await getAccountBalance(id);
  }
  const tags = await getAccountTags();
  const taxes = await getTaxesSimple();
  const journals = await getJournalsSimple();
  /* Serialize to prevent Prisma Decimal errors in Client Components */
  const serializedAccount = account ? JSON.parse(JSON.stringify(account)) : null;
  const serializedTaxes = JSON.parse(JSON.stringify(taxes));
  return <AccountForm initialData={serializedAccount} locale={locale} balance={balance} availableTags={tags} availableTaxes={serializedTaxes} availableJournals={journals} />;
}