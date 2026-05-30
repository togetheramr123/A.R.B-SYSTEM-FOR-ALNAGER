'use client';
import React from "react";
import { FormLoadingOverlay } from "@/components/common/FormLoadingOverlay";

import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Save, Check, Plus, Trash2, Printer, Download, CreditCard, ShieldCheck, List, FileText, Settings, Info, CloudUpload, AlertCircle, Loader2, ArrowRight, GripVertical, HelpCircle, SlidersHorizontal, Banknote, Send, Receipt, X } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, updateInvoice, getChartOfAccounts, getJournals, getCustomerSalesHistory, getVendorPurchaseHistory } from '@/app/actions/accounting';
import { searchProducts, getPartners } from '@/app/actions/inventory';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Chatter } from '@/components/chatter/Chatter';
import { AttachmentPanel } from '@/components/common/AttachmentPanel';
import { parsePrismaError } from '@/lib/utils/errorHandler';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { OdooCombobox } from '@/components/ui/OdooCombobox';
import { OutstandingPayments } from '@/components/accounting/OutstandingPayments';
import { useBreadcrumbStore } from '@/hooks/useBreadcrumbStore';
import { usePathname } from 'next/navigation';
import { assignCollectionPolicy, sendCollectionMessage, getCashRegisterUsers } from '@/app/actions/collection';
import { useStatusStore } from '@/store/statusStore';
import { useAutoSaveOnLeave } from '@/hooks/useAutoSaveOnLeave';
const invoiceLineSchema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  qty: z.coerce.number().min(0.01, {
    message: "الكمية يجب أن تكون أكبر من 0"
  }),
  price: z.coerce.number().min(0, {
    message: "السعر لا يمكن أن يكون سالباً"
  }),
  accountId: z.string().optional().nullable(),
  tax: z.coerce.number().min(0).max(100).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  uom: z.string().optional().nullable(),
  secondaryQuantity: z.coerce.number().optional().nullable(),
  secondaryUnit: z.string().optional().nullable(),
  lineType: z.string().default('line')
}).superRefine((data, ctx) => {
  if (data.lineType === 'line' && !data.productId && !data.name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "المنتج أو الوصف مطلوب للاسطر العادية",
      path: ['productId']
    });
  }
});
const invoiceSchema = z.object({
  partner: z.string().min(1, {
    message: "العميل مطلوب"
  }),
  date: z.string().min(1, {
    message: "تاريخ الفاتورة مطلوب"
  }),
  due: z.union([z.string(), z.null()]).optional(),
  paymentTerms: z.union([z.string(), z.null()]).optional(),
  journalId: z.union([z.string(), z.null()]).optional(),
  billReference: z.union([z.string(), z.null()]).optional(),
  paymentReference: z.union([z.string(), z.null()]).optional(),
  accountingDate: z.union([z.string(), z.null()]).optional(),
  invoiceOrigin: z.union([z.string(), z.null()]).optional(),
  salesperson: z.union([z.string(), z.null()]).optional(),
  customerRef: z.union([z.string(), z.null()]).optional(),
  fiscalPosition: z.union([z.string(), z.null()]).optional(),
  narration: z.union([z.string(), z.null()]).optional(),
  lines: z.array(invoiceLineSchema).min(1, {
    message: "يجب إضافة بند واحد على الأقل"
  })
});
interface InvoiceFormProps {
  invoiceType?: 'out_invoice' | 'in_invoice' | 'out_refund' | 'in_refund';
  initialData?: any;
  defaultEditing?: boolean;
}
interface LineItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  accountId: string;
  tax: number;
}
function ProductSelector({
  onSelect
}: {
  onSelect: (p: any) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (query.length > 1) {
      searchProducts(query).then(setResults);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query]);
  return <div className="relative"> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث عن منتج..." className="w-full p-1.5 bg-transparent font-medium text-slate-900 border-b border-transparent focus:border-blue-500 outline-none focus:bg-white placeholder-slate-400 text-sm" /> {isOpen && results.length > 0 && <div className="absolute top-full right-0 w-[400px] bg-white shadow-sm rounded-lg border border-slate-100 z-[100] max-h-60 overflow-y-auto mt-1"> {results.map(product => <div key={product.id} onClick={() => {
        onSelect(product);
        setQuery(product.name);
        setIsOpen(false);
      }} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center group"> <div className="flex flex-col text-right"> <span className="font-bold text-slate-800 text-sm group-hover:text-blue-700">{product.name}</span> <span className="text-xs text-slate-500">السعر: {product.price} | الضريبة: {product.taxes}%</span> </div> {product.hasSecondaryUnit && <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-1 rounded-full font-bold"> {product.secondaryUnit} </span>} </div>)} </div>} </div>;
}
export function InvoiceForm({
  invoiceType = 'out_invoice',
  initialData,
  defaultEditing = false
}: InvoiceFormProps) {
  const t = useTranslations('Accounting.Invoices');
  const locale = useLocale();
  const [status, setStatus] = useState(initialData?.state || 'draft');
  const [approvalStatus, setApprovalStatus] = useState(initialData?.approvalStatus || 'none');
  const isLocked = status !== 'draft';
  const pathname = usePathname();
  const invoiceName = initialData?.name || 'سجل';
  useEffect(() => {
    if (initialData?.state) {
      setStatus(initialData.state);
    }
  }, [initialData?.state]);
  useEffect(() => {
    if (initialData?.approvalStatus) {
      setApprovalStatus(initialData.approvalStatus);
    }
  }, [initialData?.approvalStatus]);
  useEffect(() => {
    if (invoiceName && pathname) {
      useBreadcrumbStore.getState().updateCurrentLabel(invoiceName);
    }
  }, [invoiceName, pathname]);
  const [activeTab, setActiveTab] = useState<'lines' | 'journal' | 'info' | 'collection'>('lines');
  const [collectionData, setCollectionData] = useState({
    policy: initialData?.collectionPolicy || '',
    assigneeId: initialData?.collectionAssigneeId || '',
    notes: initialData?.collectionNotes || '',
    dueDate: initialData?.collectionDueDate ? new Date(initialData.collectionDueDate).toISOString().split('T')[0] : ''
  });
  const [cashUsers, setCashUsers] = useState<any[]>([]);
  const [collectionSaving, setCollectionSaving] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [partnersList, setPartnersList] = useState<any[]>([]);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const {
    saveDraft,
    loadDraft,
    clearDraft
  } = useFormDraft(`invoice_${invoiceType}_new`, true);
  const setStoreUnsaved = useStatusStore(state => state.setHasUnsavedChanges);
  const setStoreIsSaving = useStatusStore(state => state.setIsSaving);
  const setTriggers = useStatusStore(state => state.setTriggers);
  const clearTriggers = useStatusStore(state => state.clearTriggers);
  const [draftId, setDraftId] = useState<string | null>(initialData?.id || null);
  const isSale = invoiceType === 'out_invoice';
  const isExpense = invoiceType === 'in_invoice';
  const isRefund = invoiceType === 'out_refund' || invoiceType === 'in_refund';
  const isSaleRefund = invoiceType === 'out_refund';
  const isPurchaseRefund = invoiceType === 'in_refund';
  const [partnerHistory, setPartnerHistory] = useState<any[]>([]);

  const [lineAlerts, setLineAlerts] = useState<Record<number, {
    type: string;
    message: string;
  }>>({});
  const [showColumnToggles, setShowColumnToggles] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    assetCategory: true,
    account: true,
    qty: true,
    uom: true,
    secondaryQty: true,
    secondaryUom: true,
    price: true,
    discount: true,
    discount2: false,
    taxes: true,
    subtotal: true
  });
  const formatInitialData = () => {
    if (!initialData) return null;
    return {
      partner: initialData.partnerId || '',
      date: initialData.dateInvoice ? new Date(initialData.dateInvoice).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      due: initialData.dateDue ? new Date(initialData.dateDue).toISOString().split('T')[0] : '',
      paymentTerms: '',
      journalId: initialData.journalId || '',
      billReference: initialData.paymentReference || initialData.name || '',
      paymentReference: initialData.paymentReference || '',
      accountingDate: initialData.dateInvoice ? new Date(initialData.dateInvoice).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      invoiceOrigin: initialData.invoiceOrigin || '',
      salesperson: '',
      customerRef: '',
      fiscalPosition: initialData.fiscalPositionId || '',
      narration: initialData.narration || '',
      lines: initialData.lines && initialData.lines.length > 0 ? initialData.lines.map((l: any) => ({
        id: l.id,
        productId: l.productId || '',
        name: l.name || '',
        qty: Number(l.quantity) || 1,
        price: Number(l.priceUnit) || 0,
        accountId: l.accountId || '',
        tax: l.taxes?.[0]?.tax?.amount ? Number(l.taxes[0].tax.amount) : 0,
        discount: Number(l.discount1) || 0,
        discount2: Number(l.discount2) || 0,
        uom: l.unitName || 'قطعة',
        secondaryQuantity: Number(l.secondaryQuantity) || 0,
        secondaryUnit: l.secondaryUnit || '',
        lineType: l.lineType || 'line',
        productType: l.product?.type || undefined
      })) : [{
        productId: '',
        name: '',
        qty: 1,
        price: 0,
        accountId: '',
        tax: null as any,
        discount: 0,
        discount2: 0,
        uom: 'قطعة',
        secondaryQuantity: 0,
        secondaryUnit: '',
        lineType: 'line',
        productType: undefined
      }]
    };
  };
  const formValues = useMemo(() => formatInitialData(), [initialData]);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: {
      isDirty
    }
  } = useForm({
    defaultValues: formValues || {
      partner: '',
      date: '',
      due: '',
      paymentTerms: '',
      journalId: '',
      billReference: '',
      paymentReference: '',
      accountingDate: '',
      invoiceOrigin: '',
      salesperson: '',
      customerRef: '',
      fiscalPosition: '',
      narration: '',
      lines: [{
        productId: '',
        name: '',
        qty: 1,
        price: 0,
        accountId: '',
        tax: null as any,
        discount: 0,
        uom: 'قطعة',
        secondaryQuantity: 0,
        secondaryUnit: '',
        lineType: 'line'
      }]
    },
    values: formValues || undefined
  });
  const {
    fields,
    append,
    remove,
    update,
    move
  } = useFieldArray({
    control,
    name: "lines"
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isLocked) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    const ghost = document.createElement('div');
    ghost.style.width = '1px';
    ghost.style.height = '1px';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => ghost.remove(), 0);
  };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || isLocked) return;
    move(draggedIndex, index);
    setDraggedIndex(index);
  };
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  const lines = watch("lines") || [];
  useEffect(() => {}, []);
  const productOptions = useMemo(() => {
    const pMap = new Map();
    (products || []).forEach(p => pMap.set(p.id, p.name));
    (lines || []).forEach((l: any) => {
      if (l.productId && l.name) pMap.set(l.productId, l.name);
    });
    return Array.from(pMap.entries()).map(([value, label]) => ({
      value,
      label
    }));
  }, [products, lines]);
  const accountOptions = useMemo(() => accounts.map(acc => ({
    label: `${acc.code} ${acc.name}`,
    value: acc.id
  })), [accounts]);
  const fetchPartnerHistory = useCallback(async (partnerId: string) => {
    if (!partnerId || !isRefund) return;
    try {
      const history = isSaleRefund ? await getCustomerSalesHistory(partnerId) : await getVendorPurchaseHistory(partnerId);
      setPartnerHistory(history);
      const currentLines = getValues('lines') || [];
      const newAlerts: Record<number, {
        type: string;
        message: string;
      }> = {};
      currentLines.forEach((line: any, idx: number) => {
        if (line.productId && line.lineType === 'line') {
          const histItem = history.find((h: any) => h.productId === line.productId);
          if (histItem) {
            setValue(`lines.${idx}.price`, histItem.lastNetPrice, {
              shouldDirty: true
            });
            setValue(`lines.${idx}.discount`, 0, {
              shouldDirty: true
            });
          } else {
            newAlerts[idx] = {
              type: 'not_in_history',
              message: `⚠️ هذا الصنف ليس ضمن فواتير ${isSaleRefund ? 'بيع' : 'شراء'} هذا ${isSaleRefund ? 'العميل' : 'المورد'}`
            };
          }
        }
      });
      setLineAlerts(newAlerts);
    } catch (e) {
      console.error('Failed to fetch partner history:', e);
    }
  }, [isRefund, isSaleRefund, getValues, setValue]);
  const checkLineAlerts = useCallback((currentLines: any[]) => {
    if (!isRefund || partnerHistory.length === 0) return;
    const newAlerts: Record<number, {
      type: string;
      message: string;
    }> = {};
    (currentLines || []).forEach((line: any, idx: number) => {
      if (!line.productId || line.lineType !== 'line') return;
      const histItem = partnerHistory.find((h: any) => h.productId === line.productId);
      if (!histItem) {
        newAlerts[idx] = {
          type: 'not_in_history',
          message: `⚠️ هذا الصنف ليس ضمن فواتير ${isSaleRefund ? 'بيع' : 'شراء'} هذا ${isSaleRefund ? 'العميل' : 'المورد'}`
        };
      } else {
        const totalQty = isSaleRefund ? histItem.totalQtySold : histItem.totalQtyPurchased;
        const returnQty = Number(line.qty || 0);
        if (returnQty > totalQty) {
          const excess = returnQty - totalQty;
          newAlerts[idx] = {
            type: 'excess_qty',
            message: `⚠️ ${isSaleRefund ? 'العميل اشترى' : 'تم شراء'} ${totalQty} فقط من هذا الصنف، والمرتجع ${returnQty} (فارق: ${excess})`
          };
        }
      }
    });
    setLineAlerts(newAlerts);
  }, [isRefund, partnerHistory, isSaleRefund]);
  const handleProductSelect = async (lineId: string, productId: string | null) => {
    setHasUnsavedChanges(true);
    const lineIndex = fields.findIndex(f => f.id === lineId);
    if (lineIndex !== -1 && productId) {
      const products = await searchProducts(productId);
      const product = products.find((p: any) => p.id === productId);
      if (product) {
        if (product.productType === 'storable' && !isRefund) {
          alert('عذراً، هذا المنتج يخضع للجرد المادي (مخزني). لا يُسمح بتعديل منتجات المخزن مباشرة من الفاتورة. الرجاء الإضافة من خلال إيصال المخزن أولاً ليتم عكسه هنا تلقائياً.');
          return;
        }
        setValue(`lines.${lineIndex}.productId`, product.id);
        setValue(`lines.${lineIndex}.name`, product.name);
        setValue(`lines.${lineIndex}.uom`, product.uom || 'قطعة');
        setValue(`lines.${lineIndex}.productType`, product.productType);
        if (isRefund && partnerHistory.length > 0) {
          const histItem = partnerHistory.find((h: any) => h.productId === product.id);
          if (histItem) {
            setValue(`lines.${lineIndex}.price`, histItem.lastNetPrice);
            setValue(`lines.${lineIndex}.discount`, 0);
            setValue(`lines.${lineIndex}.tax`, product.taxes || null as any);
            toast.success(`تم تعبئة السعر الصافي التاريخي: ${histItem.lastNetPrice.toFixed(2)} ج.م`, {
              duration: 3000
            });
          } else {
            setValue(`lines.${lineIndex}.price`, product.price);
            setValue(`lines.${lineIndex}.tax`, product.taxes || null as any);
            setValue(`lines.${lineIndex}.discount`, 0);
            toast.warning(`⚠️ هذا الصنف ليس ضمن فواتير ${isSaleRefund ? 'العميل' : 'المورد'} — تم استخدام السعر الحالي`, {
              duration: 5000
            });
          }
          const currentLines = getValues('lines');
          checkLineAlerts(currentLines);
        } else {
          setValue(`lines.${lineIndex}.price`, product.price);
          setValue(`lines.${lineIndex}.tax`, product.taxes || null as any);
        }
        if (product.hasSecondaryUnit) {
          setValue(`lines.${lineIndex}.secondaryUnit`, product.secondaryUnit);
          setValue(`lines.${lineIndex}.secondaryQuantity`, 1);
        }
      }
    } else if (lineIndex !== -1 && !productId) {
      setValue(`lines.${lineIndex}.productId`, null);
      setValue(`lines.${lineIndex}.name`, '');
      setValue(`lines.${lineIndex}.price`, 0);
      setValue(`lines.${lineIndex}.tax`, null as any);
      setValue(`lines.${lineIndex}.uom`, '');
      setValue(`lines.${lineIndex}.secondaryUnit`, '');
      setValue(`lines.${lineIndex}.secondaryQuantity`, 0);
      setLineAlerts(prev => {
        const copy = {
          ...prev
        };
        delete copy[lineIndex];
        return copy;
      });
    }
  };
  const handleLineChange = (lineId: string, field: string, value: any) => {
    setHasUnsavedChanges(true);
    const lineIndex = fields.findIndex(f => f.id === lineId);
    if (lineIndex !== -1) {
      setValue(`lines.${lineIndex}.${field}`, value, {
        shouldValidate: true,
        shouldDirty: true
      });
    }
  };
  const handleRemoveLine = (lineId: string) => {
    const lineIndex = fields.findIndex(f => f.id === lineId);
    if (lineIndex !== -1) {
      remove(lineIndex);
      setHasUnsavedChanges(true);
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, fieldName: string) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`line-${rowIndex + 1}-${fieldName}`);
      nextInput?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`line-${rowIndex - 1}-${fieldName}`);
      prevInput?.focus();
    }
  };
  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      const target = e.target as HTMLElement;
      const focusableElements = Array.from(e.currentTarget.querySelectorAll('input:not([type="hidden"]), select, textarea, button')).filter(el => !(el as HTMLInputElement).disabled && (el as HTMLElement).tabIndex !== -1) as HTMLElement[];
      if (focusableElements.length > 0 && target === focusableElements[focusableElements.length - 1]) {
        e.preventDefault();
        append({
          productId: '',
          name: '',
          qty: 1,
          price: 0,
          accountId: '',
          tax: null as any,
          discount: 0,
          uom: 'قطعة',
          secondaryQuantity: 0,
          secondaryUnit: '',
          lineType: 'line'
        });
        setTimeout(() => {
          if (!e.currentTarget) return;
          const newInputs = Array.from(e.currentTarget.querySelectorAll('input:not([type="hidden"]), select, textarea, button')).filter(el => !(el as HTMLInputElement).disabled && (el as HTMLElement).tabIndex !== -1) as HTMLElement[];
          if (newInputs.length > focusableElements.length) {
            newInputs[focusableElements.length]?.focus();
          }
        }, 50);
      }
    }
  };
  const totals = (() => {
    let untaxed = 0;
    let totalTax = 0;
    let amountBeforeDiscount = 0;
    let totalDiscount = 0;
    for (const line of lines) {
      if (line.lineType !== 'line') continue;
      const lineSubtotal = (Number(line.qty) || 0) * (Number(line.price) || 0);
      const afterDiscount1 = lineSubtotal * (1 - (Number(line.discount) || 0) / 100);
      const afterDiscount = afterDiscount1 * (1 - (Number(line.discount2) || 0) / 100);
      const lineTax = afterDiscount * ((Number(line.tax) || 0) / 100);
      amountBeforeDiscount += lineSubtotal;
      totalDiscount += lineSubtotal - afterDiscount;
      untaxed += afterDiscount;
      totalTax += lineTax;
    }
    return {
      amountBeforeDiscount,
      totalDiscount,
      untaxedAmount: untaxed,
      taxes: totalTax,
      total: untaxed + totalTax
    };
  })();
  const [isFormReady, setIsFormReady] = useState(false);
  useEffect(() => {
    Promise.all([
      getChartOfAccounts().then(setAccounts),
      getJournals().then(setJournals),
      getPartners().then(setPartnersList)
    ]).finally(() => setIsFormReady(true));
  }, []);
  const partnerOptions = useMemo(() => {
    const opts = partnersList.map(p => ({
      value: p.id,
      label: p.name
    }));
    if (initialData?.partner && !opts.find(o => o.value === initialData.partner.id)) {
      opts.unshift({
        value: initialData.partner.id,
        label: initialData.partner.name
      });
    }
    return opts;
  }, [partnersList, initialData]);
  useEffect(() => {
    (window as any).triggerInvoiceSave = async () => {
      if (!isDirty) return true;
      return new Promise(resolve => {
        handleSubmit(async data => {
          try {
            await onSubmit(data);
            resolve(true);
          } catch (err) {
            resolve(false);
          }
        })();
      });
    };
    return () => {
      delete (window as any).triggerInvoiceSave;
    };
  }, [handleSubmit, isDirty, initialData?.id, invoiceType]);
  useEffect(() => {
    if (isRefund && initialData?.partnerId) {
      fetchPartnerHistory(initialData.partnerId);
    }
  }, [isRefund, initialData?.partnerId]);
  const filteredAccounts = accounts;
  const filteredJournals = useMemo(() => {
    if (isSale || isSaleRefund) {
      return journals.filter(j => j.type === 'sale');
    } else {
      return journals.filter(j => j.type === 'purchase');
    }
  }, [journals, isSale, isSaleRefund]);
  const onSubmit = async (data: any) => {
    setIsSaving(true);
    setStoreIsSaving(true);
    setPageError(null);
    try {
      const invoiceData = {
        type: invoiceType,
        partnerId: data.partner,
        dateInvoice: data.date,
        dateDue: data.due || undefined,
        journalId: data.journalId || undefined,
        paymentReference: data.billReference || undefined,
        narration: data.narration || undefined,
        invoiceOrigin: data.invoiceOrigin || undefined,
        amountUntaxed: totals.untaxedAmount,
        amountTax: totals.taxes,
        amountTotal: totals.total,
        lines: data.lines.filter((l: any) => l.lineType === 'line' || l.name).map((line: any) => ({
          priceUnit: Number(line.price),
          tax: Number(line.tax || 0),
          discount1: Number(line.discount || 0),
          discount2: Number(line.discount2 || 0),
          unitName: line.uom || 'قطعة',
          priceSubtotal: (() => {
            const sub = Number(line.qty) * Number(line.price);
            return sub * (1 - (Number(line.discount) || 0) / 100) * (1 - (Number(line.discount2) || 0) / 100);
          })(),
          priceNet: (() => {
            const sub = Number(line.qty) * Number(line.price);
            return sub * (1 - (Number(line.discount) || 0) / 100) * (1 - (Number(line.discount2) || 0) / 100);
          })(),
          accountId: line.accountId || null,
          secondaryQuantity: Number(line.secondaryQuantity || 0),
          secondaryUnit: line.secondaryUnit || null,
          lineType: line.lineType || 'line'
        }))
      };
      let result;
      if (initialData?.id) {
        await updateInvoice(initialData.id, invoiceData);
        toast.success("تم الحفظ بنجاح");
        setStoreUnsaved(false);
        setHasUnsavedChanges(false);
        setIsSaving(false);
        setStoreIsSaving(false);
        return;
      } else {
        result = (await createInvoice(invoiceData)) as any;
      }
      if (result && result.success && result.data?.id || result?.id) {
        toast.success("تم الحفظ بنجاح");
        setStoreUnsaved(false);
        clearDraft();
        const currentPath = window.location.pathname;
        const locale = currentPath.split('/')[1] || 'ar';
        const newId = result.data?.id || result.id;
        const targetPath = isRefund ? 'invoices' : isSale ? 'invoices' : 'bills';
        router.replace(`/${locale}/accounting/${targetPath}/${newId}`);
      } else {
        const msg = parsePrismaError(result?.error) || "حدث خطأ غير معروف أثناء الحفظ";
        toast.error(msg);
        setPageError(msg);
      }
    } catch (e: any) {
      console.error(e);
      const msg = parsePrismaError(e);
      toast.error(msg);
      setPageError(msg);
    } finally {
      setIsSaving(false);
      setStoreIsSaving(false);
    }
  };
  const isFormLocallyDirty = isDirty || hasUnsavedChanges;
  const backgroundSave = useCallback(async () => {
    if (!isFormLocallyDirty) return;
    try {
      const data = getValues();
      const currentId = draftId || initialData?.id;
      const invoiceData = {
        type: invoiceType,
        partnerId: data.partner,
        dateInvoice: data.date,
        dateDue: data.due || undefined,
        journalId: data.journalId || undefined,
        paymentReference: data.billReference || undefined,
        narration: data.narration || undefined,
        invoiceOrigin: data.invoiceOrigin || undefined,
        amountUntaxed: totals.untaxedAmount,
        amountTax: totals.taxes,
        amountTotal: totals.total,
        lines: data.lines.filter((l: any) => l.lineType === 'line' || l.name).map((line: any) => ({
          id: line.id,
          productId: line.productId || null,
          name: line.name,
          quantity: Number(line.qty),
          priceUnit: Number(line.price),
          tax: Number(line.tax || 0),
          discount1: Number(line.discount || 0),
          discount2: Number(line.discount2 || 0),
          unitName: line.uom || 'قطعة',
          priceSubtotal: (() => {
            const sub = Number(line.qty) * Number(line.price);
            return sub * (1 - (Number(line.discount) || 0) / 100) * (1 - (Number(line.discount2) || 0) / 100);
          })(),
          priceNet: (() => {
            const sub = Number(line.qty) * Number(line.price);
            return sub * (1 - (Number(line.discount) || 0) / 100) * (1 - (Number(line.discount2) || 0) / 100);
          })(),
          accountId: line.accountId || null,
          secondaryQuantity: Number(line.secondaryQuantity || 0),
          secondaryUnit: line.secondaryUnit || null,
          lineType: line.lineType || 'line'
        }))
      };
      if (currentId) {
        await updateInvoice(currentId, invoiceData);
      } else if (data.partner) {
        const result = (await createInvoice(invoiceData)) as any;
        const newId = result?.success ? result.data?.id : result?.id;
        if (newId) {
          setDraftId(newId);
          clearDraft();
          const currentPath = window.location.pathname;
          const locale = currentPath.split('/')[1] || 'ar';
          window.history.replaceState(null, '', `/${locale}/accounting/bills/${newId}`);
        }
      }
    } catch (error) {
      console.error('[BackgroundSave] Failed:', error);
    }
  }, [getValues, initialData?.id, draftId, invoiceType, totals, clearDraft, isDirty]);
  const {
    setDiscarded,
    setClean
  } = useAutoSaveOnLeave(isDirty, backgroundSave);
  const safeNavigate = async (url: string) => {
    if (isFormLocallyDirty) {
      const tId = toast.loading("جاري حفظ التعديلات قبل الانتقال...");
      await backgroundSave();
      setClean();
      setStoreUnsaved(false);
      setHasUnsavedChanges(false);
      toast.dismiss(tId);
    }
    router.push(url);
  };
  const onError = (errors: any) => {
    const errorMessages = [];
    if (errors.partner) errorMessages.push("- " + errors.partner.message);
    if (errors.date) errorMessages.push("- " + errors.date.message);
    if (errors.lines) {
      if (errors.lines.message) errorMessages.push("- " + errors.lines.message);else errorMessages.push("- يوجد خطأ في سطور الفاتورة (تأكد من اختيار المنتج وأن الكمية > 0 والسعر غير سالب)");
    }
    setPageError("يرجى تصحيح الأخطاء التالية:\n" + errorMessages.join('\n'));
  };
  useEffect(() => {
    setStoreUnsaved(isDirty);
    setTriggers(async () => {
      await handleSubmit(onSubmit, onError)();
    }, () => {
      setDiscarded();
      setValue('lines', formValues?.lines || []);
      setStoreUnsaved(false);
      setClean();
    });
    return () => clearTriggers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    const subscription = watch((value, {
      name,
      type
    }) => {
      if (name || type === 'change') {
        setStoreUnsaved(true);
        setHasUnsavedChanges(true);
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
          backgroundSave().then(() => {
            setStoreUnsaved(false);
            setHasUnsavedChanges(false);
          });
        }, 3000);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [watch, setStoreUnsaved, backgroundSave]);
  const postInvoice = () => {
    toast.warning("يرجى حفظ الفاتورة أولاً قبل الترحيل!");
  };
  const getLineSubtotal = (line: any) => {
    const sub = (line.qty || 0) * (line.price || 0);
    const afterDiscount = sub * (1 - (line.discount || 0) / 100) * (1 - (line.discount2 || 0) / 100);
    return afterDiscount;
  };
  return <FormLoadingOverlay isLoading={!isFormReady}><form onSubmit={handleSubmit(onSubmit, onError)} className={`space-y-6 ${isSaving ? 'pointer-events-none opacity-60 transition-opacity duration-200' : ''}`}> {} {isLocked && <style>{` .invoice-locked-form input, .invoice-locked-form select, .invoice-locked-form textarea { pointer-events: none !important; border-color: transparent !important; background: transparent !important; opacity: 1 !important; cursor: default !important; color: #1e293b !important; } .invoice-locked-form .locked-hide { display: none !important; } `}</style>} <div className={`bg-white p-0 border-0 w-full overflow-hidden ${isLocked ? 'invoice-locked-form' : ''}`}> {pageError && <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-3"> <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" /> <div> <h3 className="text-sm font-bold text-red-800">تعذر الحفظ</h3> <p className="text-sm text-red-600 mt-1">{pageError}</p> </div> </div>} {lines.some((l: any) => l.lineType === 'line' && Number(l.price) === 0) && approvalStatus !== 'approved' && !isLocked && <div className="bg-orange-50 border-b border-orange-200 p-4 flex items-center gap-3"> <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" /> <div className="text-sm font-bold text-orange-800"> تنبيه: تحتوي هذه الفاتورة على أصناف مجانية أو بسعر صفر. ستحتاج إلى إرسال طلب موافقة للمدير قبل أن تتمكن من التأكيد والترحيل. </div> </div>} {} <div className="p-4 sm:p-8 pb-4"> {} <div className="flex justify-start items-start mb-8"> <div className="text-right"> <div className="text-sm text-slate-500 mb-1"> {isSaleRefund ? 'إشعار دائن (مرتجع بيع)' : isPurchaseRefund ? 'إشعار مدين (مرتجع شراء)' : isSale ? 'فاتورة عميل' : 'فاتورة المورد'} </div> <h1 className="text-3xl font-bold text-slate-900 tracking-tight"> {initialData?.name || 'مسودة'} </h1> {isLocked && <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded inline-block mt-2">🔒 للقراءة فقط — أعد الفاتورة لمسودة لتتمكن من التعديل</span>} </div> </div> <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-4 mb-6"> {} <div className="space-y-4"> <div className="grid grid-cols-[140px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">{isSale || isSaleRefund ? 'العميل' : 'المورد'}</label> <OdooCombobox options={partnerOptions} value={watch('partner')} onChange={val => {
                setValue('partner', val, {
                  shouldDirty: true
                });
                setHasUnsavedChanges(true);
                if (val) fetchPartnerHistory(val);
              }} placeholder={isSale ? 'اختر العميل...' : isSaleRefund ? 'اختر العميل للمرتجع...' : 'اختر المورد...'} disabled={isLocked} onExternalLink={val => safeNavigate(`/${locale}/contacts/${val}`)} showWhatsApp={true} /> </div> {(isExpense || isPurchaseRefund) && <div className="grid grid-cols-[140px_1fr] items-start gap-4"> <label className="text-sm font-bold text-slate-700 pt-1"> الرقم المرجعي للفاتورة </label> <div className="relative"> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('billReference')} className="w-full text-sm border-b border-slate-200 focus:border-slate-800 outline-none pb-1 bg-transparent" /> </div> </div>} </div> {} <div className="space-y-3 lg:pr-8 border-r-0 lg:border-r border-slate-100"> <div className="grid grid-cols-[160px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">تاريخ الفاتورة</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" {...register('date')} className={`w-full text-sm border-b border-slate-200 focus:border-slate-800 outline-none pb-1 bg-transparent text-slate-800 ${!watch('date') ? 'text-transparent focus:text-inherit' : ''}`} /> </div> <div className="grid grid-cols-[160px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">تاريخ المحاسبة</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" {...register('accountingDate')} className={`w-full text-sm border-b border-slate-200 focus:border-slate-800 outline-none pb-1 bg-transparent text-slate-800 ${!watch('accountingDate') ? 'text-transparent focus:text-inherit' : ''}`} /> </div> <div className="grid grid-cols-[160px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700 flex items-center gap-1"> الرقم المرجعي للدفعة <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" /> </label> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('paymentReference')} className="w-full text-sm border-b border-slate-200 focus:border-slate-800 outline-none pb-1 bg-transparent text-slate-800" /> </div> {(isExpense || isPurchaseRefund) && <div className="grid grid-cols-[160px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700 flex items-center gap-1"> البنك المستلم <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" /> </label> <div className="flex items-center gap-4"> <select disabled className="border-b border-slate-200 outline-none pb-1 bg-transparent appearance-none text-sm text-slate-800 cursor-not-allowed"> <option>Entreprise</option> </select> <span className="text-sm text-slate-500">فرع 1</span> </div> </div>} <div className="grid grid-cols-[160px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">تاريخ الاستحقاق</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" {...register('due')} className={`w-full text-sm border-b border-slate-200 focus:border-slate-800 outline-none pb-1 bg-transparent text-slate-800 ${!watch('due') ? 'text-transparent focus:text-inherit' : ''}`} /> </div> <div className="grid grid-cols-[160px_1fr] items-center gap-4"> <label className="text-sm font-bold text-slate-700">دفتر اليومية</label> <select {...register('journalId')} className="w-full text-sm border-b border-slate-200 focus:border-slate-800 outline-none pb-1 bg-transparent appearance-none cursor-pointer text-slate-800"> <option value="">(تلقائي)</option> {filteredJournals.map(j => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)} </select> </div> </div> </div> </div> {} <div className="flex border-b border-slate-200 px-8"> <button type="button" onClick={() => setActiveTab('lines')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'lines' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <List className="w-4 h-4" /> بنود الفاتورة </button> <button type="button" onClick={() => setActiveTab('journal')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'journal' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <FileText className="w-4 h-4" /> عناصر اليومية </button> <button type="button" onClick={() => setActiveTab('info')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <Info className="w-4 h-4" /> معلومات أخرى </button> {(isSale || isSaleRefund) && <button type="button" onClick={() => {
          setActiveTab('collection');
          if (cashUsers.length === 0) getCashRegisterUsers().then(setCashUsers);
        }} className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'collection' ? 'border-amber-600 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}> <Banknote className="w-4 h-4" /> التحصيل </button>} </div> {} <div className="p-8 min-h-[400px]"> {} {activeTab === 'lines' && <div className="space-y-4 relative"> {} {showColumnToggles && <div className="absolute top-8 right-0 bg-white border border-slate-200 shadow-sm rounded-lg p-2 z-[90] flex flex-col gap-1 min-w-[160px] text-right"> <div className="text-xs font-bold text-slate-500 border-b pb-1 mb-1 px-1 flex justify-between items-center"> <span>الأعمدة الظاهرة</span> <button type="button" onClick={() => setShowColumnToggles(false)} className="text-slate-400 hover:text-red-500"> <X className="w-3 h-3" /> </button> </div> <div className="max-h-[250px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1"> {Object.entries(visibleColumns).map(([key, isVisible]) => <label key={key} className="flex items-center justify-end gap-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded select-none"> <span className="text-xs text-slate-700 font-medium"> {key === 'assetCategory' ? 'فئة الأصول' : key === 'account' ? 'حساب' : key === 'qty' ? 'الكمية' : key === 'uom' ? 'وحدة القياس' : key === 'secondaryQty' ? 'الكمية الثانوية' : key === 'secondaryUom' ? 'الثانوية UOM' : key === 'price' ? 'السعر' : key === 'discount' ? 'خصم %' : key === 'discount2' ? 'خصم 2 %' : key === 'taxes' ? 'الضرائب' : key === 'subtotal' ? 'الناتج الفرعي' : key} </span> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isVisible} onChange={e => setVisibleColumns(prev => ({
                  ...prev,
                  [key]: e.target.checked
                }))} className="w-3.5 h-3.5 accent-[#017E84] shrink-0" /> </label>)} </div> </div>} <div className="overflow-x-auto border border-slate-200 rounded pb-16"> <table className="w-full text-sm text-right"> <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold"> <tr> <th title="" className="w-8 px-1 py-1.5 align-middle text-center relative"> <button type="button" onClick={() => setShowColumnToggles(!showColumnToggles)} className="text-slate-400 hover:text-slate-800 transition-colors inline-flex justify-center items-center h-full w-full"> <SlidersHorizontal className="w-4 h-4 mx-auto" /> </button> </th> <th title="التسلسل" className="w-8 px-1 py-1.5 align-middle text-center text-xs font-bold text-slate-500">#</th> <th title="المنتج" className="px-2 py-1.5 text-xs font-bold text-slate-500">المنتج</th> <th title="الوصف" className="px-2 py-1.5 w-[180px] text-xs font-bold text-slate-500">الوصف</th> {visibleColumns.assetCategory && <th title="فئة الأصول" className="px-2 py-1.5 w-32 text-xs font-bold text-slate-500">فئة الأصول</th>} {visibleColumns.account && <th title="حساب" className="px-2 py-1.5 w-32 text-xs font-bold text-slate-500">حساب</th>} {visibleColumns.qty && <th title="الكمية" className="px-2 py-1.5 w-20 text-xs font-bold text-slate-500 text-center">الكمية</th>} {visibleColumns.uom && <th title="وحدة القياس" className="px-2 py-1.5 w-24 text-xs font-bold text-slate-500 text-center">وحدة القياس</th>} {visibleColumns.secondaryQty && <th title="الكمية الثانوية" className="px-2 py-1.5 w-24 text-xs font-bold text-slate-500 text-center">الكمية الثانوية</th>} {visibleColumns.secondaryUom && <th title="الثانوية UOM" className="px-2 py-1.5 w-24 text-xs font-bold text-slate-500 text-center">الثانوية UOM</th>} {visibleColumns.price && <th title="السعر" className="px-2 py-1.5 w-24 text-xs font-bold text-slate-500 text-center">السعر</th>} {visibleColumns.discount && <th title="خصم %" className="px-2 py-1.5 w-16 text-xs font-bold text-slate-500 text-center">خصم %</th>} {visibleColumns.discount2 && <th title="خصم 2 %" className="px-2 py-1.5 w-16 text-xs font-bold text-slate-500 text-center">خصم 2 %</th>} {visibleColumns.taxes && <th title="الضرائب" className="px-2 py-1.5 w-16 text-xs font-bold text-slate-500 text-center">الضرائب</th>} {visibleColumns.subtotal && <th title="الناتج الفرعي" className="px-2 py-1.5 w-24 text-xs font-bold text-slate-500 text-center">الناتج الفرعي</th>} <th className="px-1 py-1.5 w-8"> </th> </tr> </thead> <tbody className="divide-y divide-slate-100" onKeyDown={handleTableKeyDown}> {fields.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((field, localIndex) => {
                  const index = (currentPage - 1) * itemsPerPage + localIndex;
                  const currentLine = lines[index];
                  const isActive = activeRowId === field.id;
                  if (currentLine.lineType === 'section') {
                    return <tr key={field.id} className={`bg-slate-50 ${isActive ? 'bg-[#017E84]/10/50' : ''} ${draggedIndex === index ? 'opacity-50' : ''}`} onFocus={() => setActiveRowId(field.id)} draggable={!isLocked} onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd}> <td className="px-2 py-1 relative"> {isActive && <div className="absolute top-1/2 -translate-y-1/2 left-0 w-max text-[#017E84] animate-pulse flex items-center pr-2"> <ArrowRight className="w-4 h-4" /> </div>} <button type="button" className="text-slate-400 cursor-grab hover:text-slate-600 pointer-events-none"> <GripVertical className="w-4 h-4" /> </button> </td> <td className="px-1 py-1 text-center font-bold text-xs text-slate-400">{index + 1}</td> <td colSpan={3 + (visibleColumns.assetCategory ? 1 : 0) + (visibleColumns.account ? 1 : 0) + (visibleColumns.qty ? 1 : 0) + (visibleColumns.uom ? 1 : 0) + (visibleColumns.secondaryQty ? 1 : 0) + (visibleColumns.secondaryUom ? 1 : 0) + (visibleColumns.price ? 1 : 0) + (visibleColumns.discount ? 1 : 0) + (visibleColumns.discount2 ? 1 : 0) + (visibleColumns.taxes ? 1 : 0) + (visibleColumns.subtotal ? 1 : 0)} className="px-2 py-1 border-r border-slate-200"> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register(`lines.${index}.name`)} className="w-full bg-transparent font-bold text-slate-800 outline-none text-sm border-0 focus:ring-0 p-1" placeholder="عنوان القسم..." onFocus={() => setActiveRowId(field.id)} /> </td> <td className="px-1 py-1 text-center"> <button type="button" onClick={() => handleRemoveLine(field.id)} className="text-slate-300 hover:text-red-500 p-1"> <Trash2 className="w-4 h-4" /> </button> </td> </tr>;
                  }
                  if (currentLine.lineType === 'note') {
                    return <tr key={field.id} className={`border-b border-slate-200 bg-amber-50/30 ${isActive ? 'bg-[#017E84]/10/50' : ''} ${draggedIndex === index ? 'opacity-50' : ''}`} onFocus={() => setActiveRowId(field.id)} draggable={!isLocked} onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd}> <td className="px-2 py-1 relative"> {isActive && <div className="absolute top-1/2 -translate-y-1/2 left-0 w-max text-[#017E84] animate-pulse flex items-center pr-2"> <ArrowRight className="w-4 h-4" /> </div>} <button type="button" className="text-slate-400 cursor-grab hover:text-slate-600 pointer-events-none"> <GripVertical className="w-4 h-4" /> </button> </td> <td className="px-1 py-1 text-center font-bold text-xs text-slate-400">{index + 1}</td> <td colSpan={2 + (visibleColumns.assetCategory ? 1 : 0) + (visibleColumns.account ? 1 : 0) + (visibleColumns.qty ? 1 : 0) + (visibleColumns.uom ? 1 : 0) + (visibleColumns.secondaryQty ? 1 : 0) + (visibleColumns.secondaryUom ? 1 : 0) + (visibleColumns.price ? 1 : 0) + (visibleColumns.discount ? 1 : 0) + (visibleColumns.discount2 ? 1 : 0) + (visibleColumns.taxes ? 1 : 0) + (visibleColumns.subtotal ? 1 : 0) - 1} className="px-2 py-1 border-r border-slate-200"> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register(`lines.${index}.name`)} className="w-full bg-transparent text-slate-600 italic outline-none text-sm border-0 focus:ring-0 p-1" placeholder="ملاحظة..." onFocus={() => setActiveRowId(field.id)} /> </td> <td className="px-1 py-1 text-center"> <button type="button" onClick={() => handleRemoveLine(field.id)} className="text-slate-300 hover:text-red-500 p-1"> <Trash2 className="w-4 h-4" /> </button> </td> </tr>;
                  }
                  return <> <tr key={field.id} className={`hover:bg-slate-50 transition-colors ${isActive ? 'bg-[#017E84]/10/30' : ''} ${lineAlerts[index] ? lineAlerts[index].type === 'not_in_history' ? 'bg-amber-50/60' : 'bg-orange-50/60' : 'bg-white'} ${draggedIndex === index ? 'opacity-50' : ''}`} onFocus={() => setActiveRowId(field.id)} draggable={!isLocked} onDragStart={e => handleDragStart(e, index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd}> <td className="px-2 py-1 relative text-center"> {isActive && <div className="absolute top-1/2 -translate-y-1/2 left-0 w-max text-[#017E84] animate-pulse flex items-center pr-2"> <ArrowRight className="w-4 h-4" /> </div>} <button type="button" className="text-slate-400 cursor-grab hover:text-slate-600 opacity-0 group-hover:opacity-100 pointer-events-none"> <GripVertical className="w-4 h-4" /> </button> </td> <td className="px-1 py-1 text-center font-bold text-xs text-slate-500">{index + 1}</td> <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative"> <div className="w-full h-full" title="المنتج"> <OdooCombobox options={productOptions} value={currentLine.productId} onChange={val => handleProductSelect(field.id, val)} placeholder="اختر منتج..." onFocus={() => setActiveRowId(field.id)} /> </div> </td> <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative"> {currentLine.productId && <input autoComplete="off" autoCorrect="off" spellCheck={false} title="الوصف الاضافي" {...register(`lines.${index}.name`)} className="w-full h-full p-2 bg-transparent text-slate-800 text-sm outline-none" placeholder="الوصف..." />} </td> {} {visibleColumns.assetCategory && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} disabled className="w-full h-full p-2 bg-transparent text-slate-400 text-sm outline-none text-center" placeholder="" /> </td>} {} {visibleColumns.account && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative"> <select title="الحساب" {...register(`lines.${index}.accountId`)} className="w-full h-full p-2 bg-transparent text-slate-800 text-sm outline-none appearance-none font-bold"> <option value="">(تلقائي)</option> {filteredAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} {acc.name}</option>)} </select> </td>} {} {visibleColumns.qty && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} title={currentLine.productType === 'storable' ? '🔒 الكمية مرتبطة بالمخزن — لتعديلها أنشئ إيصال استلام/تسليم من المخزن' : 'الكمية'} id={`line-${index}-qty`} type="text" inputMode="decimal" disabled={currentLine.productType === 'storable'} {...register(`lines.${index}.qty`, {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.target.value = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
                            setHasUnsavedChanges(true);
                            if (isRefund && partnerHistory.length > 0) {
                              setTimeout(() => checkLineAlerts(getValues('lines')), 50);
                            }
                          }
                        })} onClick={() => {
                          if (currentLine.productType === 'storable') {
                            toast.info('🔒 الكمية مرتبطة بالمخزن ولا يمكن تعديلها من الفاتورة مباشرة. لتعديلها، أنشئ إيصال استلام/تسليم من وحدة المخزن.', {
                              duration: 5000
                            });
                          }
                        }} onKeyDown={e => handleKeyDown(e, index, 'qty')} onFocus={() => setActiveRowId(field.id)} className={cn("w-full h-full p-2 text-center bg-transparent font-bold outline-none text-sm font-numbers focus:bg-white transition-colors", currentLine.productType === 'storable' && "cursor-not-allowed opacity-70 bg-amber-50/50 text-amber-800")} /> {currentLine.productType === 'storable' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center" title="مرتبطة بالمخزن"> <span className="text-white text-[8px] font-bold">🔒</span> </div>} </td>} {} {visibleColumns.uom && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} title="وحدة القياس" value={currentLine.uom || 'قطعه'} disabled className="w-full h-full p-2 text-center bg-transparent text-slate-500 font-medium outline-none text-sm cursor-not-allowed" /> </td>} {} {visibleColumns.secondaryQty && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} title="الكمية الثانوية" type="number" step="0.01" disabled={currentLine.productType === 'storable'} {...register(`lines.${index}.secondaryQuantity`, {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.target.value = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
                          }
                        })} className={cn("w-full h-full p-2 text-center bg-transparent font-bold outline-none text-sm font-numbers focus:bg-white transition-colors text-slate-800", currentLine.productType === 'storable' && "cursor-not-allowed opacity-70 bg-slate-100/50")} placeholder="" /> </td>} {} {visibleColumns.secondaryUom && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} title="الثانوية UOM" type="text" {...register(`lines.${index}.secondaryUnit`)} className="w-full h-full p-2 text-center bg-transparent text-slate-600 font-medium outline-none text-sm focus:bg-white transition-colors" placeholder="" /> </td>} {} {visibleColumns.price && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} title="السعر" id={`line-${index}-price`} type="text" inputMode="decimal" {...register(`lines.${index}.price`, {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.target.value = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
                            setHasUnsavedChanges(true);
                          }
                        })} onKeyDown={e => handleKeyDown(e, index, 'price')} onFocus={() => setActiveRowId(field.id)} className="w-full h-full p-2 text-center bg-transparent font-bold text-slate-800 outline-none text-sm font-numbers focus:bg-white transition-colors" /> </td>} {} {visibleColumns.discount && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} title="خصم %" id={`line-${index}-discount`} type="text" inputMode="decimal" {...register(`lines.${index}.discount`, {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.target.value = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
                            setHasUnsavedChanges(true);
                          }
                        })} onKeyDown={e => handleKeyDown(e, index, 'discount')} className="w-full h-full p-2 text-center bg-transparent font-bold text-slate-800 outline-none text-sm font-numbers focus:bg-white transition-colors" placeholder="" /> </td>} {} {visibleColumns.discount2 && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <input autoComplete="off" autoCorrect="off" spellCheck={false} title="خصم 2 %" id={`line-${index}-discount2`} type="text" inputMode="decimal" {...register(`lines.${index}.discount2`, {
                          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                            e.target.value = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
                            setHasUnsavedChanges(true);
                          }
                        })} onKeyDown={e => handleKeyDown(e, index, 'discount')} className="w-full h-full p-2 text-center bg-transparent font-bold text-slate-800 outline-none text-sm font-numbers focus:bg-white transition-colors" placeholder="" /> </td>} {} {visibleColumns.taxes && <td className="p-0 align-top focus-within:ring-2 focus-within:ring-[#017E84] focus-within:ring-inset focus-within:z-10 relative text-center"> <select disabled={isLocked} {...register(`lines.${index}.tax`, {
                          valueAsNumber: true
                        })} onChange={e => {
                          setValue(`lines.${index}.tax`, Number(e.target.value) || null as any, {
                            shouldValidate: true,
                            shouldDirty: true
                          });
                          setHasUnsavedChanges(true);
                        }} className="w-full h-full py-2 px-1 bg-transparent outline-none text-sm text-center text-slate-600 font-medium m-0 appearance-none border-none cursor-pointer focus:bg-white transition-colors"> <option value="" disabled hidden>بدون (تخطي)</option> <option value="0">0%</option> <option value="14">14% ض.ق.م</option> <option value="5">5%</option> </select> </td>} {visibleColumns.subtotal && <td className="p-0 align-top relative text-center"> <div className="flex items-center justify-center w-full h-full font-bold text-slate-800 text-sm font-numbers py-2"> <span>{getLineSubtotal(currentLine).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}</span> </div> </td>} <td className="px-2 py-2 text-center align-top relative"> {!isLocked && <button type="button" onClick={() => remove(index)} className="text-slate-400 hover:text-red-600 transition-opacity p-1 rounded opacity-0 group-hover:opacity-100 locked-hide" title="حذف"> <Trash2 className="w-4 h-4" /> </button>} </td> </tr> {} {lineAlerts[index] && <tr className={lineAlerts[index].type === 'not_in_history' ? 'bg-amber-50' : 'bg-orange-50'}> <td colSpan={20} className="px-4 py-1.5 text-xs font-medium border-b border-amber-200"> <span className={lineAlerts[index].type === 'not_in_history' ? 'text-amber-700' : 'text-orange-700'}> {lineAlerts[index].message} </span> </td> </tr>} </>;
                })} </tbody> </table> </div> {} {fields.length > itemsPerPage && <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border border-t-0 border-slate-200 text-sm rounded-b"> <span className="text-slate-500"> عرض {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, fields.length)} من {fields.length} </span> <div className="flex gap-2"> <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded bg-white border border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"> السابق </button> <button type="button" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage * itemsPerPage >= fields.length} className="px-3 py-1 rounded bg-white border border-slate-300 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100"> التالي </button> </div> </div>} {} {!isLocked && <div className="flex gap-4 locked-hide py-3"> <button type="button" onClick={() => append({
              productId: '',
              name: '',
              qty: 1,
              price: 0,
              accountId: '',
              tax: null as any,
              discount: 0,
              uom: 'قطعة',
              secondaryQuantity: 0,
              secondaryUnit: '',
              lineType: 'line'
            })} className="text-[#017E84] hover:text-[#015e63] text-[13px] hover:underline font-medium transition-colors"> إضافة بند </button> <button type="button" onClick={() => append({
              productId: '',
              name: '',
              qty: 0,
              price: 0,
              accountId: '',
              tax: 0,
              discount: 0,
              uom: '',
              secondaryQuantity: 0,
              secondaryUnit: '',
              lineType: 'section'
            })} className="text-[#017E84] hover:text-[#015e63] text-[13px] hover:underline font-medium transition-colors"> إضافة قسم </button> <button type="button" onClick={() => append({
              productId: '',
              name: '',
              qty: 0,
              price: 0,
              accountId: '',
              tax: 0,
              discount: 0,
              uom: '',
              secondaryQuantity: 0,
              secondaryUnit: '',
              lineType: 'note'
            })} className="text-[#017E84] hover:text-[#015e63] text-[13px] hover:underline font-medium transition-colors"> إضافة ملاحظة </button> </div>} {} {isPurchaseRefund && !isLocked && <div className="flex items-center gap-2 py-2 px-3 mt-1 bg-blue-50 border border-blue-200 rounded-md"> <button type="button" onClick={async () => {
              const currentLines = getValues('lines');
              let updated = 0;
              for (let i = 0; i < currentLines.length; i++) {
                const line = currentLines[i];
                if (line.productId && line.lineType === 'line') {
                  const products = await searchProducts(line.productId);
                  const product = products.find((p: any) => p.id === line.productId);
                  if (product) {
                    setValue(`lines.${i}.price`, product.price, {
                      shouldDirty: true
                    });
                    setValue(`lines.${i}.discount`, 0, {
                      shouldDirty: true
                    });
                    updated++;
                  }
                }
              }
              setHasUnsavedChanges(true);
              toast.success(`⟳ تم تحديث ${updated} صنف بالأسعار الحالية من قائمة الشراء`, {
                duration: 4000
              });
            }} className="text-blue-700 hover:text-blue-900 text-[13px] hover:underline font-medium transition-colors flex items-center gap-1"> ⟳ مرتجع بالأسعار الحالية </button> <span className="text-xs text-blue-500">يستبدل أسعار الأصناف بأسعار قائمة الشراء الحالية</span> </div>} {} <div className="flex justify-between mt-8 items-start"> {} <div className="w-1/2 pt-2"> <textarea className="w-full text-base border-b border-slate-300 outline-none pb-1 bg-transparent resize-none h-20 placeholder-slate-400" placeholder="الشروط والأحكام..."></textarea> </div> {} <div className="w-1/3 min-w-[300px] space-y-3"> {totals.totalDiscount > 0 && <> <div className="flex justify-between items-center text-slate-800 text-sm"> <span className="font-medium">الإجمالي قبل الخصم:</span> <span className="font-numbers">{totals.amountBeforeDiscount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ج.م</span> </div> <div className="flex justify-between items-center text-red-700 text-sm"> <span className="font-medium">الخصم:</span> <span className="font-numbers">- {totals.totalDiscount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ج.م</span> </div> </>} {totals.taxes > 0 && <> <div className="flex justify-between items-center text-slate-800 text-sm"> <span className="font-medium">المبلغ (قبل الضريبة):</span> <span className="font-numbers">{totals.untaxedAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ج.م</span> </div> <div className="flex justify-between items-center text-slate-800 text-sm"> <span className="font-medium">الضرائب:</span> <span className="font-numbers">{totals.taxes.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ج.م</span> </div> </>} {totals.taxes === 0 && totals.totalDiscount === 0 && <div className="flex justify-between items-center text-slate-800 text-sm"> <span className="font-medium">المبلغ الخاضع للضريبة:</span> <span className="font-numbers">{totals.untaxedAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} ج.م</span> </div>} <div className="flex justify-between items-center text-lg font-bold text-indigo-900 pt-2 border-t border-slate-300 mt-2"> <span>{totals.totalDiscount > 0 ? 'الصافي:' : 'الإجمالي:'}</span> <span className="font-numbers text-xl">{totals.total.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} LE</span> </div> </div> </div> {} {initialData?.id && <OutstandingPayments invoiceId={initialData.id} partnerId={watch('partner')} invoiceType={invoiceType} invoiceState={status} amountResidual={Number(initialData?.amountResidual || totals.total)} />} </div>} {} {activeTab === 'journal' && <div className="space-y-4"> {status === 'draft' ? <div className="text-center py-16 text-slate-400"> <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" /> <p className="font-medium text-lg">سيتم إنشاء القيود المحاسبية عند الترحيل</p> <p className="text-sm mt-2">قم بترحيل الفاتورة لعرض القيود اليومية المقابلة</p> </div> : <div className="overflow-hidden rounded-sm border border-slate-200 shadow-sm"> <table className="w-full text-right border-collapse text-sm"> <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200"> <tr> <th className="px-4 py-3">الحساب</th> <th className="px-4 py-3">البيان</th> <th className="px-4 py-3 text-center">مدين</th> <th className="px-4 py-3 text-center">دائن</th> </tr> </thead> <tbody className="divide-y divide-slate-100"> {} {(() => {
                  const isDebitPartner = isSale || isPurchaseRefund;
                  const partnerLabel = isSale || isSaleRefund ? '📋 العملاء (ذمم مدينة)' : '📋 الموردون (ذمم دائنة)';
                  const revenueLabel = isSale || isSaleRefund ? '💰 إيرادات المبيعات' : '💸 مصروفات المشتريات';
                  return <> <tr className="hover:bg-blue-50/20"> <td className="px-4 py-2 text-slate-700 font-medium">{partnerLabel}</td> <td className="px-4 py-2 text-slate-600">إجمالي الفاتورة</td> <td className="px-4 py-2 text-center font-bold text-green-700"> {isDebitPartner ? totals.total.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2
                        }) : '-'} </td> <td className="px-4 py-2 text-center font-bold text-red-700"> {!isDebitPartner ? totals.total.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2
                        }) : '-'} </td> </tr> {lines.filter((l: any) => l.lineType === 'line' && l.qty > 0).map((line: any, i: number) => {
                      const sub = getLineSubtotal(line);
                      return <tr key={i} className="hover:bg-blue-50/20"> <td className="px-4 py-2 text-slate-700">{revenueLabel}</td> <td className="px-4 py-2 text-slate-600">{line.name || `بند ${i + 1}`}</td> <td className="px-4 py-2 text-center font-bold text-green-700"> {!isDebitPartner ? sub.toLocaleString('ar-EG', {
                            minimumFractionDigits: 2
                          }) : '-'} </td> <td className="px-4 py-2 text-center font-bold text-red-700"> {isDebitPartner ? sub.toLocaleString('ar-EG', {
                            minimumFractionDigits: 2
                          }) : '-'} </td> </tr>;
                    })} {totals.taxes > 0 && <tr className="hover:bg-blue-50/20"> <td className="px-4 py-2 text-slate-700">🏛️ ضريبة القيمة المضافة</td> <td className="px-4 py-2 text-slate-600">ض.ق.م</td> <td className="px-4 py-2 text-center font-bold text-green-700"> {!isDebitPartner ? totals.taxes.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2
                        }) : '-'} </td> <td className="px-4 py-2 text-center font-bold text-red-700"> {isDebitPartner ? totals.taxes.toLocaleString('ar-EG', {
                          minimumFractionDigits: 2
                        }) : '-'} </td> </tr>} </>;
                })()} <tr className="bg-slate-100 font-bold border-t border-slate-300"> <td colSpan={2} className="px-4 py-2 text-slate-800">الإجمالي</td> <td className="px-4 py-2 text-center text-green-800"> {totals.total.toLocaleString('ar-EG', {
                      minimumFractionDigits: 2
                    })} </td> <td className="px-4 py-2 text-center text-red-800"> {totals.total.toLocaleString('ar-EG', {
                      minimumFractionDigits: 2
                    })} </td> </tr> </tbody> </table> <div className="bg-amber-50 text-amber-800 text-xs p-3 text-center border-t border-amber-200"> ⚠️ هذه معاينة تقديرية — القيد الفعلي سيُنشأ عند الترحيل </div> </div>} </div>} {} {activeTab === 'info' && <div className="grid grid-cols-2 gap-8 max-w-4xl"> {} <div> <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4"> {isSale || isSaleRefund ? 'معلومات المبيعات' : 'معلومات المشتريات'} </h3> <div className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 mb-1"> المصدر ({isSale || isSaleRefund ? 'أمر البيع' : 'أمر الشراء'}) </label> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('invoiceOrigin')} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" placeholder="مثال: SO0123" /> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1"> {isSale || isSaleRefund ? 'مندوب المبيعات' : 'مسؤول المشتريات'} </label> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('salesperson')} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" placeholder="" /> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1"> مرجع {isSale || isSaleRefund ? 'العميل' : 'المورد'} </label> <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('customerRef')} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm" placeholder="" /> </div> </div> </div> {} <div> <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">المحاسبة</h3> <div className="space-y-4"> <div> <label className="block text-xs font-bold text-slate-500 mb-1">الموقف المالي (Fiscal Position)</label> <select {...register('fiscalPosition')} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm appearance-none"> <option value="">بدون</option> <option value="local">محلي</option> <option value="export">تصدير (بدون ضريبة)</option> <option value="free_zone">منطقة حرة</option> </select> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">التاريخ المحاسبي</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" {...register('accountingDate')} className={`w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm ${!watch('accountingDate') ? 'text-transparent focus:text-inherit' : ''}`} /> </div> <div> <label className="flex items-center gap-3 cursor-pointer group py-2"> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" {...register('autoPost' as any)} className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-sm checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer" /> <div> <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">ترحيل تلقائي</span> <p className="text-xs text-slate-400">ترحيل الفاتورة تلقائياً عند الحفظ</p> </div> </label> </div> <div> <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات داخلية</label> <textarea {...register('narration')} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm resize-none" placeholder="ملاحظات..." /> </div> </div> </div> </div>} {} {activeTab === 'collection' && (isSale || isSaleRefund) && <div className="max-w-3xl space-y-6"> <div className="bg-amber-50 border border-amber-200 rounded-sm p-4 flex items-start gap-3"> <Banknote className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" /> <div> <h3 className="text-sm font-bold text-amber-900">سياسة التحصيل</h3> <p className="text-xs text-amber-700 mt-1">حدد المسؤول عن تحصيل هذه الفاتورة وتاريخ السداد المتوقع</p> </div> </div> <div className="grid grid-cols-2 gap-6"> {} <div> <label className="block text-xs font-bold text-slate-500 mb-2">مسؤول التحصيل</label> <select value={collectionData.policy} onChange={e => setCollectionData(d => ({
                ...d,
                policy: e.target.value
              }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium"> <option value="">— غير محدد —</option> <option value="accounts">قسم الحسابات</option> <option value="salesperson">مندوب المبيعات (منشئ الفاتورة)</option> <option value="specific">شخص محدد</option> </select> </div> {} {collectionData.policy === 'specific' && <div> <label className="block text-xs font-bold text-slate-500 mb-2">اختر الشخص</label> <select value={collectionData.assigneeId} onChange={e => setCollectionData(d => ({
                ...d,
                assigneeId: e.target.value
              }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium"> <option value="">— اختر —</option> {cashUsers.map(u => <option key={u.id} value={u.id}> {u.name} {u.cashRegister ? `(${u.cashRegister.name})` : ''} </option>)} </select> </div>} {} <div> <label className="block text-xs font-bold text-slate-500 mb-2">تاريخ السداد المتفق</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" value={collectionData.dueDate} onChange={e => setCollectionData(d => ({
                ...d,
                dueDate: e.target.value
              }))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium" /> </div> {} <div className="col-span-2"> <label className="block text-xs font-bold text-slate-500 mb-2">ملاحظات التحصيل</label> <textarea value={collectionData.notes} onChange={e => setCollectionData(d => ({
                ...d,
                notes: e.target.value
              }))} rows={3} placeholder="مثال: العميل يسدد بعد 15 يوم من التسليم — متابعة عن طريق أ/محمد" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm resize-none" /> </div> </div> {} {initialData?.id && status === 'posted' && <div className="flex items-center gap-3 pt-4 border-t border-slate-200"> {} <button type="button" disabled={collectionSaving} onClick={async () => {
              setCollectionSaving(true);
              try {
                await assignCollectionPolicy(initialData.id, {
                  collectionPolicy: collectionData.policy,
                  collectionAssigneeId: collectionData.assigneeId || undefined,
                  collectionNotes: collectionData.notes || undefined,
                  collectionDueDate: collectionData.dueDate || undefined
                });
                toast.success('تم حفظ سياسة التحصيل ✅');
              } catch (e: any) {
                toast.error(e.message || 'خطأ');
              } finally {
                setCollectionSaving(false);
              }
            }} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"> <Save className="w-4 h-4" /> {collectionSaving ? 'جاري الحفظ...' : 'حفظ سياسة التحصيل'} </button> {} <button type="button" onClick={() => {
              const locale = window.location.pathname.split('/')[1] || 'ar';
              router.push(`/${locale}/accounting/cash-registers/new-transaction?type=receipt&invoiceId=${initialData.id}&amount=${Number(initialData.amountResidual || totals.total)}`);
            }} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"> <Receipt className="w-4 h-4" /> سداد الآن (سند قبض) </button> {} {collectionData.assigneeId && <button type="button" onClick={async () => {
              try {
                await sendCollectionMessage({
                  invoiceId: initialData.id,
                  receiverId: collectionData.assigneeId,
                  message: `متابعة تحصيل: ${initialData.name} — ${collectionData.notes || ''}`,
                  actionType: 'follow_up'
                });
                toast.success('تم إرسال الرسالة ✅');
              } catch (e: any) {
                toast.error(e.message || 'خطأ');
              }
            }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"> <Send className="w-4 h-4" /> إرسال لمن يتابع التحصيل </button>} </div>} {} {initialData?.collectionStatus && initialData.collectionStatus !== 'pending' && <div className={`rounded-lg px-4 py-3 text-sm font-bold flex items-center gap-2 ${initialData.collectionStatus === 'collected' ? 'bg-green-50 text-green-700 border border-green-200' : initialData.collectionStatus === 'overdue' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}> {initialData.collectionStatus === 'collected' && '✅ تم التحصيل'} {initialData.collectionStatus === 'in_progress' && '🔄 جاري المتابعة'} {initialData.collectionStatus === 'overdue' && '⚠️ متأخر عن السداد'} {initialData.collectionStatus === 'partial' && '📊 سداد جزئي'} </div>} </div>}

      {/* Attachments */}
      {(draftId || initialData?.id) && (
        <div className="mt-6 px-4">
          <AttachmentPanel model="invoice" recordId={draftId || initialData?.id} readOnly={isLocked} />
        </div>
      )}

    </div> </div> </form> {initialData?.id && <div className="mt-8"><Chatter model="invoice" id={initialData.id} /></div>} </FormLoadingOverlay>;
}