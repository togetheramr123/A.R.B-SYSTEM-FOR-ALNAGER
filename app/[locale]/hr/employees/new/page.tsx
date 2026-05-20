import { EmployeeForm } from "@/components/hr/EmployeeForm";
import { getAllDepartments } from "@/app/actions/hr";
import { serializeDecimal } from "@/lib/serialize";
export default async function NewEmployeePage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const rawDepts = await getAllDepartments();
  const departments = serializeDecimal(rawDepts);
  return <EmployeeForm locale={locale} departments={departments} />;
}