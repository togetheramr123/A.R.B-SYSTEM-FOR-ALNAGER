import prisma from "@/lib/prisma";
import { getPartner } from "@/app/actions/partner";
import PartnerForm from "@/components/partner/PartnerForm";
import { notFound } from "next/navigation";
export default async function PartnerDetailPage(props: {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}) {
  const {
    id,
    locale
  } = await props.params;
  const partner = await getPartner(id);
  if (!partner) {
    notFound();
  }
  const initialData = {
    ...partner
  };
  return <div className="p-4">
      {" "}
      <PartnerForm initialData={initialData} locale={locale} />{" "}
    </div>;
}