import { getTranslations } from "next-intl/server";
import prisma from "@/lib/prisma";
import { OdooSearch, FilterOption, GroupByOption } from "@/components/ui/OdooSearch";
import { PivotTable, PivotConfig } from "@/components/ui/PivotTable";
import { Package, BarChart3, Layers, MapPin } from "lucide-react";
export default async function StockAnalysisPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    filter?: string;
    groupBy?: string;
    lotId?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    q,
    filter,
    groupBy,
    lotId
  } = await props.searchParams;
  const t = await getTranslations("Inventory"); // 1. Build Filter Query
  const where: any = {
    quantity: {
      not: 0
    }
  };
  if (q) {
    where.product = {
      OR: [{
        name: {
          contains: q
        }
      }, {
        sku: {
          contains: q
        }
      }]
    };
  }
  if (lotId) {
    where.lotId = lotId;
  } // 2. Fetch Data (Flat List of Quants);
  const quants = await prisma.stockQuant.findMany({
    where,
    include: {
      product: {
        include: {
          category: true
        }
      },
      location: true,
      // @ts-ignore
      lot: true,
    }
  });
  // 3. Fetch available lots for filter dropdown
  const allLots = await prisma.stockLot.findMany({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: "asc"
    }
  }); // 4. Transform Data for Pivot
  const flatData = quants.map((sq: any) => ({
    id: sq.id,
    الفئة: sq.product.category?.name || "بدون فئة",
    المنتج: sq.product.name,
    الموقع: sq.location.name,
    اللوت: sq.lot?.name || "—",
    الكمية: Number(sq.quantity || 0),
    "الكمية المحجوزة": Number(sq.reservedQty || 0),
    value: Number(sq.quantity || 0) * Number(sq.product.costPrice || 0)
  })); // 5. Configure Pivot
  let pivotConfig: PivotConfig = {
    rows: ["الفئة", "المنتج"],
    cols: ["الموقع"],
    measures: ["الكمية", "الكمية المحجوزة"]
  };
  if (groupBy === "location") {
    pivotConfig = {
      rows: ["الموقع"],
      cols: ["الفئة"],
      measures: ["الكمية", "الكمية المحجوزة"]
    };
  } else if (groupBy === "lot") {
    pivotConfig = {
      rows: ["اللوت", "المنتج"],
      cols: ["الموقع"],
      measures: ["الكمية", "الكمية المحجوزة"]
    };
  } // Filter Options
  const filters: FilterOption[] = [{
    label: "مواقع داخلية",
    key: "internal",
    domain: {}
  }];
  const groupOptions: GroupByOption[] = [{
    label: "الموقع",
    key: "location"
  }, {
    label: "الفئة",
    key: "category"
  }, {
    label: "اللوت / السيريال",
    key: "lot"
  }];
  const totalStock = flatData.reduce((s: number, x: any) => s + x["الكمية"], 0);
  const totalValue = flatData.reduce((s: number, x: any) => s + x.value, 0);
  const uniqueProducts = new Set(flatData.map((x: any) => x["المنتج"])).size;
  const uniqueLocations = new Set(flatData.map((x: any) => x["الموقع"])).size;
  return <div className="space-y-5 p-1">
      {" "}
      {/* Header */}{" "}
      <div className="flex justify-between items-center">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="w-9 h-9 bg-[#714B67] rounded-sm flex items-center justify-center shadow-md ">
            {" "}
            <BarChart3 className="w-5 h-5 text-white" />{" "}
          </div>{" "}
          <div>
            {" "}
            <h1 className="text-xl font-bold text-slate-800">
              تحليل المخزون
            </h1>{" "}
            <p className="text-xs text-slate-400 font-medium">
              تحليل الكميات والقيم حسب الموقع والفئة
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Stats Row */}{" "}
      <div className="grid grid-cols-4 gap-3">
        {" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-3 flex items-center gap-3">
          {" "}
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            {" "}
            <Package className="w-5 h-5 text-blue-500" />{" "}
          </div>{" "}
          <div>
            {" "}
            <p className="text-[11px] text-slate-400 font-bold">
              المنتجات
            </p>{" "}
            <p className="text-lg font-bold text-slate-800">
              {uniqueProducts}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-3 flex items-center gap-3">
          {" "}
          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
            {" "}
            <Layers className="w-5 h-5 text-emerald-500" />{" "}
          </div>{" "}
          <div>
            {" "}
            <p className="text-[11px] text-slate-400 font-bold">
              إجمالي الكمية
            </p>{" "}
            <p className="text-lg font-bold text-slate-800">
              {totalStock.toLocaleString("en-US")}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-3 flex items-center gap-3">
          {" "}
          <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
            {" "}
            <BarChart3 className="w-5 h-5 text-violet-500" />{" "}
          </div>{" "}
          <div>
            {" "}
            <p className="text-[11px] text-slate-400 font-bold">
              إجمالي القيمة
            </p>{" "}
            <p className="text-lg font-bold text-slate-800">
              {totalValue.toLocaleString("en-US", {
              minimumFractionDigits: 2
            })}{" "}
              <span className="text-xs font-medium text-slate-400">ج.م</span>
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-3 flex items-center gap-3">
          {" "}
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
            {" "}
            <MapPin className="w-5 h-5 text-amber-500" />{" "}
          </div>{" "}
          <div>
            {" "}
            <p className="text-[11px] text-slate-400 font-bold">المواقع</p>{" "}
            <p className="text-lg font-bold text-slate-800">
              {uniqueLocations}
            </p>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Lot Filter */}{" "}
      {allLots.length > 0 && <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4">
          {" "}
          <div className="flex items-center gap-3">
            {" "}
            <label className="text-sm font-bold text-slate-600">
              فلترة حسب اللوت:
            </label>{" "}
            <form className="flex gap-2">
              {" "}
              <select name="lotId" defaultValue={lotId || ""} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none">
                {" "}
                <option value="">كل اللوتات</option>{" "}
                {allLots.map((lot: any) => <option key={lot.id} value={lot.id}>
                    {" "}
                    {lot.name}{" "}
                  </option>)}{" "}
              </select>{" "}
              <button type="submit" className="bg-teal-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors">
                {" "}
                تطبيق{" "}
              </button>{" "}
            </form>{" "}
          </div>{" "}
        </div>}{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 p-4 space-y-4">
        {" "}
        <OdooSearch filters={filters} groupBys={groupOptions} placeholder="بحث في المخزون..." />{" "}
        <PivotTable data={flatData} config={pivotConfig} className="mt-4" />{" "}
      </div>{" "}
    </div>;
}