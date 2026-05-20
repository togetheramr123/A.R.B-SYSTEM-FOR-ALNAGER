import { getMyContract } from "@/app/actions/contracts";
import { notFound } from "next/navigation";
import { ContractEditor } from "@/components/hr/contracts/ContractEditor";

export default async function MyContractPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const { locale } = await props.params;
  const contract = await getMyContract();
  
  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] bg-gray-50">
        <h1 className="text-2xl font-bold text-gray-700 mb-2">عفواً</h1>
        <p className="text-gray-500">لا يوجد عقد مسجل ومتاح لحسابك حالياً.</p>
      </div>
    );
  }

  // We reuse ContractEditor but disable editing inside it by not showing the save buttons
  // Oh wait, ContractEditor currently shows the sidebar unconditionally.
  // Let's pass an `isReadonly` prop to it to hide the sidebar and inputs.
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">عقدي الوظيفي</h1>
          <p className="text-sm text-gray-500">نسخة للقراءة والطباعة فقط</p>
        </div>
      </div>
      
      <div className="h-[calc(100vh-140px)]">
        <ContractEditor 
          contract={contract} 
          templates={contract.template ? [contract.template] : []} 
          locale={locale} 
          isReadonly={true}
        />
      </div>
    </div>
  );
}
