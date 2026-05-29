import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { notFound, redirect } from 'next/navigation';
import QuotationPrintTemplate from '@/components/sales/QuotationPrintTemplate';
import { serializeDecimal } from '@/lib/serialize';
import Link from 'next/link';

export default async function SalePrintPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    design?: "1" | "2";
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const { design } = await props.searchParams;
  const currentDesign = design === "2" ? "2" : "1";

  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const order = await prisma.saleOrder.findUnique({
    where: {
      id
    },
    include: {
      lines: {
        include: {
          product: true
        }
      }
    }
  });
  if (!order) notFound();
  
  return (
    <div className="bg-slate-100 min-h-screen p-8 text-black print:p-0 flex justify-center">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
          .print-page { margin: 0 !important; width: 100% !important; min-height: 29.7cm; box-shadow: none !important; }
        }
      `}</style>
      <div className="w-[21cm] min-h-[29.7cm] flex flex-col relative print:w-full">
        {/* Control Bar (No Print) */}
        <div className="fixed top-8 right-8 flex flex-col gap-4 no-print z-50">
          <button id="print-btn" className="bg-indigo-600 text-white p-4 rounded-full shadow-sm hover:bg-indigo-700 transition flex items-center justify-center transform hover:scale-110" title="طباعة">
            <span className="text-2xl">🖨️</span>
          </button>
          <script dangerouslySetInnerHTML={{ __html: `document.getElementById('print-btn')?.addEventListener('click', function() { window.print(); });` }} />
          
          <div className="bg-white rounded-lg shadow-sm p-2 flex flex-col gap-2 text-center">
            <div className="text-xs font-bold text-slate-400 mb-1 border-b pb-1">التصميم</div>
            <Link href={`/${locale}/sales/${id}/print?design=1`} className={`px-4 py-2 rounded text-sm font-bold transition ${currentDesign === "1" ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              تصميم 1 (قيمة)
            </Link>
            <Link href={`/${locale}/sales/${id}/print?design=2`} className={`px-4 py-2 rounded text-sm font-bold transition ${currentDesign === "2" ? "bg-indigo-100 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}>
              تصميم 2 (نسبة)
            </Link>
          </div>
          
          <Link href={`/${locale}/sales/${id}`} className="bg-slate-600 text-white p-4 rounded-full shadow-sm hover:bg-slate-700 transition flex items-center justify-center transform hover:scale-110" title="رجوع">
            <span className="text-2xl">↩️</span>
          </Link>
        </div>
        
        {/* Document Container */}
        <div className="bg-white shadow-sm print-page box-border overflow-hidden relative">
          <QuotationPrintTemplate order={serializeDecimal(order)} locale={locale} design={currentDesign} />
        </div>
      </div>
    </div>
  );
}