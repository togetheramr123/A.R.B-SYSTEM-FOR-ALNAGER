import { RuleForm } from "@/components/inventory/config/RuleForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getRoutes, getOperationTypes, getLocations } from "@/app/actions/inventoryConfig";
export default async function EditRulePage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const {
    locale,
    id
  } = await props.params;
  const [rule, routes, operationTypes, locations] = await Promise.all([prisma.stockRule.findUnique({
    where: {
      id
    }
  }), getRoutes(), getOperationTypes(), getLocations()]);
  if (!rule) {
    notFound();
  }
  return <div className="p-6" dir="rtl">
      {" "}
      <div className="max-w-5xl mx-auto">
        {" "}
        <RuleForm initialData={rule} routes={routes} operationTypes={operationTypes} locations={locations} />{" "}
      </div>{" "}
    </div>;
}