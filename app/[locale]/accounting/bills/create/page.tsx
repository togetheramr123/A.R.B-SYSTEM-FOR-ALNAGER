import { createDraftInvoice } from "@/app/actions/accounting";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function CreateBillPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const newDraft = await createDraftInvoice("in_invoice");
  redirect(`/${locale}/accounting/bills/${newDraft.id}?edit=true`);
}