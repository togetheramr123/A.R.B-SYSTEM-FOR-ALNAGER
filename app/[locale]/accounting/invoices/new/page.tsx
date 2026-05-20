import { createDraftInvoice } from '@/app/actions/accounting';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function NewInvoicePage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    type?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    type
  } = await props.searchParams;
  const validTypes = ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'] as const;
  const invoiceType = validTypes.includes(type as any) ? type as typeof validTypes[number] : 'out_invoice';
  const newDraft = await createDraftInvoice(invoiceType);
  
  if (invoiceType === 'in_invoice' || invoiceType === 'in_refund') {
    redirect(`/${locale}/accounting/bills/${newDraft.id}`);
  } else {
    redirect(`/${locale}/accounting/invoices/${newDraft.id}`);
  }
}