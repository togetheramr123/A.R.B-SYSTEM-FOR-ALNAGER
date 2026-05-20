import { getInventoryAdjustment, getInventoryAdjustments } from "@/app/actions/inventory-adjustments";
import { getProductCategories } from "@/app/actions/inventory";
import { AdjustmentDetailClient } from "./AdjustmentDetailClient";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
export default async function AdjustmentDetailPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const params = await props.params;
  const record = await getInventoryAdjustment(params.id);
  const categories = await getProductCategories();
  if (!record) {
    return <div className="p-8 text-center text-red-500 font-bold">
        لم يتم العثور على محضر الجرد
      </div>;
  }
  return <div className="min-h-screen bg-slate-50" dir="rtl">
      {" "}
      <Breadcrumbs currentRecordName={record.name} />{" "}
      <div className="p-4 sm:p-8">
        {" "}
        <AdjustmentDetailClient initialData={record} categories={categories} locale={params.locale} />{" "}
      </div>{" "}
    </div>;
}