import PartnerForm from '@/components/partner/PartnerForm';
export default async function CreateContactPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    [key: string]: string | undefined;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const searchParams = await props.searchParams; /* Support pre-filling name and */
  returnUrl;
  from;
  query;
  params; /* (used when navigating from Sales/Purchases/Invoices "إنشاء وتحرير") */
  const initialData: any = {};
  if (searchParams.name) {
    initialData.name = searchParams.name;
  }
  if (searchParams.isVendor === 'true') {
    initialData.isVendor = true;
    initialData.isCustomer = false;
  }
  if (searchParams.isCustomer === 'true') {
    initialData.isCustomer = true;
    initialData.isVendor = false;
  }
  return <div className="p-4"> <PartnerForm initialData={initialData} locale={locale} returnUrl={searchParams.returnUrl} /> </div>;
}