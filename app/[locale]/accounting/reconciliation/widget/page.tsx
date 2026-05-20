import prisma from "@/lib/prisma";
import ReconciliationWidget from "@/components/accounting/ReconciliationWidget";
interface Props {
  searchParams: {
    lineId: string;
  };
}
export default async function ReconciliationWidgetPage({
  searchParams
}: Props) {
  if (!searchParams.lineId) {
    return <div className="p-8">No line specified</div>;
  }
  const line = await prisma.bankStatementLine.findUnique({
    where: {
      id: searchParams.lineId
    },
    include: {
      statement: true
    }
  });
  if (!line) {
    return <div className="p-8">Transaction line not found</div>;
  }
  return <div className="h-full">
      {" "}
      <ReconciliationWidget statementId={line.statement.id} />{" "}
    </div>;
}