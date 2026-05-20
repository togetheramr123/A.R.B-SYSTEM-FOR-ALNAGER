import PickingForm from '@/components/inventory/PickingForm';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
export default async function TransferDetailsPage(props: {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}) {
  const {
    id,
    locale
  } = await props.params;
  let picking = await prisma.stockPicking.findUnique({
    where: {
      id
    },
    include: {
      moves: {
        include: {
          product: true
        }
      },
      partner: true,
      location: true,
      locationDest: true
    }
  });
  if (!picking && ['1', '2', '3'].includes(id)) {
    picking = {
      id: id,
      name: id === '1' ? 'INT/00001' : id === '2' ? 'INT/00002' : 'INT/00003',
      pickingType: 'INTERNAL',
      status: id === '1' ? 'done' : id === '2' ? 'waiting' : 'draft',
      scheduleDate: new Date(),
      origin: 'Demo',
      locationId: 'demo_loc_1',
      locationDestId: 'demo_loc_2',
      partnerId: null,
      partner: null,
      moves: [{
        id: 'm1',
        productId: 'p1',
        name: 'Product A',
        product: {
          name: 'Product A'
        },
        quantity: 10,
        quantityDone: id === '1' ? 10 : 0,
        unitName: 'قطعة',
        secQty: 0,
        secQtyDone: 0,
        secUnitName: 'Box'
      }, {
        id: 'm2',
        productId: 'p2',
        name: 'Product B',
        product: {
          name: 'Product B'
        },
        quantity: 5,
        quantityDone: id === '1' ? 5 : 0,
        unitName: 'قطعة'
      }]
    } as any;
  }
  if (!picking!.name && !picking) {
    return <div className="p-8 text-center"> <h1 className="text-xl font-bold text-red-600">عفواً، لم يتم العثور على هذا المستند</h1> <p className="text-slate-500">ID: {id}</p> </div>;
  }
  const locations = await prisma.location.findMany();
  return <PickingForm picking={picking} locations={locations.length > 0 ? locations : [{
    id: 'demo',
    name: 'Demo Location'
  }]} />;
}