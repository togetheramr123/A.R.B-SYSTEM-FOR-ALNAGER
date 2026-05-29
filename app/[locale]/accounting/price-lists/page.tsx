import prisma from "@/lib/prisma";
import Link from "next/link";
import { BadgeDollarSign, Search, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
export default async function PriceListsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    id?: string;
    search?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    id: selectedId,
    search
  } = await props.searchParams;
  /* Get all price lists */
  const priceLists = await prisma.priceList.findMany({
    where: {
      active: true
    },
    include: {
      _count: {
        select: {
          items: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  });
  /* Get selected price list items */
  let selectedPL: any = null;
  let items: any[] = [];
  if (selectedId) {
    selectedPL = await prisma.priceList.findUnique({
      where: {
        id: selectedId
      },
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: {
            product: {
              name: "asc"
            }
          },
          ...(search ? {
            where: {
              product: {
                OR: [{
                  name: {
                    contains: search
                  }
                }, {
                  internalReference: {
                    contains: search
                  }
                }]
              }
            }
          } : {})
        }
      }
    });
    items = selectedPL?.items || [];
  } else if (priceLists.length > 0) {
    /* Auto-select first selectedPL = */await prisma.priceList.findUnique({
      where: {
        id: priceLists[0].id
      },
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: {
            product: {
              name: "asc"
            }
          }
        }
      }
    });
    items = selectedPL?.items || [];
  }
  return <div className="flex h-full bg-[#F9FAFB]" dir="rtl">
      {" "}
      {/* Sidebar - Price Lists */}{" "}
      <div className="w-72 bg-white border-l border-slate-200 flex flex-col">
        {" "}
        <div className="p-3 border-b border-slate-200">
          {" "}
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            {" "}
            <BadgeDollarSign className="w-4 h-4 text-slate-500" /> قوائم
            الأسعار{" "}
          </h2>{" "}
        </div>{" "}
        <div className="flex-1 overflow-auto">
          {" "}
          {priceLists.length === 0 ? <div className="p-4 text-center text-slate-400 text-sm">
              {" "}
              لا توجد قوائم أسعار{" "}
            </div> : priceLists.map((pl: any) => <Link key={pl.id} href={`/${locale}/accounting/price-lists?id=${pl.id}`} className={cn("block px-4 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50", selectedPL?.id === pl.id ? "bg-sky-50 border-r-2 border-r-sky-500" : "")}>
                {" "}
                <p className={cn("text-sm font-medium", selectedPL?.id === pl.id ? "text-sky-700" : "text-slate-700")}>
                  {" "}
                  {pl.name}{" "}
                </p>{" "}
                <p className="text-xs text-slate-400 mt-0.5">
                  {" "}
                  {pl._count.items} منتج{" "}
                </p>{" "}
              </Link>)}{" "}
        </div>{" "}
      </div>{" "}
      {/* Main Content - Items */}{" "}
      <div className="flex-1 flex flex-col">
        {" "}
        <div className="border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
          {" "}
          <h1 className="text-lg font-semibold text-slate-800">
            {" "}
            {selectedPL ? selectedPL.name : "اختر قائمة أسعار"}{" "}
          </h1>{" "}
          {selectedPL && <form method="GET" className="flex items-center gap-2">
              {" "}
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="hidden" name="id" value={selectedPL.id} />{" "}
              <div className="relative">
                {" "}
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />{" "}
                <input autoComplete="off" autoCorrect="off" spellCheck={false} name="search" defaultValue={search || ""} placeholder="بحث في المنتجات..." className="pl-3 pr-9 py-1.5 text-sm border border-slate-300 rounded-md w-64 focus:outline-none focus:ring-1 focus:ring-sky-500" />{" "}
              </div>{" "}
            </form>}{" "}
        </div>{" "}
        <div className="flex-1 overflow-auto">
          {" "}
          {!selectedPL ? <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              {" "}
              <Tag className="w-12 h-12 mb-4 text-slate-300" />{" "}
              <p>اختر قائمة أسعار من القائمة الجانبية</p>{" "}
            </div> : items.length === 0 ? <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              {" "}
              <Tag className="w-12 h-12 mb-4 text-slate-300" />{" "}
              <p>لا توجد منتجات في هذه القائمة</p>{" "}
            </div> : <table className="w-full text-sm">
              {" "}
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                {" "}
                <tr>
                  {" "}
                  <th className="py-2.5 px-4 text-right font-medium">#</th>{" "}
                  <th className="py-2.5 px-4 text-right font-medium">المنتج</th>{" "}
                  <th className="py-2.5 px-4 text-right font-medium">المرجع</th>{" "}
                  <th className="py-2.5 px-4 text-left font-medium">
                    الحد الأدنى
                  </th>{" "}
                  <th className="py-2.5 px-4 text-left font-medium">
                    سعر البيع
                  </th>{" "}
                  <th className="py-2.5 px-4 text-left font-medium">
                    سعر التكلفة
                  </th>{" "}
                  <th className="py-2.5 px-4 text-left font-medium">الهامش</th>{" "}
                  <th className="py-2.5 px-4 text-center font-medium">
                    الفترة
                  </th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody className="divide-y divide-slate-100">
                {" "}
                {items.map((item: any, idx: number) => {
              const sellPrice = Number(item.price);
              const buyPrice = Number(item.buyPrice || item.product?.costPrice || 0);
              const margin = sellPrice > 0 ? (sellPrice - buyPrice) / sellPrice * 100 : 0;
              return <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      {" "}
                      <td className="py-2.5 px-4 text-slate-400">
                        {idx + 1}
                      </td>{" "}
                      <td className="py-2.5 px-4">
                        {" "}
                        <Link href={`/${locale}/inventory/products/${item.productId}`} className="text-sky-700 hover:text-sky-600 font-medium">
                          {" "}
                          {item.product?.name}{" "}
                        </Link>{" "}
                      </td>{" "}
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-xs">
                        {item.product?.internalReference || "-"}
                      </td>{" "}
                      <td className="py-2.5 px-4 text-left text-slate-600">
                        {Number(item.minQuantity)}
                      </td>{" "}
                      <td className="py-2.5 px-4 text-left font-bold text-green-700">
                        {sellPrice.toFixed(2)}
                      </td>{" "}
                      <td className="py-2.5 px-4 text-left text-orange-600">
                        {buyPrice.toFixed(2)}
                      </td>{" "}
                      <td className={cn("py-2.5 px-4 text-left text-xs font-medium", margin >= 20 ? "text-green-600" : margin >= 0 ? "text-orange-500" : "text-red-600")}>
                        {" "}
                        {margin.toFixed(1)}%{" "}
                      </td>{" "}
                      <td className="py-2.5 px-4 text-center text-slate-500 text-xs">
                        {" "}
                        {item.startDate ? new Date(item.startDate).toLocaleDateString("en-CA") : "-"}{" "}
                        {item.endDate ? ` → ${new Date(item.endDate).toLocaleDateString("en-CA")}` : ""}{" "}
                      </td>{" "}
                    </tr>;
            })}{" "}
              </tbody>{" "}
            </table>}{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}