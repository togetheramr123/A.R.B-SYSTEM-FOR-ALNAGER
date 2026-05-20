import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, Search, Package, ChevronLeft, ChevronRight, Download, Filter, BarChart3, Grid3X3, List } from "lucide-react";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { serializeDecimal } from "@/lib/serialize";
import { cn } from "@/lib/utils";
export default async function ProductVariantsListPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    filter?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const q = searchParams?.q;
  const filter = searchParams?.filter;
  const t = await getTranslations("Inventory");
  const currentPage = parseInt(searchParams?.page || "1");
  const pageSize = 25;
  const skip = (currentPage - 1) * pageSize;
  const session = await getSession();
  const companyId = session?.companyId;
  if (!companyId) redirect(`/${locale}`);
  const where: any = {
    active: true,
    companyId,
    templateId: {
      not: null
    }
  };
  if (q) {
    where.OR = [{
      name: {
        contains: q,
        mode: "insensitive"
      }
    }, {
      barcode: {
        contains: q,
        mode: "insensitive"
      }
    }, {
      sku: {
        contains: q,
        mode: "insensitive"
      }
    }, {
      internalReference: {
        contains: q,
        mode: "insensitive"
      }
    }, {
      description: {
        contains: q,
        mode: "insensitive"
      }
    }, {
      descriptionSale: {
        contains: q,
        mode: "insensitive"
      }
    }, {
      uom: {
        contains: q,
        mode: "insensitive"
      }
    }, {
      category: {
        name: {
          contains: q,
          mode: "insensitive"
        }
      }
    }];
  }
  if (filter === "storable") where.type = "storable";
  if (filter === "service") where.type = "service";
  if (filter === "consu") where.type = "consu";
  const [products, totalCount] = await Promise.all([prisma.product.findMany({
    where,
    include: {
      category: true,
      stockQuants: {
        include: {
          location: true
        }
      }
    },
    orderBy: {
      name: "asc"
    },
    skip,
    take: pageSize
  }), prisma.product.count({
    where
  })]);
  const totalPages = Math.ceil(totalCount / pageSize);
  const serializedProducts = serializeDecimal(products);
  const startRecord = skip + 1;
  const endRecord = Math.min(skip + pageSize, totalCount);
  const productsWithStock = serializedProducts.map((product: any) => ({
    ...product,
    totalStock: product.stockQuants?.reduce((sum: number, q: any) => sum + (q.quantity || 0), 0) || 0
  }));
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
  return <div className="p-6 space-y-5">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-xl font-bold text-gray-900">
          متغيرات المنتجات
        </h1>{" "}
        <div className="flex gap-3 items-center">
          {" "}
          <span className="text-sm text-gray-500 font-medium">
            {" "}
            {startRecord}-{endRecord} / {totalCount}{" "}
          </span>{" "}
          <button className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium border border-gray-200">
            {" "}
            <Download className="w-4 h-4" /> تصدير{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Filter Tabs */}{" "}
      <div className="flex gap-2 flex-wrap items-center">
        {" "}
        <Filter className="w-4 h-4 text-gray-400" />{" "}
        <Link href={`/${locale}/inventory/products/variants`} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer transition-colors", !filter ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
          {" "}
          الكل ({totalCount}){" "}
        </Link>{" "}
        {[{
        key: "storable",
        label: "مخزني"
      }, {
        key: "service",
        label: "خدمات"
      }, {
        key: "consu",
        label: "استهلاكي"
      }].map(f => <Link key={f.key} href={`/${locale}/inventory/products/variants?filter=${f.key}`} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors", filter === f.key ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100")}>
            {" "}
            {f.label}{" "}
          </Link>)}{" "}
      </div>{" "}
      {/* Table */}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
        {" "}
        <div className="p-4 border-b border-gray-50 flex gap-4 items-center justify-between">
          {" "}
          <form className="relative flex-1 max-w-sm">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />{" "}
            <input type="text" name="q" defaultValue={q} placeholder="بحث في المتغيرات..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-gray-50/50" />{" "}
          </form>{" "}
          <div className="flex items-center gap-1">
            {" "}
            {currentPage > 1 && <Link href={`/${locale}/inventory/products/variants?page=${currentPage - 1}${q ? `&q=${q}` : ""}${filter ? `&filter=${filter}` : ""}`} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
                {" "}
                <ChevronRight className="w-4 h-4 text-gray-500" />{" "}
              </Link>}{" "}
            <span className="text-xs text-gray-500 px-2">
              صفحة {currentPage} من {totalPages || 1}
            </span>{" "}
            {currentPage < totalPages && <Link href={`/${locale}/inventory/products/variants?page=${currentPage + 1}${q ? `&q=${q}` : ""}${filter ? `&filter=${filter}` : ""}`} className="p-1.5 hover:bg-gray-100 rounded-lg border border-gray-200">
                {" "}
                <ChevronLeft className="w-4 h-4 text-gray-500" />{" "}
              </Link>}{" "}
          </div>{" "}
        </div>{" "}
        <div className="overflow-x-auto">
          {" "}
          <table className="w-full text-right">
            {" "}
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider">
              {" "}
              <tr>
                {" "}
                <th className="px-5 py-3 w-8">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>{" "}
                <th className="px-5 py-3">اسم المتغير المجمع</th>{" "}
                <th className="px-5 py-3">الباركود / SKU</th>{" "}
                <th className="px-5 py-3">الفئة</th>{" "}
                <th className="px-5 py-3">النوع</th>{" "}
                <th className="px-5 py-3">وحدة القياس</th>{" "}
                <th className="px-5 py-3">سعر البيع</th>{" "}
                <th className="px-5 py-3">التكلفة</th>{" "}
                <th className="px-5 py-3">المخزون الداخلي</th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-gray-50">
              {" "}
              {productsWithStock.map((product: any) => {
              const typeInfo = typeLabels[product.type] || {
                label: product.type,
                color: "bg-gray-50 text-gray-600 border-gray-100"
              };
              const stockLevel = product.totalStock > 10 ? "high" : product.totalStock > 0 ? "low" : "zero";
              return <tr key={product.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer">
                    {" "}
                    <td className="px-5 py-3.5">
                      {" "}
                      <input type="checkbox" className="rounded border-gray-300" />{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5">
                      {" "}
                      <Link href={`/${locale}/inventory/products/${product.id}`} className="flex items-center gap-2">
                        {" "}
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {" "}
                          <Package className="w-4 h-4 text-gray-400" />{" "}
                        </div>{" "}
                        <span className="font-bold text-gray-900 text-sm hover:text-blue-600">
                          {product.name}
                        </span>{" "}
                      </Link>{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                      {" "}
                      {product.barcode || product.sku || "-"}{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5 text-gray-600 text-sm">
                      {" "}
                      {product.category?.name || "-"}{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5">
                      {" "}
                      <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border", typeInfo.color)}>
                        {" "}
                        {typeInfo.label}{" "}
                      </span>{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5 text-gray-600 text-sm">
                      {" "}
                      {product.uom || "-"}{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5 font-bold text-gray-900 text-sm">
                      {" "}
                      {Number(product.salePrice || 0).toLocaleString("en-US")}{" "}
                      <span className="text-[10px] text-gray-400">
                        ج.م
                      </span>{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5 text-gray-600 text-sm">
                      {" "}
                      {Number(product.costPrice || 0).toLocaleString("en-US")}{" "}
                      <span className="text-[10px] text-gray-400">
                        ج.م
                      </span>{" "}
                    </td>{" "}
                    <td className="px-5 py-3.5">
                      {" "}
                      {product.type === "storable" ? <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border", stockLevel === "high" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : stockLevel === "low" ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-red-50 text-red-700 border-red-100")}>
                          {" "}
                          {product.totalStock.toLocaleString()}{" "}
                          {product.uom || "وحدة"}{" "}
                        </span> : <span className="text-gray-400 text-xs">-</span>}{" "}
                    </td>{" "}
                  </tr>;
            })}{" "}
              {productsWithStock.length === 0 && <tr>
                  {" "}
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                    {" "}
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />{" "}
                    <p className="font-bold">لا توجد منتجات</p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}