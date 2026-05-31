import { getBudget } from "@/app/actions/budgets";
import { getAnalyticAccounts } from "@/app/actions/analytic";
import { getAccounts } from "@/app/actions/accounting";
import { BudgetForm } from "@/components/accounting/BudgetForm";
import prisma from "@/lib/prisma";
interface Props {
  params: {
    id: string;
  };
}
export default async function BudgetPage({
  params
}: Props) {
  const budget = await getBudget(params.id);
  const analyticAccounts = await getAnalyticAccounts();
  const generalAccounts = await getAccounts();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true
    }
  });
  /* Handle initial state for */
  const initialData = budget || (params.id === "new" ? {
    state: "draft",
    dateFrom: new Date().toISOString(),
    dateTo: new Date(new Date().getFullYear(), 11, 31).toISOString() /* End of year lines: [] */
  } : null);
  if (!initialData) {
    return <div>Budget not found</div>;
  }
  return <div className="h-full bg-gray-50/50">
      {" "}
      <BudgetForm initialData={initialData} analyticAccounts={analyticAccounts} generalAccounts={generalAccounts} users={users} />{" "}
    </div>;
}