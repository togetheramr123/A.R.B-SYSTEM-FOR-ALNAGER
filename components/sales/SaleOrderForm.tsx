'use client';
import React from "react";

import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { Check, Plus, Trash2, ShoppingBag, Send, CreditCard, Truck, FileText, Users, CloudUpload, RotateCcw, AlertCircle, Loader2, ChevronRight, ChevronLeft, Settings, ChevronDown, Save, ExternalLink, Calendar, CheckCircle2, X, AreaChart } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStatusStore } from '@/store/statusStore';
import { useAutoSaveOnLeave } from '@/hooks/useAutoSaveOnLeave';
import { Chatter } from '@/components/chatter/Chatter';
import { OdooAutocomplete } from '../common/OdooAutocomplete';
import { OdooCombobox } from '@/components/ui/OdooCombobox';
import { useRouter } from 'next/navigation';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
import { parsePrismaError } from '@/lib/utils/errorHandler';
import { TopPortal } from '@/components/common/TopPortal';
import { ActionMenu } from '@/components/common/ActionMenu';
import { EditableDynamicTable } from '../common/EditableDynamicTable';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import OdooFormShell from '@/components/common/OdooFormShell';
import { AttachmentPanel } from '@/components/common/AttachmentPanel';
import OdooSmartButton from '@/components/common/OdooSmartButton';
import NotifyButton from '@/components/common/NotifyButton';
import { getSaleOrderSmartData, getTaxesByScope, getPaymentTerms } from '@/app/actions/smartData';
import { useBreadcrumbStore } from '@/hooks/useBreadcrumbStore';
import { useBreadcrumbsStore } from '@/store/breadcrumbsStore';
import { usePathname } from 'next/navigation';
import { VariantGridModal } from './VariantGridModal';
import ImageOrderParserModal from '../inventory/ImageOrderParserModal';
import { DebtFollowUpModal } from './DebtFollowUpModal';
import { createSaleOrder, updateSaleOrder, confirmSaleOrder, cancelSaleOrder, createInvoiceFromOrder, setToDraftSaleOrder, restoreSaleOrderAndInventory, fetchPurchaseInvoiceForSales, requestReservation, approveReservation, requestNegativeStockApproval, approveNegativeStock, rejectNegativeStock } from '@/app/actions/sales';
import { getUsers } from '@/app/actions/settings';
import { getProductPrice, getPartnerPricingOptions } from '@/app/actions/pricing';
import type { PartnerPricingOptions, PricingOption } from '@/app/actions/pricing';
import { PriceAgreementChooser } from './PriceAgreementChooser';
import { getAllPriceLists } from '@/app/actions/pricelists';
import { getAllPartners } from '@/app/actions/partner';
import { getAllProducts, getProductCategories } from '@/app/actions/products';
import { ProductBrowserModal } from '@/components/common/ProductBrowserModal';
import { ProductForm } from '@/components/inventory/ProductForm';
const saleOrderLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  qty: z.preprocess(val => val === '' || Number.isNaN(val) ? 0 : Number(val), z.number().min(0.01, {
    message: "الكمية يجب أن تكون أكبر من 0"
  })),
  price: z.preprocess(val => val === '' || Number.isNaN(val) ? 0 : Number(val), z.number().min(0, {
    message: "السعر لا يمكن أن يكون سالباً"
  })),
  discount: z.preprocess(val => val === '' || Number.isNaN(val) ? null : Number(val), z.number().min(0).max(100).nullable().optional()),
  discount2: z.preprocess(val => val === '' || Number.isNaN(val) ? null : Number(val), z.number().min(0).max(100).nullable().optional()),
  tax: z.preprocess(val => val === '' || Number.isNaN(val) ? null : Number(val), z.number().min(0).max(100).nullable().optional()),
  uom: z.string().optional().nullable(),
  secondaryQuantity: z.preprocess(val => val === '' || Number.isNaN(val) ? null : Number(val), z.number().nullable().optional()),
  secondaryUnit: z.string().optional().nullable(),
  unitSelection: z.string().optional().nullable(),
  lineType: z.string().default('line'),
  hasSecondaryUnit: z.boolean().optional(),
  secondaryUom: z.string().optional().nullable(),
  secondaryUomFactor: z.preprocess(val => val === '' || Number.isNaN(val) ? null : Number(val), z.number().nullable().optional()),
  type: z.string().optional(),
  appliedPriceListName: z.string().optional().nullable(),
  secondaryQty: z.preprocess(val => val === '' || Number.isNaN(val) ? null : Number(val), z.number().nullable().optional())
}).superRefine((data, ctx) => {
  if ((data.lineType === 'line' || data.type === 'product') && !data.productId && !data.description) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "المنتج أو الوصف مطلوب للاسطر العادية",
      path: ['productId']
    });
  }
});
const saleOrderSchema = z.object({
  customer: z.string().min(1, {
    message: "العميل مطلوب"
  }),
  date: z.string().min(1, {
    message: "تاريخ الطلب مطلوب"
  }),
  priceListId: z.union([z.string(), z.null(), z.literal('')]).optional(),
  validityDate: z.union([z.string(), z.null(), z.literal('')]).optional(),
  paymentTerm: z.union([z.string(), z.null(), z.literal('')]).optional(),
  userId: z.union([z.string(), z.null(), z.literal('')]).optional(),
  salesTeam: z.union([z.string(), z.null(), z.literal('')]).optional(),
  clientOrderRef: z.union([z.string(), z.null(), z.literal('')]).optional(),
  fiscalPosition: z.union([z.string(), z.null(), z.literal('')]).optional(),
  terms: z.union([z.string(), z.null(), z.literal('')]).optional(),
  lines: z.array(saleOrderLineSchema).min(1, {
    message: "يجب إضافة بند واحد على الأقل"
  }),
  options: z.array(z.any()).optional()
});
const StockAvailabilityIcon = ({
  product,
  stockQty,
  requestedQty,
  isOutOfStock,
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
  return <div className="flex items-center justify-center w-full h-full relative" onMouseEnter={handleEnter} onMouseLeave={() => setOpen(false)} ref={iconRef}> {initialData?.id ? <div onClick={e => {
      e.preventDefault();
      window.location.href = `/${locale}/sales/${initialData.id}/availability`;
    }} className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${iconColor}`} title="تقرير التوافر"> <AreaChart className="w-4 h-4" /> </div> : <div className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${iconColor}`} title="احفظ الطلب أولاً لعرض التوافر"> <AreaChart className="w-4 h-4 opacity-50" /> </div>} {open && typeof document !== 'undefined' && createPortal(<div className="fixed z-[9999] bg-white border border-slate-300 shadow-sm rounded p-4 min-w-[240px] text-right pointer-events-auto" style={{
      top: `${coords.top - 10}px`,
      transform: 'translateY(-100%)',
      right: `${coords.right - 8}px`
    }} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}> <div className="absolute top-full right-4 border-[8px] border-transparent border-t-slate-300"></div> <div className="absolute top-full right-[17px] border-[7px] border-transparent border-t-white -mt-[1px]"></div> <div className="text-base text-slate-800 mb-4 border-b border-slate-100 pb-2">التوافر</div> <div className="flex justify-between items-start mb-4 gap-4"> <div className="text-right flex-1"> <div className="text-sm font-bold text-slate-800">{stockQty} {product?.uom || 'قطعه'}</div> <div className="text-[11px] text-slate-500 mt-1">في ٢٩ أبريل, ٢٠٢٦</div> </div> <div className="text-sm text-slate-700 whitespace-nowrap font-medium">المخزون المتوقع</div> </div> <div className="flex justify-between items-start mb-4 gap-4"> <div className="text-right flex-1"> <div className={`text-sm font-bold ${isOutOfStock ? 'text-red-600' : 'text-slate-800'}`}>{stockQty} {product?.uom || 'قطعه'}</div> <div className="text-[11px] text-slate-500 mt-1 leading-tight">كافة العمليات المخطط لها مشمولة</div> </div> <div className="text-sm text-slate-700 whitespace-nowrap font-medium">{isOutOfStock ? 'غير متاح' : 'متاح'}</div> </div> {initialData?.id && <div onClick={e => {
        e.preventDefault();
        window.location.href = `/${locale}/sales/${initialData.id}/availability`;
      }} className="pt-2 text-[#714B67] hover:text-[#5B3C53] transition-colors text-sm font-bold flex items-center justify-start gap-1 cursor-pointer pointer-events-auto"> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg> عرض التنبؤات </div>} </div>, document.body)} </div>;
};

