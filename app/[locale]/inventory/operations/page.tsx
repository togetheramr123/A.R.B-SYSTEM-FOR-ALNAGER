import { getSession } from '@/lib/auth';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, Clock, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils';
export default async function OperationsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations('Inventory');
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) redirect(`/${locale}`);
  const [receiptCount, receiptLateCount, receiptReadyCount, deliveryCount, deliveryLateCount, deliveryReadyCount, internalCount, internalLateCount, doneToday] = await Promise.all([
    prisma.stockPicking.count({
      where: {
        companyId,
        status: {
          notIn: ['done', 'cancel']
        },
        name: {
          contains: '/IN/'
        }
      }
    }), prisma.stockPicking.count({
    where: {
      companyId,
      status: {
        notIn: ['done', 'cancel']
      },
      name: {
        contains: '/IN/'
      },
      scheduledDate: {
        lt: new Date()
      }
    }
  }), prisma.stockPicking.count({
    where: {
      companyId,
      status: 'assigned',
      name: {
        contains: '/IN/'
      }
    }
  }), prisma.stockPicking.count({
    where: {
      companyId,
      status: {
        notIn: ['done', 'cancel']
      },
      name: {
        contains: '/OUT/'
      }
    }
  }), prisma.stockPicking.count({
    where: {
      companyId,
      status: {
        notIn: ['done', 'cancel']
      },
      name: {
        contains: '/OUT/'
      },
      scheduledDate: {
        lt: new Date()
      }
    }
  }), prisma.stockPicking.count({
    where: {
      companyId,
      status: 'assigned',
      name: {
        contains: '/OUT/'
      }
    }
  }), prisma.stockPicking.count({
    where: {
      companyId,
      status: {
        notIn: ['done', 'cancel']
      },
      name: {
        contains: '/INT/'
      }
    }
  }), prisma.stockPicking.count({
    where: {
      companyId,
      status: {
        notIn: ['done', 'cancel']
      },
      name: {
        contains: '/INT/'
      },
      scheduledDate: {
        lt: new Date()
      }
    }
  }), prisma.stockPicking.count({
    where: {
      companyId,
      status: 'done',
      updatedAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  })]);
  const operationTypes = [{
    id: 'receipts',
    title: t('receipts'),
    code: 'WH/IN',
    count: receiptCount,
    lateCount: receiptLateCount,
    readyCount: receiptReadyCount,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    borderColor: 'border-t-blue-500',
    icon: ArrowDownLeft,
    href: `/${locale}/inventory/operations/receipts`
  }, {
    id: 'deliveries',
    title: t('deliveries'),
    code: 'WH/OUT',
    count: deliveryCount,
    lateCount: deliveryLateCount,
    readyCount: deliveryReadyCount,
    color: 'text-green-600',
    bg: 'bg-green-50',
    borderColor: 'border-t-green-500',
    icon: ArrowUpRight,
    href: `/${locale}/inventory/operations/deliveries`
  }, {
    id: 'internal',
    title: t('internal'),
    code: 'WH/INT',
    count: internalCount,
    lateCount: internalLateCount,
    readyCount: 0,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    borderColor: 'border-t-orange-500',
    icon: ArrowRightLeft,
    href: `/${locale}/inventory/operations/internal`
  }];
  const totalPending = receiptCount + deliveryCount + internalCount;
  const totalLate = receiptLateCount + deliveryLateCount + internalLateCount;
  return <div className="space-y-6"> <div className="flex items-center justify-between"> <h1 className="text-2xl font-bold text-slate-800">{t('operations')}</h1> <div className="flex gap-3"> <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm"> <Package className="w-4 h-4 text-slate-500" /> <span className="text-sm font-bold text-slate-700">{totalPending}</span> <span className="text-xs text-slate-500">معلّقة</span> </div> {totalLate > 0 && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm"> <AlertTriangle className="w-4 h-4 text-red-500" /> <span className="text-sm font-bold text-red-600">{totalLate}</span> <span className="text-xs text-red-500">متأخرة</span> </div>} {doneToday > 0 && <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center gap-2 shadow-sm"> <CheckCircle className="w-4 h-4 text-green-500" /> <span className="text-sm font-bold text-green-600">{doneToday}</span> <span className="text-xs text-green-500">أُنجزت اليوم</span> </div>} </div> </div> <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> {operationTypes.map((op: any) => {
        const Icon = op.icon;
        return <div key={op.id} className={cn("bg-white rounded-sm shadow-sm border border-slate-200 border-t-4 overflow-hidden hover:shadow-md transition-shadow", op.borderColor)}> <div className="p-4 border-b border-slate-100 flex justify-between items-center"> <span className="font-bold text-slate-700">{op.title}</span> <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-500">{op.code}</span> </div> <Link href={op.href} className="p-6 flex items-center justify-between group"> <div> <h2 className={`text-4xl font-bold ${op.count > 0 ? op.color : 'text-slate-300'}`}> {op.count} </h2> <p className="text-slate-500 text-sm mt-1">{t('toProcess')}</p> </div> <div className={`${op.bg} p-4 rounded-full group-hover:scale-110 transition-transform`}> <Icon className={`w-8 h-8 ${op.color}`} /> </div> </Link> {} <div className="px-4 pb-4 space-y-2"> {op.readyCount > 0 && <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-emerald-50 rounded-lg"> <div className="flex items-center gap-1.5"> <CheckCircle className="w-3 h-3 text-teal-700" /> <span className="text-emerald-700 font-medium">جاهز للمعالجة</span> </div> <span className="font-bold text-emerald-700">{op.readyCount}</span> </div>} {op.lateCount > 0 && <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-red-50 rounded-lg"> <div className="flex items-center gap-1.5"> <AlertTriangle className="w-3 h-3 text-red-500" /> <span className="text-red-600 font-medium">متأخر</span> </div> <span className="font-bold text-red-600">{op.lateCount}</span> </div>} </div> {op.count > 0 && <div className="bg-slate-50 px-4 py-3 border-t border-slate-100 text-center"> <Link href={op.href} className="text-sm font-medium text-blue-600 hover:underline inline-flex items-center gap-1"> <Clock className="w-3 h-3" /> عرض العمليات المعلقة </Link> </div>} </div>;
      })} </div> </div>;
}