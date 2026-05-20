import { getProductQuants } from "@/app/actions/inventory";
import { ProductQuantsClient } from "./ProductQuantsClient";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
export default async function ProductQuantsPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const params = await props.params;
  const {
    data,
    productName,
    error
  } = await getProductQuants(params.id);
  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  }
  return <div className="min-h-screen bg-slate-50" dir="rtl">
      {" "}
      <Breadcrumbs currentRecordName={productName || "تحديث الكمية"} />{" "}
      <div className="p-4 sm:p-8">
        {" "}
        <ProductQuantsClient initialData={data || []} productId={params.id} productName={productName || ""} />{" "}
      </div>{" "}
    </div>;
}