import { getContractDetails, getAllContractTemplates } from "@/app/actions/contracts";
import { ContractEditor } from "@/components/hr/contracts/ContractEditor";
import { notFound } from "next/navigation";

export default async function ContractEditorPage(props: {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}) {
  const { locale, id } = await props.params;
  const contract = await getContractDetails(id);
  
  if (!contract) {
    return notFound();
  }

  const templates = await getAllContractTemplates();

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <ContractEditor 
        contract={contract} 
        templates={templates} 
        locale={locale} 
      />
    </div>
  );
}
