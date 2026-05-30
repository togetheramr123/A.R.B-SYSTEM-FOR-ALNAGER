import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import PaymentPrintTemplate from "@/components/accounting/PaymentPrintTemplate";

export default async function PaymentPrintPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const { locale, id } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      partner: true,
      journal: {
        include: { defaultAccount: true }
      }
    }
  });

  if (!payment) notFound();

  const company = await prisma.company.findFirst();
  const paymentData = {
    ...payment,
    amount: Number(payment.amount),
    company
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, header, .sidebar, .no-print, [class*="fixed bottom"], [class*="fixed left"], [class*="z-[9999]"], [class*="z-[100]"] { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
        @media screen {
          .print-wrapper { display: flex; justify-content: center; min-height: 100vh; background: #f1f5f9; padding: 20px; }
          .print-paper { box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        }
      `}</style>
      <div className="print-wrapper">
        <div className="print-paper">
          <PaymentPrintTemplate payment={paymentData} locale={locale} />
        </div>
      </div>
    </>
  );
}