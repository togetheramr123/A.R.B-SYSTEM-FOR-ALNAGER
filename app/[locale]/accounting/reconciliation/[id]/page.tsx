import { getBankStatement } from "@/app/actions/bank-reconciliation";
import { getJournals } from "@/app/actions/accounting";
import { BankStatementForm } from "@/components/accounting/BankStatementForm";
import ReconciliationWidget from "@/components/accounting/ReconciliationWidget";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
interface Props {
  params: {
    id: string;
  };
  searchParams: {
    view?: string;
  };
}
export default async function BankStatementPage({
  params,
  searchParams
}: Props) {
  const isReconcileMode = searchParams.view === "reconcile";
  /* If in reconcile mode, we just need the ID for the widget */
  if (isReconcileMode && params.id !== "new") {
    return <div className="flex flex-col h-full bg-background">
        {" "}
        <div className="flex items-center gap-4 p-4 border-b">
          {" "}
          <Link href={`/accounting/reconciliation/${params.id}`}>
            {" "}
            <Button variant="ghost" size="sm">
              {" "}
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Statement{" "}
            </Button>{" "}
          </Link>{" "}
          <h1 className="text-xl font-bold">Reconciliation</h1>{" "}
        </div>{" "}
        <div className="flex-1 p-4 overflow-hidden">
          {" "}
          <ReconciliationWidget statementId={params.id} />{" "}
        </div>{" "}
      </div>;
  }
  const statement = await getBankStatement(params.id);
  const journals = await getJournals("bank");
  const cashJournals = await getJournals("cash");
  const partners = await prisma.partner.findMany({
    select: {
      id: true,
      name: true
    }
  });
  const initialData = statement || (params.id === "new" ? {
    state: "draft",
    date: new Date().toISOString(),
    lines: []
  } : null);
  if (!initialData) {
    return <div>Statement not found</div>;
  }
  return <div className="h-full bg-white">
      {" "}
      <BankStatementForm initialData={initialData} journals={[...journals, ...cashJournals]} partners={partners} />{" "}
    </div>;
}