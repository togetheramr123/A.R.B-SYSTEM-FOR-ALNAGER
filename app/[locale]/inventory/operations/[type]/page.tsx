import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Plus, Search, ArrowRight, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import prisma from '@/lib/prisma';
export default async function OperationListPage(props: {
  params: Promise<{
    locale: string;
    type: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}) {
  const {
    locale,
    type
  } = await props.params;
  const {
    page,
    search
  } = await props.searchParams;
  const t = await getTranslations('Inventory');
  const getTitle = () => {
    switch (type) {
      case 'receipts':
        return t('receipts');
      case 'deliveries':
        return t('deliveries');
      case 'internal':
        return t('internal');
      default:
        return t('operations');
    }
  };
  const getNamePattern = () => {
    switch (type) {
      case 'receipts':
        return '/IN/';
      case 'deliveries':
        return '/OUT/';
      case 'internal':
        return '/INT/';
      default:
        return '';
    }
  };
  const currentPage = parseInt(page || '1');
  const pageSize = 15;
  const skip = (currentPage - 1) * pageSize;
  const namePattern = getNamePattern();
  const where = {
    ...(namePattern && {
      name: {
        contains: namePattern
      }
    }),
    ...(search && {
      OR: [{
        name: {
          contains: search
        }
      }, {
        origin: {
          contains: search
        }
      }, {
        partner: {
          name: {
            contains: search
          }
        }
      }]
    })
  };
  const [pickings, totalCount] = await Promise.all([prisma.stockPicking.findMany({
    where,
    include: {
      partner: true,
      moves: {
        include: {
          product: true,
          sourceLocation: true,
          destLocation: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    skip,
    take: pageSize
  }), prisma.stockPicking.count({
    where
  })]);
  const totalPages = Math.ceil(totalCount / pageSize);
  return <div className="space-y-6"> <div className="flex justify-between items-center"> <div className="flex items-center gap-4"> <Link href={`/${locale}/inventory/operations`} className="p-2 hover:bg-slate-100 rounded-full transition-colors"> <ArrowRight className="w-5 h-5 text-slate-500" /> </Link> <div> <h1 className="text-2xl font-bold text-slate-800">{getTitle()}</h1> <p className="text-slate-500 text-sm mt-1">{totalCount} عملية</p> </div> </div> <Link href={`/${locale}/inventory/operations/${type}/new`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm"> <Plus className="w-5 h-5" /> إنشاء جديد </Link> </div> <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden"> <div className="p-4 border-b border-slate-100 flex gap-4 items-center"> <form className="relative flex-1 max-w-md"> <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /> <input type="text" name="search" defaultValue={search} placeholder="بحث في العمليات..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" /> </form> <div className="flex items-center gap-2 text-sm text-slate-500"> <span>صفحة {currentPage} من {totalPages}</span> <div className="flex gap-1"> {currentPage > 1 && <Link href={`/${locale}/inventory/operations/${type}?page=${currentPage - 1}${search ? `&search=${search}` : ''}`} className="p-1 hover:bg-slate-100 rounded border border-slate-200"> <ChevronRight className="w-4 h-4" /> </Link>} {currentPage < totalPages && <Link href={`/${locale}/inventory/operations/${type}?page=${currentPage + 1}${search ? `&search=${search}` : ''}`} className="p-1 hover:bg-slate-100 rounded border border-slate-200"> <ChevronLeft className="w-4 h-4" /> </Link>} </div> </div> </div> <div className="overflow-x-auto"> <table className="w-full text-right"> <thead className="bg-slate-50 text-slate-600 font-medium text-sm"> <tr> <th className="px-6 py-4">{t('document')}</th> <th className="px-6 py-4">الشريك</th> <th className="px-6 py-4">{t('source')}</th> <th className="px-6 py-4">التاريخ المحدد</th> <th className="px-6 py-4">عدد المنتجات</th> <th className="px-6 py-4">{t('status')}</th> </tr> </thead> <tbody className="divide-y divide-slate-100"> {pickings.map((picking: any) => <tr key={picking.id} className="hover:bg-slate-50 transition-colors group"> <td className="px-6 py-4 font-bold text-blue-600"> <Link href={`/${locale}/inventory/operations/${type}/${picking.id}`} className="flex items-center gap-2 hover:underline"> <Truck className="w-4 h-4 opacity-50 group-hover:opacity-100" /> {picking.name} </Link> </td> <td className="px-6 py-4 text-slate-700">{picking.partner?.name || '-'}</td> <td className="px-6 py-4 text-slate-500 text-sm">{picking.origin || '-'}</td> <td className="px-6 py-4 text-slate-500"> {picking.scheduledDate ? new Date(picking.scheduledDate).toLocaleDateString('en-CA') : '-'} </td> <td className="px-6 py-4 text-slate-600"> <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium"> {picking.moves.length} منتج </span> </td> <td className="px-6 py-4"> <span className={`px-2 py-1 rounded-full text-xs font-bold ${picking.status === 'done' ? 'bg-green-100 text-green-700' : picking.status === 'assigned' || picking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}> {picking.status === 'done' ? 'تم' : picking.status === 'assigned' ? 'جاهز' : picking.status === 'confirmed' ? 'مؤكد' : picking.status === 'draft' ? 'مسودة' : picking.status} </span> </td> </tr>)} </tbody> </table> </div> </div> </div>;
}