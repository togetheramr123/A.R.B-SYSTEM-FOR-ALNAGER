"use client";
import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { createAnalyticAccount } from "@/app/actions/analytic";
import { toast } from "sonner";
interface Props {
  accounts: any[];
}
export default function AnalyticAccountsClient({
  accounts
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAnalyticAccount({
        name: newName,
        code: newCode
      });
      setNewName("");
      setNewCode("");
      router.refresh();
      toast.success("Analytic Account created");
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setLoading(false);
    }
  };
  return <div className="flex flex-col h-full space-y-4 p-8 bg-gray-50/50">
      {" "}
      <h1 className="text-2xl font-bold">Analytic Accounts</h1>{" "}
      <div className="border rounded-lg bg-white overflow-hidden shadow-sm">
        {" "}
        <Table>
          {" "}
          <TableHeader>
            {" "}
            <TableRow>
              {" "}
              <TableHead className="w-[100px]">Code</TableHead>{" "}
              <TableHead>Name</TableHead>{" "}
              {/* <TableHead>Parent</TableHead> */}{" "}
            </TableRow>{" "}
          </TableHeader>{" "}
          <TableBody>
            {" "}
            {accounts.map((acc: any) => <TableRow key={acc.id}>
                {" "}
                <TableCell className="font-medium text-gray-500">
                  {acc.code || "-"}
                </TableCell>{" "}
                <TableCell>{acc.name}</TableCell>{" "}
                {/* <TableCell>{acc.parentId || '-'}</TableCell> */}{" "}
              </TableRow>)}{" "}
          </TableBody>{" "}
        </Table>{" "}
      </div>{" "}
      <form onSubmit={handleCreate} className="flex gap-4 items-end bg-white p-4 rounded-lg border shadow-sm">
        {" "}
        <div className="space-y-2 w-32">
          {" "}
          <label className="text-sm font-medium">Code</label>{" "}
          <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. PRJ01" />{" "}
        </div>{" "}
        <div className="space-y-2 flex-1">
          {" "}
          <label className="text-sm font-medium">Name</label>{" "}
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Project X" required />{" "}
        </div>{" "}
        <Button type="submit" disabled={loading}>
          {" "}
          <Plus className="mr-2 h-4 w-4" /> Add Account{" "}
        </Button>{" "}
      </form>{" "}
    </div>;
}