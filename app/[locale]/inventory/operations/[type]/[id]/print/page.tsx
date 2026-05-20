import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import StockPickingPrintTemplate from "@/components/inventory/StockPickingPrintTemplate";
interface Props {
  params: Promise<{
    locale: string;
    type: string;
    id: string;
  }>;
}
export default async function OperationPrintPage({
  params
}: Props) {
  const {
    locale,
    id,
    type
  } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const picking = await prisma.stockPicking.findUnique({
    where: {
      id
    },
    include: {
      partner: true,
      location: true,
      locationDest: true,
      company: true,
      moves: {
        include: {
          product: true
        }
      }
    }
  });
  if (!picking) {
    notFound();
  }
  return <StockPickingPrintTemplate picking={picking} locale={locale} />;
}