import { getAllPriceLists } from "@/app/actions/pricelists";
import { PriceListListClient } from "@/components/sales/PriceListListClient";
import { serializeDecimal } from "@/lib/serialize";
export default async function PriceListsPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    q?: string;
    filter?: string;
    groupBy?: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams;
  const lists = await getAllPriceLists();
  const serialized = JSON.parse(JSON.stringify(serializeDecimal(lists)));
  return <div className="flex flex-col bg-white min-h-screen">
      {" "}
      <PriceListListClient pricelists={serialized} locale={locale} searchQuery={searchParams?.q} filterParam={searchParams?.filter} groupByParam={searchParams?.groupBy} />{" "}
    </div>;
}