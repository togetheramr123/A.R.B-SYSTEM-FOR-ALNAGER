"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getBankStatement, getReconciliationCandidates, reconcileWithExistingItems, reconcileDirectly } from "@/app/actions/bank-reconciliation";
import { formatCurrency } from "@/lib/utils";
import { Check, X, Search, ArrowRight, RefreshCw, Plus } from "lucide-react";
interface ReconciliationWidgetProps {
  statementId: string;
}
export default function ReconciliationWidget({
  statementId
}: ReconciliationWidgetProps) {
  const {
    toast
  } = useToast();
  const [statement, setStatement] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("");
  useEffect(() => {
    loadData();
  }, [statementId]);
  useEffect(() => {
    if (selectedLine) {
      loadCandidates(selectedLine.amount);
    } else {
      setCandidates([]);
    }
  }, [selectedLine]);
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getBankStatement(statementId);
      setStatement(data);
      /* Select first unreconciled line by default */
      const firstUnreconciled = data?.lines.find((l: any) => !l.isReconciled);
      if (firstUnreconciled) setSelectedLine(firstUnreconciled);
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الكشف",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const loadCandidates = async (amount?: number) => {
    /* In a real scenario, we might pre-filter by amount logic here or just fetch recent items // For now, we fetch generic candidates and sort/filter client side or update server action to accept amount */const items = await getReconciliationCandidates(filter);
    setCandidates(items);
  };
  const handleReconcileMatch = async () => {
    if (!selectedLine || !selectedCandidate) return;
    setProcessing(true);
    try {
      await reconcileWithExistingItems(selectedLine.id, [selectedCandidate.id]);
      toast({
        title: "تم بنجاح",
        description: "تمت مطابقة السطر بنجاح"
      });
      setSelectedLine(null);
      setSelectedCandidate(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "فشلت المطابقة",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };
  const handleReconcileCreate = async () => {
    if (!selectedLine) return;
    setProcessing(true);
    try {
      await reconcileDirectly(selectedLine.id, "101200", selectedLine.name);
      /* Default to generic account for now or prompt user */
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الدفعة والمطابقة"
      });
      setSelectedLine(null);
      await loadData();
    } catch (error) {
      console.error(error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الدفعة",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };
  if (loading) return <div>جاري تحميل المطابقة...</div>;
  if (!statement) return <div>لم يتم العثور على الكشف</div>;
  const unreconciledLines = statement.lines.filter((l: any) => !l.isReconciled);
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
      {" "}
      {/* Left: Statement Lines */}{" "}
      <Card className="flex flex-col h-full">
        {" "}
        <CardHeader className="py-3 shadow-sm z-10">
          {" "}
          <CardTitle className="text-lg flex justify-between items-center">
            {" "}
            <span>سطور كشف البنك</span>{" "}
            <Badge variant="secondary">
              {unreconciledLines.length} معلقة
            </Badge>{" "}
          </CardTitle>{" "}
        </CardHeader>{" "}
        <CardContent className="flex-1 overflow-auto p-0">
          {" "}
          {unreconciledLines.length === 0 ? <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              {" "}
              <Check className="h-12 w-12 text-green-500 mb-2" />{" "}
              <p>تمت مطابقة جميع السطور!</p>{" "}
            </div> : <div className="divide-y">
              {" "}
              {unreconciledLines.map((line: any) => <div key={line.id} className={`p-4 cursor-pointer hover:bg-muted transition-colors ${selectedLine?.id === line.id ? "bg-primary/5 border-l-4 border-primary" : ""}`} onClick={() => {
            setSelectedLine(line);
            setSelectedCandidate(null);
          }}>
                  {" "}
                  <div className="flex justify-between items-start mb-1">
                    {" "}
                    <span className="font-medium">{line.name}</span>{" "}
                    <span className={Number(line.amount) > 0 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                      {" "}
                      {formatCurrency(Number(line.amount))}{" "}
                    </span>{" "}
                  </div>{" "}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {" "}
                    <span>{new Date(line.date).toLocaleDateString()}</span>{" "}
                    <span>{line.partner?.name || "-"}</span>{" "}
                  </div>{" "}
                </div>)}{" "}
            </div>}{" "}
        </CardContent>{" "}
      </Card>{" "}
      {/* Right: Matching Area */}{" "}
      <Card className="flex flex-col h-full">
        {" "}
        <CardHeader className="py-3 shadow-sm z-10 bg-muted/30">
          {" "}
          <CardTitle className="text-lg">
            الطرف المقابل (مطابقة أو إنشاء)
          </CardTitle>{" "}
          <div className="relative">
            {" "}
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />{" "}
            <Input placeholder="بحث في المدفوعات الحالية..." className="pl-8" value={filter} onChange={e => {
            setFilter(e.target.value);
            loadCandidates();
          }} />{" "}
          </div>{" "}
        </CardHeader>{" "}
        <CardContent className="flex-1 overflow-auto p-4 space-y-4">
          {" "}
          {selectedLine ? <>
              {" "}
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
                {" "}
                <h3 className="text-sm font-semibold mb-2">
                  السطر المحدد
                </h3>{" "}
                <div className="flex justify-between">
                  {" "}
                  <span>{selectedLine.name}</span>{" "}
                  <span className="font-bold">
                    {formatCurrency(Number(selectedLine.amount))}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
              <div className="space-y-4">
                {" "}
                <h3 className="font-medium text-sm text-muted-foreground">
                  التطابقات المقترحة
                </h3>{" "}
                {candidates.length > 0 ? <div className="grid gap-2">
                    {" "}
                    {candidates.map((item: any) => <div key={item.id} className={`p-3 rounded border cursor-pointer hover:border-primary transition-all ${selectedCandidate?.id === item.id ? "border-primary ring-1 ring-primary bg-primary/5" : ""}`} onClick={() => setSelectedCandidate(item)}>
                        {" "}
                        <div className="flex justify-between items-center text-sm">
                          {" "}
                          <span className="font-medium">
                            {item.entry.name}{" "}
                            {item.entry.ref ? `(${item.entry.ref})` : ""}
                          </span>{" "}
                          <Badge variant={selectedCandidate?.id === item.id ? "default" : "outline"}>
                            {" "}
                            {Number(item.debit) > 0 ? formatCurrency(Number(item.debit) * -1) : formatCurrency(Number(item.credit))}{" "}
                          </Badge>{" "}
                        </div>{" "}
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          {" "}
                          <span>
                            {item.partner?.name || item.account.name}
                          </span>{" "}
                          <span>
                            {new Date(item.entry.date).toLocaleDateString()}
                          </span>{" "}
                        </div>{" "}
                      </div>)}{" "}
                  </div> : <p className="text-sm text-muted-foreground italic">
                    لا توجد تطابقات مباشرة.
                  </p>}{" "}
              </div>{" "}
            </> : <div className="h-full flex items-center justify-center text-muted-foreground">
              {" "}
              اختر سطر كشف لبدء المطابقة{" "}
            </div>}{" "}
        </CardContent>{" "}
        {selectedLine && <div className="p-4 border-t bg-muted/10 flex gap-2 justify-end">
            {" "}
            <Button variant="secondary" onClick={handleReconcileCreate} disabled={processing}>
              {" "}
              <Plus className="mr-2 h-4 w-4" /> إنشاء دفعة{" "}
            </Button>{" "}
            <Button onClick={handleReconcileMatch} disabled={!selectedCandidate || processing} className={selectedCandidate ? "animate-pulse" : ""}>
              {" "}
              <Check className="mr-2 h-4 w-4" /> تأكيد{" "}
            </Button>{" "}
          </div>}{" "}
      </Card>{" "}
    </div>;
}