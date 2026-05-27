'use client';
import React from "react";

import { createPurchaseOrder, updatePurchaseOrder, confirmPurchaseOrder, cancelPurchaseOrder, setToDraftPurchaseOrder, createBillFromOrder, sendToInventory, duplicatePurchaseOrder, restorePurchaseOrderAndInventory } from '@/app/actions/purchases';
import { getProductPrice } from '@/app/actions/pricing';
import { getAllPriceLists } from '@/app/actions/pricelists';
import { getAllPartners } from '@/app/actions/partner';
import { getAllProducts, getProductCategories } from '@/app/actions/products';
import { ProductBrowserModal } from '@/components/common/ProductBrowserModal';
import ImageOrderParserModal from '../inventory/ImageOrderParserModal';
import { AttachmentPanel } from '@/components/common/AttachmentPanel';
import { ProductForm } from '@/components/inventory/ProductForm';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
import { Check, Plus, Trash2, FileText, Send, Truck, CreditCard, ArrowRight, CloudUpload, RotateCcw, Loader2, AlertCircle, ChevronRight, ChevronLeft, Settings, ChevronDown, Save, Package, X, ExternalLink, AreaChart, History } from 'lucide-react';
import { TopPortal } from '@/components/common/TopPortal';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Chatter } from '@/components/chatter/Chatter';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStatusStore } from '@/store/statusStore';
import { useAutoSaveOnLeave } from '@/hooks/useAutoSaveOnLeave';
import { EditableDynamicTable, Column } from '../common/EditableDynamicTable';
import { OdooAutocomplete } from '../common/OdooAutocomplete';
import { useRouter } from 'next/navigation';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { parsePrismaError } from '@/lib/utils/errorHandler';
import { toast } from 'sonner';
import Link from 'next/link';
import OdooFormShell from '@/components/common/OdooFormShell';
import OdooSmartButton from '@/components/common/OdooSmartButton';
import NotifyButton from '@/components/common/NotifyButton';
import { getPurchaseOrderSmartData } from '@/app/actions/smartData';
import { useBreadcrumbStore } from '@/hooks/useBreadcrumbStore';
import { useBreadcrumbsStore } from '@/store/breadcrumbsStore';
import { usePathname } from 'next/navigation';
const StockAvailabilityIcon = ({
  product,
  stockQty,
  requestedQty,
  initialData,
  locale,
  iconColor
}: any) => {
  const [open, setOpen] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({
    top: 0,
    right: 0
  });
  const handleEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        right: document.documentElement.clientWidth - rect.right
      });
      setOpen(true);
    }
  };
  return <div className="flex items-center justify-center w-full h-full relative" onMouseEnter={handleEnter} onMouseLeave={() => setOpen(false)} ref={iconRef}> <div onClick={e => {
      e.preventDefault();
      safeNavigate(`/${locale}/inventory/products/${product?.id}`);
    }} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${iconColor}`} title="الرصيد المتاح"> <AreaChart className="w-4 h-4" /> </div> {open && typeof document !== 'undefined' && createPortal(<div className="fixed z-[9999] bg-white border border-slate-300 shadow-sm rounded p-4 min-w-[240px] text-right pointer-events-auto" style={{
      top: `${coords.top - 10}px`,
      transform: 'translateY(-100%)',
      right: `${coords.right - 8}px`
    }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}> <div className="absolute top-full right-4 border-[8px] border-transparent border-t-slate-300"></div> <div className="absolute top-full right-[17px] border-[7px] border-transparent border-t-white -mt-[1px]"></div> <div className="text-base text-slate-800 mb-4 border-b border-slate-100 pb-2">التوافر</div> <div className="flex justify-between items-start mb-4 gap-4"> <div className="text-right flex-1"> <div className="text-sm font-bold text-slate-800">{stockQty} {product?.uom || 'قطعه'}</div> </div> <div className="text-sm text-slate-700 whitespace-nowrap font-medium">الرصيد في المخزن</div> </div> <div className="flex justify-between items-start gap-4"> <div className="text-right flex-1"> <div className="text-sm font-bold text-[#017E84]">+{requestedQty} {product?.uom || 'قطعه'}</div> <div className="text-[11px] text-slate-500 mt-1 leading-tight">الكمية المطلوبة في أمر الشراء هذا</div> </div> <div className="text-sm text-slate-700 whitespace-nowrap font-medium">بعد الشراء</div> </div> </div>, document.body)} </div>;
};
const safeNavigate = (path: string) => {
  window.location.href = path;
};

// Editable Secondary UOM Cell - simple select from existing UOM options
const EditableUomCell = ({ uomName, factor, uomOptions, onSave }: { uomName: string; factor: number; uomOptions: { name: string; factor: number }[]; onSave: (name: string, factor: number) => void }) => {
  const currentKey = `${uomName}|${factor}`;
  return <select
    value={currentKey}
    onChange={e => {
      const val = e.target.value;
      if (!val) return;
      const [name, f] = val.split('|');
      onSave(name, Number(f));
    }}
    className="w-full h-full p-2 min-w-0 bg-transparent outline-none text-sm text-center text-slate-800 m-0"
    title="اختر الوحدة الثانوية"
  >
    {uomOptions.map(opt => (
      <option key={`${opt.name}|${opt.factor}`} value={`${opt.name}|${opt.factor}`}>
        {opt.name}
      </option>
    ))}
  </select>;
};

export function PurchaseOrderForm({
  initialData,
  defaultEditing,
  canEditUomFactor = false
}: {
  initialData?: any;
  defaultEditing?: boolean;
  canEditUomFactor?: boolean;
}) {
  const router = useRouter();
  const locale = useLocale();
  const isNewRecord = !initialData?.id;
  const [priceLists, setPriceLists] = useState<any[]>([]);
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [smartData, setSmartData] = useState<{
    receiptCount: number;
    billCount: number;
    totalBilled: number;
    totalResidual: number;
    firstReceiptId?: string | null;
    firstBillId?: string | null;
  }>({
    receiptCount: 0,
    billCount: 0,
    totalBilled: 0,
    totalResidual: 0,
    firstReceiptId: null,
    firstBillId: null
  });
  useEffect(() => {
    if (initialData?.id) {
      getPurchaseOrderSmartData(initialData.id).then(setSmartData);
    }
  }, [initialData?.id]);
  useEffect(() => {
    getAllPriceLists().then(setPriceLists);
  }, []);
  const [activeTab, setActiveTab] = useState('products');
  const [isSaving, setIsSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(initialData?.id || null);
  const [orderName, setOrderName] = useState<string>(initialData?.name || 'جديد');
  const [pageError, setPageError] = useState<string | null>(null);
  const STATUS_STEPS = status === 'cancel' ? [{
    value: 'draft',
    label: 'طلب عرض سعر'
  }, {
    value: 'cancel',
    label: 'ملغي'
  }] : [{
    value: 'draft',
    label: 'طلب عرض سعر'
  }, {
    value: 'sent',
    label: 'مُرسل'
  }, {
    value: 'purchase',
    label: 'أمر شراء'
  }, {
    value: 'done',
    label: 'مكتمل'
  }];
  const formValues = useMemo(() => ({
    vendor: initialData?.partnerId || '',
    ref: initialData?.name || initialData?.ref || '',
    date: initialData?.dateOrder ? new Date(initialData.dateOrder).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    priceListId: initialData?.priceListId || '',
    lines: initialData?.lines?.map((l: any) => ({
      id: l.id,
      productId: l.productId,
      description: l.name,
      qty: l.quantity,
      receivedQty: l.qtyReceived || 0,
      billedQty: l.qtyInvoiced || 0,
      price: l.priceUnit,
      discount: l.discount1 || 0,
      appliedPriceListName: l.appliedPriceListName || '',
      taxes: false,
      subtotal: l.priceSubtotal,
      unitSelection: l.unitName === l.secondaryUnit && l.secondaryUnit ? 'secondary' : 'primary',
      secondaryQty: l.secondaryQuantity || 0,
      uom: l.product?.uom || '',
      secondaryUom: l.product?.secondaryUom || '',
      hasSecondaryUnit: l.product?.hasSecondaryUnit || false,
      secondaryUomFactor: Number(l.product?.secondaryUomFactor || 1)
    })) || [{
      id: '',
      productId: '',
      description: '',
      qty: 1,
      receivedQty: 0,
      billedQty: 0,
      price: 0,
      discount: 0,
      discount2: 0,
      taxes: null as any,
      subtotal: 0,
      uom: '',
      hasSecondaryUnit: false,
      secondaryUom: '',
      secondaryUomFactor: 1,
      unitSelection: 'primary',
      secondaryQty: 0,
      appliedPriceListName: ''
    }],
    receiptDate: '',
    invoicePolicy: '',
    fiscalPosition: '',
    terms: ''
  }), [initialData]);
const {
  register,
  control,
  handleSubmit,
  watch,
  setValue,
  getValues,
  reset,
  formState: {
    isDirty
  }
} = useForm({
  defaultValues: formValues,
  values: formValues
});
  useEffect(() => {
  if (!initialData?.id) {
    reset({
      ...formValues,
      date: new Date().toISOString().split('T')[0]
    });
  }
}, [initialData?.id, reset, formValues]);
const priceListId = watch('priceListId');
const lines = watch("lines");
const handleVendorChange = async (val: string, onChange: (...event: any[]) => void) => {
  onChange(val);
  if (!val) return;
  const currentLines = getValues('lines');
  let updated = false;
  if (!currentLines || !Array.isArray(currentLines)) return;
  
  for (let i = 0; i < currentLines.length; i++) {
    const line = currentLines[i];
    if (line.productId && (line.lineType === 'line' || !line.lineType)) {
      const {
        price,
        discount,
        appliedPriceListName
      } = await getProductPrice({
        productId: line.productId,
        partnerId: val,
        priceListId: getValues('priceListId') || null,
        type: 'purchase',
        quantity: line.qty || 1,
        date: getValues('date') ? new Date(getValues('date')) : new Date()
      });
      if (price !== line.price || discount !== line.discount) {
        setValue(`lines.${i}.price`, price || 0);
        setValue(`lines.${i}.discount`, discount);
        setValue(`lines.${i}.appliedPriceListName`, appliedPriceListName);
        updated = true;
      }
    }
  }
  if (updated) {
    toast.info("تم تحديث الأسعار طبقاً لقائمة أسعار المورد المحددة.", {
      duration: 5000
    });
  }
};
const handleProductChange = async (index: number, productId: string | null) => {
  if (!productId) {
    setValue(`lines.${index}.description`, '');
    setValue(`lines.${index}.uom`, '');
    setValue(`lines.${index}.price`, 0);
    return;
  }
  const product = productsList.find(p => p.id === productId);
  if (product) {
    setValue(`lines.${index}.description`, product.label);
    setValue(`lines.${index}.uom`, product.uom);
    setValue(`lines.${index}.hasSecondaryUnit`, product.hasSecondaryUnit);
    setValue(`lines.${index}.secondaryUom`, product.secondaryUom);
    setValue(`lines.${index}.secondaryUomFactor`, product.secondaryUomFactor);
    setValue(`lines.${index}.unitSelection`, 'primary');
    const currentQty = lines[index]?.qty || 1;
    if (product.secondaryUomFactor && product.secondaryUomFactor > 0) {
      setValue(`lines.${index}.secondaryQty`, parseFloat((currentQty / product.secondaryUomFactor).toFixed(3)));
    } else {
      setValue(`lines.${index}.secondaryQty`, 0);
    }
  }
  const {
    price,
    discount,
    appliedPriceListName,
    warnings
  } = await getProductPrice({
    productId,
    partnerId: getValues('vendor') || null,
    priceListId: getValues('priceListId') || null,
    type: 'purchase',
    quantity: lines[index]?.qty || 1,
    date: getValues('date') ? new Date(getValues('date')) : new Date()
  });
  setValue(`lines.${index}.price`, price || 0);
  setValue(`lines.${index}.discount`, discount);
  setValue(`lines.${index}.appliedPriceListName`, appliedPriceListName);
  if (warnings && warnings.length > 0) {
    warnings.forEach((w: string) => toast.warning(w, {
      duration: 6000
    }));
  }
};
const fetchPricesForAllLines = async () => {
  const currentLines = getValues('lines');
  if (currentLines && currentLines.length > 0) {
    for (let index = 0; index < currentLines.length; index++) {
      const line = currentLines[index];
      if (line.productId) {
        const {
          price,
          discount,
          appliedPriceListName,
          warnings
        } = await getProductPrice({
          productId: line.productId,
          partnerId: getValues('vendor') || null,
          priceListId: getValues('priceListId') || null,
          type: 'purchase',
          quantity: line.qty || 1,
          date: getValues('date') ? new Date(getValues('date')) : new Date()
        });
        setValue(`lines.${index}.price`, price || 0);
        setValue(`lines.${index}.discount`, discount);
        setValue(`lines.${index}.appliedPriceListName`, appliedPriceListName);
        if (warnings && warnings.length > 0) {
          warnings.forEach((w: string) => toast.warning(`للبند ${index + 1}: ${w}`, {
            duration: 6000
          }));
        }
      }
    }
  }
};
const pathname = usePathname();
const breadcrumbLabel = orderName !== 'جديد' ? orderName : '';
const updateV1Label = useBreadcrumbStore(state => state.updateCurrentLabel);
const updateV2Label = useBreadcrumbsStore(state => state.updateCurrentLabel);
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (breadcrumbLabel && pathname) {
    updateV1Label(breadcrumbLabel);
    updateV2Label(breadcrumbLabel, pathname);
  }
}, [breadcrumbLabel, pathname]);
const isFormLocked = status === 'done' || status === 'cancel' || smartData.billCount > 0;
const isQtyLocked = isFormLocked || status === 'purchase';
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
const editableFields = ['productId', 'qty', 'price', 'discount'];
const handleKeyDown = (e: React.KeyboardEvent, index: number, field: string) => {
  if (e.key === 'ArrowUp' && index > 0) {
    e.preventDefault();
    document.getElementById(`line-${index - 1}-${field}`)?.focus();
  } else if (e.key === 'ArrowDown' && index < lines.length - 1) {
    e.preventDefault();
    document.getElementById(`line-${index + 1}-${field}`)?.focus();
  } else if (e.key === 'ArrowLeft') {
    const fieldIndex = editableFields.indexOf(field);
    if (fieldIndex < editableFields.length - 1) {
      e.preventDefault();
      document.getElementById(`line-${index}-${editableFields[fieldIndex + 1]}`)?.focus();
    }
  } else if (e.key === 'ArrowRight') {
    const fieldIndex = editableFields.indexOf(field);
    if (fieldIndex > 0) {
      e.preventDefault();
      document.getElementById(`line-${index}-${editableFields[fieldIndex - 1]}`)?.focus();
    }
  }
};
const isLocked = status === 'purchase' || status === 'done' || smartData.billCount > 0;
const amountBeforeDiscount = lines.reduce((acc: number, line: any) => {
  const lineVal = (line.qty || 0) * (line.price || 0);
  return acc + lineVal;
}, 0);
const totalDiscount = lines.reduce((acc: number, line: any) => {
  const preTotal = (line.qty || 0) * (line.price || 0);
  const postTotal = preTotal * (1 - (line.discount || 0) / 100) * (1 - (line.discount2 || 0) / 100);
  return acc + (preTotal - postTotal);
}, 0);
const untaxedAmount = lines.reduce((acc: number, line: any) => {
  const lineVal = (line.qty || 0) * (line.price || 0) * (1 - (line.discount || 0) / 100) * (1 - (line.discount2 || 0) / 100);
  return acc + lineVal;
}, 0);
const taxAmount = lines.reduce((acc: number, line: any) => {
  const lineVal = (line.qty || 0) * (line.price || 0) * (1 - (line.discount || 0) / 100) * (1 - (line.discount2 || 0) / 100);
  return acc + lineVal * ((line.taxes || 0) / 100);
}, 0);
const totalAmount = untaxedAmount + taxAmount;
const pendingActionRef = useRef<string | null>(null);
const onSubmit = async (data: any) => {
  // Cancel any pending auto-save to prevent race conditions
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = null;
  }
  setIsSaving(true);
  setStoreIsSaving(true);
  setPageError(null);
  const isConfirming = pendingActionRef.current === 'confirm';
  try {
    const currentId = draftId || initialData?.id;
    if (currentId) {
      const result = await updatePurchaseOrder(currentId, {
        ...data,
        partnerId: data.vendor
      });
      if ((result as any)?.error) {
        const msg = parsePrismaError((result as any).error);
        toast.error(msg);
        setPageError(msg);
      } else {
        setStoreUnsaved(false);
        if (isConfirming) {
          toast.success("تم التعديل، جاري التأكيد...");
          try {
            await confirmPurchaseOrder(currentId);
            toast.success('تم تأكيد أمر الشراء بنجاح ✅');
            setStatus('purchase');
          } catch (confirmErr: any) {
            console.error('Confirm error:', confirmErr);
            toast.error(confirmErr.message || 'خطأ أثناء التأكيد');
          }
        } else {
          toast.success("تم التعديل بنجاح");
        }
        pendingActionRef.current = null;
        router.push(`/${locale}/purchases/${currentId}`);
        return;
      }
    } else {
      const newOrder = await createPurchaseOrder({
        ...data,
        partnerId: data.vendor
      });
      if (newOrder && (newOrder as any).id) {
        setStoreUnsaved(false);
        setDraftId((newOrder as any).id);
        if ((newOrder as any).name) setOrderName((newOrder as any).name);
        if (isConfirming) {
          toast.success("تم إنشاء الأمر، جاري التأكيد...");
          try {
            const confirmRes = await confirmPurchaseOrder((newOrder as any).id);
            if ((confirmRes as any)?.error) {
              toast.error((confirmRes as any).error);
            } else {
              toast.success('تم تأكيد أمر الشراء بنجاح ✅');
            }
          } catch (confirmErr: any) {
            console.error('Confirm error:', confirmErr);
            toast.error(confirmErr.message || 'خطأ أثناء التأكيد');
          }
        } else {
          toast.success("تم الحفظ بنجاح");
        }
        pendingActionRef.current = null;
        router.replace(`/${locale}/purchases/${(newOrder as any).id}`);
      } else if ((newOrder as any)?.error) {
        const msg = parsePrismaError((newOrder as any).error);
        toast.error(msg);
        setPageError(msg);
      }
    }
  } catch (e: any) {
    console.error('onSubmit error:', e);
    const msg = parsePrismaError(e) || "حدث خطأ أثناء الحفظ";
    toast.error(msg);
    setPageError(msg);
  } finally {
    pendingActionRef.current = null;
    setIsSaving(false);
    setStoreIsSaving(false);
  }
};
  const handleNavigate = async (url: string) => {
  if (isFormLocallyDirty) {
    const tId = toast.loading("جاري حفظ التعديلات قبل الانتقال...");
    const saved = await backgroundSave();
    if (!saved) {
      toast.dismiss(tId);
      toast.error("فشل الحفظ قبل الانتقال.");
      return;
    }
    setClean();
    setStoreUnsaved(false);
    if (typeof reset === "function" && typeof getValues === "function") reset(getValues());
    toast.dismiss(tId);
  }
  router.push(url);
};
const setStoreUnsaved = useStatusStore(state => state.setHasUnsavedChanges);
const setStoreIsSaving = useStatusStore(state => state.setIsSaving);
const setTriggers = useStatusStore(state => state.setTriggers);
const clearTriggers = useStatusStore(state => state.clearTriggers);
const hasUnsavedChanges = useStatusStore(state => state.hasUnsavedChanges);
const isFormLocallyDirty = isDirty || hasUnsavedChanges;
const isEmptyDraft = !initialData?.partnerId && !initialData?.vendorId && (!initialData?.lines || initialData.lines.length === 0);
const showNotifyButton = !isNewRecord && !isEmptyDraft && !isFormLocallyDirty;
const backgroundSave = useCallback(async () => {
  if (!isFormLocallyDirty) return true;
  try {
    const data = getValues();
    const currentId = draftId || initialData?.id;
    if (currentId) {
      const res = await updatePurchaseOrder(currentId, {
        ...data,
        partnerId: data.vendor || null
      });
      if ((res as any)?.error) return false;
      return true;
    } else {
      const newOrder = await createPurchaseOrder({
        ...data,
        partnerId: data.vendor || null
      });
      if (newOrder && (newOrder as any).id) {
        setDraftId((newOrder as any).id);
        if ((newOrder as any).name) setOrderName((newOrder as any).name);
        window.history.replaceState(null, '', `/${locale}/purchases/${(newOrder as any).id}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('[BackgroundSave] Failed:', error);
    return false;
  }
}, [getValues, initialData?.id, draftId, locale, isFormLocallyDirty]);
const keepaliveSave = useCallback(() => {
  const currentId = draftId || initialData?.id;
  if (!currentId) return;
  const data = getValues();
  fetch('/api/purchases/save-purchaseorder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: currentId,
      ...data
    }),
    keepalive: true
  }).catch(err => console.error('[KeepaliveSave] Error:', err));
}, [getValues, draftId, initialData?.id]);
const {
  setDiscarded,
  setClean
} = useAutoSaveOnLeave(isFormLocallyDirty, async () => {
  await backgroundSave();
}, async () => {
  await keepaliveSave();
});
  useEffect(() => {
  setStoreUnsaved(isDirty);
  setTriggers(async () => {
    await handleSubmit(onSubmit)();
  }, () => {
    setDiscarded();
    reset(initialData || {});
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
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
        backgroundSave().then(() => {
          setStoreUnsaved(false);
        });
        }, 3000);
    }
  });
  return () => {
    subscription.unsubscribe();
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
  };
}, [watch, setStoreUnsaved, backgroundSave]);
const [vendorsList, setVendorsList] = useState<any[]>([]);
const reloadVendors = useCallback(async () => {
  const partners = await getAllPartners();
  const mapped = partners.map((p: any) => ({
    id: p.id,
    label: p.name,
    mobile: p.mobile || p.phone || ''
  }));
  setVendorsList(mapped);
}, []);
useEffect(() => {
  reloadVendors();
}, [reloadVendors]);
const [whatsappLoading, setWhatsappLoading] = useState(false);
const getVendorPhone = () => {
  const vendorId = watch('vendor');
  const vendor = vendorsList.find(v => v.id === vendorId);
  return vendor?.mobile || '';
};
const openWhatsApp = async () => {
  const phone = getVendorPhone().replace(/[^0-9+]/g, '');
  if (!phone) {
    toast.warning('لا يوجد رقم هاتف مسجل لهذا المورد');
    return;
  }
  setWhatsappLoading(true);
  try {
    const {
      generatePdfFromPrintPage,
      shareViaWhatsApp
    } = await import('@/lib/whatsappShare');
    const printUrl = `${window.location.origin}/${locale}/purchases/${initialData.id}/print`;
    const pdfBlob = await generatePdfFromPrintPage(printUrl);
    const pdfFileName = initialData?.name || 'أمر_شراء';
    await shareViaWhatsApp({
      phone,
      pdfBlob,
      fileName: `${pdfFileName}.pdf`,
      greeting: 'السلام عليكم ورحمة الله'
    });
  } catch (err) {
    console.error('WhatsApp share error:', err);
    toast.error('حدث خطأ أثناء إنشاء الملف');
  } finally {
    setWhatsappLoading(false);
  }
};
const [productsList, setProductsList] = useState<any[]>([]);
const reloadProducts = useCallback(async () => {
  const products = await getAllProducts();
  const mapped = products.map((p: any) => ({
    id: p.id,
    label: (p.defaultCode || p.internalRef) ? `[${p.defaultCode || p.internalRef}] ${p.name}` : p.name,
    subLabel: `${p.quantityOnHand || 0} ${p.uom || ''} متاح`,
    price: p.salePrice,
    cost: p.costPrice,
    uom: p.uom,
    hasSecondaryUnit: p.hasSecondaryUnit,
    secondaryUom: p.secondaryUom,
    secondaryUomFactor: p.secondaryUomFactor,
    quantityOnHand: p.quantityOnHand || 0,
    categoryId: p.categoryId || '',
    categoryName: p.category?.name || p.categoryName || '',
    internalRef: p.internalRef || '',
    type: p.type || 'storable',
    reservedQty: p.reservedQty || 0
  }));
  setProductsList(mapped);
}, []);
useEffect(() => {
  reloadProducts();
}, [reloadProducts]);
const [productBrowserOpen, setProductBrowserOpen] = useState(false);
const [productBrowserLineIndex, setProductBrowserLineIndex] = useState<number | null>(null);
const [productCategories, setProductCategories] = useState<any[]>([]);
const [quickCreateProductOpen, setQuickCreateProductOpen] = useState(false);
const [quickCreateProductName, setQuickCreateProductName] = useState<string | null>(null);
const [quickCreateProductLineIndex, setQuickCreateProductLineIndex] = useState<number | null>(null);
const [imageParserOpen, setImageParserOpen] = useState(false);
useEffect(() => {
  getProductCategories().then(setProductCategories);
}, []);
const handleProductBrowserConfirm = async (selections: {
  productId: string;
  quantity: number;
  secondaryQuantity: number;
}[]) => {
  if (selections.length === 0) return;
  if (productBrowserLineIndex !== null) {
    const currentLine = getValues(`lines.${productBrowserLineIndex}`);
    if (currentLine && !currentLine.productId) {
      remove(productBrowserLineIndex);
    }
  }
  for (const sel of selections) {
    const productInfo = productsList.find((p: any) => p.id === sel.productId);
    const existingIdx = fields.findIndex((f: any) => f.productId === sel.productId);
    if (existingIdx !== -1) {
      const currentQty = Number(getValues(`lines.${existingIdx}.qty`)) || 0;
      setValue(`lines.${existingIdx}.qty`, currentQty + sel.quantity);
      if (sel.secondaryQuantity > 0) {
        const currentSecQty = Number(getValues(`lines.${existingIdx}.secondaryQty`)) || 0;
        setValue(`lines.${existingIdx}.secondaryQty`, currentSecQty + sel.secondaryQuantity);
      }
      continue;
    }
    const {
      price,
      discount,
      appliedPriceListName
    } = await getProductPrice({
      productId: sel.productId,
      partnerId: getValues('vendor') || null,
      priceListId: getValues('priceListId') || null,
      type: 'purchase',
      quantity: sel.quantity,
      date: getValues('date') ? new Date(getValues('date')) : new Date()
    });
    append({
      productId: sel.productId,
      description: productInfo?.label || '',
      qty: sel.quantity,
      price: price || 0,
      discount: discount || 0,
      taxes: 0,
      uom: productInfo?.uom || 'قطعه',
      unitSelection: 'primary',
      hasSecondaryUnit: productInfo?.hasSecondaryUnit || false,
      secondaryUom: productInfo?.secondaryUom || '',
      secondaryUomFactor: productInfo?.secondaryUomFactor || 1,
      secondaryQty: sel.secondaryQuantity || 0,
      appliedPriceListName: appliedPriceListName || ''
    });
  }
  toast.success(`تم إضافة ${selections.length} صنف بنجاح`);
  setProductBrowserLineIndex(null);
};
const onInvalid = (errors: any) => {
  console.log("Validation errors:", errors);
  toast.error('تعذر الحفظ: يرجى إكمال جميع الحقول المطلوبة');
};

