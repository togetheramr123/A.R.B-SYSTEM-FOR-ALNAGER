"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchMockBankTransactions, createBankStatement } from "@/app/actions/bank-reconciliation";
import { Loader2, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
interface BankTransaction {
  id: string;
  date: string;
  name: string;
  amount: number;
  partnerName?: string;
  ref?: string;
}
export default function BankSyncWidget({
  journalId
}: {
  journalId: string;
}) {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const {
    toast
  } = useToast();
  const handleFetch = async () => {
    setLoading(true);
    try {
      const data = await fetchMockBankTransactions(journalId);
      setTransactions(data);
      toast({
        title: "تم جلب المعاملات",
        description: `Found ${data.length} new transactions from bank.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch transactions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSync = async () => {
    if (transactions.length === 0) return;
    setSyncing(true);
    try {
      await createBankStatement({
        journalId,
        transactions,
        name: `BNK/${new Date().getFullYear()}/SYNC/${Date.now().toString().slice(-4)}`,
        date: new Date()
      });
      toast({
        title: "Success",
        description: "Bank Statement created successfully with transactions."
      });
      setTransactions([]); /* Clear list */
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bank statement.",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };
  return <Card className="w-full">
      {" "}
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        {" "}
        <CardTitle className="text-sm font-medium">
          {" "}
          Bank Synchronization{" "}
        </CardTitle>{" "}
        <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
          {" "}
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>{" "}
          Connected{" "}
        </div>{" "}
      </CardHeader>{" "}
      <CardContent>
        {" "}
        <div className="flex flex-col gap-4">
          {" "}
          <div className="flex justify-between items-center text-sm text-gray-500">
            {" "}
            <span>Last Sync: {new Date().toLocaleTimeString()}</span>{" "}
            <Button variant="outline" size="sm" onClick={handleFetch} disabled={loading || syncing}>
              {" "}
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}{" "}
              Fetch Transactions{" "}
            </Button>{" "}
          </div>{" "}
          {transactions.length > 0 && <div className="border rounded-md p-3 bg-gray-50 dark:bg-gray-900/50">
              {" "}
              <h4 className="text-sm font-semibold mb-2">
                New Transactions Found ({transactions.length})
              </h4>{" "}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {" "}
                {transactions.map(tx => <div key={tx.id} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-800 rounded border">
                    {" "}
                    <div className="flex flex-col">
                      {" "}
                      <span className="font-medium">{tx.name}</span>{" "}
                      <span className="text-xs text-gray-400">
                        {tx.date} {tx.partnerName ? `• ${tx.partnerName}` : ""}
                      </span>{" "}
                    </div>{" "}
                    <span className={`font-mono ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {" "}
                      {tx.amount > 0 ? "+" : ""}
                      {tx.amount.toFixed(2)}{" "}
                    </span>{" "}
                  </div>)}{" "}
              </div>{" "}
              <Button className="w-full mt-3" onClick={handleSync} disabled={syncing}>
                {" "}
                {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}{" "}
                Import & Create Statement{" "}
              </Button>{" "}
            </div>}{" "}
          {transactions.length === 0 && !loading && <div className="text-center py-4 text-gray-400 text-sm">
              {" "}
              <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" /> All
              caught up! No new transactions to import.{" "}
            </div>}{" "}
        </div>{" "}
      </CardContent>{" "}
    </Card>;
}