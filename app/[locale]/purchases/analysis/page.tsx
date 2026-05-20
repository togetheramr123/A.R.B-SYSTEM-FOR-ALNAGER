import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getCompanyId } from '@/lib/getCompanyId';
import { redirect } from 'next/navigation';
import { PivotTable } from '@/components/ui/PivotTable';
export default async function PurchaseAnalysisPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const dateFrom = searchParams.dateFrom ? new Date(searchParams.dateFrom) : undefined;
  const dateTo = searchParams.dateTo ? new Date(searchParams.dateTo) : undefined;
  const lines = await prisma.purchaseOrderLine.findMany({
    where: {
      order: {
        status: {
          in: ['purchase', 'done']
        },
        dateOrder: {
          gte: dateFrom,
          lte: dateTo
        }
      },
      companyId: session.companyId || (await getCompanyId())
    },
    include: {
      order: {
        include: { partner: true }
      },
      product: {
        include: { category: true }
      }
    }
  });
  const flatData = lines.map(line => ({
    'المورد': line.order.partner?.name || 'غير محدد',
    'المنتج': line.product?.name || line.name,
    'الفئة': line.product?.category?.name || 'غير مصنف',
    'التاريخ': new Date(line.order.dateOrder).toLocaleDateString(locale),
    'الشهر': new Date(line.order.dateOrder).toLocaleString('ar-EG', {
      month: 'long',
      year: 'numeric'
    }),
    'الكمية': line.quantity,
    'السعر': line.priceUnit,
    'الإجمالي': line.priceSubtotal
  }));
  return <div className="p-4" dir="rtl"> <div className="space-y-8"> <div className="flex justify-between items-end"> <div> <h1 className="text-2xl font-bold text-slate-900">تحليل المشتريات</h1> <p className="text-slate-500">تحليل المشتريات حسب المورد، المنتج، والتاريخ</p> </div> </div> {} <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-200"> <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">إجمالي المشتريات لكل مورد (شهرياً)</h3> <PivotTable data={flatData} config={{
        rows: ['المورد'],
          columns: ['الشهر'],
          measures: ['الإجمالي']
        }} /> </div> {} <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-200"> <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">تحليل المنتجات حسب الموردين</h3> <PivotTable data={flatData} config={{
        rows: ['الفئة'],
          columns: ['المورد'],
          measures: ['الكمية']
        }} /> <p className="text-xs text-slate-400 mt-2">* الأرقام تمثل الكميات</p> </div> {} <div className="bg-white p-6 rounded-sm shadow-sm border border-slate-200"> <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">تحليل تكلفة المنتجات</h3> <PivotTable data={flatData} config={{
          rows: ['المنتج']
        }} /> </div> </div> </div>;
}