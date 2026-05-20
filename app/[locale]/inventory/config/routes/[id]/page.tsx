import { RouteForm } from "@/components/inventory/config/RouteForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
export default async function EditRoutePage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const route = await prisma.stockRoute.findUnique({
    where: {
      id
    }
  });
  if (!route) {
    notFound();
  }
  return <div className="p-6" dir="rtl">
      {" "}
      <div className="max-w-4xl mx-auto">
        {" "}
        <RouteForm initialData={route} />{" "}
      </div>{" "}
    </div>;
}