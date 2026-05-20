import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import OdooListView from "@/components/common/OdooListView";
import { Breadcrumb } from "@/components/common/Breadcrumb";
export const dynamic = "force-dynamic";
export default async function StockMovesPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    productId?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const {
    productId
  } = await props.searchParams;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const where: any = {
    companyId: session.companyId
  };
  if (productId) {
    where.productId = productId;
  }
  const moves = await prisma.stockMove.findMany({
    where,
    include: {
      product: true,
      sourceLocation: true,
      destLocation: true,
      picking: true
    },
    orderBy: {
      date: "desc"
    }
  });
  const product = productId ? await prisma.product.findUnique({
    where: {
      id: productId
    }
  }) : null;
  /* Serialize and format moves for the list view */
  const formattedMoves = moves.map((move: any) => {
    const isIncoming = move.sourceLocation?.type === "vendor" || move.sourceLocation?.type === "inventory" || move.sourceLocation?.type === "production";
    const isOutgoing = move.destLocation?.type === "customer" || move.destLocation?.type === "inventory" || move.destLocation?.type === "production";
    let qtyColor = "text-slate-700";
    /* Default */
    if (isIncoming && !isOutgoing) qtyColor = "text-green-600";else if (isOutgoing && !isIncoming) qtyColor = "text-red-500";
    return {
      id: move.id,
      date: new Date(move.date).toLocaleDateString("ar-EG", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      reference: move.picking?.name || move.name || move.reference || "-",
      productName: move.product?.name || "-",
      sourceLocation: move.sourceLocation?.name || "-",
      destLocation: move.destLocation?.name || "-",
      quantity: move.quantityDone?.toFixed(3) || "0.000",
      unitName: move.product?.uomName || "قطعه",
      secondaryQuantity: move.secQtyDone?.toFixed(3) || "0.000",
      secondaryUnitName: move.product?.secondaryUomName || "كرتونه",
      state: move.state === "done" ? "تم الانتهاء" : move.state,
      qtyColor
    };
  });
  const columns = [{
    key: "date",
    label: "التاريخ",
    width: "w-48"
  }, {
    key: "reference",
    label: "المرجع",
    width: "w-32"
  }, {
    key: "productName",
    label: "المنتج",
    width: "w-48"
  }, {
    key: "sourceLocation",
    label: "من",
    width: "w-32"
  }, {
    key: "destLocation",
    label: "إلى",
    width: "w-32"
  }, {
    key: "quantity",
    label: "الكمية",
    width: "w-24",
    render: (row: any) => <span className={`font-medium ${row.qtyColor}`}> {row.quantity} </span>
  }, {
    key: "unitName",
    label: "الوحدة",
    width: "w-20"
  }, {
    key: "secondaryQuantity",
    label: "الكمية الثانوية",
    width: "w-24"
  }, {
    key: "secondaryUnitName",
    label: "الثانوية UoM",
    width: "w-20"
  }, {
    key: "state",
    label: "الحالة",
    width: "w-24",
    render: (row: any) => <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs font-bold w-full inline-block text-center whitespace-nowrap">
          {" "}
          {row.state}{" "}
        </span>
  }];
  const breadcrumbs = [{
    label: "المنتجات",
    href: `/${locale}/inventory/products`
  }];
  if (product) {
    breadcrumbs.push({
      label: product.name,
      href: `/${locale}/inventory/products/${product.id}`
    });
  }
  breadcrumbs.push({
    label: "سجل الحركات",
    href: "#"
  });
  return <div className="h-full flex flex-col pt-14 bg-slate-50" dir="rtl">
      {" "}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 h-[50px]">
        {" "}
        <div className="flex flex-col">
          {" "}
          <Breadcrumb items={breadcrumbs} />{" "}
        </div>{" "}
        <div className="flex gap-2">
          {" "}
          {/* Add any top action buttons here if needed */}{" "}
        </div>{" "}
      </div>{" "}
      <div className="p-4 flex-1 overflow-hidden h-full">
        {" "}
        <OdooListView title={product ? `سجل الحركات - ${product.name}` : "سجل الحركات"} columns={columns} data={formattedMoves} />{" "}
      </div>{" "}
    </div>;
}