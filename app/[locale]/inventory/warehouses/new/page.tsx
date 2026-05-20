import { useTranslations } from "next-intl";
import { WarehouseForm } from "@/components/inventory/WarehouseForm";
export default function NewWarehousePage() {
  const t = useTranslations("Inventory");
  return <div className="max-w-4xl mx-auto space-y-6">
      {" "}
      <h1 className="text-2xl font-bold text-slate-800">
        {t("addWarehouse")}
      </h1>{" "}
      <WarehouseForm />{" "}
    </div>;
}