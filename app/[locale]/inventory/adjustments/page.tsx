import { getInventoryAdjustments } from "@/app/actions/inventory-adjustments";
import { AdjustmentsListClient } from "./AdjustmentsListClient";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
export default async function AdjustmentsPage({
  params
}: {
  params: {
    locale: string;
  };
}) {
  const adjustments = await getInventoryAdjustments();
  return <div className="min-h-screen bg-slate-50" dir="rtl">
      {" "}
      <Breadcrumbs />{" "}
      <div className="p-4 sm:p-8">
        {" "}
        <Suspense fallback={<div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#017E84]" />
            </div>}>
          {" "}
          <AdjustmentsListClient initialData={adjustments} locale={params.locale} />{" "}
        </Suspense>{" "}
      </div>{" "}
    </div>;
}