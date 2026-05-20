import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdjustmentForm from "./_components/AdjustmentForm";
export default async function NewAdjustmentPage({
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
      /* @ts-ignore companyId: session.companyId */
    }
  });
  const productsFetch = await prisma.product.findMany({
    where: {
      /* @ts-ignore companyId: session.companyId */
    }
  });
  const products = productsFetch.map(p => ({
    ...p,
    salePrice: Number(p.salePrice || 0),
    costPrice: Number(p.costPrice || 0),
    taxes: Number(p.taxes || 0),
    weight: Number(p.weight || 0),
    volume: Number(p.volume || 0),
    secondaryUomFactor: Number(p.secondaryUomFactor || 1)
  }));
  const quantsFetch = await prisma.stockQuant.findMany({
    where: {
      /* @ts-ignore companyId: session.companyId */
    },
    select: {
      productId: true,
      locationId: true,
      quantity: true
    }
  });
  const quants = quantsFetch.map(q => ({
    ...q,
    quantity: Number(q.quantity || 0)
  }));
  return <div className="p-6 max-w-5xl mx-auto">
      {" "}
      <div className="mb-6">
        {" "}
        <h1 className="text-2xl font-bold">New Inventory Adjustment</h1>{" "}
        <p className="text-gray-500">Correct physical stock levels</p>{" "}
      </div>{" "}
      <div className="bg-white rounded-lg shadow p-6">
        {" "}
        <AdjustmentForm locations={locations} products={products} quants={quants} locale={params.locale} />{" "}
      </div>{" "}
    </div>;
}