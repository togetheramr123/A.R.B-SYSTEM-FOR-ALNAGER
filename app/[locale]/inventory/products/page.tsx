import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { serializeDecimal } from "@/lib/serialize";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/auth";
import { ProductListClient } from "@/components/inventory/ProductListClient";
import { getProductMetrics } from "@/app/actions/inventory";
export const dynamic = "force-dynamic";
export default async function ProductListPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    filter?: string;
    templateId?: string;
    groupBy?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const q = searchParams?.q;
  const filter = searchParams?.filter;
  const groupBy = searchParams?.groupBy;
  const templateId = searchParams?.templateId;
  const t = await getTranslations("Inventory");
  const currentPage = parseInt(searchParams?.page || "1");
  const pageSize = 25;
  const skip = (currentPage - 1) * pageSize;
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) redirect(`/${locale}`);
  const where: any = {
    companyId
  }; // Archive filter: show archived or active products
  if (filter === "archived") {
    where.active = false;
  } else {
    where.active = true;
  }
  if (templateId) {
    where.templateId = templateId;
  } else {
    where.templateId = null;
  }
  if (q) {
    where.OR = [{
      name: {
        contains: q
      }
    }, {
      barcode: {
        contains: q
      }
    }, {
      sku: {
        contains: q
      }
    }, {
      internalReference: {
        contains: q
      }
    }, {
      description: {
        contains: q
      }
    }, {
      descriptionSale: {
        contains: q
      }
    }, {
      uom: {
        contains: q
      }
    }, {
      category: {
        name: {
          contains: q
        }
      }
    }];
  }
  if (filter === "storable") {
    where.type = "storable";
    where.active = true;
  }
  if (filter === "service") {
    where.type = "service";
    where.active = true;
  }
  if (filter === "consu") {
    where.type = "consu";
    where.active = true;
  }
  if (filter === "can_sell") {
    where.canBeSold = true;
    where.active = true;
  }
  if (filter === "can_purchase") {
    where.canBePurchased = true;
    where.active = true;
  }
  if (filter === "available") {
    where.stockQuants = {
      some: {
        quantity: { gt: 0 }
      }
    };
    where.active = true;
  }
  let orderBy: any = {
    name: "asc"
  };
  if (groupBy === "category") {
    orderBy = [{
      categoryId: "asc"
    }, {
      name: "asc"
    }];
  } else if (groupBy === "type") {
    orderBy = [{
      type: "asc"
    }, {
      name: "asc"
    }];
  }
  const [products, totalCount] = await Promise.all([prisma.product.findMany({
    where,
    include: {
      category: true,
      tags: true,
      stockQuants: {
        include: {
          location: true
        }
      }
    },
    orderBy,
    skip,
    take: pageSize
  }), prisma.product.count({
    where
  })]);
  const totalPages = Math.ceil(totalCount / pageSize);

  // If grouping is active, calculate group summaries instead of paginating products blindly
  const typeLabels: Record<string, {
    label: string;
    color: string;
  }> = {
    storable: {
      label: "مخزني",
      color: "bg-blue-50 text-blue-700 border-blue-100"
    },
    service: {
      label: "خدمة",
      color: "bg-slate-50 text-slate-700 border-slate-200"
    },
    consu: {
      label: "استهلاكي",
      color: "bg-amber-50 text-amber-700 border-amber-100"
    }
  };
  let groupSummaries = undefined;
  if (groupBy) {
    if (groupBy === "category") {
      const grouped = await prisma.product.groupBy({
        by: ['categoryId'],
        where,
        _count: { id: true }
      });
      const categoryIds = grouped.map(g => g.categoryId).filter(Boolean);
      const categories = await prisma.productCategory.findMany({
        where: { id: { in: categoryIds as string[] } }
      });
      const catMap = categories.reduce((acc: any, c: any) => ({...acc, [c.id]: c.name}), {});
      
      groupSummaries = grouped.map(g => ({
        key: g.categoryId ? catMap[g.categoryId] || "غير معروف" : "بدون فئة",
        count: g._count.id
      }));
    } else if (groupBy === "type") {
      const grouped = await prisma.product.groupBy({
        by: ['type'],
        where,
        _count: { id: true }
      });
      groupSummaries = grouped.map(g => ({
        key: typeLabels[g.type]?.label || g.type,
        count: g._count.id
      }));
    }
  }
  const serializedProducts = serializeDecimal(products);
  const startRecord = skip + 1;
  const endRecord = Math.min(skip + pageSize, totalCount);
  // Fetch responsible users
  const userIds = [...new Set(serializedProducts.map((p: any) => p.createdById).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds as string[] } },
    select: { id: true, name: true }
  });
  const userMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.name }), {});

  // Enhance products with metrics and users
  let productsWithStock = await Promise.all(
    serializedProducts.map(async (product: any) => {
      const metrics = await getProductMetrics(product.id);
      const totalStock = product.stockQuants?.reduce((sum: number, q: any) => sum + (Number(q.quantity) || 0), 0) || 0;
      return {
        ...product,
        totalStock,
        forecastedQty: metrics.forecasted,
        responsibleName: product.createdById ? userMap[product.createdById] || "غير معروف" : "غير محدد"
      };
    })
  );

  if (filter === "negative_forecast") {
    productsWithStock = productsWithStock.filter((p: any) => p.forecastedQty < 0);
  }
 // Build pagination URLs
  const buildUrl = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    if (groupBy) params.set("groupBy", groupBy);
    const qs = params.toString();
    return `/${locale}/inventory/products${qs ? `?${qs}` : ""}`;
  };
  return <div className="flex flex-col bg-white">
      {" "}
      <ProductListClient groupSummaries={groupSummaries} products={productsWithStock} locale={locale} typeLabels={typeLabels} searchQuery={q} groupBy={groupBy} totalCount={totalCount} pagination={{
      currentPage,
      totalPages,
      startRecord,
      endRecord,
      prevUrl: currentPage > 1 ? buildUrl(currentPage - 1) : undefined,
      nextUrl: currentPage < totalPages ? buildUrl(currentPage + 1) : undefined
    }} />{" "}
    </div>;
}