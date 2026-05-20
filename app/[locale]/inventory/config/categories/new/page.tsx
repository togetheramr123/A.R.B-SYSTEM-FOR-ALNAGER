import { getAccounts, getCategories, getJournals } from "@/app/actions/categories";
import { CategoryForm } from "@/components/inventory/CategoryForm";
export default async function NewCategoryPage() {
  const [categories, accounts, journals] = await Promise.all([getCategories(), getAccounts(), getJournals()]);
  return <CategoryForm categories={categories} accounts={accounts} journals={journals} />;
}