const confirmOrder = async () => {
  // Guard: prevent duplicate confirms
  if (isSaving || pendingActionRef.current === 'confirm') return;
  if (status === 'purchase' || status === 'done') {
    toast.info('الأمر مؤكد بالفعل');
    return;
  }
  // Cancel any pending auto-save to prevent race conditions
  if (autoSaveTimerRef.current) {
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = null;
  }
  pendingActionRef.current = 'confirm';
  handleSubmit(onSubmit, onInvalid)();
};
const cancelOrder = async () => {
  if (!initialData?.id) return;
  // Removed native confirm() to prevent browser blocking
  setIsSaving(true);
  setStoreIsSaving(true);
  try {
    const result = await cancelPurchaseOrder(initialData.id);
    if ((result as any)?.error) {
      toast.error((result as any).error);
    } else {
      toast.success('تم إلغاء الطلب');
      setStatus('cancel');
      router.refresh();
    }
  } catch (e: any) {
    toast.error(e.message || 'خطأ في الإلغاء');
  } finally {
    setIsSaving(false);
    setStoreIsSaving(false);
  }
};
const handleStatusClick = async (clickedStatus: string) => {
  if (clickedStatus === 'draft' && status === 'cancel') {
    // Removed native confirm() to prevent browser blocking
    setIsSaving(true);
    setStoreIsSaving(true);
    try {
      if (initialData?.id) {
        const result = await setToDraftPurchaseOrder(initialData.id);
        if ((result as any)?.error) {
          toast.error((result as any).error);
        } else {
          toast.success('تمت الإعادة كمسودة');
          setStatus('draft');
          router.refresh();
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ');
    } finally {
      setIsSaving(false);
      setStoreIsSaving(false);
    }
  }
};
const createBill = async () => {
  if (!initialData?.id) return;
  setIsSaving(true);
  setStoreIsSaving(true);
  try {
    const result = await createBillFromOrder(initialData.id);
    if ((result as any)?.error) {
      toast.error((result as any).error);
    } else {
      toast.success('تم إنشاء فاتورة المورد بنجاح 📄');
      router.push(`/${locale}/accounting/bills/${result.id}`);
    }
  } catch (e: any) {
    toast.error(e.message || 'خطأ في إنشاء الفاتورة');
  } finally {
    setIsSaving(false);
    setStoreIsSaving(false);
  }
};
const buildContextActions = () => {
  const actions: any[] = [];
  if (status === 'draft' || status === 'sent') {
    actions.push({
      label: 'تأكيد الأمر',
      onClick: confirmOrder,
      style: 'primary',
      disabled: isSaving
    });
    actions.push({
      label: 'إرسال بالبريد الإلكتروني',
      onClick: () => toast.info('جاري إعداد تجهيزات البريد'),
      style: 'secondary',
      disabled: isSaving
    });
    actions.push({
      label: 'طباعة طلب عرض السعر',
      onClick: async () => {
        if (initialData?.id) {
          const loadingToast = toast.loading("جاري تحميل الملف...");
          try {
            const { generatePdfFromPrintPage } = await import('@/lib/whatsappShare');
            const printUrl = `${window.location.origin}/${locale}/purchases/${initialData.id}/print`;
            const pdfBlob = await generatePdfFromPrintPage(printUrl);
            const url = window.URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${initialData?.name || 'أمر_شراء'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('تم تحميل الملف بنجاح', { id: loadingToast });
          } catch (err: any) {
            console.error(err);
            toast.error('فشل في تجهيز ملف الطباعة: ' + (err?.message || String(err)), { id: loadingToast });
          }
        } else {
          toast.error("يرجى حفظ الأمر أولاً قبل الطباعة");
        }
      },
      style: 'secondary',
      disabled: isSaving
    });
  }
  if (status === 'purchase') {
    const isFullyReceived = initialData?.lines?.length > 0 && initialData.lines.every((l: any) => parseFloat(l.qtyReceived || 0) >= parseFloat(l.quantity || 1));
    if (!isFullyReceived) {
      actions.push({
        label: 'استلام المنتجات',
        onClick: async () => {
          let receiptId = smartData.firstReceiptId;
          if (!receiptId && initialData?.id) {
            try {
              const {
                getPurchaseOrderSmartData
              } = await import('@/app/actions/smartData');
              const freshData = await getPurchaseOrderSmartData(initialData.id);
              receiptId = freshData.firstReceiptId;
            } catch (e) {
              console.error('Failed to fetch smart data dynamically:', e);
            }
          }
          if (receiptId) {
            router.push(`/${locale}/inventory/operations/receipts/${receiptId}`);
          } else {
            router.push(`/${locale}/inventory/operations/receipts?search=${initialData?.name}`);
          }
        },
        style: 'primary',
        disabled: false
      });
    }
    const hasUnbilledReceipts = initialData?.lines?.some((l: any) => parseFloat(l.qtyReceived || 0) > parseFloat(l.qtyInvoiced || 0));
    if (hasUnbilledReceipts) {
      actions.push({
        label: 'إنشاء فاتورة',
        onClick: createBill,
        style: 'secondary',
        disabled: isSaving
      });
    }
    const hasReceipts = lines.some((l: any) => Number(l.qtyReceived || 0) > 0);
    if (!hasReceipts && smartData.billCount === 0) {
      actions.push({
        label: 'إعادة تحديث المخزون',
        onClick: async () => {
          try {
            await restorePurchaseOrderAndInventory(initialData.id);
            toast.success('تمت إعادة الطلب للعمل بنجاح، يمكنك الآن تعديل الجرد');
            const target = smartData.receiptCount === 1 && smartData.firstReceiptId ? `/${locale}/inventory/operations/receipts/${smartData.firstReceiptId}` : `/${locale}/inventory/operations/receipts?search=${initialData?.name}`;
            router.push(target);
          } catch (e: any) {
            toast.error(e.message || "فشل في تحديث المخزون");
          }
        },
        style: 'secondary',
        disabled: isSaving
      });
    }
  }
  return actions;
}; // Smart Buttons
const smartButtonsElement = !isNewRecord && status !== 'draft' && status !== 'sent' ? <> <OdooSmartButton icon={<Package className="w-5 h-5" />} count={smartData.receiptCount} label="الاستلام" onClick={async () => {
    let receiptId = smartData.firstReceiptId;
    if (!receiptId && initialData?.id) {
      try {
        const {
          getPurchaseOrderSmartData
        } = await import('@/app/actions/smartData');
        const freshData = await getPurchaseOrderSmartData(initialData.id);
        receiptId = freshData.firstReceiptId;
      } catch (e) {}
    }
    if (receiptId) {
      router.push(`/${locale}/inventory/operations/receipts/${receiptId}`);
    } else {
      router.push(`/${locale}/inventory/operations/receipts?search=${initialData?.name}`);
    }
  }} /> {smartData.billCount > 0 && <OdooSmartButton icon={<FileText className="w-5 h-5" />} count={smartData.billCount} label="فواتير الموردين" href={smartData.billCount === 1 && smartData.firstBillId ? `/${locale}/accounting/bills/${smartData.firstBillId}` : `/${locale}/accounting/bills?search=${initialData?.name}`} />} </> : undefined;
const showSecondaryUnits = fields.some((field: any) => field.hasSecondaryUnit);
const columns: any[] = [{
  id: 'product',
  label: 'المنتج',
  required: true,
  sticky: true,
  width: '100%',
  minWidth: '280px',
  renderCell: (field: any, index: number, register: any, control: any) => {
    const line = lines[index] || {};
    const product = productsList.find((p: any) => p.id === line.productId);
    const stockQty = product?.quantityOnHand || 0;
    const hasStock = stockQty > 0;
    return <div className="flex items-center gap-1 w-full h-full"> <div className="flex-1 w-full h-full" onDoubleClick={() => {
        setProductBrowserLineIndex(index);
        setProductBrowserOpen(true);
      }}> <Controller name={`lines.${index}.productId`} control={control} render={({
          field: {
            onChange,
            value
          }
        }) => <div className="relative w-full h-full flex items-center"> <OdooAutocomplete id={`line-${index}-productId`} onKeyDown={e => handleKeyDown(e, index, 'productId')} options={productsList} value={value} initialQuery={line.description || line.name} onChange={(val, opt) => {
            onChange(val);
            handleProductChange(index, val as string);
          }} onCreateEdit={query => {
            setQuickCreateProductName(query);
            setQuickCreateProductLineIndex(index);
            setQuickCreateProductOpen(true);
          }} onSearchMore={() => {
            setProductBrowserLineIndex(index);
            setProductBrowserOpen(true);
          }} onLinkClick={(e, id) => {
            safeNavigate(`/${locale}/inventory/products/${id}`);
          }} disabled={isLocked} placeholder="ابحث عن منتج..." /> </div>} /> </div> </div>;
  }
}, {
  id: 'history',
  label: 'سجل',
  renderHeader: () => <span title="سجل المشتريات"><History className="w-4 h-4 mx-auto text-slate-500" /></span>,
  width: '32px',
  renderCell: (field: any, index: number) => {
    const line = lines[index] || {};
    if (!line.productId) return null;
    return <button type="button" className="p-1 text-slate-400 hover:text-[#017E84] hover:bg-slate-100 rounded transition-colors w-full flex justify-center" title="سجل المشتريات لهذا الصنف" onClick={e => {
      e.preventDefault();
      e.stopPropagation();
      safeNavigate(`/${locale}/purchases/lines?productId=${line.productId}`);
    }}> <History className="w-4 h-4" /> </button>;
  }
}, {
  id: 'description',
  label: 'الوصف',
  defaultVisible: false,
  minWidth: '200px',
  renderCell: (field: any, index: number, register: any, control: any) => <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register(`lines.${index}.description`)} disabled={isLocked} readOnly={true} className="w-full h-full p-2 min-w-0 text-xs text-slate-700 bg-transparent outline-none m-0 pointer-events-none" tabIndex={-1} />
}, {
  id: 'availability',
  label: ' ',
  width: '32px',
  renderCell: (field: any, index: number) => {
    const line = lines[index] || {};
    const product = productsList.find((p: any) => p.id === line.productId);
    if (!line.productId || !product) return null;
    const stockQty = product?.quantityOnHand || 0;
    const requestedQty = line.qty || 0;
    const iconColor = 'text-slate-500 hover:bg-slate-100 hover:text-slate-700';
    return <StockAvailabilityIcon product={product} stockQty={stockQty} requestedQty={requestedQty} initialData={initialData} locale={locale} iconColor={iconColor} />;
  }
}, {
  id: 'qty',
  label: 'الكمية',
  required: true,
  width: '100px',
  renderCell: (field: any, index: number, register: any, control: any) => <> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="hidden" {...register(`lines.${index}.id`)} /> <Controller name={`lines.${index}.qty`} control={control} render={({
      field: {
        value,
        onChange
      }
    }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-qty`} type="text" inputMode="decimal" disabled={isQtyLocked} value={value ?? ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
      setStoreUnsaved(true);
      const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
      onChange(val === '' ? null : val);
      const primaryVal = val ? parseFloat(val) : 0;
      const freshLine = getValues(`lines.${index}`);
      const factor = Number(freshLine?.secondaryUomFactor) || 0;
      if (factor > 0) {
        setValue(`lines.${index}.secondaryQty`, parseFloat((primaryVal / factor).toFixed(3)), {
          shouldValidate: true,
          shouldDirty: true
        });
      }
    }} onFocus={e => e.target.select()} onKeyDown={e => handleKeyDown(e, index, 'qty')} className={`w-full h-full p-2 min-w-0 bg-transparent outline-none text-sm text-center font-bold font-numbers m-0 ${isQtyLocked ? 'text-slate-600' : 'text-slate-800'}`} />} /> </>
}, {
  id: 'receivedQty',
  label: 'المستلم',
  width: '80px',
  hide: status === 'draft' || status === 'sent',
  renderCell: (field: any, index: number) => {
    const line = lines[index] || {};
    const received = line.qtyReceived || 0;
    const ordered = line.qty || 0;
    const isFullyReceived = received >= ordered && ordered > 0;
    return <div className={`text-sm text-center py-2 h-full w-full font-medium ${isFullyReceived ? 'text-green-600' : received > 0 ? 'text-blue-600' : 'text-slate-400'}`}> {received} </div>;
  }
}, {
  id: 'billedQty',
  label: 'المفوتر',
  width: '80px',
  hide: status === 'draft' || status === 'sent',
  renderCell: (field: any, index: number) => {
    const line = lines[index] || {};
    const billed = line.billedQty || 0;
    const ordered = line.qty || 0;
    const isFullyBilled = billed >= ordered && ordered > 0;
    return <div className={`text-sm text-center py-2 h-full w-full font-medium ${isFullyBilled ? 'text-green-600' : billed > 0 ? 'text-blue-600' : 'text-slate-400'}`}> {billed} </div>;
  }
}, {
  id: 'unit',
  label: 'وحدة القياس',
  width: '120px',
  renderCell: (field: any, index: number, register: any) => {
    const line = lines[index] || {};
    const hasSecondary = line.hasSecondaryUnit;
    const uom = line.uom || '-';
    const secondaryUom = line.secondaryUom;
    if (!hasSecondary || !secondaryUom) {
      return <div className="text-sm text-center py-2 text-slate-500 h-full w-full">{uom}</div>;
    }
    return <select disabled={isQtyLocked} {...register(`lines.${index}.unitSelection`)} className="w-full h-full p-2 min-w-0 bg-transparent outline-none text-sm text-center text-slate-800 m-0 appearance-none"> <option value="primary">{uom} (أساسية)</option> <option value="secondary">{secondaryUom}</option> </select>;
  }
}, {
  id: 'secondaryQty',
  label: 'الكمية الثانوية',
  hide: !showSecondaryUnits,
  renderCell: (field: any, index: number, register: any, control: any) => {
    const line = lines[index] || {};
    if (!line.hasSecondaryUnit) return <div className="text-xs text-center text-slate-400 py-2">-</div>;
    return <Controller name={`lines.${index}.secondaryQty`} control={control} render={({
      field: {
        value,
        onChange
      }
    }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" inputMode="decimal" disabled={isQtyLocked} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
      const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
      onChange(val);
      const secondaryVal = val ? parseFloat(val) : 0;
      const freshLine = getValues(`lines.${index}`);
      const factor = Number(freshLine?.secondaryUomFactor) || 0;
      if (factor > 0) {
        setValue(`lines.${index}.qty`, parseFloat((secondaryVal * factor).toFixed(3)), {
          shouldValidate: true,
          shouldDirty: true
        });
      }
    }} className="w-full p-1 bg-transparent focus:border-indigo-500 outline-none text-sm text-center text-slate-800 font-bold" onFocus={e => e.target.select()} />} />;
  }
}, {
  id: 'secondaryUom',
  label: 'الثانوية UOM',
  width: '110px',
  hide: !showSecondaryUnits,
  renderCell: (field: any, index: number, register: any, control: any) => {
    const line = lines[index] || {};
    if (!line.hasSecondaryUnit || !line.secondaryUom) {
      return <div className="text-sm text-center py-2 text-slate-400 h-full w-full">-</div>;
    }
    const currentFactor = Number(line.secondaryUomFactor) || 0;
    if (!canEditUomFactor) {
      return <div className="text-sm text-center py-2 text-slate-500 h-full w-full flex items-center justify-center" title={`المتغير: ${currentFactor}`}>{line.secondaryUom}</div>;
    }
    // Build unique UOM options from all products that have secondary units
    const uomMap = new Map<string, { name: string; factor: number }>();
    productsList.filter((p: any) => p.hasSecondaryUnit && p.secondaryUom).forEach((p: any) => {
      const key = `${p.secondaryUom}|${p.secondaryUomFactor}`;
      if (!uomMap.has(key)) uomMap.set(key, { name: p.secondaryUom, factor: Number(p.secondaryUomFactor) || 1 });
    });
    // Ensure current value is in the list
    const currentKey = `${line.secondaryUom}|${currentFactor}`;
    if (!uomMap.has(currentKey)) uomMap.set(currentKey, { name: line.secondaryUom, factor: currentFactor });
    const uomOptions = Array.from(uomMap.values());
    return <EditableUomCell
      uomName={line.secondaryUom}
      factor={currentFactor}
      uomOptions={uomOptions}
      onSave={(newName: string, newFactor: number) => {
        setValue(`lines.${index}.secondaryUom`, newName, { shouldDirty: true });
        setValue(`lines.${index}.secondaryUomFactor`, newFactor, { shouldDirty: true });
        const secondaryQty = Number(line.secondaryQty) || 0;
        if (newFactor > 0 && secondaryQty > 0) {
          setValue(`lines.${index}.qty`, parseFloat((secondaryQty * newFactor).toFixed(3)), { shouldValidate: true, shouldDirty: true });
        }
        setStoreUnsaved(true);
      }}
    />;
  }
}, {
  id: 'price',
  label: 'سعر الشراء',
  width: '120px',
  renderCell: (field: any, index: number, register: any, control: any) => <Controller name={`lines.${index}.price`} control={control} render={({
    field: {
      value,
      onChange
    }
  }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-price`} type="text" inputMode="decimal" disabled={isFormLocked} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
    const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
    onChange(val);
  }} onFocus={e => e.target.select()} onKeyDown={e => handleKeyDown(e, index, 'price')} className="w-full h-full p-2 min-w-0 bg-transparent outline-none text-sm text-center text-slate-800 font-medium m-0" />} />
}, {
  id: 'discount',
  label: 'خصم %',
  width: '100px',
  renderCell: (field: any, index: number, register: any, control: any) => <div className="relative w-full h-full flex flex-col justify-center"> <Controller name={`lines.${index}.discount`} control={control} render={({
      field: {
        value,
        onChange
      }
    }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-discount`} type="text" inputMode="decimal" disabled={isLocked} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
      const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
      onChange(val);
    }} onFocus={e => e.target.select()} onKeyDown={e => handleKeyDown(e, index, 'discount')} className="w-full h-full p-2 min-w-0 bg-transparent outline-none text-sm text-center text-slate-600 font-medium m-0" placeholder="0" />} /> </div>
}, {
  id: 'discount2',
  label: 'خصم 2 %',
  width: '80px',
  defaultVisible: false,
  renderCell: (field: any, index: number, register: any, control: any) => <div className="relative w-full h-full flex items-center justify-center"> <Controller name={`lines.${index}.discount2`} control={control} render={({
      field: {
        value,
        onChange
      }
    }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-discount2`} type="text" inputMode="decimal" disabled={isLocked} value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
      const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
      onChange(val);
    }} onFocus={e => e.target.select()} className="w-full h-full p-2 min-w-0 bg-transparent outline-none text-sm text-center text-slate-600 font-medium m-0" placeholder="0" />} /> </div>
}, {
  id: 'preDiscountTotal',
  label: 'الإجمالي قبل الخصم',
  width: '120px',
  renderCell: (field: any, index: number) => {
    const qty = parseFloat(lines[index]?.qty || 0);
    const price = parseFloat(lines[index]?.price || 0);
    const total = qty * price;
    return <div className="text-center text-sm text-slate-700 h-full w-full py-2"> {total.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} </div>;
  }
}, {
  id: 'subtotal',
  label: 'الإجمالي بعد الخصم',
  width: '120px',
  renderCell: (field: any, index: number, register: any) => {
    const qty = parseFloat(lines[index]?.qty || 0);
    const price = parseFloat(lines[index]?.price || 0);
    const discount = parseFloat(lines[index]?.discount || 0);
    const discount2 = parseFloat(lines[index]?.discount2 || 0);
    const subtotal = qty * price * (1 - discount / 100) * (1 - discount2 / 100);
    return <div className="text-center font-bold text-slate-800 h-full w-full py-2 flex items-center justify-center"> {subtotal.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} </div>;
  }
}, {
  id: 'taxes',
  label: 'الضرائب',
  width: '80px',
  renderCell: (field: any, index: number, register: any, control: any) => <div className="relative w-full h-full flex items-center justify-center"> <select id={`line-${index}-taxes`} disabled={isLocked} {...register(`lines.${index}.taxes`, {
      valueAsNumber: true
    })} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
      setValue(`lines.${index}.taxes`, parseFloat(e.target.value) || null as any, {
        shouldValidate: true,
        shouldDirty: true
      });
    }} className="w-full h-full py-2 px-1 bg-transparent outline-none text-xs text-center text-slate-600 font-medium m-0 appearance-none border-none cursor-pointer"> <option value="" disabled hidden>بدون (تخطي)</option> <option value="0">معفاة 0%</option> <option value="14">مضافة 14%</option> <option value="5">مخفّضة 5%</option> </select> </div>
}, {
  id: 'pricelist',
  label: 'قائمة الأسعار',
  width: '100px',
  renderCell: (field: any, index: number) => {
    const line = lines[index] || {};
    const listName = line.appliedPriceListName || '-';
    return <div className="w-full h-full flex flex-col justify-center items-center py-2"> <span title={listName} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[80px]"> {listName} </span> </div>;
  }
}];
  return (
    <>
      <OdooFormShell statusSteps={STATUS_STEPS} currentStatus={status} onStatusClick={status === 'cancel' ? handleStatusClick : undefined} statusClickable={status === 'cancel'} contextActions={buildContextActions()} smartButtons={smartButtonsElement} titleLabel={status === 'draft' || status === 'sent' ? 'طلب عرض سعر' : 'أمر شراء'} titleValue={orderName} extraHeaderElements={showNotifyButton && <NotifyButton resourceModel="PurchaseOrder" resourceId={draftId || initialData?.id} resourceName={orderName} />} chatterId={draftId || initialData?.id} chatterModel="purchaseOrder" error={pageError} isLoading={isSaving} createdBy={initialData?.createdBy?.name} createdAt={initialData?.createdAt} updatedBy={initialData?.updatedBy?.name} updatedAt={initialData?.updatedAt}>
        {/* Top Portal for breadcrumb & action menu */}
        <TopPortal>
          <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse" dir="rtl">
            {isFormLocallyDirty && (
              <>
                <button onClick={() => handleSubmit(onSubmit, onInvalid)()} disabled={isSaving} className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-sm font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2 h-8">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                  حفظ يدوي
                </button>
                <button onClick={() => {
                  setDiscarded();
                  reset(initialData || {});
                  setStoreUnsaved(false);
                  setClean();
                }} disabled={isSaving} className="bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-sm text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 h-8">
                  <RotateCcw className="w-4 h-4" />
                  تجاهل
                </button>
              </>
            )}

            {/* New Button */}
            <button type="button" onClick={() => router.push(`/${locale}/purchases/new`)} title="إنشاء أمر شراء جديد" className="bg-white border border-[#017E84] text-[#017E84] px-3 py-1.5 rounded-sm text-sm font-bold hover:bg-[#017E84] hover:text-white transition-colors h-8 flex items-center justify-center min-w-[60px]">
              جديد
            </button>

            <div className="h-4 w-px bg-slate-300 mx-1"></div>

            {/* Pagination */}
            <div className="flex items-center text-slate-500 font-numbers text-xs font-bold gap-2">
              <button className="p-1 rounded-sm text-slate-300 cursor-not-allowed" title="التالي" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 rounded-sm text-slate-300 cursor-not-allowed" title="السابق" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
              <span>1 / 1</span>
            </div>

            {/* Refresh */}
            <button type="button" onClick={() => window.location.reload()} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-sm transition-colors ml-1" title="تحديث">
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Action Menu Component is used here */}
            <ActionMenu onPrint={async () => {
              if (initialData?.id) {
                const loadingToast = toast.loading("جاري تحميل الملف...");
                try {
                  const { generatePdfFromPrintPage } = await import('@/lib/whatsappShare');
                  const printUrl = `${window.location.origin}/${locale}/purchases/${initialData.id}/print`;
                  const pdfBlob = await generatePdfFromPrintPage(printUrl);
                  const url = window.URL.createObjectURL(pdfBlob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${initialData?.name || 'أمر_شراء'}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  toast.success("تم تحميل الملف بنجاح", { id: loadingToast });
                } catch (e: any) {
                  console.error("PDF generation failed:", e);
                  toast.error("فشل في تجهيز ملف الطباعة: " + (e?.message || String(e)), { id: loadingToast });
                }
              } else {
                toast.error("يرجى حفظ الأمر أولاً قبل الطباعة");
              }
            }} onDuplicate={async () => {
              if (!initialData?.id) return;
              try {
                const newOrder = await duplicatePurchaseOrder(initialData.id);
                toast.success('تم إنشاء نسخة مطابقة بنجاح');
                router.push(`/${locale}/purchases/${newOrder.id}`);
              } catch (e: any) {
                toast.error(e.message || 'فشل في إنشاء النسخة');
              }
            }} onDelete={() => toast.error('الحذف غير مصرح به لهذه الوثيقة')} />
          </div>
        </TopPortal>

        {/* Form Body */}
        <div className="pt-4 sm:pt-6">
          {/* Warning Banner for Zeroed Inventory with Bills */}
          {smartData.billCount > 0 && (initialData?.lines?.length || 0) > 0 && initialData?.lines?.every((l: any) => parseFloat(l.qtyReceived || 0) === 0) && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex justify-between items-center">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  <div className="ml-3 mr-3">
                    <h3 className="text-sm font-bold text-red-800">تنبيه نظام التزامن (المخزون مصفر)</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>تم تصفير استلامات المخزون بالكامل، لكن توجد فواتير مرتبطة بهذا الطلب. يرجى إلغاء أو حذف الفواتير المسودة المتوقفة بسبب تصفير المخزن لعدم وجود ما يفوتر.</p>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => {
                  if (smartData.firstReceiptId) {
                    router.push(`/${locale}/inventory/operations/receipts/${smartData.firstReceiptId}`);
                  } else {
                    router.push(`/${locale}/inventory/operations/receipts?search=${initialData?.name}`);
                  }
                }} className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold py-2 px-4 rounded transition-colors">
                  معاينة المخزن
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-3 mb-8 border-b border-slate-100 pb-8">
            {/* Right Column */}
            <div className="space-y-3">
              {/* Vendor Autocomplete */}
              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-900">المورد</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Controller name="vendor" control={control} render={({
                      field: {
                        onChange,
                        value
                      }
                    }) => (
                      <div className="relative w-full">
                        <OdooAutocomplete options={vendorsList} value={value} onChange={val => handleVendorChange(val as string, onChange)} disabled={isLocked} onCreateEdit={query => {
                          // Navigate to full-page partner creation instead of modal
                          const currentPath = `/${locale}/purchases${initialData?.id ? `/${initialData.id}` : '/new'}`;
                          router.push(`/${locale}/contacts/create?name=${encodeURIComponent(query)}&isVendor=true&returnUrl=${encodeURIComponent(currentPath)}`);
                        }} onLinkClick={(e, id) => safeNavigate(`/${locale}/contacts/${id}`)} showWhatsApp={true} placeholder="ابدأ الكتابة للبحث أو الإنشاء..." />
                        {isLocked && value && <Link href={`/${locale}/contacts/${value}`} className="absolute inset-0 z-10 block cursor-pointer" title="انتقل لصفحة المورد" />}
                        {/* Error Message */}
                        {/* Using any to bypass TS error on formState.errors */}
                        {(control._formState.errors as any).vendor && <p className="text-xs text-red-500 mt-1">{(control._formState.errors as any).vendor.message as string}</p>}
                      </div>
                    )} />
                  </div>
                  {watch('vendor') && (
                    <>
                      <button type="button" onClick={openWhatsApp} disabled={whatsappLoading} className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white transition-colors shadow-sm flex-shrink-0" title="إرسال عبر واتساب">
                        {whatsappLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /> </svg>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-700">الموعد النهائي للطلب</label>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" lang="en" dir="ltr" {...register('date', {
                  onChange: () => setTimeout(fetchPricesForAllLines, 0)
                })} disabled={isLocked} className={`w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent ${!watch('date') ? 'text-transparent focus:text-inherit' : ''}`} />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-700">الوصول المتوقع</label>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" lang="en" dir="ltr" {...register('receiptDate')} disabled={isLocked} className={`w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent ${!watch('receiptDate') ? 'text-transparent focus:text-inherit' : ''}`} />
              </div>
            </div>

            {/* Left Column */}
            <div className="space-y-3">
              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-700">مرجع المورّد</label>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('ref')} disabled={isLocked} className="w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent" />
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-700">قائمة الأسعار</label>
                <select {...register('priceListId', {
                  onChange: () => setTimeout(fetchPricesForAllLines, 0)
                })} disabled={isLocked} className="w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none py-1 text-sm bg-transparent appearance-none">
                  <option value="">(الافتراضية)</option>
                  {priceLists.filter((list: any) => {
                    if (list.type !== 'purchase') return false;
                    const vendorId = watch('vendor');
                    const isGlobal = !list.partnerId && (!list.partners || list.partners.length === 0);
                    if (isGlobal) return true;
                    if (!vendorId) return true;
                    if (list.partnerId === vendorId) return true;
                    if (list.partners?.some((p: any) => p.id === vendorId)) return true;
                    return false;
                  }).map((list: any) => <option key={list.id} value={list.id}>{list.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-700">التوصيل إلى</label>
                <select disabled={isLocked} className={`w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent transition-colors ${isLocked ? 'appearance-none cursor-not-allowed' : 'cursor-pointer'}`}>
                  <option value="main">المخزن الرئيسي</option>
                  {/* Further warehouse locations will be fetched and listed here */}
                </select>
              </div>

              {!isLocked && (
                <div className="grid grid-cols-[140px_1fr] items-center mt-2">
                  <div className="text-sm font-bold text-slate-700 pt-2"></div>
                  <div className="flex">
                    <button type="button" onClick={() => {
                      toast.info('جاري إعادة تقييم الأسعار لجميع البنود...');
                      fetchPricesForAllLines();
                    }} className="text-xs flex items-center gap-1.5 text-slate-600 hover:text-slate-800 font-bold bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-md transition-colors shadow-sm">
                      <RotateCcw className="w-3.5 h-3.5" />
                      تحديث الأسعار
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-6">
            <div className="flex gap-8">
              <button onClick={() => setActiveTab('products')} className={`py-2 text-sm font-bold transition-all ${activeTab === 'products' ? 'text-[#017E84] border-b-2 border-[#017E84]' : 'text-slate-500 hover:text-slate-800'}`}>المنتجات</button>
              <button onClick={() => setActiveTab('other_info')} className={`py-2 text-sm font-bold transition-all ${activeTab === 'other_info' ? 'text-[#017E84] border-b-2 border-[#017E84]' : 'text-slate-500 hover:text-slate-800'}`}>معلومات أخرى</button>
            </div>
          </div>

          {activeTab === 'products' && (
            <>
              <div className="mb-8">
                <EditableDynamicTable tableId="purchase_order_lines" columns={columns.filter(c => !c.hide)} fields={fields} register={register} control={control} onRemove={remove} onSwap={(indexA, indexB) => {
                  move(indexA, indexB); // ensure react-hook-form knows order changed
                }} onAdd={() => append({
                  productId: '',
                  description: '',
                  qty: 1,
                  receivedQty: 0,
                  billedQty: 0,
                  price: 0,
                  discount: 0,
                  discount2: 0,
                  taxes: null as any,
                  subtotal: 0,
                  secondaryQty: 0,
                  type: 'product'
                })} onAddSection={() => append({
                  type: 'section',
                  description: 'عنوان قسم جديد',
                  productId: 'SECTION',
                  qty: 0,
                  price: 0,
                  discount: 0,
                  discount2: 0,
                  taxes: null as any,
                  subtotal: 0,
                  secondaryQty: 0
                })} onAddNote={() => append({
                  type: 'note',
                  description: 'ملاحظة جديدة',
                  productId: 'NOTE',
                  qty: 0,
                  price: 0,
                  discount: 0,
                  discount2: 0,
                  taxes: null as any,
                  subtotal: 0,
                  secondaryQty: 0
                })} onAddFromImage={() => setImageParserOpen(true)} readOnly={isLocked} itemsPerPage={20} rowClassName={(item, index) => {
                  const line = lines[index] || {};
                  const billedQty = line.billedQty || 0;
                  const qty = line.qty || 0;
                  if (line.type === 'product' && billedQty >= qty && qty > 0) {
                    return '[&_input]:!text-green-600 [&_.odoo-autocomplete-input]:!text-green-600 !text-green-600 bg-green-50/10';
                  }
                  return '';
                }} />
              </div>

              {/* Totals */}
              <div className="flex justify-between items-start mt-6">
                <div className="text-sm text-slate-500">
                </div>
                <div className="w-1/3 min-w-[300px] space-y-3">
                  {totalDiscount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-slate-800 text-sm">
                        <span className="font-medium">الإجمالي قبل الخصم:</span>
                        <span>{amountBeforeDiscount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ج.م</span>
                      </div>
                      <div className="flex justify-between items-center text-red-700 text-sm">
                        <span className="font-medium">الخصم:</span>
                        <span>- {totalDiscount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ج.م</span>
                      </div>
                    </>
                  )}

                  {taxAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center text-slate-800 text-sm">
                        <span className="font-medium">المبلغ (قبل الضريبة):</span>
                        <span>{untaxedAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ج.م</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 text-sm">
                        <span className="font-medium">الضرائب:</span>
                        <span>{taxAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ج.م</span>
                      </div>
                    </>
                  )}

                  {taxAmount === 0 && totalDiscount === 0 && (
                    <div className="flex justify-between items-center text-slate-800 text-sm">
                      <span className="font-medium">المبلغ الخاضع للضريبة:</span>
                      <span>{untaxedAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} ج.م</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-lg font-bold text-indigo-900 border-t border-slate-300 pt-2 mt-2">
                    <span>{totalDiscount > 0 ? 'الصافي:' : 'الإجمالي:'}</span>
                    <span>{totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })} ج.م</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'other_info' && (
            <div className="p-6 grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">سياسة الفواتير</h3>
                <div className="grid grid-cols-[140px_1fr] items-start">
                  <label className="text-sm font-bold text-slate-800 pt-1">سياسة استلام الفواتير</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input autoComplete="off" autoCorrect="off" spellCheck={false} type="radio" value="ordered" {...register('invoicePolicy')} disabled={isLocked} className="text-slate-700 focus:ring-slate-600" />
                      <span className="text-sm text-slate-700">على الكميات المطلوبة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input autoComplete="off" autoCorrect="off" spellCheck={false} type="radio" value="received" {...register('invoicePolicy')} disabled={isLocked} className="text-slate-700 focus:ring-slate-600" />
                      <span className="text-sm text-slate-700">على الكميات المستلمة</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">المحاسبة</h3>
                <div className="grid grid-cols-[140px_1fr] items-center">
                  <label className="text-sm font-bold text-slate-800">الوضع المالي</label>
                  <select {...register('fiscalPosition')} disabled={isLocked} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent appearance-none">
                    <option value="">—</option>
                    <option value="local">محلي</option>
                    <option value="export">تصدير</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="mt-8 text-right">
            <textarea {...register('terms')} disabled={isLocked} className="w-full border-b border-transparent hover:border-slate-300 focus:border-slate-500 outline-none py-1 text-sm bg-transparent resize-none" placeholder="قم بتعريف الشروط والأحكام." rows={2}></textarea>
          </div>

          {/* Attachments */}
          {(draftId || initialData?.id) && (
            <div className="mt-6 px-4">
              <AttachmentPanel model="purchaseOrder" recordId={draftId || initialData?.id} readOnly={isLocked} />
            </div>
          )}
        </div>
      </OdooFormShell>

      {/* Quick Create Product Modal */}
      {quickCreateProductOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow-sm w-[90vw] max-w-[1200px] max-h-[90vh] flex flex-col overflow-hidden" dir="rtl">
            <div className="flex justify-between items-center p-4 border-b border-[#e5e7eb] bg-slate-50">
              <h2 className="text-lg font-medium text-slate-800">إنشاء صنف: {quickCreateProductName}</h2>
              <button onClick={() => setQuickCreateProductOpen(false)} className="text-slate-500 hover:text-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 bg-white">
              <ProductForm isModal={true} initialData={{
                name: quickCreateProductName || ''
              }} onSuccess={async (newProduct: any) => {
                // Refresh products
                const products = await getAllProducts();
                if (products) {
                  setProductsList(products);
                  if (quickCreateProductLineIndex !== null) {
                    const {
                      price,
                      discount,
                      appliedPriceListName
                    } = await getProductPrice({
                      productId: newProduct.id,
                      partnerId: getValues('vendor') || null,
                      priceListId: getValues('priceListId') || null,
                      type: 'purchase',
                      quantity: 1,
                      date: getValues('date') ? new Date(getValues('date')) : new Date()
                    });

                    setValue(`lines.${quickCreateProductLineIndex}.productId`, newProduct.id);
                    setValue(`lines.${quickCreateProductLineIndex}.price`, price || 0);
                    setValue(`lines.${quickCreateProductLineIndex}.discount`, discount || 0);
                    setValue(`lines.${quickCreateProductLineIndex}.description`, newProduct.name || '');
                    setValue(`lines.${quickCreateProductLineIndex}.uom`, newProduct.uom || 'قطعه');
                    setValue(`lines.${quickCreateProductLineIndex}.appliedPriceListName`, appliedPriceListName || '');

                    if (newProduct.hasSecondaryUnit) {
                      setValue(`lines.${quickCreateProductLineIndex}.hasSecondaryUnit`, true);
                      setValue(`lines.${quickCreateProductLineIndex}.secondaryUom`, newProduct.secondaryUom);
                      setValue(`lines.${quickCreateProductLineIndex}.secondaryUomFactor`, newProduct.secondaryUomFactor);
                    }
                    handleProductChange(quickCreateProductLineIndex, newProduct.id);
                  }
                }
                setQuickCreateProductOpen(false);
              }} />
            </div>
          </div>
        </div>
      )}

      {/* Product Browser Modal */}
      {/* Image Parser Modal */}
      <ImageOrderParserModal 
        isOpen={imageParserOpen} 
        products={productsList}
        onClose={() => setImageParserOpen(false)} 
        onConfirmItems={(newItems) => {
          newItems.forEach((item) => {
            append({
              productId: item.product.id,
              description: item.product.name,
              qty: item.quantity,
              price: item.product.price || 0,
              discount: 0,
              taxes: null as any,
              uom: item.uom || item.product.uom,
              secondaryQty: 0,
              hasSecondaryUnit: item.product.hasSecondaryUnit || false,
              secondaryUom: item.product.secondaryUom || '',
              secondaryUomFactor: item.product.secondaryUomFactor || 1,
              unitSelection: 'primary'
            });
          });
          toast.success(`تم إضافة ${newItems.length} صنف بنجاح`);
          setTimeout(fetchPricesForAllLines, 500);
        }} 
      />

      <ProductBrowserModal isOpen={productBrowserOpen} onClose={() => {
        setProductBrowserOpen(false);
        setProductBrowserLineIndex(null);
      }} products={productsList.map((p: any) => ({
        id: p.id,
        name: p.label || p.name,
        internalRef: p.internalRef,
        type: p.type,
        categoryId: p.categoryId,
        categoryName: p.categoryName,
        salePrice: p.price || p.salePrice,
        costPrice: p.cost || p.costPrice,
        quantityOnHand: p.quantityOnHand,
        reservedQty: p.reservedQty || 0,
        uom: p.uom,
        secondaryUom: p.secondaryUom,
        secondaryUomFactor: p.secondaryUomFactor,
        hasSecondaryUnit: p.hasSecondaryUnit
      }))} categories={productCategories} existingProductIds={lines.filter((l: any) => l.productId).map((l: any) => l.productId)} onConfirm={handleProductBrowserConfirm} />

      {/* Chatter / Tracking */}
      {initialData?.id && (
        <div className="mt-8 border-t border-slate-200 pt-8">
          <Chatter model="purchaseOrder" id={initialData.id} />
        </div>
      )}
    </>
  );
}