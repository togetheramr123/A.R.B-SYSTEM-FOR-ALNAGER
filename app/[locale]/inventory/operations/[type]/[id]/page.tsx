import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import PickingForm from "@/components/inventory/PickingForm";
interface Props {
  params: Promise<{
    locale: string;
    type: string;
    id: string;
  }>;
}
export default async function PickingDetailPage({
  params
}: Props) {
  const {
    locale,
    type,
    id
  } = await params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const picking = await prisma.stockPicking.findUnique({
    where: {
      id: id
    },
    include: {
      partner: true,
      location: true,
      locationDest: true,
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
  /* Filter locations for dropdown (Internal locations mostly) */
  const locations = await prisma.location.findMany({
    where: {
      /* @ts-ignore companyId: session.companyId */
    }
  });
  return <PickingForm picking={picking} locations={locations} />;
}