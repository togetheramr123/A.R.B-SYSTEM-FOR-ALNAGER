"use client";
import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetBody } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash, Check, ArrowRight, CornerUpLeft, Search, CloudUpload } from "lucide-react";
import { TopPortal } from '@/components/common/TopPortal';
import { createBankStatement, updateBankStatement, addBankStatementLine } from "@/app/actions/bank-reconciliation";
import { Chatter } from "@/components/chatter/Chatter";
import { toast } from "sonner";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
interface BankStatementFormProps {
  initialData?: any;
  journals: any[];
  partners: any[];
}
export function BankStatementForm({
  initialData,
  journals,
  partners
}: BankStatementFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState(initialData?.lines || []);
  const {
    register,
    handleSubmit,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      journalId: initialData?.journalId || "",
      date: initialData?.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      balanceStart: initialData?.balanceStart || 0,
      balanceEnd: initialData?.balanceEnd || 0,
      state: initialData?.state || "draft"
    }
  });
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateBankStatement(initialData.id, data);
      } else {
        const newStatement = await createBankStatement(data);
        router.push(`/accounting/reconciliation/${newStatement.id}`);
      }
      toast.success("تم الحفظ بنجاح");
    } catch (error) {
      toast.error("فشل في حفظ الكشف");
    } finally {
      setLoading(false);
    }
  };
  const handleAddLine = async () => {
    if (!initialData?.id) {
      toast.error("يرجى حفظ رأس الكشف أولاً");
      return;
    }
    try {
      await addBankStatementLine(initialData.id, {
        date: watch("date"),
        name: "معاملة جديدة",
        amount: 0
      });
      router.refresh();
      toast.success("تم إضافة السطر");
    } catch (error) {
      toast.error("فشل في إضافة السطر");
    }
  };
  return <>
    <TopPortal>
      <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse" dir="rtl">
        <button onClick={handleSubmit(onSubmit)} disabled={loading}
          className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-sm font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2 h-8">
          <CloudUpload className="w-4 h-4" />
          حفظ
        </button>
      </div>
    </TopPortal>
    <Sheet>
      {" "}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        {" "}
        <SheetHeader className="flex flex-row items-center justify-between border-b px-6 py-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
          {" "}
          <div className="flex items-center gap-4">
            {" "}
            <div>
              {" "}
              <SheetTitle>
                {initialData?.id ? `كشف: ${initialData.name}` : "كشف بنكي جديد"}
              </SheetTitle>{" "}
              <SheetDescription>
                تسجيل المعاملات البنكية ومطابقتها مع دفتر الأستاذ
              </SheetDescription>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            <Button type="submit" disabled={loading}>
              {" "}
              {loading ? "جاري الحفظ..." : "حفظ"}{" "}
            </Button>{" "}
          </div>{" "}
        </SheetHeader>{" "}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {" "}
          {/* Status Ribbon */}{" "}
          <div className="flex justify-end border-b pb-4">
            {" "}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {" "}
              {["draft", "open", "posted", "cancelled"].map(step => <div key={step} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${watch("state") === step ? "bg-white shadow-sm text-primary" : "text-gray-500"}`}>
                  {" "}
                  {step.charAt(0).toUpperCase() + step.slice(1)}{" "}
                </div>)}{" "}
            </div>{" "}
          </div>{" "}
          {/* Main Form */}{" "}
          <div className="grid grid-cols-2 gap-6">
            {" "}
            <div className="space-y-4">
              {" "}
              <div className="space-y-2">
                {" "}
                <Label>اسم الكشف</Label>{" "}
                <Input {...register("name")} placeholder="e.g. Bank/2024/001" required />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <Label>دفتر اليومية (بنك/نقدي)</Label>{" "}
                <Select onValueChange={val => setValue("journalId", val)} defaultValue={initialData?.journalId}>
                  {" "}
                  <SelectTrigger>
                    {" "}
                    <SelectValue placeholder="اختر دفتر اليومية" />{" "}
                  </SelectTrigger>{" "}
                  <SelectContent>
                    {" "}
                    {journals.map((j: any) => <SelectItem key={j.id} value={j.id}>
                        {j.name} ({j.code})
                      </SelectItem>)}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
              </div>{" "}
            </div>{" "}
            <div className="space-y-4">
              {" "}
              <div className="space-y-2">
                {" "}
                <Label>التاريخ</Label>{" "}
                <Input type="date" {...register("date")} required />{" "}
              </div>{" "}
              <div className="grid grid-cols-2 gap-4">
                {" "}
                <div className="space-y-2">
                  {" "}
                  <Label>رصيد البداية</Label>{" "}
                  <Input type="number" step="0.01" {...register("balanceStart", {
                  valueAsNumber: true,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = convertArabicToEnglishNumbers(e.target.value);
                    setValue("balanceStart", val ? parseFloat(val) : 0, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                })} />{" "}
                </div>{" "}
                <div className="space-y-2">
                  {" "}
                  <Label>رصيد النهاية</Label>{" "}
                  <Input type="number" step="0.01" {...register("balanceEnd", {
                  valueAsNumber: true,
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = convertArabicToEnglishNumbers(e.target.value);
                    setValue("balanceEnd", val ? parseFloat(val) : 0, {
                      shouldValidate: true,
                      shouldDirty: true
                    });
                  }
                })} />{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Lines Section */}{" "}
          <div className="space-y-4">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <h3 className="text-lg font-semibold">المعاملات</h3>{" "}
              <Button type="button" size="sm" variant="outline" onClick={handleAddLine}>
                {" "}
                <Plus className="mr-2 h-4 w-4" /> إضافة معاملة{" "}
              </Button>{" "}
            </div>{" "}
            <div className="border rounded-lg overflow-hidden">
              {" "}
              <Table>
                {" "}
                <TableHeader>
                  {" "}
                  <TableRow>
                    {" "}
                    <TableHead className="w-[120px]">التاريخ</TableHead>{" "}
                    <TableHead>البيان</TableHead> <TableHead>الشريك</TableHead>{" "}
                    <TableHead className="text-right">المبلغ</TableHead>{" "}
                    <TableHead className="w-[100px] text-center">
                      الحالة
                    </TableHead>{" "}
                    <TableHead className="w-[100px]"></TableHead>{" "}
                  </TableRow>{" "}
                </TableHeader>{" "}
                <TableBody>
                  {" "}
                  {initialData?.lines?.map((line: any) => <TableRow key={line.id} className="group">
                      {" "}
                      <TableCell>
                        {new Date(line.date).toLocaleDateString()}
                      </TableCell>{" "}
                      <TableCell className="font-medium">{line.name}</TableCell>{" "}
                      <TableCell>{line.partner?.name || "-"}</TableCell>{" "}
                      <TableCell className={`text-right font-medium ${parseFloat(line.amount) < 0 ? "text-red-600" : "text-green-600"}`}>
                        {" "}
                        {parseFloat(line.amount).toFixed(2)}{" "}
                      </TableCell>{" "}
                      <TableCell className="text-center">
                        {" "}
                        {line.isReconciled ? <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs">
                            {" "}
                            <Check className="h-3 w-3 mr-1" /> تمت المطابقة{" "}
                          </span> : <span className="inline-flex items-center text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-xs">
                            {" "}
                            معلقة{" "}
                          </span>}{" "}
                      </TableCell>{" "}
                      <TableCell>
                        {" "}
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {" "}
                          <Button variant="ghost" size="icon">
                            {" "}
                            <Trash className="h-4 w-4 text-red-500" />{" "}
                          </Button>{" "}
                        </div>{" "}
                      </TableCell>{" "}
                    </TableRow>)}{" "}
                  {(!initialData?.lines || initialData.lines.length === 0) && <TableRow>
                      {" "}
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500 italic">
                        {" "}
                        لا توجد معاملات مسجلة بعد.{" "}
                      </TableCell>{" "}
                    </TableRow>}{" "}
                </TableBody>{" "}
              </Table>{" "}
            </div>{" "}
          </div>{" "}
          {initialData?.id && <div className="mt-8 pt-8 border-t"><Chatter model="bankStatement" id={initialData.id} /></div>}
        </div>{" "}
      </form>{" "}
    </Sheet>
    </>;
}