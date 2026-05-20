import { notFound } from "next/navigation";
import { getAsset, getAllAssetCategories } from "@/app/actions/assets";
import { AssetForm } from "@/components/accounting/AssetForm";
export default async function AssetDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  let asset = null;
  if (id !== "new") {
    asset = await getAsset(id);
    if (!asset) notFound();
  }
  const categories = await getAllAssetCategories();
  return <AssetForm initialData={asset} categories={categories} locale={locale} />;
}