import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { convertArabicToEnglishNumbers } from "@/lib/utils/numberUtils";
interface AccountCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    code: string;
    name: string;
    type: string;
    allowReconciliation: boolean;
  }) => Promise<void>;
  initialData?: {
    code?: string;
    type?: string;
  };
}
export function AccountCreationDialog({
  open,
  onOpenChange,
  onConfirm,
  initialData
}: AccountCreationDialogProps) {
  const t = useTranslations("Accounting");
  const [code, setCode] = useState(initialData?.code || "");
  const [name, setName] = useState("");
  const [type, setType] = useState(initialData?.type || "asset");
  const [allowReconciliation, setAllowReconciliation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accountTypes = [{
    value: "asset",
    label: "أصول متداولة"
  }, {
    value: "non_current_asset",
    label: "أصول غير متداولة"
  }, {
    value: "bank",
    label: "بنك ونقد"
  }, {
    value: "receivable",
    label: "مدينون"
  }, {
    value: "payable",
    label: "دائنون"
  }, {
    value: "liability",
    label: "التزامات متداولة"
  }, {
    value: "non_current_liability",
    label: "التزامات غير متداولة"
  }, {
    value: "equity",
    label: "حقوق الملكية"
  }, {
    value: "income",
    label: "إيرادات"
  }, {
    value: "other_income",
    label: "إيرادات أخرى"
  }, {
    value: "expense",
    label: "مصروفات"
  }, {
    value: "cost_of_revenue",
    label: "تكلفة الإيرادات"
  }];
  const handleConfirm = async () => {
    if (!code || !name || !type) {
      setError("يرجى تعبئة الكود والاسم والنوع.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onConfirm({
        code: convertArabicToEnglishNumbers(code),
        name,
        type,
        allowReconciliation
      }); // Dialog will be closed by parent on success setCode(''); setName(''); setType('asset');
    } catch (err: any) {
      setError(err.message || "فشلت العملية");
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      {" "}
      <DialogContent className="sm:max-w-[425px]">
        {" "}
        <DialogHeader>
          {" "}
          <DialogTitle>إنشاء حساب جديد</DialogTitle>{" "}
          <DialogDescription>
            {" "}
            تعريف حساب دفتر أستاذ جديد.{" "}
          </DialogDescription>{" "}
        </DialogHeader>{" "}
        {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error}
          </div>}{" "}
        <div className="grid gap-4 py-4">
          {" "}
          <div className="grid gap-2">
            {" "}
            <Label htmlFor="code">الكود</Label>{" "}
            <Input id="code" value={code} onChange={e => setCode(e.target.value)} placeholder="مثال: 101000" />{" "}
          </div>{" "}
          <div className="grid gap-2">
            {" "}
            <Label htmlFor="name">اسم الحساب</Label>{" "}
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: الصندوق" />{" "}
          </div>{" "}
          <div className="grid gap-2">
            {" "}
            <Label htmlFor="type">النوع</Label>{" "}
            <select id="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={type} onChange={e => {
            setType(e.target.value); // Auto-toggle reconciliation for Receivable/Payable
            if (["receivable", "payable"].includes(e.target.value)) {
              setAllowReconciliation(true);
            }
          }}>
              {" "}
              {accountTypes.map(at => <option key={at.value} value={at.value}>
                  {at.label}
                </option>)}{" "}
            </select>{" "}
          </div>{" "}
          <div className="flex items-center gap-2 mt-2 cursor-pointer" onClick={() => setAllowReconciliation(!allowReconciliation)}>
            {" "}
            <input type="checkbox" checked={allowReconciliation} onChange={e => setAllowReconciliation(e.target.checked)} className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer" />{" "}
            <Label className="cursor-pointer mb-0">السماح بالمطابقة</Label>{" "}
          </div>{" "}
          <p className="text-xs text-slate-500 ml-6 -mt-1">
            مطلوب لحسابات المدينين والدائنين
          </p>{" "}
        </div>{" "}
        <DialogFooter>
          {" "}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {" "}
            إلغاء{" "}
          </Button>{" "}
          <Button onClick={handleConfirm} disabled={loading} className="bg-sky-600 hover:bg-sky-700">
            {" "}
            {loading ? "جاري الحفظ..." : "حفظ الحساب"}{" "}
          </Button>{" "}
        </DialogFooter>{" "}
      </DialogContent>{" "}
    </Dialog>;
}