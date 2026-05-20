import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import OdooListView from "@/components/common/OdooListView";
import { Breadcrumb } from "@/components/common/Breadcrumb";
export const dynamic = "force-dynamic";
export default async function PurchaseLinesPage(props: {
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
    order: {
      companyId: session.companyId,
      status: {
        in: ["purchase", "done"]
      } /* Only confirmed orders */
    }
  };
  if (productId) {
    where.productId = productId;
  }
  const lines = await prisma.purchaseOrderLine.findMany({
    where,
    include: {
      product: true,
      order: {
        include: {
          partner: true
        }
      }
    },
    orderBy: {
      order: {
        dateOrder: "desc"
      }
    }
  });
  const product = productId ? await prisma.product.findUnique({
    where: {
      id: productId
    }
  }) : null;
  /* Serialize and format lines for the list view */
  const formattedLines = lines.map((line: any) => {
    return {
      id: line.id,
      date: line.order.dateOrder ? new Date(line.order.dateOrder).toLocaleDateString("ar-EG", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }) : "-",
      reference: line.order.name || "-",
      productName: line.product?.name || "-",
      vendorName: line.order.partner?.name || "-",
      quantity: line.quantity ? Number(line.quantity).toFixed(3) : "0.000",
      priceUnit: line.priceUnit?.toFixed(2) || "0.00"
    };
  });
  const columns = [{
    key: "reference",
    label: "مرجع الطلب",
    width: "w-32"
  }, {
    key: "date",
    label: "تاريخ التأكيد",
    width: "w-48"
  }, {
    key: "vendorName",
    label: "الشريك",
    width: "w-48"
  }, {
    key: "quantity",
    label: "إجمالي الكمية",
    width: "w-32"
  }, {
    key: "priceUnit",
    label: "سعر الوحدة",
    width: "w-32"
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
    breadcrumbs.push({
      label: `سجل المشتريات لـ ${product.name}`,
      href: "#"
    });
  } else {
    breadcrumbs.push({
      label: "سجل المشتريات",
      href: "#"
    });
  }
  return <div className="h-full flex flex-col pt-14 bg-slate-50" dir="rtl">
      {" "}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 h-[50px]">
        {" "}
        <div className="flex flex-col">
          {" "}
          <Breadcrumb items={breadcrumbs} />{" "}
        </div>{" "}
        <div className="flex gap-2"> </div>{" "}
      </div>{" "}
      <div className="p-4 flex-1 overflow-hidden h-full">
        {" "}
        <OdooListView title={product ? `سجل المشتريات لـ ${product.name}` : "سجل المشتريات"} columns={columns} data={formattedLines} hideNewButton={true} hideDownloadButton={true} />{" "}
      </div>{" "}
    </div>;
}