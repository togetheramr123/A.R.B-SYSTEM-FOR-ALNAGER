import { notFound } from "next/navigation";
import { getJournalDetails, getPaymentMethods } from "@/app/actions/accounting";
import { getAllAccounts } from "@/app/actions/product-categories";
import { JournalForm } from "@/components/accounting/JournalForm";
export default async function JournalDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  let journal = null;
  if (id !== "new") {
    journal = await getJournalDetails(id);
    if (!journal) notFound();
  }
  const accounts = await getAllAccounts();
  const paymentMethods = await getPaymentMethods();
  return <JournalForm initialData={journal} accounts={accounts} paymentMethods={paymentMethods} locale={locale} />;
}