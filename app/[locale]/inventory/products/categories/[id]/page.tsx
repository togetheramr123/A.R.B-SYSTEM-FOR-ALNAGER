import { notFound } from "next/navigation";
import { getCategory, getAllCategories, getAllAccounts, getAllJournals } from "@/app/actions/product-categories";
import { CategoryForm } from "@/components/inventory/CategoryForm";
export default async function CategoryDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  let category = null;
  if (id !== "new") {
    category = await getCategory(id);
    if (!category) notFound();
  }
  const allCategories = await getAllCategories();
  const allAccounts = await getAllAccounts();
  const allJournals = await getAllJournals();
  return <CategoryForm category={category} categories={allCategories} accounts={allAccounts} journals={allJournals} />;
}