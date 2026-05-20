import { notFound } from "next/navigation";
import { getPriceList, getPriceListItems } from "@/app/actions/pricelists";
import { PriceListItemsClient } from "@/components/sales/PriceListItemsClient";
import { serializeDecimal } from "@/lib/serialize";
export default async function PriceListItemsPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    filter?: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1");
  const q = searchParams?.q;
  const filter = searchParams?.filter;
  const list = await getPriceList(id);
  if (!list) notFound();
  const paginatedItems = await getPriceListItems(id, {
    page,
    pageSize: 80 /* Odoo default usually around 80 for lists q, filter */
  });
  const pagination = {
    currentPage: paginatedItems.currentPage,
    totalPages: paginatedItems.totalPages,
    startRecord: paginatedItems.startRecord,
    endRecord: paginatedItems.endRecord,
    totalCount: paginatedItems.totalCount
  };
  return <PriceListItemsClient priceList={JSON.parse(JSON.stringify(serializeDecimal(list)))} items={JSON.parse(JSON.stringify(serializeDecimal(paginatedItems.items)))} pagination={pagination} locale={locale} />;
}