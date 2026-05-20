import { getAllPayslips, getAllEmployees } from "@/app/actions/hr";
import { serializeDecimal } from "@/lib/serialize";
import PayslipsClient from "@/components/hr/PayslipsClient";
export default async function PayslipsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const [rawPayslips, rawEmployees] = await Promise.all([getAllPayslips(), getAllEmployees()]);
  const payslips = serializeDecimal(rawPayslips);
  const employees = serializeDecimal(rawEmployees);
  return <PayslipsClient payslips={payslips} employees={employees} locale={locale} />;
}