// Editable Secondary UOM Cell - simple select from existing UOM options
const EditableUomCellSale = ({ uomName, factor, uomOptions, onSave }: { uomName: string; factor: number; uomOptions: { name: string; factor: number }[]; onSave: (name: string, factor: number) => void }) => {
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

export function SaleOrderForm({
  initialData,
  showMargins = false,
  defaultEditing = false,
  userRole = 'USER',
  userId = '',
  allowedCustomerType = 'ALL',
  canViewCustomerDetails = false,
  canEditUomFactor = false
}: {
  initialData?: any;
  showMargins?: boolean;
  defaultEditing?: boolean;
  userRole?: string;
  userId?: string;
  allowedCustomerType?: string;
  canViewCustomerDetails?: boolean;
  canEditUomFactor?: boolean;
}) {
  const t = useTranslations('Sales');
  const router = useRouter();
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState('lines');
  const [pricingOptions, setPricingOptions] = useState<PartnerPricingOptions | null>(null);
  const [status, setStatus] = useState(initialData?.status || 'draft');
  const [isSaving, setIsSaving] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(initialData?.id || null);
  const [orderName, setOrderName] = useState<string>(initialData?.name || 'جديد');
  const isAdmin = userRole === 'ADMIN';
  const isFormLocked = status === 'done' || status === 'cancel';
  const isQtyLocked = isFormLocked || status === 'sale';
  const [pageError, setPageError] = useState<string | null>(null);
  const isNewRecord = !initialData?.id;
  const isQuotationStage = status === 'draft' || status === 'sent';
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantProductId, setVariantProductId] = useState<string | null>(null);
  
  const [imageParserOpen, setImageParserOpen] = useState(false);
  const [activeVariantLineIndex, setActiveVariantLineIndex] = useState<number | null>(null);
  const [productBrowserOpen, setProductBrowserOpen] = useState(false);
  const [productBrowserLineIndex, setProductBrowserLineIndex] = useState<number | null>(null);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [smartData, setSmartData] = useState({
    deliveryCount: 0,
    firstDeliveryId: null as string | null,
    invoiceCount: 0,
    firstInvoiceId: null as string | null,
    paidCount: 0
  });
  const [dbTaxes, setDbTaxes] = useState<any[]>([]);
  const [dbPaymentTerms, setDbPaymentTerms] = useState<any[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [useCostPrice, setUseCostPrice] = useState(false);
  const [importRef, setImportRef] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [negativeStockModalOpen, setNegativeStockModalOpen] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');

  useEffect(() => {
    if (negativeStockModalOpen && admins.length === 0) {
      getUsers().then(users => {
        const filteredAdmins = users.filter((u: any) => u.role === 'ADMIN');
        setAdmins(filteredAdmins);
        if (filteredAdmins.length > 0) {
          setSelectedAdminId(filteredAdmins[0].id);
        }
      });
    }
  }, [negativeStockModalOpen]);
  const [debtFollowUpModalOpen, setDebtFollowUpModalOpen] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState<any[]>([]);
  const [isApprovingNegativeStock, setIsApprovingNegativeStock] = useState(false);
  const [reservationHours, setReservationHours] = useState(24);
  const [isReserving, setIsReserving] = useState(false);
  const [validityPromptOpen, setValidityPromptOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);
  const [quickCreateProductOpen, setQuickCreateProductOpen] = useState(false);
  const [quickCreateProductName, setQuickCreateProductName] = useState<string | null>(null);
  const [quickCreateProductLineIndex, setQuickCreateProductLineIndex] = useState<number | null>(null);
  useEffect(() => {
    if (initialData?.id) {
      getSaleOrderSmartData(initialData.id).then(setSmartData);
    }
    getTaxesByScope('sale').then(setDbTaxes);
    getPaymentTerms().then(setDbPaymentTerms);
  }, [initialData?.id]);
  const STATUS_STEPS = [{
    value: 'draft',
    label: 'مسودة'
  }, {
    value: 'sent',
    label: 'مُرسل'
  }, {
    value: 'sale',
    label: 'أمر بيع'
  }, {
    value: 'done',
    label: 'مكتمل'
  }];
  const [priceLists, setPriceLists] = useState<any[]>([]);
  useEffect(() => {
    getAllPriceLists().then(setPriceLists);
  }, []);
  const [customers, setCustomers] = useState<any[]>([]);
  const reloadCustomers = useCallback(async () => {
    const partners = await getAllPartners();
    
    // Filter customers based on user permissions
    const filteredPartners = partners.filter((p: any) => {
      if (allowedCustomerType === 'CASH') return p.partnerType === 'CASH';
      if (allowedCustomerType === 'COMMERCIAL') return p.partnerType === 'COMMERCIAL';
      return true; // 'ALL' or empty allows all
    });

    const mapped = filteredPartners.map((p: any) => ({
      id: p.id,
      label: p.name,
      mobile: p.mobile || p.phone || ''
    }));
    setCustomers(mapped);
  }, [allowedCustomerType]);
  useEffect(() => {
    reloadCustomers();
  }, [reloadCustomers]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const reloadProducts = useCallback(async () => {
    const products = await getAllProducts();
    const mapped = products.map((p: any) => ({
      id: p.id,
      label: p.name,
      subLabel: '',
      price: p.salePrice,
      cost: p.costPrice,
      uom: p.uom,
      hasSecondaryUnit: p.hasSecondaryUnit,
      secondaryUom: p.secondaryUom,
      hasVariants: p.hasVariants || false,
      secondaryUomFactor: p.secondaryUomFactor,
      salesVariantSelection: p.salesVariantSelection || 'grid',
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
  useEffect(() => {
    getProductCategories().then(setProductCategories);
  }, []);
  const formValues = useMemo(() => ({
    customer: initialData?.partnerId || initialData?.customerId || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validityDate: initialData?.validityDate ? new Date(initialData.validityDate).toISOString().split('T')[0] : '',
    paymentTerm: initialData?.paymentTerm || '',
    userId: initialData?.userId || '',
    salesTeam: initialData?.salesTeam || '',
    clientOrderRef: initialData?.clientOrderRef || '',
    fiscalPosition: initialData?.fiscalPosition || '',
    terms: initialData?.terms || '',
    lines: initialData?.lines?.map((l: any) => ({
      ...l,
      qty: l.quantity,
      price: l.priceUnit,
      discount: l.discount1,
      appliedPriceListName: l.appliedPriceListName || '',
      lineType: l.lineType || 'line',
      unitSelection: l.unitName === l.secondaryUnit && l.secondaryUnit ? 'secondary' : 'primary',
      secondaryQty: l.secondaryQuantity || 0,
      uom: l.product?.uom || '',
      secondaryUom: l.product?.secondaryUom || '',
      hasSecondaryUnit: l.product?.hasSecondaryUnit || false,
      secondaryUomFactor: Number(l.product?.secondaryUomFactor || 1)
    })) || [{
      type: 'product',
      productId: '',
      description: '',
      qty: 1,
      price: 0,
      discount: 0,
      tax: null as any,
      secondaryQuantity: 0,
      secondaryUnit: '',
      uom: '',
      hasSecondaryUnit: false,
      secondaryUom: '',
      secondaryUomFactor: 1,
      unitSelection: 'primary',
      lineType: 'line',
      appliedPriceListName: ''
    }],
    options: initialData?.options?.map((o: any) => ({
      ...o,
      qty: o.quantity,
      price: o.priceUnit
    })) || []
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
      isDirty,
      errors
    }
  } = useForm<any>({
    resolver: zodResolver(saleOrderSchema) as any,
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
  const {
    fields,
    append,
    update,
    remove,
    move
  } = useFieldArray({
    control,
    name: "lines"
  });
  const handleCustomerChange = async (val: string, onChange: (...event: any[]) => void) => {
    onChange(val);
    if (!val) return;
    const currentLines = getValues('lines');
    let updated = false;
    if (!currentLines || !Array.isArray(currentLines)) return;
    for (let i = 0; i < currentLines.length; i++) {
      const line = currentLines[i];
      if (line.productId && line.lineType === 'line') {
        const {
          price,
          discount,
          appliedPriceListName
        } = await getProductPrice({
          productId: line.productId,
          partnerId: val,
          priceListId: getValues('priceListId') || null,
          type: 'sale',
          quantity: line.qty || 1,
          date: getValues('date') ? new Date(getValues('date')) : new Date()
        });
        if (price !== line.price || discount !== line.discount) {
          setValue(`lines.${i}.price`, price);
          setValue(`lines.${i}.discount`, discount);
          setValue(`lines.${i}.appliedPriceListName`, appliedPriceListName);
          updated = true;
        }
      }
    }
    if (updated) {
      toast.info("تم تحديث الأسعار طبقاً لقائمة أسعار العميل المحددة.", {
        duration: 5000
      });
    }
    // === فحص تعارض الخصومات (اتفاقية العميل vs قائمة الأسعار) ===
    try {
      const options = await getPartnerPricingOptions(val, 'sale');
      if (options.hasConflict) {
        setPricingOptions(options);
      } else {
        setPricingOptions(null);
      }
    } catch {
      setPricingOptions(null);
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
    const existingLineIndex = fields.findIndex((field: any, i) => i !== index && field.lineType === 'line' && field.productId === productId);
    if (existingLineIndex !== -1 && product) {
      import('@/app/actions/performance').then(m => {
        m.logUserMistake('DUPLICATE_ITEM_SALES', 2, `تكرار الصنف ${product.label} في المبيعات`).then(res => {
          if (res?.isLocked) {
            toast.error(`تم تعليق جلستك لمدة 3 دقائق بناءً على تقييم النظام (نقاطك الحالية ${res.newScore}%). تم تبليغ المدير عبر الواتساب.`, {
              duration: 10000
            });
            setTimeout(() => window.location.href = `/${locale}/locked`, 2000);
          } else if (res?.success) {
            toast.warning(<div className="flex flex-col gap-1"> <span className="font-bold text-yellow-800">توجيه ذكي (Smart Coach) 💡</span> <span className="text-sm">الصنف "{product.label}" تم اختياره مسبقاً! يرجى الانتباه وتجنب التكرار لرفع تقييمك الذي أصبح ({res.newScore}%).</span> {res.managerNotified && <span className="text-xs text-red-600 mt-1">تم إرسال إشعار للمدير بتفاصيل الخطأ.</span>} </div>, {
              duration: 8000,
              action: {
                label: 'حسناً، سأكون أكثر حذراً',
                onClick: () => console.log('User acknowledged warning')
              }
            });
          }
        });
      });
    }
    if (product && product.hasVariants) {
      setActiveVariantLineIndex(index);
      setVariantProductId(productId);
      setVariantModalOpen(true);
      return;
    }
    if (product) {
      setValue(`lines.${index}.description`, product.label);
      setValue(`lines.${index}.uom`, product.uom);
      setValue(`lines.${index}.hasSecondaryUnit`, product.hasSecondaryUnit);
      setValue(`lines.${index}.secondaryUom`, product.secondaryUom);
      setValue(`lines.${index}.secondaryUomFactor`, product.secondaryUomFactor);
      setValue(`lines.${index}.unitSelection`, 'primary');
    }
    const currentPriceBeforeFetch = getValues(`lines.${index}.price`);
    const currentDiscountBeforeFetch = getValues(`lines.${index}.discount`);
    const {
      price,
      discount,
      appliedPriceListName,
      warnings
    } = await getProductPrice({
      productId,
      partnerId: getValues('customer') || null,
      priceListId: getValues('priceListId') || null,
      type: 'sale',
      quantity: lines[index]?.qty || 1,
      date: getValues('date') ? new Date(getValues('date')) : new Date()
    });
    const currentPriceAfterFetch = getValues(`lines.${index}.price`);
    const currentDiscountAfterFetch = getValues(`lines.${index}.discount`);
    if (currentPriceAfterFetch === currentPriceBeforeFetch || !currentPriceAfterFetch) {
      setValue(`lines.${index}.price`, price);
      setValue(`lines.${index}.appliedPriceListName`, appliedPriceListName);
    }
    if (currentDiscountAfterFetch === currentDiscountBeforeFetch || !currentDiscountAfterFetch) {
      setValue(`lines.${index}.discount`, discount);
    }
    if (warnings && warnings.length > 0) {
      warnings.forEach((w: string) => toast.warning(w, {
        duration: 6000
      }));
    }
  };
  const handleVariantConfirm = async (selectedVariants: {
    productId: string;
    quantity: number;
  }[]) => {
    if (selectedVariants.length === 0) return;
    if (activeVariantLineIndex === null) return;
    for (const v of selectedVariants) {
      const productInfo = productsList.find(p => p.id === v.productId);
      const newIndex = getValues('lines')?.length || 0;
      const {
        price,
        discount,
        appliedPriceListName
      } = await getProductPrice({
        productId: v.productId,
        partnerId: getValues('customer') || null,
        priceListId: getValues('priceListId') || null,
        type: 'sale',
        quantity: v.quantity,
        date: getValues('date') ? new Date(getValues('date')) : new Date()
      });
      append({
        productId: v.productId,
        description: productInfo?.label || '',
        qty: v.quantity,
        price: price || 0,
        discount: discount || 0,
        tax: 0,
        uom: productInfo?.uom || 'Units',
        unitSelection: 'primary',
        type: 'product',
        lineType: 'line',
        hasSecondaryUnit: productInfo?.hasSecondaryUnit || false,
        secondaryUom: productInfo?.secondaryUom || '',
        secondaryUomFactor: productInfo?.secondaryUomFactor || 1,
        secondaryQty: 0,
        appliedPriceListName: appliedPriceListName || ''
      });
    }
    toast.success(`تم إضافة ${selectedVariants.length} متغيرات بنجاح`);
  };
  const handleProductBrowserConfirm = async (selections: {
    productId: string;
    quantity: number;
    secondaryQuantity: number;
  }[]) => {
    if (selections.length === 0) return;
    if (productBrowserLineIndex !== null) {
      const currentLine = watch(`lines.${productBrowserLineIndex}`);
      if (currentLine && !currentLine.productId) {
        remove(productBrowserLineIndex);
      }
    }
    for (const sel of selections) {
      const productInfo = productsList.find((p: any) => p.id === sel.productId);
      const existingIdx = fields.findIndex((f: any) => f.lineType === 'line' && f.productId === sel.productId);
      if (existingIdx !== -1) {
        const currentQty = Number(getValues(`lines.${existingIdx}.qty`)) || 0;
        setValue(`lines.${existingIdx}.qty`, currentQty + sel.quantity);
        if (sel.secondaryQuantity > 0) {
          const currentSecQty = Number(getValues(`lines.${existingIdx}.secondaryQuantity`)) || 0;
          setValue(`lines.${existingIdx}.secondaryQuantity`, currentSecQty + sel.secondaryQuantity);
        }
        continue;
      }
      const {
        price,
        discount,
        appliedPriceListName
      } = await getProductPrice({
        productId: sel.productId,
        partnerId: getValues('customer') || null,
        priceListId: getValues('priceListId') || null,
        type: 'sale',
        quantity: sel.quantity,
        date: getValues('date') ? new Date(getValues('date')) : new Date()
      });
      append({
        productId: sel.productId,
        description: productInfo?.label || '',
        qty: sel.quantity,
        price: price || 0,
        discount: discount || 0,
        tax: 0,
        uom: productInfo?.uom || 'قطعه',
        unitSelection: 'primary',
        type: 'product',
        lineType: 'line',
        hasSecondaryUnit: productInfo?.hasSecondaryUnit || false,
        secondaryUom: productInfo?.secondaryUom || '',
        secondaryUomFactor: productInfo?.secondaryUomFactor || 1,
        secondaryQuantity: sel.secondaryQuantity || 0,
        appliedPriceListName: appliedPriceListName || ''
      });
    }
    toast.success(`تم إضافة ${selections.length} صنف بنجاح`);
    setProductBrowserLineIndex(null);
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
            partnerId: getValues('customer') || null,
            priceListId: getValues('priceListId') || null,
            type: 'sale',
            quantity: line.qty || 1,
            date: getValues('date') ? new Date(getValues('date')) : new Date()
          });
          setValue(`lines.${index}.price`, price);
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
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption
  } = useFieldArray({
    control,
    name: "options"
  });
  const setToDraft = async () => {
    setIsSaving(true);
    try {
      await setToDraftSaleOrder(initialData.id);
      toast.success('تم إعادة التعيين كمسودة');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'خطأ أثناء إعادة التعيين');
    } finally {
      setIsSaving(false);
    }
  };
  const restoreInventory = async () => {
    setIsSaving(true);
    try {
      await restoreSaleOrderAndInventory(initialData.id);
      toast.success('تم استعادة المخزون وإلغاء الطلب');
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'خطأ أثناء الاستعادة');
    } finally {
      setIsSaving(false);
    }
  };
  const amountBeforeDiscount = lines.reduce((acc: number, line: any) => {
    return acc + (line.qty || 0) * (line.price || 0);
  }, 0);
  const totalDiscount = lines.reduce((acc: number, line: any) => {
    const basePrice = (line.qty || 0) * (line.price || 0);
    return acc + basePrice * ((line.discount || 0) / 100);
  }, 0);
  const untaxedAmount = lines.reduce((acc: number, line: any) => {
    const lineVal = (line.qty || 0) * (line.price || 0) * (1 - (line.discount || 0) / 100) * (1 - (line.discount2 || 0) / 100);
    return acc + lineVal;
  }, 0);
  const taxes = lines.reduce((acc: number, line: any) => {
    const lineVal = (line.qty || 0) * (line.price || 0) * (1 - (line.discount || 0) / 100);
    const taxRate = (line.tax || 0) / 100;
    return acc + lineVal * taxRate;
  }, 0);
  const total = untaxedAmount + taxes;
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const getCustomerPhone = () => {
    const customerId = watch('customer');
    const customer = customers.find(c => c.id === customerId);
    return customer?.mobile || '';
  };
  // Helper: Build PDF data from form state (for sales)
  const buildSalePdfData = () => {
    const formData = getValues();
    const customerId = formData.customer;
    const customer = customers.find((c: any) => c.id === customerId);
    const lines = (formData.lines || []).map((l: any) => {
      const product = productsList.find((p: any) => p.id === l.productId);
      return {
        productName: product?.label || l.description || '—',
        quantity: Number(l.qty) || 0,
        unitName: l.uom || 'pc',
        priceUnit: Number(l.price) || 0,
        discount1: Number(l.discount) || 0,
        priceSubtotal: Number(l.subtotal) || 0,
        secondaryQuantity: Number(l.secondaryQuantity) || 0,
        secondaryUnit: l.secondaryUom || '',
      };
    });
    return {
      name: orderName || initialData?.name || 'SO',
      dateOrder: formData.date || initialData?.dateOrder,
      partnerName: customer?.label || initialData?.partner?.name || '—',
      companyName: initialData?.company?.name || '',
      lines,
      amountUntaxed: Number(initialData?.amountUntaxed || lines.reduce((s: number, l: any) => s + l.priceSubtotal, 0)),
      amountTax: Number(initialData?.amountTax || 0),
      amountTotal: Number(initialData?.amountTotal || lines.reduce((s: number, l: any) => s + l.priceSubtotal, 0)),
    };
  };

  const downloadSalePdf = async () => {
    const loadingToast = toast.loading("جاري تحميل الملف...");
    try {
      const { generateSaleOrderPdf } = await import('@/lib/pdfGenerator');
      const pdfData = buildSalePdfData();
      const pdfBlob = generateSaleOrderPdf(pdfData);
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${orderName || initialData?.name || 'عرض_سعر'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل الملف بنجاح', { id: loadingToast });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      toast.error('فشل في تجهيز ملف الطباعة: ' + (err?.message || String(err)), { id: loadingToast });
    }
  };

  const openWhatsApp = async () => {
    const phone = getCustomerPhone().replace(/[^0-9+]/g, '');
    if (!phone) {
      toast.warning('لا يوجد رقم هاتف مسجل لهذا العميل');
      return;
    }
    setWhatsappLoading(true);
    try {
      const { generateSaleOrderPdf } = await import('@/lib/pdfGenerator');
      const { shareViaWhatsApp } = await import('@/lib/whatsappShare');
      const pdfData = buildSalePdfData();
      const pdfBlob = generateSaleOrderPdf(pdfData);
      const pdfFileName = orderName || initialData?.name || 'عرض_سعر';
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
  const setStoreUnsaved = useStatusStore(state => state.setHasUnsavedChanges);
  const setStoreIsSaving = useStatusStore(state => state.setIsSaving);
  const setTriggers = useStatusStore(state => state.setTriggers);
  const clearTriggers = useStatusStore(state => state.clearTriggers);
  const hasUnsavedChanges = useStatusStore(state => state.hasUnsavedChanges);
  const isFormLocallyDirty = isDirty || hasUnsavedChanges;
  const isEmptyDraft = !initialData?.partnerId && !initialData?.customerId && (!initialData?.lines || initialData.lines.length === 0);
  const isDirtyImmediateRef = useRef(false);
  const showNotifyButton = !isNewRecord && !isEmptyDraft && !isFormLocallyDirty && !isDirtyImmediateRef.current;
  const setHasUnsavedChangesSync = useCallback((dirty: boolean) => {
    isDirtyImmediateRef.current = dirty;
  }, []);
  const backgroundSave = useCallback(async () => {
    if (!isFormLocallyDirty && !isDirtyImmediateRef.current) return true;
    try {
      const data = getValues();
      const currentId = draftId || initialData?.id;
      if (currentId) {
        const res = await updateSaleOrder(currentId, {
          ...data,
          partnerId: data.customer || null
        });
        if ((res as any)?.error) return false;
        return true;
      } else {
        const newOrder = await createSaleOrder({
          ...data,
          partnerId: data.customer || null
        });
        if (newOrder && (newOrder as any).id) {
          setDraftId((newOrder as any).id);
          if ((newOrder as any).name) setOrderName((newOrder as any).name);
          window.history.replaceState(null, '', `/${locale}/sales/${(newOrder as any).id}`);
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
    fetch('/api/sales/save-saleorder', {
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
  } = useAutoSaveOnLeave(isDirtyImmediateRef, async () => {
    await backgroundSave();
  }, async () => {
    await keepaliveSave();
  });
  const pendingActionRef = useRef<string | null>(null);
  const processSave = async (data: any) => {
    setIsSaving(true);
    setStoreIsSaving(true);
    setPageError(null);
    let loadingToastId: string | number | undefined;
    try {
      const currentId = draftId || initialData?.id;
      if (currentId) {
        const result = await updateSaleOrder(currentId, {
          ...data,
          partnerId: data.customer
        });
        if ((result as any)?.error) {
          const msg = parsePrismaError((result as any).error);
          toast.error(msg);
          setPageError(msg);
        } else {
          setStoreUnsaved(false);
          setHasUnsavedChangesSync(false);
          if (typeof reset === "function" && typeof getValues === "function") reset(getValues());
          if (pendingActionRef.current === 'confirm') {
            loadingToastId = toast.loading("جاري التأكيد...");
            await confirmSaleOrder(currentId);
            toast.success('تم تأكيد الطلب بنجاح ✅', {
              id: loadingToastId
            });
            setStatus('sale');
          } else {
            toast.success("تم التعديل بنجاح");
          }
          pendingActionRef.current = null;
          router.push(`/${locale}/sales/${currentId}`);
          return;
        }
      } else {
        const newOrder = await createSaleOrder({
          ...data,
          partnerId: data.customer
        });
        if (newOrder && (newOrder as any).id) {
          setStoreUnsaved(false);
          setHasUnsavedChangesSync(false);
          if ((newOrder as any).name) setOrderName((newOrder as any).name);
          if (typeof reset === "function" && typeof getValues === "function") reset(getValues());
          if (pendingActionRef.current === 'confirm') {
            loadingToastId = toast.loading("جاري التأكيد...");
            const confirmRes = await confirmSaleOrder((newOrder as any).id);
            if ((confirmRes as any)?.error) {
              toast.error((confirmRes as any).error, {
                id: loadingToastId
              });
            } else {
              toast.success('تم تأكيد الطلب بنجاح ✅', {
                id: loadingToastId
              });
            }
          } else {
            toast.success("تم الحفظ بنجاح");
          }
          pendingActionRef.current = null;
          router.replace(`/${locale}/sales/${(newOrder as any).id}`);
        } else if ((newOrder as any)?.error) {
          const msg = parsePrismaError((newOrder as any).error);
          toast.error(msg);
          setPageError(msg);
        }
      }
    } catch (e: any) {
      if (loadingToastId) toast.dismiss(loadingToastId);
      console.error(e);
      const rawMessage = e?.message || e?.error || String(e);
      if (rawMessage.includes('NEGATIVE_STOCK:')) {
        try {
          const jsonStr = rawMessage.split('NEGATIVE_STOCK:')[1].trim();
          const items = JSON.parse(jsonStr);
          setOutOfStockItems(items);
          setNegativeStockModalOpen(true);
          toast.error('لم يتم التأكيد: رصيد غير كافٍ');
          return;
        } catch (parseError) {
          console.error("Failed to parse negative stock items", parseError);
        }
      }
      if (rawMessage.includes('PREVIOUSLY_REJECTED:')) {
        try {
          const jsonStr = rawMessage.split('PREVIOUSLY_REJECTED:')[1].trim();
          const data = JSON.parse(jsonStr);
          toast.error(`المدير رفض هذا الأمر من قبل بتاريخ ${data.date} والسبب: ${data.reason}`, { duration: 10000 });
          return;
        } catch (parseError) {
          console.error("Failed to parse rejected reason", parseError);
        }
      }
      const msg = parsePrismaError(e) || "حدث خطأ أثناء حفظ الطلب";
      toast.error(msg);
      setPageError(msg);
    } finally {
      pendingActionRef.current = null;
      setIsSaving(false);
      setStoreIsSaving(false);
    }
  };
  const onSubmit = async (data: any) => {
    await processSave(data);
  };
  const safeNavigate = async (url: string) => {
    if (isDirtyImmediateRef.current || isFormLocallyDirty) {
      const tId = toast.loading("جاري حفظ التعديلات قبل الانتقال...");
      const saved = await backgroundSave();
      if (!saved) {
        toast.dismiss(tId);
        toast.error("فشل الحفظ قبل الانتقال.");
        return;
      }
      setClean();
      setStoreUnsaved(false);
      setHasUnsavedChangesSync(false);
      if (typeof reset === "function" && typeof getValues === "function") reset(getValues());
      toast.dismiss(tId);
    }
    router.push(url);
  };
  useEffect(() => {
    setStoreUnsaved(isDirty);
    setTriggers(async () => {
      await handleSubmit(onSubmit)();
    }, () => {
      setDiscarded();
      reset(initialData || {});
      setStoreUnsaved(false);
      setHasUnsavedChangesSync(false);
      if (typeof reset === "function" && typeof getValues === "function") reset(getValues());
      setClean();
    });
    return () => clearTriggers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountingRef = useRef(false);
  const hasUserInteractedRef = useRef(false);
  useEffect(() => {
    return () => {
      isUnmountingRef.current = true;
    };
  }, []);
  useEffect(() => {
    const subscription = watch((value, {
      name,
      type
    }) => {
      if (name || type === 'change') {
        hasUserInteractedRef.current = true;
        setStoreUnsaved(true);
        setHasUnsavedChangesSync(true);
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => {
          backgroundSave().then(() => {
            setStoreUnsaved(false);
            setHasUnsavedChangesSync(false);
            if (typeof reset === "function" && typeof getValues === "function") reset(getValues());
          });
        }, 3000);
      }
    });
    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
        if (isUnmountingRef.current && hasUserInteractedRef.current && isDirtyImmediateRef.current) {
          keepaliveSave();
        }
      }
    };
  }, [watch, setStoreUnsaved, backgroundSave, keepaliveSave, setHasUnsavedChangesSync]);
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
            }} disabled={isQtyLocked} placeholder="بحث عن منتج..." /> </div>} /> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="hidden" {...register(`lines.${index}.type`)} /> </div> </div>;
    }
  }, {
    id: 'description',
    label: 'الوصف',
    minWidth: '300px',
    renderCell: (field: any, index: number, register: any) => <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register(`lines.${index}.description`)} disabled={isQtyLocked} readOnly={true} className="w-full h-full p-2 min-w-0 text-xs text-slate-700 bg-transparent outline-none m-0 pointer-events-none" tabIndex={-1} />
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
      const isOutOfStock = stockQty < requestedQty;
      const iconColor = 'text-slate-500 hover:bg-slate-100 hover:text-slate-700';
      return <StockAvailabilityIcon product={product} stockQty={stockQty} requestedQty={requestedQty} isOutOfStock={isOutOfStock} initialData={initialData} locale={locale} iconColor={iconColor} />;
    }
  }, {
    id: 'qty',
    label: 'الكمية',
    required: true,
    width: '100px',
    renderCell: (field: any, index: number, register: any, control: any) => <> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="hidden" {...register(`lines.${index}.id`)} /> <Controller name={`lines.${index}.qty`} control={control} render={({
        field
      }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-qty`} type="text" inputMode="decimal" disabled={isQtyLocked} value={field.value ?? ''} onChange={e => {
        setHasUnsavedChangesSync(true);
        const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
        field.onChange(val === '' ? null : val);
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
    minWidth: '110px',
    hide: !showSecondaryUnits,
    renderCell: (field: any, index: number, register: any, control: any) => {
      const line = lines[index] || {};
      if (!line.hasSecondaryUnit) return <div className="text-xs text-center text-slate-400 py-2">-</div>;
      return <Controller name={`lines.${index}.secondaryQty`} control={control} render={({
        field
      }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" inputMode="decimal" disabled={isQtyLocked} value={field.value ?? ''} onChange={e => {
        setHasUnsavedChangesSync(true);
        const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
        field.onChange(val === '' ? null : val);
        const secondaryVal = val ? parseFloat(val) : 0;
        const freshLine = getValues(`lines.${index}`);
        const factor = Number(freshLine?.secondaryUomFactor) || 0;
        if (factor > 0) {
          setValue(`lines.${index}.qty`, parseFloat((secondaryVal * factor).toFixed(3)), {
            shouldValidate: true,
            shouldDirty: true
          });
        }
      }} className="w-full p-1 bg-transparent focus:border-indigo-500 outline-none text-sm text-center font-numbers text-slate-800 font-bold" onFocus={e => e.target.select()} />} />;
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
      const currentKey = `${line.secondaryUom}|${currentFactor}`;
      if (!uomMap.has(currentKey)) uomMap.set(currentKey, { name: line.secondaryUom, factor: currentFactor });
      const uomOptions = Array.from(uomMap.values());
      return <EditableUomCellSale
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
          setHasUnsavedChangesSync(true);
        }}
      />;
    }
  }, {
    id: 'price',
    label: 'سعر البيع',
    required: true,
    width: '120px',
    renderCell: (field: any, index: number, register: any, control: any) => <Controller name={`lines.${index}.price`} control={control} render={({
      field
    }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-price`} type="text" inputMode="decimal" disabled={isQtyLocked} value={field.value ?? ''} onChange={e => {
      setHasUnsavedChangesSync(true);
      const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
      field.onChange(val === '' ? null : val);
    }} onFocus={e => e.target.select()} onKeyDown={e => handleKeyDown(e, index, 'price')} className="w-full h-full p-2 min-w-0 bg-transparent outline-none text-sm text-center font-numbers text-blue-600 font-medium m-0" />} />
  }, {
    id: 'discount',
    label: 'خصم %',
    width: '100px',
    renderCell: (field: any, index: number, register: any, control: any) => <div className="relative w-full h-full flex flex-col justify-center"> <Controller name={`lines.${index}.discount`} control={control} render={({
        field
      }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-discount`} type="text" inputMode="decimal" disabled={isQtyLocked} value={field.value ?? ''} onChange={e => {
        setHasUnsavedChangesSync(true);
        const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
        field.onChange(val === '' ? null : val);
      }} onFocus={e => e.target.select()} onKeyDown={e => handleKeyDown(e, index, 'discount')} className="w-full p-2 bg-transparent outline-none text-sm text-center text-slate-600 font-medium font-numbers m-0" />} /> </div>
  }, {
    id: 'discount2',
    label: 'خصم2 %',
    width: '100px',
    defaultVisible: false,
    renderCell: (field: any, index: number, register: any, control: any) => <div className="relative w-full h-full flex flex-col justify-center"> <Controller name={`lines.${index}.discount2`} control={control} render={({
        field
      }) => <input autoComplete="off" autoCorrect="off" spellCheck={false} id={`line-${index}-discount2`} type="text" inputMode="decimal" disabled={isQtyLocked} value={field.value ?? ''} onChange={e => {
        setHasUnsavedChangesSync(true);
        const val = convertArabicToEnglishNumbers(e.target.value).replace(/[^0-9.]/g, '');
        field.onChange(val === '' ? null : val);
      }} onFocus={e => e.target.select()} className="w-full p-2 bg-transparent outline-none text-sm text-center text-slate-600 font-medium font-numbers m-0" />} /> </div>
  }, {
    id: 'tax',
    label: 'الضرائب',
    width: '100px',
    defaultVisible: false,
    renderCell: (field: any, index: number, register: any, control: any) => {
      const line = lines[index] || {};
      return <div className="relative w-full h-full flex flex-col justify-center"> <Controller name={`lines.${index}.tax`} control={control} render={({
          field: {
            onChange,
            value
          }
        }) => <OdooCombobox options={dbTaxes.map(t => ({
          value: t.amount,
          label: `${t.amount}%`,
          data: t
        }))} value={value} onChange={(val: any) => {
          onChange(val);
        }} disabled={isQtyLocked} placeholder="بدون ضريبة" className="w-full h-full border-none focus:ring-0 text-xs text-center font-numbers text-slate-600 bg-transparent" />} /> </div>;
    }
  }, {
    id: 'subtotalBeforeDiscount',
    label: 'الإجمالي قبل الخصم',
    width: '120px',
    renderCell: (field: any, index: number) => {
      const line = lines[index] || {};
      const price = line.price || 0;
      const qty = line.qty || 0;
      const total = price * qty;
      return <div className="text-center text-sm font-numbers text-slate-700 py-2">{total.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</div>;
    }
  }, {
    id: 'subtotalAfterDiscount',
    label: 'الإجمالي بعد الخصم',
    width: '120px',
    renderCell: (field: any, index: number) => {
      const line = lines[index] || {};
      const price = line.price || 0;
      const qty = line.qty || 0;
      const discount = line.discount || 0;
      const discount2 = line.discount2 || 0;
      const total = price * qty * (1 - discount / 100) * (1 - discount2 / 100);
      return <div className="text-center text-sm font-numbers font-bold text-slate-800 py-2">{total.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}</div>;
    }
  }, {
    id: 'pricelist',
    label: 'قائمة الأسعار',
    width: '100px',
    renderCell: (field: any, index: number) => {
      const line = lines[index] || {};
      const listName = line.appliedPriceListName || '-';
      return <div className="w-full h-full flex flex-col justify-center items-center py-2"> <span title={listName} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[80px]"> {listName} </span> </div>;
    }
  }, {
    id: 'cost',
    label: 'التكلفة',
    width: '100px',
    hide: !showMargins,
    renderCell: (field: any, index: number) => <div className="text-xs text-slate-500 font-mono text-center pt-2"> {(field.cost || 0).toLocaleString()} </div>
  }, {
    id: 'margin',
    label: 'الربح',
    width: '100px',
    hide: !showMargins,
    renderCell: (field: any, index: number) => {
      const line = lines[index] || {};
      const price = line.price || 0;
      const qty = line.qty || 0;
      const cost = field.cost || 0;
      const margin = (price - cost) * qty;
      return <div className="text-xs text-green-600 font-bold text-center pt-2">{margin.toLocaleString()}</div>;
    }
  }, {
    id: 'margin_pct',
    label: '%',
    width: '60px',
    hide: !showMargins,
    renderCell: (field: any, index: number) => {
      const line = lines[index] || {};
      const price = line.price || 0;
      const cost = field.cost || 0;
      if (!price) return null;
      const pct = (price - cost) / price * 100;
      return <div className="text-xs text-green-600 font-bold text-center pt-2">{pct.toFixed(1)}%</div>;
    }
  }];
  const onError = (errors: any) => {
    const errorMessages = [];
    if (errors.customer) errorMessages.push("- " + errors.customer.message);
    if (errors.date) errorMessages.push("- " + errors.date.message);
    if (errors.lines) {
      if (errors.lines.message) errorMessages.push("- " + errors.lines.message);else errorMessages.push("- يوجد خطأ في التقييم أو المنتجات (تأكد من إدخال منتج/وصف، وأن الكمية > 0 والسعر غير سالب)");
    }
    setPageError("يرجى تصحيح الأخطاء التالية:\n" + errorMessages.join('\n'));
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
  const onInvalid = (errors: any) => {
    console.log("Validation errors:", errors);
    toast.error('تعذر الحفظ: يرجى إكمال جميع الحقول المطلوبة');
  };
  const confirmOrder = async () => {
    // Guard: prevent duplicate confirms
    if (isSaving || pendingActionRef.current === 'confirm') return;
    if (status === 'sale' || status === 'done') {
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
      const result = await cancelSaleOrder(initialData.id);
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
  const createInvoice = async () => {
    if (!initialData?.id) return;
    setIsSaving(true);
    setStoreIsSaving(true);
    try {
      const result = await createInvoiceFromOrder(initialData.id);
      if ((result as any)?.error) {
        toast.error((result as any).error);
      } else {
        toast.success('تم إنشاء الفاتورة بنجاح 📄');
        getSaleOrderSmartData(initialData.id).then(setSmartData);
        router.refresh();
      }
    } catch (e: any) {
      toast.error(e.message || 'خطأ في إنشاء الفاتورة');
    } finally {
      setIsSaving(false);
      setStoreIsSaving(false);
    }
  };
  const handleImportSearch = async () => {
    if (!importRef.trim()) return;
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const result = await fetchPurchaseInvoiceForSales(importRef.trim(), 'full');
      if (result.error) {
        setImportError(result.error);
      } else {
        setImportResult(result);
      }
    } catch (e: any) {
      setImportError(e.message || 'حدث خطأ غير متوقع');
    } finally {
      setImportLoading(false);
    }
  };
  const handleImportConfirm = () => {
    if (!importResult?.lines) return;
    for (const line of importResult.lines) {
      const product = productsList.find(p => p.id === line.productId);
      append({
        type: 'product',
        productId: line.productId,
        description: line.description || product?.label || '',
        qty: line.qty || 1,
        price: useCostPrice ? (product?.costPrice || 0) : (line.price || 0),
        discount: 0,
        tax: line.tax || null as any,
        uom: line.uom || product?.uom || 'قطعه',
        unitSelection: 'primary',
        hasSecondaryUnit: product?.hasSecondaryUnit || false,
        secondaryUomFactor: product?.secondaryUomFactor || 1,
        secondaryQuantity: line.secondaryQty || 0,
        secondaryUnit: line.secondaryUnit || product?.secondaryUom || '',
        appliedPriceListName: '',
        lineType: 'line'
      });
    }
    toast.success(`تم استدعاء ${importResult.lines.length} صنف من الفاتورة ${importResult.invoice?.name || importRef}`);
    setImportModalOpen(false);
    setImportRef('');
    setImportResult(null);
    setImportError(null);
    setUseCostPrice(false);
  };
  const buildContextActions = () => {
    const actions: any[] = [];
    if (!isNewRecord && (status === 'draft' || status === 'sent')) {
      actions.push({
        label: 'تأكيد',
        onClick: confirmOrder,
        style: 'primary',
        disabled: isSaving
      });
      actions.push({
        label: 'التحقق من التوفر',
        onClick: () => {
          router.push(`/${locale}/sales/${initialData.id}/availability`);
        },
        style: 'secondary',
        disabled: isSaving
      });
      if (initialData?.reservationState === 'none' || initialData?.reservationState === 'expired') {
        actions.push({
          label: 'حجز بضاعة',
          onClick: () => {
            setReservationModalOpen(true);
          },
          style: 'secondary',
          disabled: isSaving
        });
      }
      if (initialData?.reservationState === 'pending_approval') {
        actions.push({
          label: 'بإنتظار موافقة الإدارة للحجز',
          onClick: () => {},
          style: 'secondary',
          disabled: true
        });
        if (userRole === 'ADMIN' || userRole === 'MANAGER') {
          actions.push({
            label: 'موافقة على الحجز',
            onClick: async () => {
              setIsReserving(true);
              try {
                await approveReservation(initialData.id);
                toast.success('تم الحجز بنجاح!');
                router.refresh();
              } catch (e: any) {
                toast.error(e.message || 'خطأ في الموافقة');
              } finally {
                setIsReserving(false);
              }
            },
            style: 'primary',
            disabled: isReserving || isSaving
          });
        }
      }
      if (initialData?.reservationState === 'reserved') {
        actions.push({
          label: 'محجوزة حتى ' + new Date(initialData?.reservationExpiresAt).toLocaleString('ar-EG'),
          onClick: () => {},
          style: 'secondary',
          disabled: true
        });
      }
      actions.push({
        label: 'استدعاء فاتورة مشتريات',
        onClick: () => {
          setImportModalOpen(true);
          setImportRef('');
          setImportResult(null);
          setImportError(null);
        },
        style: 'secondary',
        disabled: isSaving
      });
    }

    if (!isNewRecord && status === 'sale') {
      actions.push({
        label: 'إنشاء فاتورة',
        onClick: createInvoice,
        style: 'primary',
        disabled: isSaving
      });
    }

    if (!isNewRecord && status !== 'cancel' && status !== 'done') {
      actions.push({
        label: 'إلغاء',
        onClick: cancelOrder,
        style: 'secondary',
        disabled: isSaving
      });
    }

    if (!isNewRecord && status === 'cancel') {
      const hasDeliveries = lines.some((l: any) => Number(l.qtyDelivered || 0) > 0);
      if (!hasDeliveries && smartData.invoiceCount === 0) {
        actions.push({
          label: 'إعادة تحديث المخزون',
          onClick: async () => {
            try {
              await restoreSaleOrderAndInventory(initialData.id);
              toast.success('تمت إعادة الطلب للعمل بنجاح، يمكنك الآن تعديل الجرد');
              const target = smartData.firstDeliveryId ? `/${locale}/inventory/operations/deliveries/${smartData.firstDeliveryId}` : `/${locale}/inventory/operations/deliveries?search=${initialData?.name}`;
              router.push(target);
            } catch (e: any) {
              toast.error(e.message || "فشل في تحديث المخزون");
            }
          },
          style: 'secondary',
          disabled: isSaving
        });
      } else {
        actions.push({
          label: 'إعادة التعيين كمسودة',
          onClick: setToDraft,
          style: 'secondary',
          disabled: isSaving
        });
      }
    }
    return actions;
  };
const smartButtonsElement = !isNewRecord && status !== 'draft' && status !== 'sent' ? <> <OdooSmartButton icon={<Truck className="w-5 h-5" />} count={smartData.deliveryCount} label="التسليم" onClick={async () => {
    let deliveryId = smartData.firstDeliveryId;
    if (!deliveryId && initialData?.id) {
      try {
        const {
          getSaleOrderSmartData
        } = await import('@/app/actions/smartData');
        const freshData = await getSaleOrderSmartData(initialData.id);
        deliveryId = freshData.firstDeliveryId;
      } catch (e) {}
    }
    if (deliveryId) {
      router.push(`/${locale}/inventory/operations/deliveries/${deliveryId}`);
    } else {
      router.push(`/${locale}/inventory/operations/deliveries?search=${initialData?.name}`);
    }
  }} /> {smartData.invoiceCount > 0 && <OdooSmartButton icon={<FileText className="w-5 h-5" />} count={smartData.invoiceCount} label="الفواتير" href={smartData.invoiceCount === 1 && smartData.firstInvoiceId ? `/${locale}/accounting/invoices/${smartData.firstInvoiceId}` : `/${locale}/accounting/invoices?search=${initialData?.name}`} />} {smartData.paidCount > 0 && <OdooSmartButton icon={<CreditCard className="w-5 h-5" />} count={smartData.paidCount} label="المدفوعات" href={`/${locale}/accounting/payments?search=${initialData?.name}`} />} </> : undefined;
  return (
    <>
      <OdooFormShell statusSteps={STATUS_STEPS} currentStatus={status} contextActions={buildContextActions()} smartButtons={smartButtonsElement} titleLabel={status === 'draft' || status === 'sent' ? 'عرض سعر' : 'أمر بيع'} titleValue={orderName} extraHeaderElements={showNotifyButton && <NotifyButton resourceModel="SaleOrder" resourceId={draftId || initialData?.id} resourceName={orderName} />} chatterId={draftId || initialData?.id} chatterModel="saleOrder" error={pageError} isLoading={isSaving} createdBy={initialData?.createdBy?.name} createdAt={initialData?.createdAt} updatedBy={initialData?.updatedBy?.name} updatedAt={initialData?.updatedAt}>
        {/* Top Portal for breadcrumb & action menu */}
        <TopPortal>
          <div className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse" dir="rtl">
            {(isFormLocallyDirty || isDirtyImmediateRef.current) && (
              <>
                <button onClick={() => handleSubmit(onSubmit)()} disabled={isSaving} className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-sm font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2 h-8">
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
            <button type="button" onClick={() => router.push(`/${locale}/sales/new`)} title="إنشاء أمر بيع جديد" className="bg-white border border-[#017E84] text-[#017E84] px-3 py-1.5 rounded-sm text-sm font-bold hover:bg-[#017E84] hover:text-white transition-colors h-8 flex items-center justify-center min-w-[60px]">
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
            <ActionMenu onPrint={downloadSalePdf} onDuplicate={() => toast.info('جاري الدعم للتكرار')} onDelete={() => toast.error('الحذف غير مصرح به لهذه الوثيقة')} />
          </div>
        </TopPortal>

        {/* Form Body */}
        <div className="pt-4 sm:pt-6">
          {/* Negative Stock Approval Request Banner */}
          {initialData?.approvalStatus === 'pending_approval' && (
            <div className="mb-6 rounded-md bg-yellow-50 p-4 border border-yellow-200 shadow-sm animate-in fade-in slide-in-">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div className="flex">
                  <AlertCircle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                  <div className="ml-3 mr-3">
                    <h3 className="text-base font-bold text-yellow-800">طلب موافقة للإدارة: صرف رصيد بالسالب</h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      <p>هذا الطلب يحتوي على أصناف رصيدها غير كافٍ. هل توافق على إنشاء إذن الصرف بالسالب؟</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={isApprovingNegativeStock} onClick={async () => {
                    setIsApprovingNegativeStock(true);
                    const tid = toast.loading("جاري الموافقة...");
                    try {
                      await approveNegativeStock(initialData.id);
                      toast.success("تمت الموافقة بنجاح. يمكن للمستخدم الآن تأكيد الطلب.", {
                        id: tid
                      });
                      router.refresh();
                    } catch (e: any) {
                      toast.error(e.message || "فشل الموافقة", {
                        id: tid
                      });
                    } finally {
                      setIsApprovingNegativeStock(false);
                    }
                  }} className="px-4 py-2 bg-yellow-600 text-white font-bold rounded shadow-sm hover:bg-yellow-700 disabled:opacity-50 transition-colors">
                    {isApprovingNegativeStock ? 'جاري الموافقة...' : 'موافقة على الصرف بالسالب'}
                  </button>
                  <button type="button" disabled={isApprovingNegativeStock} onClick={async () => {
                    setIsApprovingNegativeStock(true);
                    const tid = toast.loading("جاري الرفض...");
                    try {
                      await rejectNegativeStock(initialData.id);
                      toast.success("تم رفض الطلب بنجاح.", {
                        id: tid
                      });
                      router.refresh();
                    } catch (e: any) {
                      toast.error(e.message || "فشل الرفض", {
                        id: tid
                      });
                    } finally {
                      setIsApprovingNegativeStock(false);
                    }
                  }} className="px-4 py-2 bg-white text-slate-700 border border-slate-300 font-bold rounded shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">
                    رفض
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Warning Banner for Zeroed Inventory with Invoices */}
          {smartData.invoiceCount > 0 && (initialData?.lines?.length || 0) > 0 && initialData?.lines?.every((l: any) => parseFloat(l.qtyDelivered || 0) === 0) && (
            <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex justify-between items-center">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  <div className="ml-3 mr-3">
                    <h3 className="text-sm font-bold text-red-800">تنبيه نظام التزامن (المخزون مصفر)</h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>تم تصفير تسليمات المخزون بالكامل، لكن توجد فواتير مرتبطة بهذا الطلب. يرجى إلغاء أو حذف الفواتير المسودة المتوقفة لعدم وجود كميات يتم فوترتها.</p>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => {
                  if (smartData.firstDeliveryId) {
                    router.push(`/${locale}/inventory/operations/deliveries/${smartData.firstDeliveryId}`);
                  } else {
                    router.push(`/${locale}/inventory/operations/deliveries?search=${initialData?.name}`);
                  }
                }} className="bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold py-2 px-4 rounded transition-colors">
                  معاينة المخزون
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-4 mb-10 border-b border-slate-100 pb-10 px-4 sm:px-6">
            <div className="space-y-4">
              {/* Customer Row */}
              <div className="grid grid-cols-[140px_1fr] items-start group">
                <label className="text-sm font-bold text-slate-800 pt-2">{t('customer') || 'العميل'}</label>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      {isQuotationStage ? (
                        /* --- حالة عرض السعر (مسودة/مرسل): تعديل مباشر + سهم للانتقال --- */
                        <Controller name="customer" control={control} render={({
                          field: {
                            onChange,
                            value
                          }
                        }) => (
                          <div className="relative w-full flex items-center gap-1">
                            <div className="flex-1">
                              <OdooAutocomplete options={customers} value={value} onChange={val => handleCustomerChange(val as string, onChange)} onCreateEdit={query => {
                                const currentPath = `/${locale}/sales${initialData?.id ? `/${initialData.id}` : '/new'}`;
                                router.push(`/${locale}/contacts/create?name=${encodeURIComponent(query)}&isCustomer=true&returnUrl=${encodeURIComponent(currentPath)}`);
                              }} onLinkClick={canViewCustomerDetails ? ((e, id) => safeNavigate(`/${locale}/contacts/${id}`)) : undefined} showWhatsApp={true} error={!!errors.customer} placeholder="ابدأ الكتابة للبحث أو الإنشاء..." />
                            </div>
                            {value && canViewCustomerDetails && (
                              <button
                                type="button"
                                onClick={() => safeNavigate(`/${locale}/contacts/${value}`)}
                                className="flex items-center justify-center w-7 h-7 rounded hover:bg-slate-100 text-[#714B67] hover:text-[#5B3C53] transition-colors shrink-0"
                                title="الدخول على بيانات العميل"
                              >
                                <ChevronLeft className="w-5 h-5" />
                              </button>
                            )}
                            {errors.customer && <p className="text-xs text-red-500 mt-1">{errors.customer.message as string}</p>}
                          </div>
                        )} />
                      ) : (
                        /* --- حالة بعد التأكيد (sale/done/cancel): رابط مباشر لصفحة العميل --- */
                        <Controller name="customer" control={control} render={({
                          field: { value }
                        }) => {
                          const selectedCustomer = customers.find(c => c.id === value);
                          const customerName = selectedCustomer?.label || initialData?.partner?.name || '—';
                          return (
                            <div className="flex items-center gap-1 py-1.5">
                              {canViewCustomerDetails && value ? (
                                <button
                                  type="button"
                                  onClick={() => safeNavigate(`/${locale}/contacts/${value}`)}
                                  className="text-[15px] font-bold text-[#714B67] hover:underline cursor-pointer bg-transparent border-none outline-none transition-colors"
                                >
                                  {customerName}
                                </button>
                              ) : (
                                <span className="text-[15px] font-bold text-slate-800">{customerName}</span>
                              )}
                              {canViewCustomerDetails && value && (
                                <button
                                  type="button"
                                  onClick={() => safeNavigate(`/${locale}/contacts/${value}`)}
                                  className="flex items-center justify-center w-7 h-7 rounded hover:bg-slate-100 text-[#714B67] hover:text-[#5B3C53] transition-colors shrink-0"
                                  title="الدخول على بيانات العميل"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          );
                        }} />
                      )}
                    </div>
                    {watch('customer') && (
                      <div className="flex gap-1 shrink-0">
                        <button type="button" onClick={openWhatsApp} disabled={whatsappLoading} className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white transition-colors shadow-sm" title="إرسال عرض السعر عبر واتساب">
                          {whatsappLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"> <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /> </svg>}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-800">{t('invoiceAddress') || 'عنوان الفاتورة'}</label>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} className="w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent transition-colors" placeholder="..." />
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center mt-2">
                <label className="text-sm font-bold text-slate-800">{t('deliveryAddress') || 'عنوان التوصيل'}</label>
                <div className="text-sm text-slate-600 py-1 border-b border-transparent">
                  {/* <span className="text-slate-400">نفس عنوان الفاتورة</span> */}
                  <input autoComplete="off" autoCorrect="off" spellCheck={false} className="w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent transition-colors" placeholder="..." />
                </div>
              </div>

              {!isAdmin ? null : (
                <div className="grid grid-cols-[140px_1fr] items-center mt-2">
                  <div className="text-sm font-bold text-slate-800 pt-2"></div>
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

            <div className="space-y-4 lg:pr-8 border-r-0 lg:border-r border-slate-100">
              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  {t('orderDate') || 'تاريخ الأمر'}
                  {!isAdmin && <span title="مغلق (للمدراء فقط)" className="text-slate-400">🔒</span>}
                </label>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2 border-b border-transparent hover:border-slate-300 w-full relative focus-within:border-[#017E84]">
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" lang="en" dir="ltr" {...register('date', {
                      onChange: () => setTimeout(fetchPricesForAllLines, 0)
                    })} readOnly={!isAdmin} className={`w-full focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent ${!watch('date') ? 'text-transparent focus:text-inherit' : ''} ${!isAdmin ? 'opacity-80 cursor-not-allowed' : ''}`} />
                  </div>
                  {errors.date && <p className="text-xs text-red-500">{errors.date.message as string}</p>}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center">
                <label className="text-sm font-bold text-slate-800">{t('expiration') || 'تاريخ الصلاحية'}</label>
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" lang="en" dir="ltr" {...register('validityDate')} className={`w-full border-b border-transparent hover:border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent ${!watch('validityDate') ? 'text-transparent focus:text-inherit' : ''}`} />
              </div>


            </div>
          </div>

          {/* === شعار اختيار مصدر الخصم (اتفاقية vs قائمة أسعار) === */}
          {pricingOptions && pricingOptions.hasConflict && (
            <div className="px-4 sm:px-6">
              <PriceAgreementChooser
                options={pricingOptions}
                onSelect={(source, option) => {
                  // تطبيق الخصم المختار على جميع بنود الطلب
                  const currentLines = getValues('lines');
                  if (currentLines && Array.isArray(currentLines)) {
                    for (let i = 0; i < currentLines.length; i++) {
                      if (currentLines[i].lineType === 'line') {
                        setValue(`lines.${i}.discount`, option.discount1 || 0);
                        setValue(`lines.${i}.discount2`, option.discount2 || 0);
                        setValue(`lines.${i}.appliedPriceListName`, option.name);
                      }
                    }
                  }
                  setPricingOptions(null);
                  toast.success(`تم تطبيق خصومات ${source === 'agreement' ? 'اتفاقية العميل' : 'قائمة الأسعار'}: ${option.name}`);
                }}
                onDismiss={() => setPricingOptions(null)}
              />
            </div>
          )}

          <div className="border-b border-slate-200 mb-4 px-4 sm:px-6">
            <div className="flex gap-8">
              <button onClick={() => setActiveTab('lines')} className={`py-2 text-sm font-bold transition-all ${activeTab === 'lines' ? 'text-[#017E84] border-b-2 border-[#017E84]' : 'text-slate-500 hover:text-slate-800'}`}>بنود الطلب</button>
              <button onClick={() => setActiveTab('options')} className={`py-2 text-sm font-bold transition-all ${activeTab === 'options' ? 'text-[#017E84] border-b-2 border-[#017E84]' : 'text-slate-500 hover:text-slate-800'}`}>منتجات اختيارية</button>
              <button onClick={() => setActiveTab('other_info')} className={`py-2 text-sm font-bold transition-all ${activeTab === 'other_info' ? 'text-[#017E84] border-b-2 border-[#017E84]' : 'text-slate-500 hover:text-slate-800'}`}>معلومات أخرى</button>
            </div>
          </div>

          <div className="bg-white min-h-[300px]">
            {activeTab === 'lines' && (
              <>
                <div className="p-0">
                  <EditableDynamicTable tableId="sale_order_lines" columns={columns.filter(c => !c.hide)} fields={fields} register={register} control={control} onRemove={remove} onSwap={(indexA, indexB) => {
                    move(indexA, indexB);
                  }} onAdd={() => append({
                    type: 'product',
                    productId: '',
                    description: '',
                    qty: 1,
                    price: 0,
                    discount: 0,
                    tax: null as any,
                    secondaryQuantity: 0,
                    secondaryUnit: '',
                    lineType: 'line'
                  })} onAddSection={() => append({
                    type: 'section',
                    description: 'عنوان قسم جديد',
                    productId: 'SECTION',
                    qty: 0,
                    price: 0,
                    tax: null as any,
                    discount: 0,
                    secondaryQuantity: 0,
                    secondaryUnit: '',
                    lineType: 'section'
                  })} onAddNote={() => append({
                    type: 'note',
                    description: 'ملاحظة جديدة',
                    productId: 'NOTE',
                    qty: 0,
                    price: 0,
                    tax: null as any,
                    discount: 0,
                    secondaryQuantity: 0,
                    secondaryUnit: '',
                    lineType: 'note'
                  })} onAddFromImage={() => setImageParserOpen(true)} itemsPerPage={20} rowClassName={(item, index) => {
                    const line = lines[index] || {};
                    const qtyInvoiced = line.qtyInvoiced || 0;
                    const qty = line.qty || 0;
                    if (line.type === 'product' && qtyInvoiced >= qty && qty > 0) {
                      return '[&_input]:!text-green-600 [&_.odoo-autocomplete-input]:!text-green-600 !text-green-600 bg-green-50/10';
                    }
                    return '';
                  }} />
                </div>
                <div className="flex justify-end items-center bg-white p-4 border-t border-slate-200">
                  <div className="w-1/3 min-w-[300px] space-y-3">
                    {totalDiscount > 0 && (
                      <>
                        <div className="flex justify-between items-center text-slate-800 text-sm">
                          <span className="font-medium">الإجمالي قبل الخصم:</span>
                          <span>{amountBeforeDiscount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {t('currency') || 'ج.م'}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-700 text-sm">
                          <span className="font-medium">الخصم:</span>
                          <span>- {totalDiscount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {t('currency') || 'ج.م'}</span>
                        </div>
                      </>
                    )}
                    {taxes > 0 && (
                      <>
                        <div className="flex justify-between items-center text-slate-800 text-sm">
                          <span className="font-medium">{t('untaxed_amount') || 'المبلغ (قبل الضريبة)'}:</span>
                          <span>{untaxedAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {t('currency') || 'ج.م'}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-800 text-sm">
                          <span className="font-medium">{t('taxes') || 'الضرائب'}:</span>
                          <span>{taxes.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })} {t('currency') || 'ج.م'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between items-center text-lg font-bold text-indigo-900 border-t border-slate-300 pt-2 mt-2">
                      <span>{totalDiscount > 0 ? 'الصافي:' : 'الإجمالي:'}</span>
                      <span>{total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })} ج.م</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'options' && (
              <div className="p-4">
                <p className="text-sm text-slate-500 mb-4">أضف منتجات اختيارية لزيادة قيمة البيع (Cross-selling).</p>
                {/* Simplified view for options */}
                {/* <EditableDynamicTable columns={columns.filter(c => ['product', 'qty', 'price'].includes(c.id))} fieldArrayName="options" /> */}
                <p className="text-sm italic text-slate-400">قريباً: إضافة الخيارات البديلة.</p>
              </div>
            )}

            {activeTab === 'other_info' && (
              <div className="p-6 grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">المبيعات</h3>
                  <div className="grid grid-cols-[120px_1fr] items-center">
                    <label className="text-sm font-bold text-slate-800">{t('priceList') || 'قائمة الأسعار'}</label>
                    <select {...register('priceListId', {
                      onChange: () => setTimeout(fetchPricesForAllLines, 0)
                    })} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent appearance-none">
                      <option value="">(الافتراضية)</option>
                      {priceLists.filter((list: any) => {
                        if (list.type !== 'sale') return false;
                        const customerId = watch('customer');
                        const isGlobal = !list.partnerId && (!list.partners || list.partners.length === 0);
                        if (isGlobal) return true;
                        if (!customerId) return true;
                        if (list.partnerId === customerId) return true;
                        if (list.partners?.some((p: any) => p.id === customerId)) return true;
                        return false;
                      }).map((list: any) => <option key={list.id} value={list.id}>{list.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center">
                    <label className="text-sm font-bold text-slate-800">مسؤول المبيعات</label>
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('userId')} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent" placeholder="اختر مسؤول المبيعات..." />
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center">
                    <label className="text-sm font-bold text-slate-800">فريق المبيعات</label>
                    <select {...register('salesTeam')} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent appearance-none">
                      <option value="">—</option>
                      <option value="direct">مبيعات مباشرة</option>
                      <option value="online">مبيعات عبر الإنترنت</option>
                      <option value="wholesale">جملة</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center">
                    <label className="text-sm font-bold text-slate-800">مرجع العميل</label>
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} {...register('clientOrderRef')} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent" placeholder="PO أو رقم طلب العميل" />
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center">
                    <label className="text-sm font-bold text-slate-800">الوضع المالي</label>
                    <select {...register('fiscalPosition')} className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent appearance-none">
                      <option value="">—</option>
                      <option value="local">محلي</option>
                      <option value="export">تصدير</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 border-b pb-2 mb-4">التسليم</h3>
                  <div className="grid grid-cols-[120px_1fr] items-center">
                    <label className="text-sm font-bold text-slate-800">سياسة الشحن</label>
                    <select className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent">
                      <option>بأسرع ما يمكن (As soon as possible)</option>
                      <option>عندما تكتمل كل المنتجات</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-center">
                    <label className="text-sm font-bold text-slate-800">تاريخ التسليم</label>
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" lang="en" dir="ltr" className="w-full border-b border-slate-300 focus:border-[#017E84] outline-none px-1 py-1 text-sm bg-transparent text-transparent focus:text-inherit" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8">
            <textarea {...register('terms')} className="w-full border border-slate-200 rounded p-2 text-sm focus:border-indigo-500 outline-none" placeholder="حدد الشروط والأحكام..." rows={3}></textarea>
          </div>

          {/* Attachments */}
          {(draftId || initialData?.id) && (
            <div className="mt-6 px-4">
              <AttachmentPanel model="saleOrder" recordId={draftId || initialData?.id} readOnly={status === 'done' || status === 'cancel'} />
            </div>
          )}
        </div>
      </OdooFormShell>

      {/* Reservation Prompt Modal */}
      {reservationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rtl">
          <div className="bg-white rounded-sm shadow-sm w-full max-w-md mx-4 overflow-hidden border border-slate-200">
            <div className="bg-teal-600 px-5 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                🔒 حجز أصناف عرض السعر
              </h3>
              <button onClick={() => setReservationModalOpen(false)} className="text-teal-100 hover:text-white transition-colors">
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                سيتم إرسال طلب للمدير لحجز البضاعة. يرجى تحديد عدد الساعات المطلوبة للحجز.
              </p>
              <label className="block text-sm font-bold text-slate-700 mb-2">مدة الحجز (بالساعات)</label>
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" min="1" max="168" value={reservationHours} onChange={e => setReservationHours(parseInt(e.target.value) || 24)} className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-teal-500" />
            </div>
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex gap-3">
              <button onClick={async () => {
                setIsReserving(true);
                try {
                  await requestReservation(initialData?.id, reservationHours);
                  toast.success('تم إرسال طلب الحجز للمدير');
                  setReservationModalOpen(false);
                  router.refresh();
                } catch (e: any) {
                  toast.error(e.message || 'فشل إرسال الطلب');
                } finally {
                  setIsReserving(false);
                }
              }} disabled={isReserving} className="flex-1 bg-teal-600 text-white font-bold py-2.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {isReserving ? 'جاري الإرسال...' : 'إرسال الطلب'}
              </button>
              <button onClick={() => setReservationModalOpen(false)} className="px-6 bg-white text-slate-600 font-bold border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <VariantGridModal isOpen={variantModalOpen} onClose={() => {
        setVariantModalOpen(false);
        setActiveVariantLineIndex(null);
        setVariantProductId(null);
      }} productId={variantProductId} onConfirm={handleVariantConfirm} />

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
                      partnerId: getValues('customer') || null,
                      priceListId: getValues('priceListId') || null,
                      type: 'sale',
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
      }))} categories={productCategories} existingProductIds={lines.filter((l: any) => l.productId && l.lineType === 'line').map((l: any) => l.productId)} onConfirm={handleProductBrowserConfirm} />

      {/* Image Parser Modal */}
      <ImageOrderParserModal 
        isOpen={imageParserOpen} 
        products={productsList}
        onClose={() => setImageParserOpen(false)} 
        onConfirmItems={(newItems) => {
          newItems.forEach((item) => {
            append({
              type: 'product',
              productId: item.product.id,
              description: item.product.name,
              qty: item.ratio ? (item.quantity * item.ratio) : item.quantity,
              price: item.product.price || 0,
              discount: 0,
              tax: null as any,
              uom: item.uom || item.product.uom,
              hasSecondaryUnit: item.ratio ? true : (item.product.hasSecondaryUnit || false),
              secondaryUomFactor: item.ratio || item.product.secondaryUomFactor || 1,
              secondaryQuantity: item.ratio ? item.quantity : 0,
              secondaryUnit: item.ratio ? "نسبة مخصصة" : (item.product.secondaryUom || ''),
              lineType: 'line'
            });
          });
          toast.success(`تم إضافة ${newItems.length} صنف بنجاح`);
          setTimeout(fetchPricesForAllLines, 500);
        }} 
      />

      {/* Import Invoice Modal */}

      {importModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm shadow-sm w-full max-w-2xl overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="bg-[#714B67] p-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📥 استدعاء فاتورة مشتريات
              </h3>
              <p className="text-teal-100 text-sm mt-1">
                ابحث برقم الفاتورة أو رقم أمر الشراء لاستدعاء الأصناف تلقائياً
              </p>
            </div>

            {/* Search Input */}
            <div className="p-5 border-b border-slate-100">
              <div className="flex gap-2">
                <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={importRef} onChange={e => setImportRef(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleImportSearch()} placeholder="اكتب رقم الفاتورة أو رقم أمر الشراء (مثال: P00002)..." className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none" autoFocus />
                <button type="button" onClick={handleImportSearch} disabled={importLoading || !importRef.trim()} className="px-6 py-3 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>🔍</span>}
                  بحث
                </button>
              </div>
            </div>

            {/* Error State */}
            {importError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {importError}
              </div>
            )}

            {/* Result Display */}
            {importResult && (
              <div className="p-5">
                {/* Invoice Meta */}
                <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">رقم الفاتورة:</span>
                      <span className="font-bold text-slate-800 mr-2">{importResult.invoice?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">المورد:</span>
                      <span className="font-bold text-teal-700 mr-2">{importResult.invoice?.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">المصدر:</span>
                      <span className="font-bold text-slate-800 mr-2">{importResult.invoice?.origin || '—'}</span>
                    </div>
                    {importResult.invoice?.total !== undefined && (
                      <div>
                        <span className="text-slate-500">إجمالي التكلفة:</span>
                        <span className="font-bold text-orange-600 mr-2">{Number(importResult.invoice.total).toLocaleString('en-US')} ج.م</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lines Preview */}
                <div className="text-sm font-bold text-slate-700 mb-2">الأصناف ({importResult.lines?.length || 0}):</div>
                <div className="max-h-[250px] overflow-y-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 sticky top-0">
                      <tr>
                        <th className="text-right p-2.5 font-bold text-slate-700">الصنف</th>
                        <th className="text-center p-2.5 font-bold text-slate-700 w-20">الكمية</th>
                        <th className="text-center p-2.5 font-bold text-slate-700 w-24">الوحدة</th>
                        <th className="text-center p-2.5 font-bold text-slate-700 w-28">سعر التكلفة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.lines?.map((line: any, idx: number) => (
                        <tr key={idx} className="border-t border-slate-100 hover:bg-blue-50/50">
                          <td className="p-2.5 font-medium text-slate-800">{line.description}</td>
                          <td className="p-2.5 text-center font-bold text-slate-900">{line.qty}</td>
                          <td className="p-2.5 text-center text-slate-500">{line.uom}</td>
                          <td className="p-2.5 text-center font-mono text-orange-600">
                            {line.costPrice > 0 ? `${Number(line.costPrice).toLocaleString('en-US')}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`mt-3 p-3 border rounded-lg text-xs ${useCostPrice ? 'bg-[#017E84]/10 border-indigo-200 text-[#015e63]' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  💡 <strong>ملاحظة:</strong> {useCostPrice ? 'سيتم استخدام أسعار الشراء (التكلفة) كما هي واردة في الفاتورة.' : 'سيتم استخدام سعر البيع المسجل في النظام لكل صنف. يمكنك تعديل الأسعار بعد الاستدعاء.'}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between gap-3">
              <div className="flex-1">
                {isAdmin && importResult && importResult.lines?.length > 0 && (
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                    <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={useCostPrice} onChange={e => setUseCostPrice(e.target.checked)} className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 cursor-pointer" />
                    استدعاء بأسعار الشراء (صلاحية مدير)
                  </label>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => {
                  setImportModalOpen(false);
                  setImportResult(null);
                  setImportError(null);
                  setUseCostPrice(false);
                }} className="px-5 py-2.5 text-slate-600 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors">
                  إغلاق
                </button>
                {importResult && importResult.lines?.length > 0 && (
                  <button type="button" onClick={handleImportConfirm} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm">
                    ✅ استدعاء {importResult.lines.length} صنف
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validity Date Action Prompt */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center rtl p-4 transition-opacity duration-300 ${validityPromptOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => {
          setValidityPromptOpen(false);
          setPendingSaveData(null);
        }}></div>
        <div className={`bg-white rounded-sm shadow-sm max-w-md w-full flex flex-col overflow-hidden transition-transform duration-300 ${validityPromptOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          <div className="bg-[#017E84]/10 border-b border-[#017E84]/20 px-6 py-4 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-[#017E84]" />
            <h2 className="text-xl font-bold text-slate-800">تاريخ الانتهاء غير محدد</h2>
          </div>
          <div className="p-6">
            <p className="text-slate-600 mb-6 font-medium leading-relaxed">
              لم تقم بتحديد تاريخ الانتهاء (تاريخ الصلاحية) لهذا الأمر. هل تريد إغلاقه على تاريخ اليوم، أم تحديده بناءً على جدول متابعة المديونية؟
            </p>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setValue('validityDate', today);
                setValidityPromptOpen(false);
                if (pendingSaveData) {
                  processSave({
                    ...pendingSaveData,
                    validityDate: today
                  });
                  setPendingSaveData(null);
                }
              }} className="w-full py-3 px-4 bg-[#017E84] hover:bg-[#015e63] text-white rounded-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                إغلاق على تاريخ اليوم
              </button>
              <button type="button" onClick={() => {
                setValidityPromptOpen(false);
                setDebtFollowUpModalOpen(true);
              }} className="w-full py-3 px-4 bg-white border-2 border-[#017E84] text-[#017E84] hover:bg-slate-50 rounded-sm font-bold transition-colors flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                تحديد من متابعة المديونية
              </button>
              <button type="button" onClick={() => {
                setValidityPromptOpen(false);
                setPendingSaveData(null);
              }} className="w-full py-3 px-4 text-slate-500 hover:bg-slate-100 rounded-sm font-bold transition-colors mt-2">
                العودة للمراجعة بدون حفظ
              </button>
            </div>
          </div>
        </div>
      </div>

      <DebtFollowUpModal open={debtFollowUpModalOpen} onOpenChange={open => {
        setDebtFollowUpModalOpen(open);
        if (!open && pendingSaveData) {
          // If closed without success, we don't save
          setPendingSaveData(null);
        }
      }} partnerId={watch('customer')} saleOrderId={initialData?.id} isAdmin={isAdmin} currentUserId={userId} onSuccess={date => {
        const dateStr = date.toISOString().split('T')[0];
        setValue('validityDate', dateStr);
        if (pendingSaveData) {
          processSave({
            ...pendingSaveData,
            validityDate: dateStr
          });
          setPendingSaveData(null);
        }
      }} />

      {/* Negative Stock Rejection Details Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center rtl p-4 transition-opacity duration-300 ${negativeStockModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setNegativeStockModalOpen(false)}></div>
        <div className={`bg-white rounded-sm shadow-sm max-w-2xl w-full flex flex-col overflow-hidden transition-transform duration-300 ${negativeStockModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-800">رصيد غير كافٍ!</h2>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <p className="text-slate-600 mb-4 font-medium">هنالك عنصر فلاني يصرف بسالب اطلب من المدير فتح الاستجابة من المخزن.</p>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">الصنف</th>
                    <th className="px-4 py-3 text-center">الكمية المطلوبة</th>
                    <th className="px-4 py-3 text-center">الرصيد المتاح</th>
                    <th className="px-4 py-3 text-center">النقص</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {outOfStockItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {item.name}
                        {item.kitName && <span className="block text-xs text-slate-500 mt-0.5">جزء من مجموعة: {item.kitName}</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-numbers">{item.qtyRequested}</td>
                      <td className="px-4 py-3 text-center font-numbers text-red-600 font-bold">{item.qtyAvailable}</td>
                      <td className="px-4 py-3 text-center font-numbers font-bold text-red-700">{(item.qtyRequested - item.qtyAvailable).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {admins.length > 0 && (
              <div className="mt-6 border border-slate-200 rounded-lg p-4 bg-slate-50">
                <label className="block text-sm font-bold text-slate-700 mb-2">اختر المدير لإرسال طلب الموافقة:</label>
                <select value={selectedAdminId} onChange={(e) => setSelectedAdminId(e.target.value)} className="w-full h-10 border border-slate-300 rounded-md px-3 bg-white text-slate-800 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  {admins.map(admin => (
                    <option key={admin.id} value={admin.id}>{admin.name || admin.email || 'مدير النظام'}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">سيتم إرسال إشعار فوري للمدير المختار ليتمكن من الموافقة وتفعيل الصرف بسالب.</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
            <button type="button" onClick={() => setNegativeStockModalOpen(false)} className="px-5 py-2.5 bg-white text-slate-700 border border-slate-300 font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
              إلغاء وتعديل الطلب
            </button>
            <button type="button" onClick={async () => {
              const tid = toast.loading("جاري إرسال الطلب للإدارة...");
              try {
                await requestNegativeStockApproval(initialData.id, outOfStockItems, selectedAdminId);
                toast.success("تم إرسال الطلب للمدير بنجاح", {
                  id: tid
                });
                setNegativeStockModalOpen(false);
                router.refresh();
              } catch (e: any) {
                toast.error(e.message || "فشل إرسال الطلب", {
                  id: tid
                });
              }
            }} className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-lg shadow-sm hover:bg-red-700 transition-colors">
              طلب موافقة الصرف بالسالب
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
