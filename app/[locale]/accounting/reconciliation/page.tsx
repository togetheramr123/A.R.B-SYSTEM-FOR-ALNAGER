import { getBankStatements } from "@/app/actions/bank-reconciliation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Landmark } from "lucide-react";
import Link from "next/link";
export default async function BankStatementsPage() {
  const statements = await getBankStatements();
  return <div className="flex flex-col h-full space-y-4 p-8">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <div className="flex items-center gap-3">
          {" "}
          <div className="p-2 bg-blue-100 rounded-lg">
            {" "}
            <Landmark className="h-6 w-6 text-blue-600" />{" "}
          </div>{" "}
          <h1 className="text-2xl font-bold">المطابقة البنكية</h1>{" "}
        </div>{" "}
        <Link href="/accounting/reconciliation/new">
          {" "}
          <Button>
            {" "}
            <Plus className="mr-2 h-4 w-4" /> كشف جديد{" "}
          </Button>{" "}
        </Link>{" "}
      </div>{" "}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        {" "}
        <Table>
          {" "}
          <TableHeader className="bg-gray-50">
            {" "}
            <TableRow>
              {" "}
              <TableHead>اسم الكشف</TableHead>{" "}
              <TableHead>دفتر اليومية</TableHead> <TableHead>التاريخ</TableHead>{" "}
              <TableHead className="text-right">رصيد البداية</TableHead>{" "}
              <TableHead className="text-right">رصيد النهاية</TableHead>{" "}
              <TableHead className="text-center">الحالة</TableHead>{" "}
              <TableHead className="w-[100px] text-right">إجراء</TableHead>{" "}
            </TableRow>{" "}
          </TableHeader>{" "}
          <TableBody>
            {" "}
            {statements.map((stmt: any) => <TableRow key={stmt.id}>
                {" "}
                <TableCell className="font-medium">{stmt.name}</TableCell>{" "}
                <TableCell>{stmt.journal?.name}</TableCell>{" "}
                <TableCell>
                  {new Date(stmt.date).toLocaleDateString()}
                </TableCell>{" "}
                <TableCell className="text-right">
                  {parseFloat(stmt.balanceStart).toFixed(2)}
                </TableCell>{" "}
                <TableCell className="text-right">
                  {parseFloat(stmt.balanceEnd).toFixed(2)}
                </TableCell>{" "}
                <TableCell className="text-center">
                  {" "}
                  <span className={`px-2 py-1 rounded-full text-xs capitalize ${stmt.state === "posted" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {" "}
                    {stmt.state}{" "}
                  </span>{" "}
                </TableCell>{" "}
                <TableCell className="text-right">
                  {" "}
                  <Link href={`/accounting/reconciliation/${stmt.id}`}>
                    {" "}
                    <Button variant="ghost" size="sm">
                      فتح
                    </Button>{" "}
                  </Link>{" "}
                </TableCell>{" "}
              </TableRow>)}{" "}
            {statements.length === 0 && <TableRow>
                {" "}
                <TableCell colSpan={7} className="text-center py-12 text-gray-400 italic">
                  {" "}
                  لا توجد كشوف بنكية. أنشئ كشفاً لبدء المطابقة.{" "}
                </TableCell>{" "}
              </TableRow>}{" "}
          </TableBody>{" "}
        </Table>{" "}
      </div>{" "}
    </div>;
}