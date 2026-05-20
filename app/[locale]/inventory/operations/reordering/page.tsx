import { redirect } from 'next/navigation';
export default async function ReorderingRedirect(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  redirect(`/${locale}/inventory/operations/replenishment`);
  return null;
}