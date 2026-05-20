import { RuleForm } from "@/components/inventory/config/RuleForm";
import { getRoutes, getOperationTypes, getLocations } from "@/app/actions/inventoryConfig";
export default async function NewRulePage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const [routes, operationTypes, locations] = await Promise.all([getRoutes(), getOperationTypes(), getLocations()]);
  return <div className="p-6" dir="rtl">
      {" "}
      <div className="max-w-5xl mx-auto">
        {" "}
        <RuleForm routes={routes} operationTypes={operationTypes} locations={locations} />{" "}
      </div>{" "}
    </div>;
}