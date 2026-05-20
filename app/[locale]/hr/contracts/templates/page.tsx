import { getAllContractTemplates } from "@/app/actions/contracts";
import { getCompanies } from "@/app/actions/company";
import { TemplatesManager } from "@/components/hr/contracts/TemplatesManager";

export default async function ContractTemplatesPage() {
  const templates = await getAllContractTemplates();
  const companies = await getCompanies();

  return (
    <div className="p-6">
      <TemplatesManager templates={templates} companies={companies} />
    </div>
  );
}
