import prisma from "@/lib/prisma";
import Link from "next/link";
import { Package, TrendingUp, DollarSign, Search, Printer, Download, ChevronLeft, ChevronRight, BarChart3, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
export default async function StockValuationPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    page: pageStr,
    search,
    category
  } = await props.searchParams;
  const page = parseInt(pageStr || "1");
  const perPage = 30;
  const where: any = {
    ...(search ? {
      OR: [{
        name: {
          contains: search
        }
      }, {
        internalReference: {
          contains: search
        }
      }, {
        barcode: {
          contains: search
        }
      }]
    } : {}),
    ...(category ? {
      categoryId: category
    } : {})
  };
  const [products, total, categories] = await Promise.all([prisma.product.findMany({
    where,
    include: {
      category: true,
      stockQuants: {
        select: {
          quantity: true
        }
      }
    },
    orderBy: {
      name: "asc"
    },
    skip: (page - 1) * perPage,
    take: perPage
  }), prisma.product.count({
    where
  }), prisma.productCategory.findMany({
    orderBy: {
      name: "asc"
    }
  })]);
  const totalPages = Math.ceil(total / perPage); // Compute grand totals from all products (separate query for accuracy);
  const allProductsForTotals = await prisma.product.findMany({
    select: {
      costPrice: true,
      categoryId: true,
      stockQuants: {
        select: {
          quantity: true
        }
      }
    }
  });
  let grandTotalValue = 0;
  let grandTotalItems = 0;
  const categoryValueMap: Record<string, {
    name: string;
    value: number;
  }> = {};
  for (const p of allProductsForTotals) {
    const qty = (p as any).stockQuants?.reduce((sum: number, q: any) => sum + Number(q.quantity || 0), 0) || 0;
    const cost = Number(p.costPrice || 0);
    const val = qty * cost;
    grandTotalValue += val;
    grandTotalItems += qty;
    const catId = p.categoryId || "__uncategorized";
    if (!categoryValueMap[catId]) {
      const catName = categories.find((c: any) => c.id === catId)?.name || "بدون فئة";
      categoryValueMap[catId] = {
        name: catName,
        value: 0
      };
    }
    categoryValueMap[catId].value += val;
  } // Top 5 categories by value for mini chart
  const topCategories = Object.values(categoryValueMap).sort((a, b) => b.value - a.value).slice(0, 5);
  const maxCatValue = topCategories[0]?.value || 1; // Current page rows
  let pageTotalValue = 0;
  let pageTotalItems = 0;
  const rows = products.map((p: any) => {
    const qty = p.stockQuants?.reduce((sum: number, q: any) => sum + Number(q.quantity || 0), 0) || 0;
    const cost = Number(p.costPrice || 0);
    const value = qty * cost;
    const pct = grandTotalValue > 0 ? value / grandTotalValue * 100 : 0;
    pageTotalValue += value;
    pageTotalItems += qty;
    return {
      ...p,
      qty,
      cost,
      value,
      pct
    };
  }); // Average cost
  const avgCost = grandTotalItems > 0 ? grandTotalValue / grandTotalItems : 0;
  const catColors = ["bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-violet-500", "bg-rose-500"];
  return <div className="flex flex-col h-full bg-[#F8FAFC]" dir="rtl">
      {" "}
      {/* Header */}{" "}
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        {" "}
        <div className="flex items-center justify-between mb-4">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <div className="w-9 h-9 bg-[#714B67] rounded-sm flex items-center justify-center shadow-md ">
              {" "}
              <TrendingUp className="w-5 h-5 text-white" />{" "}
            </div>{" "}
            <div>
              {" "}
              <h1 className="text-lg font-bold text-slate-900">
                تقييم المخزون
              </h1>{" "}
              <p className="text-[11px] text-slate-400 font-medium">
                تقرير التكلفة والقيمة الإجمالية للمنتجات
              </p>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
              {" "}
              <Printer className="w-4 h-4" /> طباعة{" "}
            </button>{" "}
            <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium">
              {" "}
              <Download className="w-4 h-4" /> تصدير{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
        {/* Stats Cards */}{" "}
        <div className="grid grid-cols-4 gap-3">
          {" "}
          <div className="bg-[#714B67] border border-sky-200/60 rounded-sm px-4 py-3">
            {" "}
            <p className="text-[11px] text-sky-500 font-bold mb-1">
              إجمالي المنتجات
            </p>{" "}
            <p className="text-2xl font-bold text-sky-700">{total}</p>{" "}
            <p className="text-[10px] text-sky-400 mt-0.5">منتج</p>{" "}
          </div>{" "}
          <div className="bg-[#714B67] border border-emerald-200/60 rounded-sm px-4 py-3">
            {" "}
            <p className="text-[11px] text-emerald-500 font-bold mb-1">
              إجمالي الكمية
            </p>{" "}
            <p className="text-2xl font-bold text-emerald-700">
              {grandTotalItems.toLocaleString("en-US")}
            </p>{" "}
            <p className="text-[10px] text-emerald-400 mt-0.5">وحدة</p>{" "}
          </div>{" "}
          <div className="bg-[#714B67] border border-violet-200/60 rounded-sm px-4 py-3">
            {" "}
            <p className="text-[11px] text-violet-500 font-bold mb-1">
              إجمالي القيمة
            </p>{" "}
            <p className="text-2xl font-bold text-violet-700">
              {grandTotalValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            </p>{" "}
            <p className="text-[10px] text-violet-400 mt-0.5">ج.م</p>{" "}
          </div>{" "}
          <div className="bg-[#714B67] border border-amber-200/60 rounded-sm px-4 py-3">
            {" "}
            <p className="text-[11px] text-amber-500 font-bold mb-1">
              متوسط تكلفة الوحدة
            </p>{" "}
            <p className="text-2xl font-bold text-amber-700">
              {avgCost.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
            </p>{" "}
            <p className="text-[10px] text-amber-400 mt-0.5">ج.م / وحدة</p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Mini Category Chart + Filters */}{" "}
      <div className="px-5 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-4">
        {" "}
        {/* Category Distribution */}{" "}
        {topCategories.length > 0 && <div className="flex items-center gap-3 flex-1">
            {" "}
            <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />{" "}
            <div className="flex items-center gap-2 flex-1">
              {" "}
              {topCategories.map((cat, i) => <div key={cat.name} className="flex items-center gap-1.5" title={`${cat.name}: ${cat.value.toLocaleString("en-US", {
            minimumFractionDigits: 2
          })} ج.م`}>
                  {" "}
                  <div className={cn("h-5 rounded-sm min-w-[4px]", catColors[i % catColors.length])} style={{
              width: `${Math.max(4, cat.value / maxCatValue * 80)}px`
            }} />{" "}
                  <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">
                    {cat.name}
                  </span>{" "}
                </div>)}{" "}
            </div>{" "}
          </div>}{" "}
        {/* Filters */}{" "}
        <form method="GET" className="flex items-center gap-2">
          {" "}
          <select name="category" defaultValue={category || ""} className="text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
            {" "}
            <option value="">كل الفئات</option>{" "}
            {categories.map((cat: any) => <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>)}{" "}
          </select>{" "}
          <div className="relative">
            {" "}
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
            <input name="search" defaultValue={search || ""} placeholder="بحث منتج..." className="pl-3 pr-9 py-1.5 text-sm border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white" />{" "}
          </div>{" "}
        </form>{" "}
      </div>{" "}
      {/* Table */}{" "}
      <div className="flex-1 overflow-auto px-5 py-3">
        {" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200/80 overflow-hidden">
          {" "}
          <table className="w-full text-sm">
            {" "}
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 sticky top-0">
              {" "}
              <tr>
                {" "}
                <th className="py-2.5 px-4 text-right font-bold text-[11px] uppercase tracking-wider w-12">
                  #
                </th>{" "}
                <th className="py-2.5 px-4 text-right font-bold text-[11px] uppercase tracking-wider">
                  المنتج
                </th>{" "}
                <th className="py-2.5 px-4 text-right font-bold text-[11px] uppercase tracking-wider">
                  المرجع
                </th>{" "}
                <th className="py-2.5 px-4 text-right font-bold text-[11px] uppercase tracking-wider">
                  الفئة
                </th>{" "}
                <th className="py-2.5 px-4 text-right font-bold text-[11px] uppercase tracking-wider">
                  الوحدة
                </th>{" "}
                <th className="py-2.5 px-4 text-left font-bold text-[11px] uppercase tracking-wider">
                  الكمية
                </th>{" "}
                <th className="py-2.5 px-4 text-left font-bold text-[11px] uppercase tracking-wider">
                  سعر التكلفة
                </th>{" "}
                <th className="py-2.5 px-4 text-left font-bold text-[11px] uppercase tracking-wider">
                  القيمة
                </th>{" "}
                <th className="py-2.5 px-4 text-left font-bold text-[11px] uppercase tracking-wider w-24">
                  % من الإجمالي
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100">
              {" "}
              {rows.map((p: any, idx: number) => <tr key={p.id} className="hover:bg-sky-50/30 transition-colors group">
                  {" "}
                  <td className="py-2.5 px-4 text-slate-400 text-xs">
                    {(page - 1) * perPage + idx + 1}
                  </td>{" "}
                  <td className="py-2.5 px-4">
                    {" "}
                    <Link href={`/${locale}/inventory/products/${p.id}`} className="text-sky-700 hover:text-sky-500 font-bold text-sm transition-colors">
                      {" "}
                      {p.name}{" "}
                    </Link>{" "}
                  </td>{" "}
                  <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">
                    {p.internalReference || "—"}
                  </td>{" "}
                  <td className="py-2.5 px-4">
                    {" "}
                    {p.category?.name ? <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-medium">
                        {p.category.name}
                      </span> : <span className="text-slate-300">—</span>}{" "}
                  </td>{" "}
                  <td className="py-2.5 px-4 text-slate-600 text-xs">
                    {p.uom || "قطعة"}
                  </td>{" "}
                  <td className={cn("py-2.5 px-4 text-left font-bold text-sm", p.qty > 0 ? "text-teal-700" : p.qty < 0 ? "text-red-600" : "text-slate-300")}>
                    {" "}
                    {p.qty.toLocaleString("en-US")}{" "}
                  </td>{" "}
                  <td className="py-2.5 px-4 text-left text-slate-700 font-medium">
                    {p.cost.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                  </td>{" "}
                  <td className={cn("py-2.5 px-4 text-left font-bold", p.value > 0 ? "text-slate-900" : "text-slate-300")}>
                    {" "}
                    {p.value.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}{" "}
                  </td>{" "}
                  <td className="py-2.5 px-4 text-left">
                    {" "}
                    <div className="flex items-center gap-1.5">
                      {" "}
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        {" "}
                        <div className={cn("h-full rounded-full transition-all", p.pct > 20 ? "bg-sky-500" : p.pct > 5 ? "bg-sky-400" : "bg-sky-300")} style={{
                      width: `${Math.min(100, p.pct)}%`
                    }} />{" "}
                      </div>{" "}
                      <span className="text-[10px] text-slate-400 font-bold w-10 text-left">
                        {" "}
                        {p.pct.toFixed(1)}%{" "}
                      </span>{" "}
                    </div>{" "}
                  </td>{" "}
                </tr>)}{" "}
              {rows.length === 0 && <tr>
                  {" "}
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    {" "}
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />{" "}
                    <p className="font-bold text-sm">لا توجد منتجات</p>{" "}
                    <p className="text-xs mt-1">أضف منتجات لرؤيتها هنا</p>{" "}
                  </td>{" "}
                </tr>}{" "}
            </tbody>{" "}
            {/* Totals Footer */}{" "}
            <tfoot className="bg-gray-50 border-t-2 border-slate-300">
              {" "}
              <tr className="font-bold text-slate-900">
                {" "}
                <td colSpan={5} className="py-3 px-4 text-right text-sm">
                  {" "}
                  إجمالي الصفحة:{" "}
                </td>{" "}
                <td className="py-3 px-4 text-left text-emerald-700 text-sm">
                  {pageTotalItems.toLocaleString("en-US")}
                </td>{" "}
                <td className="py-3 px-4 text-left text-sm">—</td>{" "}
                <td className="py-3 px-4 text-left text-lg">
                  {pageTotalValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2
                })}
                </td>{" "}
                <td className="py-3 px-4 text-left text-xs text-slate-500">
                  {" "}
                  {grandTotalValue > 0 ? (pageTotalValue / grandTotalValue * 100).toFixed(1) : 0}
                  %{" "}
                </td>{" "}
              </tr>{" "}
            </tfoot>{" "}
          </table>{" "}
        </div>{" "}
      </div>{" "}
      {/* Pagination */}{" "}
      {totalPages > 1 && <div className="border-t border-slate-200 bg-white px-5 py-2.5 flex items-center justify-between text-sm text-slate-600">
          {" "}
          <span className="font-medium">{total} منتج</span>{" "}
          <div className="flex gap-1 items-center">
            {" "}
            {page > 1 && <Link href={`/${locale}/inventory/valuation?page=${page - 1}${search ? "&search=" + search : ""}${category ? "&category=" + category : ""}`} className="px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center gap-1">
                {" "}
                <ChevronRight className="w-4 h-4" /> السابق{" "}
              </Link>}{" "}
            <span className="px-3 py-1.5 font-bold">
              صفحة {page} من {totalPages}
            </span>{" "}
            {page < totalPages && <Link href={`/${locale}/inventory/valuation?page=${page + 1}${search ? "&search=" + search : ""}${category ? "&category=" + category : ""}`} className="px-3 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium flex items-center gap-1">
                {" "}
                التالي <ChevronLeft className="w-4 h-4" />{" "}
              </Link>}{" "}
          </div>{" "}
        </div>}{" "}
    </div>;
}