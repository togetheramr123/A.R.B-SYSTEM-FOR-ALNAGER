import { getAllDepartments } from "@/app/actions/hr";
import { serializeDecimal } from "@/lib/serialize";
import DepartmentsClient from "@/components/hr/DepartmentsClient";
export default async function DepartmentsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const rawDepts = await getAllDepartments();
  const departments = serializeDecimal(rawDepts);
  return <DepartmentsClient departments={departments} locale={locale} />;
}