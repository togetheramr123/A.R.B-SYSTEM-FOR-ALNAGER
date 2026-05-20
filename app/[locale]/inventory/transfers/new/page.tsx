import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import InternalTransferForm from "./_components/InternalTransferForm";
/* We'll create this client component */
export default async function NewTransferPage({
  params
}: {
  params: {
    locale: string;
  };
}) {
  const session = await getSession();
  if (!session) redirect(`/${params.locale}/login`);
  const locations = await prisma.location.findMany({
    where: {
      companyId: session.companyId
    }
  });
  const products = await prisma.product.findMany({
    where: {
      companyId: session.companyId
    }
  });
  return <div className="p-6 max-w-5xl mx-auto">
      {" "}
      <div className="mb-6">
        {" "}
        <h1 className="text-2xl font-bold">New Internal Transfer</h1>{" "}
        <p className="text-gray-500">Move products between locations</p>{" "}
      </div>{" "}
      <div className="bg-white rounded-lg shadow p-6">
        {" "}
        <InternalTransferForm locations={locations} products={products} locale={params.locale} />{" "}
      </div>{" "}
    </div>;
}