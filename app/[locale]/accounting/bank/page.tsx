import React from "react";
import { getJournals } from "@/app/actions/accounting";
import BankSyncWidget from "@/components/accounting/BankSyncWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function BankSyncPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const locale = "ar"; // Or extract from params if needed
  if (session.canAccessTreasury === false) {
    redirect(`/${locale}/accounting`);
  }
  const journals = await getJournals("bank");
  return <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {" "}
      <div className="flex flex-col gap-2">
        {" "}
        <h1 className="text-3xl font-bold tracking-tight">
          Bank Synchronization
        </h1>{" "}
        <p className="text-muted-foreground">
          {" "}
          Connect your bank accounts and synchronize transactions
          automatically.{" "}
        </p>{" "}
      </div>{" "}
      <div className="grid gap-6 md:grid-cols-2">
        {" "}
        {journals.length > 0 ? journals.map((journal: any) => <div key={journal.value} className="space-y-4">
              {" "}
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {" "}
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {" "}
                  {journal.label.split(" ")[0]}{" "}
                </span>{" "}
                {journal.label.split(" ").slice(1).join(" ")}{" "}
              </h2>{" "}
              <BankSyncWidget journalId={journal.value} />{" "}
            </div>) : <Card>
            {" "}
            <CardHeader>
              {" "}
              <CardTitle>لا توجد دفاتر يومية بنكية</CardTitle>{" "}
            </CardHeader>{" "}
            <CardContent>
              {" "}
              <p className="text-muted-foreground">
                {" "}
                Please create a Bank Journal in Configuration &gt; Journals
                first.{" "}
              </p>{" "}
            </CardContent>{" "}
          </Card>}{" "}
      </div>{" "}
    </div>;
}