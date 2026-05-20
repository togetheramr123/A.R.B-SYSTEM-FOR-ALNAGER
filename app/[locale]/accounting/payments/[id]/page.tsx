import { notFound } from "next/navigation";
import { getPayment } from "@/app/actions/payments";
import prisma from "@/lib/prisma";
import { PaymentForm } from "@/components/accounting/PaymentForm";
export default async function PaymentDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  let payment = null;
  if (id !== "new") {
    payment = await getPayment(id);
    if (!payment) notFound();
  }
  const partners = await prisma.partner.findMany();
  const journals = await prisma.journal.findMany({
    where: {
      type: {
        in: ["bank", "cash"]
      }
    }
  });
  return <PaymentForm initialData={payment} partners={partners} journals={journals} locale={locale} />;
}