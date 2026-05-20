import { getTranslations } from 'next-intl/server';
import prisma from '@/lib/prisma';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import { Decimal } from '@prisma/client/runtime/library';
export default async function AnalyticsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations('Analytics'); /* 1. KPI Calculations */
  const [revenueData, expenseData, activeOrders] = await Promise.all([prisma.invoice.aggregate({
    _sum: {
      amountTotal: true
    },
    where: {
      state: {
        in: ['posted', 'paid']
      }
    }
  }), prisma.purchaseOrder.aggregate({
    _sum: {
      amountTotal: true
    },
    where: {
      status: {
        in: ['purchase', 'done']
      }
    }
  }), prisma.saleOrder.count({
    where: {
      status: {
        notIn: ['cancel', 'done']
      }
    }
  })]);
  const totalRevenue = new Decimal(revenueData._sum.amountTotal || 0);
  const totalExpenses = new Decimal(expenseData._sum.amountTotal || 0);
  const netProfit = totalRevenue.minus(totalExpenses);
  const kpis = [{
    label: t('totalRevenue'),
    value: totalRevenue.toNumber(),
    icon: 'DollarSign',
    growth: '+15.2%'
  }, {
    label: t('totalExpenses'),
    value: totalExpenses.toNumber(),
    icon: 'ShoppingBag',
    growth: '+2.1%'
  }, {
    label: t('netProfit'),
    value: netProfit.toNumber(),
    icon: 'TrendingUp',
    growth: '+18.1%'
  }, {
    label: 'الطلبات النشطة',
    value: activeOrders,
    icon: 'Package',
    growth: '+5.4%'
  }]; /* 2. Monthly Performance (Line Chart) // We'll group by month from invoices // Simplified for demo: Last 6 months // Converting totals to numbers for chart calculation */
  const revNum = totalRevenue.toNumber();
  const expNum = totalExpenses.toNumber();
  const monthlyData = [{
    name: 'Jul',
    revenue: revNum * 0.12,
    expenses: expNum * 0.1
  }, {
    name: 'Aug',
    revenue: revNum * 0.15,
    expenses: expNum * 0.12
  }, {
    name: 'Sep',
    revenue: revNum * 0.18,
    expenses: expNum * 0.15
  }, {
    name: 'Oct',
    revenue: revNum * 0.20,
    expenses: expNum * 0.18
  }, {
    name: 'Nov',
    revenue: revNum * 0.17,
    expenses: expNum * 0.22
  }, {
    name: 'Dec',
    revenue: revNum * 0.18,
    expenses: expNum * 0.23
  }]; /* 3. Top Categories (Pie Chart) // We'll find top partners instead of categories for now to show real */
  variety;
  const topPartners = await prisma.invoice.groupBy({
    by: ['partnerId'],
    _sum: {
      amountTotal: true
    },
    orderBy: {
      _sum: {
        amountTotal: 'desc'
      }
    },
    take: 5
  });
  const partnerDetails = await prisma.partner.findMany({
    where: {
      id: {
        in: topPartners.map((p: any) => p.partnerId)
      }
    }
  });
  const pieData = topPartners.map((tp: any, i: number) => ({
    name: partnerDetails.find((p: any) => p.id === tp.partnerId)?.name || 'Unknown',
    value: new Decimal(tp._sum.amountTotal || 0).toNumber()
  }));
  return <AnalyticsCharts data={monthlyData} pieData={pieData} kpis={kpis} locale={locale} />;
}