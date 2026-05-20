import { DashboardCards } from '@/components/ui/DashboardCards';
import { ShoppingCart, Receipt, Users, Boxes, TrendingUp, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { serializeDecimal } from '@/lib/serialize';
import Link from 'next/link';
import { getSession } from '@/lib/auth';
export default async function PurchasesDashboardPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations('Purchases');
  const session = await getSession();
  const companyId = session?.companyId;
  const [draftCount, confirmedCount, totalAggregate, vendorCount, billCount, shortageCount, confirmedOrdersWithLines] = await Promise.all([prisma.purchaseOrder.count({
    where: {
      status: {
        in: ['draft', 'sent']
      },
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.purchaseOrder.count({
    where: {
      status: {
        in: ['purchase', 'done']
      },
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.purchaseOrder.aggregate({
    _sum: {
      amountTotal: true
    },
    _count: true,
    where: {
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.partner.count({
    where: {
      isVendor: true,
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.invoice.count({
    where: {
      type: 'in_invoice',
      state: {
        in: ['draft', 'posted']
      },
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.product.count({
    where: {
      type: 'storable',
      active: true,
      ...(companyId ? {
        companyId
      } : {}),
      stockQuants: {
        every: {
          quantity: {
            lte: 5
          }
        }
      }
    }
  }),
  prisma.purchaseOrder.findMany({
    where: {
      status: {
        in: ['purchase', 'done']
      },
      ...(companyId ? {
        companyId
      } : {})
    },
    include: {
      lines: true
    }
  })]);
  const ordersToBill = confirmedOrdersWithLines.filter(order => {
    return order.lines.some(l => Number(l.qtyReceived || 0) > Number(l.qtyInvoiced || 0));
  });
  const totalData = serializeDecimal(totalAggregate);
  const totalValue = Number(totalData._sum?.amountTotal || 0);
  const totalFormatted = totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}K` : totalValue.toLocaleString('en-US');
  const purchaseCards = [{
    title: 'طلبات عروض الأسعار',
    description: 'إرسال طلبات وعروض تسعير للموردين للمقارنة.',
    href: `/${locale}/purchases/orders`,
    icon: Clock,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-50',
    metrics: [{
      label: 'بانتظار الرد',
      value: String(draftCount)
    }]
  }, {
    title: 'أوامر الشراء',
    description: 'أوامر الشراء المؤكدة والمسجلة للموردين.',
    href: `/${locale}/purchases/orders`,
    icon: ShoppingCart,
    colorClass: 'text-teal-700',
    bgClass: 'bg-emerald-50',
    metrics: [{
      label: 'إجمالي الأوامر',
      value: String(totalData._count || 0)
    }, {
      label: 'القيمة',
      value: totalFormatted
    }]
  }, {
    title: 'الموردون',
    description: 'قاعدة بيانات الموردين وتقييماتهم.',
    href: `/${locale}/contacts`,
    icon: Users,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    metrics: [{
      label: 'نشط',
      value: String(vendorCount)
    }]
  }, {
    title: 'المنتجات المطلوبة',
    description: 'المنتجات التي ينخفض مخزونها وتحتاج إعادة طلب.',
    href: `/${locale}/inventory`,
    icon: AlertCircle,
    colorClass: 'text-red-700',
    bgClass: 'bg-rose-50',
    metrics: [{
      label: 'تنبيه النواقص',
      value: String(shortageCount)
    }]
  }, {
    title: 'فواتير الموردين',
    description: 'مطابقة استلام البضائع مع فواتير الشراء والدفع.',
    href: `/${locale}/accounting/bills`,
    icon: Receipt,
    colorClass: 'text-indigo-600',
    bgClass: 'bg-indigo-50',
    metrics: billCount > 0 ? [{
      label: 'فواتير',
      value: String(billCount)
    }] : undefined
  }, {
    title: 'تحليل المشتريات',
    description: 'رسم بياني لتحليل نفقات الشراء الشهرية.',
    href: `/${locale}/purchases/analysis`,
    icon: TrendingUp,
    colorClass: 'text-cyan-600',
    bgClass: 'bg-cyan-50'
  }];
  return <div className="bg-[#f8fafc] w-full min-h-screen py-6 px-4"> {ordersToBill.length > 0 && <div className="max-w-7xl mx-auto mb-6 bg-orange-50 border-r-4 border-orange-500 p-4 rounded-sm shadow-sm flex items-start gap-4"> <div className="bg-orange-100 p-2 rounded-full"> <Receipt className="w-6 h-6 text-orange-600" /> </div> <div> <h3 className="text-lg font-bold text-orange-900">تنبيه: بضائع دخلت المخزن ولم تُفوتر بعد!</h3> <p className="text-sm text-orange-800 mt-1">يوجد عدد <strong>{ordersToBill.length}</strong> أمر شراء تم استلام بعض أو كل بضاعته من الموردين، وما زالت لم تصدر لها فاتورة شراء مالية (مسودة). يرجى مراجعة الاستلامات واستخراج الفواتير لمطابقة الحسابات.</p> <div className="mt-2 flex flex-wrap gap-2"> {ordersToBill.map((order: any) => <Link key={order.id} href={`/${locale}/purchases/${order.id}`} className="inline-flex items-center gap-1 bg-white text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-200 hover:bg-orange-100 hover:text-orange-900 transition-colors"> <span>{order.name}</span> <ArrowRight className="w-3 h-3 rtl:scale-x-[-1]" /> </Link>)} </div> </div> </div>} <DashboardCards title="لوحة المشتريات (Purchases)" subtitle="إدارة دورة التوريد واعتماد أوامر الشراء" cards={purchaseCards} /> </div>;
}