import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ScrapOrderForm from '@/components/inventory/ScrapOrderForm';
export default async function CreateScrapPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const products = await prisma.product.findMany({
    where: {
      type: 'product'
    },
    select: { id: true, name: true, uom: true }
  });
  const locations = await prisma.location.findMany({
    where: {
      companyId: session.companyId
    },
    select: {
      id: true,
      name: true,
      type: true
    }
  });
  const internalLocations = locations.filter(l => l.type === 'internal');
  const scrapLocations = locations.filter(l => l.type === 'inventory' || l.type === 'scrap');
  return <div className="p-6 max-w-2xl mx-auto space-y-6"> <h1 className="text-2xl font-bold text-slate-800">New Scrap Order</h1> <div className="bg-white p-6 rounded-lg shadow border border-slate-200"> <ScrapOrderForm products={products} sourceLocations={internalLocations} scrapLocations={scrapLocations} locale={locale} /> </div> </div>;
}