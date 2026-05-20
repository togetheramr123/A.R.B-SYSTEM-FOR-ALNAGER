import { DashboardCards } from "@/components/ui/DashboardCards";
import { Store, ShoppingBag, FileText, Users, Boxes, TrendingUp, Users2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { serializeDecimal } from "@/lib/serialize";
import { getSession } from "@/lib/auth";
import Link from "next/link";

export default async function SalesDashboardPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations("Sales");
  const session = await getSession();
  const companyId = session?.companyId;
  /* Fetch real data from database */
  const [draftCount, confirmedCount, totalAggregate, customerCount, productCount, invoiceAggregate, confirmedOrdersWithLines] = await Promise.all([prisma.saleOrder.count({
    where: {
      status: "draft",
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.saleOrder.count({
    where: {
      status: "sale",
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.saleOrder.aggregate({
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
      isCustomer: true,
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.product.count({
    where: {
      active: true,
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.invoice.aggregate({
    _sum: {
      amountTotal: true
    },
    where: {
      type: "out_invoice",
      state: "posted",
      ...(companyId ? {
        companyId
      } : {})
    }
  }), prisma.saleOrder.findMany({
    where: {
      status: "sale",
      ...(companyId ? {
        companyId
      } : {})
    },
    include: {
      lines: true
    }
  })]);
  /* Check which ones have pending items to invoice */
  const ordersToInvoice = confirmedOrdersWithLines.filter(order => {
    return order.lines.some(l => Number(l.qtyDelivered || 0) > Number(l.qtyInvoiced || 0));
  });
  const totalData = serializeDecimal(totalAggregate);
  const totalValue = Number(totalData._sum?.amountTotal || 0);
  const totalFormatted = totalValue >= 1000 ? `${(totalValue / 1000).toFixed(0)}K` : totalValue.toLocaleString("en-US");
  const salesCards = [{
    title: "عروض الأسعار",
    description: "إدارة وتتبع عروض الأسعار المسودة والجاهزة للتحويل.",
    href: `/${locale}/sales/orders?filter=draft`,
    icon: FileText,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    metrics: [{
      label: "مسودة",
      value: String(draftCount)
    }, {
      label: "مؤكدة",
      value: String(confirmedCount)
    }]
  }, {
    title: "أوامر البيع",
    description: "متابعة أوامر البيع المؤكدة وحالتها من حيث التسليم والفوترة.",
    href: `/${locale}/sales/orders`,
    icon: ShoppingBag,
    colorClass: "text-teal-700",
    bgClass: "bg-emerald-50",
    metrics: [{
      label: "إجمالي الأوامر",
      value: String(totalData._count || 0)
    }, {
      label: "القيمة",
      value: totalFormatted
    }]
  }, {
    title: "العملاء",
    description: "إدارة جهات الاتصال الخاصة بالعملاء وقوائم تصنيفاتهم.",
    href: `/${locale}/contacts`,
    icon: Users,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    metrics: [{
      label: "عميل نشط",
      value: String(customerCount)
    }]
  }, {
    title: "قوائم الأسعار",
    description: "إعداد وتخصيص قوائم الأسعار للعملاء.",
    href: `/${locale}/sales/pricelists`,
    icon: Users2,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50"
  }, {
    title: "منتجات البيع",
    description: "تصفح قائمة المنتجات المتاحة للبيع مع أسعارها.",
    href: `/${locale}/inventory`,
    icon: Boxes,
    colorClass: "text-purple-600",
    bgClass: "bg-purple-50",
    metrics: productCount > 0 ? [{
      label: "منتج",
      value: String(productCount)
    }] : undefined
  }, {
    title: "تحليل المبيعات",
    description: "تقارير بيانية تفصيلية لمبيعات الشركة والإيرادات.",
    href: `/${locale}/sales/analysis`,
    icon: TrendingUp,
    colorClass: "text-red-700",
    bgClass: "bg-rose-50"
  }];
  return <div className="bg-[#f8fafc] w-full min-h-screen py-6 px-4">
      {" "}
      {ordersToInvoice.length > 0 && <div className="max-w-7xl mx-auto mb-6 bg-orange-50 border-r-4 border-orange-500 p-4 rounded-sm shadow-sm flex items-start gap-4">
          {" "}
          <div className="bg-orange-100 p-2 rounded-full">
            {" "}
            <FileText className="w-6 h-6 text-orange-600" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h3 className="text-lg font-bold text-orange-900">
              تنبيه: بضائع خرجت من المخزن ولم تُفوتر بعد!
            </h3>{" "}
            <p className="text-sm text-orange-800 mt-1 mb-3">
              يوجد عدد <strong>{ordersToInvoice.length}</strong> أمر بيع تم
              تسليم بعض أو كل بضاعته للعملاء، وما زالت لم تصدر لها فاتورة مالية.
              يرجى مراجعة أوامر البيع واستخراج الفواتير لحفظ المستحقات.
            </p>{" "}
            <div className="flex flex-wrap gap-2">
              {ordersToInvoice.map((order) => (
                <Link key={order.id} href={`/${locale}/sales/${order.id}`} className="bg-orange-200 text-orange-900 px-3 py-1 rounded-sm text-sm font-semibold hover:bg-orange-300 transition-colors">
                  {order.name}
                </Link>
              ))}
            </div>
          </div>{" "}
        </div>}{" "}
      <DashboardCards title="لوحة المبيعات (Sales)" subtitle="نظرة عامة على عمليات ونشاطات قسم المبيعات" cards={salesCards} />{" "}
    </div>;
}