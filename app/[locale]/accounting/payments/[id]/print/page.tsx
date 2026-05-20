import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import PaymentPrintTemplate from "@/components/accounting/PaymentPrintTemplate";
import Link from "next/link";
export default async function PaymentPrintPage(props: {
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
  const payment = await prisma.payment.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      journal: {
        include: {
          defaultAccount: true
        }
      }
    }
  });
  if (!payment) notFound(); // Fetch company info
  const company = await prisma.company.findFirst();
  const paymentData = {
    ...payment,
    amount: Number(payment.amount),
    company
  };
  return <div className="bg-slate-100 min-h-screen p-8 text-black print:p-0 flex justify-center">
      {" "}
      {/* Print Styles */}{" "}
      <style>{` @media print { @page { size: A4; margin: 0; } body { -webkit-print-color-adjust: exact; background: white; } .no-print { display: none !important; } .print-page { margin: 0 !important; width: 100% !important; min-height: 29.7cm; box-shadow: none !important; } } `}</style>{" "}
      <div className="w-[21cm] min-h-[29.7cm] flex flex-col relative print:w-full">
        {" "}
        {/* Control Bar (No Print) */}{" "}
        <div className="fixed top-8 right-8 flex flex-col gap-4 no-print z-50">
          {" "}
          <button // @ts-ignore
        onClick="window.print()" className="bg-indigo-600 text-white p-4 rounded-full shadow-sm hover:bg-indigo-700 transition flex items-center justify-center transform hover:scale-110" title="طباعة">
            {" "}
            <span className="text-2xl">🖨️</span>{" "}
          </button>{" "}
          <Link href={`/${locale}/accounting/payments/${id}`} className="bg-slate-600 text-white p-4 rounded-full shadow-sm hover:bg-slate-700 transition flex items-center justify-center transform hover:scale-110" title="رجوع">
            {" "}
            <span className="text-2xl">↩️</span>{" "}
          </Link>{" "}
        </div>{" "}
        {/* Document Container */}{" "}
        <div className="bg-white shadow-sm print-page box-border overflow-hidden relative">
          {" "}
          <PaymentPrintTemplate payment={paymentData} locale={locale} />{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}