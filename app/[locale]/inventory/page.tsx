import { getTranslations } from "next-intl/server";
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, RotateCcw, Warehouse, ClipboardList, BarChart3, Settings, Boxes, Package } from "lucide-react";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DashboardCards } from "@/components/ui/DashboardCards";
export default async function InventoryPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations("Inventory");
  let incomingCount = 0;
  let outgoingCount = 0;
  let internalCount = 0;
  let productCount = 0;
  const session = await getSession();
  const companyId = session?.companyId;
  try {
    [incomingCount, outgoingCount, internalCount, productCount] = await Promise.all([prisma.stockPicking.count({
      where: {
        pickingType: "INCOMING",
        status: {
          notIn: ["done", "cancel"]
        },
        ...(companyId ? {
          companyId
        } : {})
      }
    }).catch(() => 0), prisma.stockPicking.count({
      where: {
        pickingType: "OUTGOING",
        status: {
          notIn: ["done", "cancel"]
        },
        ...(companyId ? {
          companyId
        } : {})
      }
    }).catch(() => 0), prisma.stockPicking.count({
      where: {
        pickingType: "INTERNAL",
        status: {
          notIn: ["done", "cancel"]
        },
        ...(companyId ? {
          companyId
        } : {})
      }
    }).catch(() => 0), prisma.product.count({
      where: {
        active: true,
        ...(companyId ? {
          companyId
        } : {})
      }
    }).catch(() => 0)]);
  } catch (e) {
    console.error("Failed to fetch inventory counts:", e);
  }
  const inventoryCards = [{
    title: "المنتجات",
    description: "إدارة مخزون الفروع والمنتجات وسيريال اللوتات.",
    href: `/${locale}/inventory/products`,
    icon: Package,
    colorClass: "text-violet-600",
    bgClass: "bg-violet-50",
    metrics: [{
      label: "إجمالي المنتجات",
      value: productCount.toString()
    }]
  }, {
    title: "الاستلام",
    description: "عمليات الاستلام من الموردين لداخل المستودع.",
    href: `/${locale}/inventory/operations/receipts`,
    icon: ArrowDownToLine,
    colorClass: "text-teal-700",
    bgClass: "bg-emerald-50",
    metrics: [{
      label: "قيد المعالجة",
      value: incomingCount.toString(),
      trend: incomingCount > 0 ? "مستعجل" : ""
    }]
  }, {
    title: "التسليم",
    description: "عمليات تسليم أوامر الشحن وتوصيل الطلبات للعملاء.",
    href: `/${locale}/inventory/operations/deliveries`,
    icon: ArrowUpFromLine,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50",
    metrics: [{
      label: "للشحن",
      value: outgoingCount.toString(),
      trend: outgoingCount > 0 ? "الآن" : ""
    }]
  }, {
    title: "التحويلات الداخلية",
    description: "نقل المنتجات بين مستودعات شركتك الداخلية.",
    href: `/${locale}/inventory/operations/internal`,
    icon: ArrowLeftRight,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50",
    metrics: [{
      label: "بالانتظار",
      value: internalCount.toString()
    }]
  }, {
    title: "المرتجعات والتوالف",
    description: "عزل الوحدات التالفة ومعالجة المترجعات بمسار منفصل.",
    href: `/${locale}/inventory/scrap`,
    icon: RotateCcw,
    colorClass: "text-red-600",
    bgClass: "bg-red-50"
  }, {
    title: "تقارير المخزون",
    description: "الجرد وتحليل تحركات المنتجات بدقة.",
    href: `/${locale}/inventory/reporting/stock`,
    icon: BarChart3,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50"
  }, {
    title: "المستودعات والمواقع",
    description: "إعداد الخرائط الداخلية لمستودعات التخزين.",
    href: `/${locale}/inventory/warehouses`,
    icon: Warehouse,
    colorClass: "text-slate-600",
    bgClass: "bg-slate-50"
  }, {
    title: "فئات المنتجات",
    description: "تصنيفات وتسلسل شجرة منتجات المخزن.",
    href: `/${locale}/inventory/products/categories`,
    icon: Boxes,
    colorClass: "text-teal-600",
    bgClass: "bg-teal-50"
  }, {
    title: "التسويات المخزنية",
    description: "عمليات الجرد المطابقة لمعالجة فروقات الجرد الفعلي.",
    href: `/${locale}/inventory/adjustments`,
    icon: Settings,
    colorClass: "text-gray-600",
    bgClass: "bg-gray-50"
  }];
  return <div className="bg-[#f8fafc] w-full min-h-screen py-6 px-4">
      {" "}
      <DashboardCards title={t("title") || "لوحة المخازن (Inventory)"} subtitle="لوحة تحكم عمليات ومراقبة المخزون" cards={inventoryCards} />{" "}
    </div>;
}