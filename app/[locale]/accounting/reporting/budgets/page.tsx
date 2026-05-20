import { getBudgets } from "@/app/actions/budgets";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import Link from "next/link";
export default async function BudgetsPage() {
  const budgets = await getBudgets();
  return <div className="flex flex-col h-full space-y-4 p-8">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-2xl font-bold">Budgets</h1>{" "}
        <Link href="/accounting/reporting/budgets/new">
          {" "}
          <Button>
            {" "}
            <Plus className="mr-2 h-4 w-4" /> New Budget{" "}
          </Button>{" "}
        </Link>{" "}
      </div>{" "}
      <div className="border rounded-lg overflow-hidden">
        {" "}
        <Table>
          {" "}
          <TableHeader>
            {" "}
            <TableRow>
              {" "}
              <TableHead>اسم الميزانية</TableHead>{" "}
              <TableHead>Responsible</TableHead> <TableHead>Period</TableHead>{" "}
              <TableHead>State</TableHead>{" "}
              <TableHead className="w-[100px]">Action</TableHead>{" "}
            </TableRow>{" "}
          </TableHeader>{" "}
          <TableBody>
            {" "}
            {budgets.map((budget: any) => <TableRow key={budget.id}>
                {" "}
                <TableCell className="font-medium">
                  {budget.name}
                </TableCell>{" "}
                <TableCell>{budget.user?.name || "-"}</TableCell>{" "}
                <TableCell>
                  {" "}
                  {new Date(budget.dateFrom).toLocaleDateString()} -{" "}
                  {new Date(budget.dateTo).toLocaleDateString()}{" "}
                </TableCell>{" "}
                <TableCell>
                  {" "}
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${budget.state === "done" ? "bg-green-100 text-green-700" : budget.state === "confirmed" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                    {" "}
                    {budget.state}{" "}
                  </span>{" "}
                </TableCell>{" "}
                <TableCell>
                  {" "}
                  <Link href={`/accounting/reporting/budgets/${budget.id}`}>
                    {" "}
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>{" "}
                  </Link>{" "}
                </TableCell>{" "}
              </TableRow>)}{" "}
            {budgets.length === 0 && <TableRow>
                {" "}
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {" "}
                  No budgets found. Create one to start planning.{" "}
                </TableCell>{" "}
              </TableRow>}{" "}
          </TableBody>{" "}
        </Table>{" "}
      </div>{" "}
    </div>;
}