import { getAssetCategory } from '@/app/actions/assets';
import { getChartOfAccounts, getJournals } from '@/app/actions/accounting';
import { AssetCategoryForm } from '@/components/accounting/AssetCategoryForm';
import { notFound } from 'next/navigation';
export default async function AssetCategoryDetailPage({
  params
}: {
  params: {
    id: string;
  };
}) {
  const {
    id
  } = params;
  const [category, rawAccounts, rawJournals] = await Promise.all([id === 'new' ? null : getAssetCategory(id), getChartOfAccounts(), getJournals()]);
  if (id !== 'new' && !category) {
    notFound();
  }
  const accounts = rawAccounts.map((acc: any) => ({
    value: acc.id,
    label: `${acc.code} - ${acc.name}`
  }));
  const journals = rawJournals.map((j: any) => ({
    value: j.value,
    label: j.label
  }));
  return <AssetCategoryForm initialData={category} accounts={accounts} journals={journals} />;
}