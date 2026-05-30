import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import InvoicePrintTemplate from "@/components/accounting/InvoicePrintTemplate";

export default async function BillPrintPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    mode?: "simple" | "detailed";
    design?: "1" | "2";
  }>;
}) {
  const { locale, id } = await props.params;
  const { mode, design } = await props.searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      partner: true,
      company: true,
      lines: true,
    },
  });
  if (!invoice) notFound();

  const currentMode = mode === "simple" ? "simple" : "detailed";
  const currentDesign = design === "2" ? "2" : "1";

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; background: white; }
        }
        html, body { margin: 0; padding: 0; background: white; }
      `}</style>
      <InvoicePrintTemplate
        invoice={invoice}
        locale={locale}
        mode={currentMode}
        design={currentDesign}
      />
    </>
  );
}