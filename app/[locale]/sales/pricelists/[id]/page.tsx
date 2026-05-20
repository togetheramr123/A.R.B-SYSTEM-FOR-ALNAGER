import { notFound } from "next/navigation";
import { getPriceListWithPaginatedItems } from "@/app/actions/pricelists";
import { getAllProducts } from "@/app/actions/products";
import { getAllCategories } from "@/app/actions/product-categories";
import { PriceListForm } from "@/components/sales/PriceListForm";
import { serializeDecimal } from "@/lib/serialize";
export default async function PriceListDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams?.page || "1");
  let list = null;
  if (id !== "new") {
    list = await getPriceListWithPaginatedItems(id, page, 10);
    if (!list) notFound();
  }
  const products = await getAllProducts();
  const {
    getAllPartners
  } = await import("@/app/actions/partner");
  const partners = await getAllPartners();
  const categories = await getAllCategories();
  return <PriceListForm initialData={list ? serializeDecimal(list) : null} products={serializeDecimal(products)} partners={serializeDecimal(partners)} categories={serializeDecimal(categories)} locale={locale} />;
}