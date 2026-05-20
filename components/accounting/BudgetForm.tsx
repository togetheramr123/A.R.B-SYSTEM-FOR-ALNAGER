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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash, Calculator, Check, ArrowRight, CornerUpLeft } from "lucide-react";
import { updateBudget, createBudget, createBudgetLine, updateBudgetLine, deleteBudgetLine, computeBudget } from "@/app/actions/budgets";
import { toast } from "sonner";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
interface BudgetFormProps {
  initialData?: any;
  analyticAccounts: any[];
  generalAccounts: any[];
  users: any[];
}
export function BudgetForm({
  initialData,
  analyticAccounts,
  generalAccounts,
  users
}: BudgetFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [lines, setLines] = useState(initialData?.lines || []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentLine, setCurrentLine] = useState<any>(null);
  const {
    register,
    handleSubmit,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      userId: initialData?.userId || "",
      dateFrom: initialData?.dateFrom ? new Date(initialData.dateFrom).toISOString().split("T")[0] : "",
      dateTo: initialData?.dateTo ? new Date(initialData.dateTo).toISOString().split("T")[0] : "",
      state: initialData?.state || "draft" /* مسودة */
    }
  });
  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (initialData?.id) {
        await updateBudget(initialData.id, data);
      } else {
        const newBudget = await createBudget(data);
        router.push(`/accounting/reporting/budgets/${newBudget.id}`);
      }
      toast.success("تم الحفظ بنجاح");
    } catch (error) {
      toast.error("فشل حفظ الموازنة");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  const handleحساب = async () => {
    if (!initialData?.id) return;
    setLoading(true);
    try {
      await computeBudget(initialData.id);
      toast.success("تم حساب الموازنة بنجاح");
      router.refresh();
    } catch (error) {
      toast.error("فشل حساب الموازنة");
    } finally {
      setLoading(false);
    }
  };
  const handleSaveLine = async (lineData: any) => {
    if (!initialData?.id) {
      toast.error("يرجى حفظ الموازنة أولاً");
      return;
    }
    try {
      if (currentLine?.id) {
        await updateBudgetLine(currentLine.id, {
          ...lineData,
          budgetId: initialData.id
        });
      } else {
        await createBudgetLine(initialData.id, {
          ...lineData,
          budgetId: initialData.id
        });
      }
      setDialogOpen(false);
      router.refresh();
      toast.success("تم حفظ البند");
    } catch (error) {
      toast.error("فشل حفظ البند");
    }
  };
  const handleDeleteLine = async (id: string) => {
    if (!confirm("هل أنت متأكد؟")) return;
    try {
      await deleteBudgetLine(id);
      router.refresh();
      toast.success("تم حذف البند");
    } catch (error) {
      toast.error("فشل حذف البند");
    }
  };
  return <Sheet>
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
                {initialData?.id ? `Budget: ${initialData.name}` : "موازنة جديدة"}
              </SheetTitle>{" "}
              <SheetDescription>
                إدارة خطط الموازنة ومقارنتها بالأرقام الفعلية
              </SheetDescription>{" "}
            </div>{" "}
          </div>{" "}
          <div className="flex items-center gap-2">
            {" "}
            {initialData?.id && <Button type="button" variant="secondary" onClick={handleحساب} disabled={loading}>
                {" "}
                <Calculator className="mr-2 h-4 w-4" /> حساب{" "}
              </Button>}{" "}
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
              {["draft" /* مسودة */, "confirmed" /* مؤكد */, "done" /* منتهي */, "cancelled" /* ملغي */].map(step => <button key={step} type="button" onClick={() => setValue("state", step)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${watch("state") === step ? "bg-white shadow-sm text-primary" : "text-gray-500 hover:text-gray-700"}`}>
                  {" "}
                  {step === "draft" ? "مسودة" : step === "confirmed" ? "مؤكد" : step === "done" ? "منتهي" : "ملغي"}{" "}
                </button>)}{" "}
            </div>{" "}
          </div>{" "}
          {/* Main Form */}{" "}
          <div className="grid grid-cols-2 gap-6">
            {" "}
            <div className="space-y-4">
              {" "}
              <div className="space-y-2">
                {" "}
                <Label>اسم الموازنة</Label>{" "}
                <Input {...register("name")} placeholder="مثال: موازنة 2024" required />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <Label>المسؤول</Label>{" "}
                <Select onValueChange={val => setValue("userId", val)} defaultValue={initialData?.userId}>
                  {" "}
                  <SelectTrigger>
                    {" "}
                    <SelectValue placeholder="اختر المستخدم" />{" "}
                  </SelectTrigger>{" "}
                  <SelectContent>
                    {" "}
                    {users.map((u: any) => <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>)}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
              </div>{" "}
            </div>{" "}
            <div className="space-y-4">
              {" "}
              <div className="space-y-2">
                {" "}
                <Label>تاريخ البدء</Label>{" "}
                <Input type="date" {...register("dateFrom")} required />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <Label>تاريخ الانتهاء</Label>{" "}
                <Input type="date" {...register("dateTo")} required />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Lines Section */}{" "}
          <div className="space-y-4">
            {" "}
            <div className="flex items-center justify-between">
              {" "}
              <h3 className="text-lg font-semibold">بنود الموازنة</h3>{" "}
              <Button type="button" size="sm" onClick={() => {
              setCurrentLine(null);
              setDialogOpen(true);
            }}>
                {" "}
                <Plus className="mr-2 h-4 w-4" /> إضافة بند{" "}
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
                    <TableHead>الحساب التحليلي</TableHead>{" "}
                    <TableHead>الحساب العام</TableHead>{" "}
                    <TableHead>تاريخ البدء</TableHead>{" "}
                    <TableHead>تاريخ الانتهاء</TableHead>{" "}
                    <TableHead className="text-right">المبلغ المخطط</TableHead>{" "}
                    <TableHead className="text-right">المبلغ الفعلي</TableHead>{" "}
                    <TableHead className="text-right">المبلغ النظري</TableHead>{" "}
                    <TableHead className="text-right">%</TableHead>{" "}
                    <TableHead className="w-[100px]"></TableHead>{" "}
                  </TableRow>{" "}
                </TableHeader>{" "}
                <TableBody>
                  {" "}
                  {initialData?.lines?.map((line: any) => <TableRow key={line.id} className="group">
                      {" "}
                      <TableCell>
                        {line.analyticAccount?.name || "-"}
                      </TableCell>{" "}
                      <TableCell>{line.generalAccount?.name || "-"}</TableCell>{" "}
                      <TableCell>
                        {new Date(line.dateFrom).toLocaleDateString()}
                      </TableCell>{" "}
                      <TableCell>
                        {new Date(line.dateTo).toLocaleDateString()}
                      </TableCell>{" "}
                      <TableCell className="text-right font-medium">
                        {parseFloat(line.plannedAmount).toFixed(2)}
                      </TableCell>{" "}
                      <TableCell className="text-right">
                        {parseFloat(line.practicalAmount).toFixed(2)}
                      </TableCell>{" "}
                      <TableCell className="text-right text-gray-500">
                        {parseFloat(line.theoreticalAmount).toFixed(2)}
                      </TableCell>{" "}
                      <TableCell className="text-right">
                        {" "}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${parseFloat(line.percentage) > 100 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {" "}
                          {parseFloat(line.percentage).toFixed(1)}%{" "}
                        </span>{" "}
                      </TableCell>{" "}
                      <TableCell>
                        {" "}
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {" "}
                          <Button variant="ghost" size="icon" type="button" onClick={() => {
                        setCurrentLine(line);
                        setDialogOpen(true);
                      }}>
                            {" "}
                            <ArrowRight className="h-4 w-4" />{" "}
                          </Button>{" "}
                          <Button variant="ghost" size="icon" type="button" onClick={() => handleDeleteLine(line.id)}>
                            {" "}
                            <Trash className="h-4 w-4 text-red-500" />{" "}
                          </Button>{" "}
                        </div>{" "}
                      </TableCell>{" "}
                    </TableRow>)}{" "}
                  {(!initialData?.lines || initialData.lines.length === 0) && <TableRow>
                      {" "}
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        {" "}
                        No budget lines defined. Click "إضافة بند" to start
                        planning.{" "}
                      </TableCell>{" "}
                    </TableRow>}{" "}
                </TableBody>{" "}
              </Table>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </form>{" "}
      <LineDialog open={dialogOpen} onOpenChange={setDialogOpen} initialData={currentLine} analyticAccounts={analyticAccounts} generalAccounts={generalAccounts} onSubmit={handleSaveLine} defaultDates={{
      from: watch("dateFrom"),
      to: watch("dateTo")
    }} />{" "}
    </Sheet>;
}
function LineDialog({
  open,
  onOpenChange,
  initialData,
  analyticAccounts,
  generalAccounts,
  onSubmit,
  defaultDates
}: any) {
  const {
    register,
    handleSubmit,
    reset,
    setValue
  } = useForm();
  /* Reset when dialog opens/changes */
  if (open && initialData) {
    setValue("analyticAccountId", initialData.analyticAccountId);
    setValue("generalAccountId", initialData.generalAccountId);
    setValue("dateFrom", new Date(initialData.dateFrom).toISOString().split("T")[0]);
    setValue("dateTo", new Date(initialData.dateTo).toISOString().split("T")[0]);
    setValue("plannedAmount", initialData.plannedAmount);
  } else if (open && !initialData) {
    setValue("dateFrom", defaultDates.from || "");
    setValue("dateTo", defaultDates.to || "");
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      {" "}
      <DialogContent>
        {" "}
        <DialogHeader>
          {" "}
          <DialogTitle>
            {initialData ? "تعديل بند" : "إضافة بند"}
          </DialogTitle>{" "}
        </DialogHeader>{" "}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <div className="space-y-2">
              {" "}
              <Label>الحساب التحليلي</Label>{" "}
              <Select onValueChange={val => setValue("analyticAccountId", val)} defaultValue={initialData?.analyticAccountId}>
                {" "}
                <SelectTrigger>
                  {" "}
                  <SelectValue placeholder="اختر..." />{" "}
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  {analyticAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>)}{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>الحساب العام</Label>{" "}
              <Select onValueChange={val => setValue("generalAccountId", val)} defaultValue={initialData?.generalAccountId}>
                {" "}
                <SelectTrigger>
                  {" "}
                  <SelectValue placeholder="اختر..." />{" "}
                </SelectTrigger>{" "}
                <SelectContent>
                  {" "}
                  {generalAccounts.map((a: any) => <SelectItem key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </SelectItem>)}{" "}
                </SelectContent>{" "}
              </Select>{" "}
            </div>{" "}
          </div>{" "}
          <div className="grid grid-cols-2 gap-4">
            {" "}
            <div className="space-y-2">
              {" "}
              <Label>تاريخ البدء</Label>{" "}
              <Input type="date" {...register("dateFrom")} required />{" "}
            </div>{" "}
            <div className="space-y-2">
              {" "}
              <Label>تاريخ الانتهاء</Label>{" "}
              <Input type="date" {...register("dateTo")} required />{" "}
            </div>{" "}
          </div>{" "}
          <div className="space-y-2">
            {" "}
            <Label>المبلغ المخطط</Label>{" "}
            <Input type="number" step="0.01" {...register("plannedAmount", {
            required: true,
            valueAsNumber: true,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
              const val = convertArabicToEnglishNumbers(e.target.value);
              setValue("plannedAmount", val ? parseFloat(val) : 0, {
                shouldValidate: true,
                shouldDirty: true
              });
            }
          })} />{" "}
          </div>{" "}
          <DialogFooter>
            {" "}
            <Button type="submit">حفظ البند</Button>{" "}
          </DialogFooter>{" "}
        </form>{" "}
      </DialogContent>{" "}
    </Dialog>;
}