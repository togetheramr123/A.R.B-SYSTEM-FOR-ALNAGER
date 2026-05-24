'use client';
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { getChartOfAccounts } from '@/app/actions/accounting';
interface JournalCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    code: string;
    name: string;
    type: string;
    defaultAccountId?: string;
  }) => Promise<void>;
  initialData?: {
    code?: string;
    type?: string;
  };
}
export function JournalCreationDialog({
  open,
  onOpenChange,
  onConfirm,
  initialData
}: JournalCreationDialogProps) {
  const t = useTranslations('Accounting');
  const [code, setCode] = useState(initialData?.code || '');
  const [name, setName] = useState('');
  const [type, setType] = useState(initialData?.type || 'sale');
  const [defaultAccountId, setDefaultAccountId] = useState<string>('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const journalTypes = [{
    value: 'sale',
    label: 'مبيعات'
  }, {
    value: 'purchase',
    label: 'مشتريات'
  }, {
    value: 'cash',
    label: 'نقدي'
  }, {
    value: 'bank',
    label: 'بنك'
  }, {
    value: 'general',
    label: 'متنوعة'
  }];
  useEffect(() => {
    if (open) {
      getChartOfAccounts().then(accs => setAccounts(accs));
    }
  }, [open]);
  const handleConfirm = async () => {
    if (!code || !name || !type) {
      setError('يرجى تعبئة الكود والاسم والنوع.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm({
        code: code.trim().toUpperCase(),
        name,
        type,
        defaultAccountId: defaultAccountId || undefined
      });
    } catch (err: any) {
      setError(err.message || 'فشلت العملية');
    } finally {
      setLoading(false);
    }
  };
  const filteredAccounts = accounts.filter(acc => {
    if (type === 'bank') return acc.type === 'bank';
    if (type === 'cash') return acc.type === 'cash' || acc.type === 'asset';
    if (type === 'sale') return acc.type === 'income' || acc.type === 'receivable';
    if (type === 'purchase') return acc.type === 'expense' || acc.type === 'payable';
    return true;
  });
  return <Dialog open={open} onOpenChange={onOpenChange}> <DialogContent className="sm:max-w-[425px]"> <DialogHeader> <DialogTitle>إنشاء دفتر يومية جديد</DialogTitle> <DialogDescription> تعريف دفتر يومية محاسبي جديد (مثال: بنك، نقدي، مبيعات). </DialogDescription> </DialogHeader> {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>} <div className="grid gap-4 py-4"> <div className="grid gap-2"> <Label htmlFor="name">اسم دفتر اليومية</Label> <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="مثال: فواتير العملاء" /> </div> <div className="grid grid-cols-2 gap-4"> <div className="grid gap-2"> <Label htmlFor="type">النوع</Label> <select id="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={type} onChange={e => {
              setType(e.target.value);
              setDefaultAccountId('');
            }}> {journalTypes.map(jt => <option key={jt.value} value={jt.value}>{jt.label}</option>)} </select> </div> <div className="grid gap-2"> <Label htmlFor="code">الكود المختصر</Label> <Input id="code" value={code} maxLength={5} onChange={e => setCode(e.target.value)} placeholder="مثال: INV" className="uppercase" /> </div> </div> <div className="grid gap-2"> <Label htmlFor="defaultAccountId">الحساب الافتراضي (اختياري)</Label> <select id="defaultAccountId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" value={defaultAccountId} onChange={e => setDefaultAccountId(e.target.value)}> <option value="">-- اختر حساباً --</option> {filteredAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} {acc.name}</option>)} </select> <p className="text-xs text-slate-500"> الحساب الافتراضي المستخدم عند إنشاء القيود تلقائياً. </p> </div> </div> <DialogFooter> <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}> إلغاء </Button> <Button onClick={handleConfirm} disabled={loading} className="bg-sky-600 hover:bg-sky-700"> {loading ? "جاري الحفظ..." : "إنشاء دفتر اليومية"} </Button> </DialogFooter> </DialogContent> </Dialog>;
}