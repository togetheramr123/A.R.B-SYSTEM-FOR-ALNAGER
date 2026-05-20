import { PutawayForm } from "@/components/inventory/config/PutawayForm";
import { getLocations } from "@/app/actions/inventoryConfig";
import { getAllProducts, getProductCategories } from "@/app/actions/inventory";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
export default async function EditPutawayPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const [rule, locations, products, categories] = await Promise.all([prisma.stockPutawayRule.findUnique({
    where: {
      id
    }
  }), getLocations(), getAllProducts(), getProductCategories()]);
  if (!rule) notFound();
  return <div className="p-6" dir="rtl">
      {" "}
      <div className="max-w-4xl mx-auto">
        {" "}
        <PutawayForm initialData={rule} locations={locations} products={products} categories={categories} />{" "}
      </div>{" "}
    </div>;
}