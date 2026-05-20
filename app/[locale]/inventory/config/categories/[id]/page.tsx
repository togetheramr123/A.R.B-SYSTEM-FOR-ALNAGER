import { getAccounts, getCategories, getCategory, getJournals } from "@/app/actions/categories";
import { CategoryForm } from "@/components/inventory/CategoryForm";
import { redirect } from "next/navigation";
export default async function EditCategoryPage(props: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id
  } = await props.params;
  const [category, categories, accounts, journals] = await Promise.all([getCategory(id), getCategories(), getAccounts(), getJournals()]);
  if (!category) {
    redirect("/inventory/config/categories");
  }
  return <CategoryForm category={category} categories={categories} accounts={accounts} journals={journals} />;
}