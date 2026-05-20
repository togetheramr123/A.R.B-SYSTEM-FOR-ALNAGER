import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import ChequePrintTemplate from "@/components/accounting/ChequePrintTemplate";
import { serializeDecimal } from "@/lib/serialize";
export default async function ChequePrintPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const cheque = await prisma.cheque.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      company: true
    }
  });
  if (!cheque) notFound();
  return <ChequePrintTemplate cheque={serializeDecimal(cheque)} locale={locale} />;
}