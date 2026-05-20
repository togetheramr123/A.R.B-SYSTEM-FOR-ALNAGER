import { RouteForm } from "@/components/inventory/config/RouteForm";
export default async function NewRoutePage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  return <div className="p-6" dir="rtl">
      {" "}
      <div className="max-w-4xl mx-auto">
        {" "}
        <RouteForm />{" "}
      </div>{" "}
    </div>;
}