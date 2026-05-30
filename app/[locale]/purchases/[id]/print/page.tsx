import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { serializeDecimal } from "@/lib/serialize";
import PurchasePrintTemplate from "@/components/purchases/PurchasePrintTemplate";

export default async function PurchasePrintPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    design?: "1" | "2";
  }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const locale = params?.locale;
  const id = params?.id;
  const design = searchParams?.design;
  const session = await getSession();
  
  if (!session) redirect(`/${locale}/login`);
  
  const currentDesign = design === "2" ? "2" : "1";

  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      partner: true,
      company: true,
      user: true,
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  
  if (!order) notFound();

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          nav, header, .sidebar, .no-print, [class*="fixed bottom"], [class*="z-[9999]"] { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
        }
        @media screen {
          .print-wrapper { display: flex; justify-content: center; min-height: 100vh; background: #f1f5f9; padding: 20px; }
          .print-paper { box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        }
      `}</style>
      <div className="print-wrapper">
        <div className="print-paper">
          <PurchasePrintTemplate order={serializeDecimal(order)} locale={locale} design={currentDesign} />
        </div>
      </div>
    </>
  );
}