import { PutawayForm } from "@/components/inventory/config/PutawayForm";
import { getLocations } from "@/app/actions/inventoryConfig";
import { getAllProducts, getProductCategories } from "@/app/actions/inventory";
export default async function NewPutawayPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const [locations, products, categories] = await Promise.all([getLocations(), getAllProducts(), getProductCategories()]);
  return <div className="p-6" dir="rtl">
      {" "}
      <div className="max-w-4xl mx-auto">
        {" "}
        <PutawayForm locations={locations} products={products} categories={categories} />{" "}
      </div>{" "}
    </div>;
}