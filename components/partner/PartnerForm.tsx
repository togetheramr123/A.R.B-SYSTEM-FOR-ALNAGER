"use client";
import React from "react";

import { useState, useEffect, useCallback, useRef } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useAutoSaveOnLeave } from "@/hooks/useAutoSaveOnLeave";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, User, Building, Banknote, CloudUpload, RotateCcw, Trash2, ShoppingCart, Receipt, CreditCard, Plus, ExternalLink, ChevronLeft, ChevronRight, Printer, Settings, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { updatePartner, createPartner, getAccountingOptions } from "@/app/actions/partner";
import OdooFormShell from "@/components/common/OdooFormShell";
import { useBreadcrumbStore } from "@/hooks/useBreadcrumbStore";
import { useStatusStore } from "@/store/statusStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Chatter } from "@/components/chatter/Chatter";
import Image from "next/image";
import { toast } from "sonner";
import { getPartnerFormPermissions } from "@/app/actions/contacts";
import { MacStatusBar } from "@/components/common/MacStatusBar";
import { TopPortal } from "@/components/common/TopPortal";
interface PartnerFormProps {
  initialData?: any;
  locale: string;
  isModal?: boolean;
  onSuccess?: (partner: any) => void;
  returnUrl?: string;
}
export default function PartnerForm({
  initialData,
  locale,
  isModal,
  onSuccess,
  returnUrl
}: PartnerFormProps) {
  const isEdit = !!initialData?.id;
  const defaultValues = {
    type: initialData?.type && ["person", "company"].includes(initialData.type) ? initialData.type : "person",
    name: "",
    image: "",
    email: "",
    phone: "",
    mobile: "",
    website: "",
    vat: "",
    lang: "ar_SY",
    street: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    function: "",
    title: "",
    isCustomer: initialData?.isCustomer ?? true,
    isVendor: initialData?.isVendor ?? false,
    customerType: initialData?.customerType || "cash",
    propertyPaymentTermId: "",
    propertySupplierPaymentTermId: "",
    propertyPriceListId: "",
    userId: "",
    ref: "",
    industry: "",
    propertyAccountReceivableId: "",
    propertyAccountPayableId: "",
    notes: "",
    branch: "",
    ...initialData,
    purchaseAgreements: initialData?.purchaseAgreements?.map((a: any) => ({
      ...a,
      startDate: a.startDate ? new Date(a.startDate).toISOString().split("T")[0] : "",
      endDate: a.endDate ? new Date(a.endDate).toISOString().split("T")[0] : ""
    })) || [],
    saleAgreements: initialData?.saleAgreements?.map((a: any) => ({
      ...a,
      startDate: a.startDate ? new Date(a.startDate).toISOString().split("T")[0] : "",
      endDate: a.endDate ? new Date(a.endDate).toISOString().split("T")[0] : ""
    })) || []
  };
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: {
      isDirty
    },
    setValue,
    getValues,
    reset
  } = useForm({
    defaultValues
  });
  const {
    fields: bankFields,
    append: appendBank,
    remove: removeBank
  } = useFieldArray({
    control,
    name: "bankAccounts"
  });
  const {
    fields: saleAgreements,
    append: appendSaleAgreement,
    remove: removeSaleAgreement
  } = useFieldArray({
    control,
    name: "saleAgreements"
  });
  const {
    fields: purchaseAgreements,
    append: appendPurchaseAgreement,
    remove: removePurchaseAgreement
  } = useFieldArray({
    control,
    name: "purchaseAgreements"
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const effectiveReturnUrl = returnUrl || searchParams.get("returnUrl");
  const [loading, setLoading] = useState(false);
  const [accountingOptions, setAccountingOptions] = useState<any>({
    receivableAccounts: [],
    payableAccounts: [],
    paymentTerms: [],
    pricelists: []
  });
  const [permissions, setPermissions] = useState({
    canSetCommercial: false,
    canSeePurchases: false,
    canSeeSales: false,
    canSeeAccounting: false
  });
  const setStoreUnsaved = useStatusStore(state => state.setHasUnsavedChanges);
  const setStoreIsSaving = useStatusStore(state => state.setIsSaving);
  const setTriggers = useStatusStore(state => state.setTriggers);
  const clearTriggers = useStatusStore(state => state.clearTriggers);
  const type = watch("type");
  const isCompany = type === "company";
  const currentName = watch("name");
  const pathname = usePathname(); // Update breadcrumb label with partner name
  useEffect(() => {
    if (!isModal && currentName && pathname) {
      useBreadcrumbStore.getState().updateCurrentLabel(currentName);
    }
  }, [currentName, pathname, isModal]);
  useEffect(() => {
    getAccountingOptions().then(setAccountingOptions);
    getPartnerFormPermissions().then(setPermissions);
  }, []);
  const backgroundSave = useCallback(async () => {
    if (!isDirty || isModal) return; // Skip background save in modal mode
    try {
      const currentData = getValues();
      if (isEdit) {
        await updatePartner(initialData.id, currentData);
      } else if (currentData.name?.trim().length > 0) {
        const newPartner: any = await createPartner(currentData);
        if (newPartner?.id) {
          router.replace(`/${locale}/contacts/${newPartner.id}`);
        }
      }
    } catch (error) {
      console.error("[BackgroundSave] Failed:", error);
    }
  }, [getValues, initialData?.id, isDirty, isEdit, locale, isModal, router]);
  const {
    setDiscarded,
    setClean
  } = useAutoSaveOnLeave(isModal ? false : isDirty, backgroundSave);
  const saveData = useCallback(async (data: any, silent = false) => {
    try {
      setStoreIsSaving(true);
      setLoading(true);
      if (isEdit) {
        const res = await updatePartner(initialData.id, data);
        if (res?.error) {
          toast.error(res.error);
          return;
        } // Odoo standard: silent save
      } else {
        const res: any = await createPartner(data);
        if (res?.error) {
          toast.error(res.error);
          return;
        } // Odoo standard: silent creation
        if (onSuccess) {
          onSuccess(res.id);
        } else if (!isModal) {
          // Navigate to the newly created partner page, or returnUrl if specified
          router.push(effectiveReturnUrl || `/${locale}/contacts/${res.id}`);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ");
    } finally {
      setStoreIsSaving(false);
      setLoading(false);
    }
  }, [isEdit, initialData?.id, isModal, onSuccess, effectiveReturnUrl, router, setStoreIsSaving]);
  const onSubmit = useCallback(async (data: any) => {
    await saveData(data, false);
    setStoreUnsaved(false);
    setClean();
    reset(getValues()); // Reset dirty state to hide buttons
  }, [saveData, setStoreUnsaved, setClean, reset, getValues]);
  useEffect(() => {
    if (isModal) return;
    setStoreUnsaved(isDirty);
    const onInvalid = (errors: any) => {
      console.error("Validation Errors:", errors);
      toast.error("الرجاء التأكد من الحقول المطلوبة (اسم جهة الاتصال، الخ)");
    };
    setTriggers(async () => {
      await handleSubmit(onSubmit, onInvalid)();
    }, () => {
      setDiscarded();
      setStoreUnsaved(false);
      setClean();
      reset();
    });
    return () => clearTriggers();
  }, [isDirty, handleSubmit, onSubmit, setDiscarded, setClean, setTriggers, clearTriggers, isModal, setStoreUnsaved, reset]);
  useEffect(() => {
    if (isModal) return;
    const subscription = watch((value, {
      name,
      type
    }) => {
      if (name || type === "change") {
        setStoreUnsaved(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setStoreUnsaved, isModal]); // Field renderer helper for Odoo-style field layout
  const Field = ({
    label,
    children,
    className = ""
  }: {
    label: string;
    children: React.ReactNode;
    className?: string;
  }) => <div className={`grid grid-cols-[130px_1fr] items-center gap-1 ${className}`}>
      {" "}
      <label className="text-[12px] font-bold text-slate-600 text-right">
        {label}
      </label>{" "}
      <div>{children}</div>{" "}
    </div>;
  const inputClass = "w-full border-b border-transparent focus:border-indigo-400 hover:border-slate-300 outline-none py-0.5 text-[12px] text-slate-800 bg-transparent placeholder:text-slate-400 transition-colors"; // Custom Dropdowns for OdooFormShell extraHeaderElements
  const HeaderDropdowns = () => {
    const [actionOpen, setActionOpen] = useState(false);
    const [printOpen, setPrintOpen] = useState(false);
    const actionRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (actionRef.current && !actionRef.current.contains(event.target as Node)) setActionOpen(false);
        if (printRef.current && !printRef.current.contains(event.target as Node)) setPrintOpen(false);
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    return <div className="flex items-center gap-2">
        {" "}
        {/* Print Menu */}{" "}
        <div className="relative" ref={printRef}>
          {" "}
          <button type="button" onClick={() => {
          setPrintOpen(!printOpen);
          setActionOpen(false);
        }} className="flex items-center gap-1.5 bg-white text-slate-700 px-3 py-1.5 rounded-sm text-[13px] hover:bg-slate-50 border border-slate-200 transition-colors font-bold whitespace-nowrap">
            {" "}
            <Printer className="w-4 h-4 text-slate-500" /> طباعة{" "}
            <ChevronDown className="w-3 h-3 text-slate-400" />{" "}
          </button>{" "}
          {printOpen && <div className="absolute top-full rtl:right-0 ltr:left-0 mt-1 w-48 bg-white border border-slate-200 shadow-sm rounded-sm z-50 py-1">
              {" "}
              {(permissions.canSeeSales || permissions.canSeePurchases) && <>
                <button type="button" onClick={() => {
                  setPrintOpen(false);
                  router.push(`/${locale}/accounting/reporting/partner_ledger?partnerId=${initialData?.id}`);
                }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  كشف حساب
                </button>
                <button type="button" onClick={() => {
                  setPrintOpen(false);
                  router.push(`/${locale}/accounting/partner-statement/${initialData?.id}`);
                }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2">
                  كشف حساب تفصيلي
                </button>
              </>}{" "}
            </div>}{" "}
        </div>{" "}
        {/* Action Menu */}{" "}
        <div className="relative" ref={actionRef}>
          {" "}
          <button type="button" onClick={() => {
          setActionOpen(!actionOpen);
          setPrintOpen(false);
        }} className="flex items-center gap-1.5 bg-white text-slate-700 px-3 py-1.5 rounded-sm text-[13px] hover:bg-slate-50 border border-slate-200 transition-colors font-bold whitespace-nowrap">
            {" "}
            <Settings className="w-4 h-4 text-slate-500" /> إجراء{" "}
            <ChevronDown className="w-3 h-3 text-slate-400" />{" "}
          </button>{" "}
          {actionOpen && <div className="absolute top-full rtl:right-0 ltr:left-0 mt-1 w-56 bg-white border border-slate-200 shadow-sm rounded-sm z-50 py-1">
              {" "}
              <button type="button" onClick={() => {
            setActionOpen(false);
            toast.info("الأرشيف غير مفعل حالياً");
          }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                الأرشيف
              </button>{" "}
              <button type="button" onClick={() => {
            setActionOpen(false);
            toast.info("جاري إنشاء نسخة...");
          }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                إنشاء نسخة مطابقة
              </button>{" "}
              <button type="button" onClick={() => {
            setActionOpen(false);
            toast.error("غير مصرح بالحذف");
          }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                حذف
              </button>{" "}
              <div className="h-px w-full bg-slate-200 my-1" />{" "}
              <button type="button" onClick={() => {
            setActionOpen(false);
            toast.info("جاري الإعداد...");
          }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                إرسال رسالة نصية قصيرة
              </button>{" "}
              <button type="button" onClick={() => {
            setActionOpen(false);
            toast.info("جاري الإعداد...");
          }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                بحث الخصوصية
              </button>{" "}
              <button type="button" onClick={() => {
            setActionOpen(false);
            toast.info("جاري الإعداد...");
          }} className="w-full text-start px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                منح صلاحية الوصول إلى البوابة
              </button>{" "}
            </div>}{" "}
        </div>{" "}
      </div>;
  };
  const smartButtonsElement = !isModal && initialData?.id ? <>
        {" "}
        {permissions.canSeeAccounting && <>
            {" "}
            <Link href={`/${locale}/accounting/bills?partner_id=${initialData.id}`} className="oe_stat_button">
              {" "}
              <Receipt className="w-5 h-5 o_stat_icon" />{" "}
              <div className="o_stat_info">
                {" "}
                <span className="o_stat_value">
                  {initialData?._count?.invoices || 0}
                </span>{" "}
                <span className="o_stat_text">فواتير المورد</span>{" "}
              </div>{" "}
            </Link>{" "}
            <Link href={`/${locale}/accounting/partner_ledger?partnerId=${initialData.id}&partnerName=${initialData?.name || ""}`} className="oe_stat_button">
              {" "}
              <Banknote className="w-5 h-5 o_stat_icon" />{" "}
              <div className="o_stat_info">
                {" "}
                <span className="o_stat_value">
                  {(initialData?.totalReceivable || 0).toLocaleString()} LE
                </span>{" "}
                <span className="o_stat_text">مفتوح</span>{" "}
              </div>{" "}
            </Link>{" "}
            <Link href={`/${locale}/accounting/partner_ledger?partnerId=${initialData.id}&partnerName=${initialData?.name || ""}`} className="oe_stat_button">
              {" "}
              <CreditCard className="w-5 h-5 o_stat_icon" />{" "}
              <div className="o_stat_info">
                {" "}
                <span className="o_stat_value">
                  % {initialData?.paymentRate || 0}
                </span>{" "}
                <span className="o_stat_text">نسبة الدفعة في</span>{" "}
              </div>{" "}
            </Link>{" "}
          </>}{" "}
        {permissions.canSeePurchases && <Link href={`/${locale}/purchases/orders?partner_id=${initialData.id}`} className="oe_stat_button">
            {" "}
            <ShoppingCart className="w-5 h-5 o_stat_icon" />{" "}
            <div className="o_stat_info">
              {" "}
              <span className="o_stat_value">
                {initialData?._count?.purchaseOrders || 0}
              </span>{" "}
              <span className="o_stat_text">المشتريات</span>{" "}
            </div>{" "}
          </Link>}{" "}
        {permissions.canSeeSales && <Link href={`/${locale}/sales/orders?partner_id=${initialData.id}`} className="oe_stat_button">
            {" "}
            <Banknote className="w-5 h-5 o_stat_icon" />{" "}
            <div className="o_stat_info">
              {" "}
              <span className="o_stat_value">
                ${initialData?._count?.saleOrders || 0}
              </span>{" "}
              <span className="o_stat_text">المبيعات</span>{" "}
            </div>{" "}
          </Link>}{" "}
      </> : undefined;
  const formContent = <form id="partner-form" onSubmit={handleSubmit(onSubmit)} className="font-sans text-right" dir="rtl">
      {" "}
      <div className={isModal ? "bg-white p-2" : "p-4 sm:p-6"}>
        {" "}
        <div className="flex justify-between items-start mb-4">
          {" "}
          {/* Partner Header Information */}{" "}
          <div className="flex-1 space-y-3">
            {" "}
            {/* Type Selector */}{" "}
            <div className="flex gap-5 mb-1">
              {" "}
              <label className="flex items-center gap-1.5 cursor-pointer group">
                {" "}
                <input type="radio" value="person" {...register("type")} className="peer appearance-none w-3.5 h-3.5 border border-slate-400 rounded-full checked:border-[#017E84] checked:bg-[#017E84] transition-all cursor-pointer ring-offset-1 checked:ring-2 checked:ring-indigo-200" />{" "}
                <span className="text-[12px] text-slate-700">فرد</span>{" "}
              </label>{" "}
              <label className="flex items-center gap-1.5 cursor-pointer group">
                {" "}
                <input type="radio" value="company" {...register("type")} className="peer appearance-none w-3.5 h-3.5 border border-slate-400 rounded-full checked:border-[#017E84] checked:bg-[#017E84] transition-all cursor-pointer ring-offset-1 checked:ring-2 checked:ring-indigo-200" />{" "}
                <span className="text-[12px] text-slate-700">الشركة</span>{" "}
              </label>{" "}
            </div>{" "}
            <div className="space-y-0.5 w-full max-w-2xl">
              {" "}
              <div className="flex items-center group/title border-b border-transparent focus-within:border-slate-400 transition-all">
                {" "}
                <input {...register("name", {
                required: true
              })} className="text-[32px] font-bold bg-transparent outline-none w-full text-slate-900 placeholder-slate-300 leading-tight" placeholder={isCompany ? "مثال: الامل الشريف" : "الاسم..."} autoComplete="new-password" spellCheck="false" />{" "}
              </div>{" "}
              {/* Removed unused inputs (Company Name / Job Position) for Individuals as requested */}{" "}
            </div>{" "}
          </div>{" "}
          {/* Image Placeholder — Odoo style */}{" "}
          <div className="w-[110px] h-[110px] bg-white border border-slate-200 shadow-sm flex items-center justify-center relative group cursor-pointer hover:bg-slate-50 shrink-0 overflow-hidden rounded-sm">
            {" "}
            {isCompany ? <Building className="w-12 h-12 text-slate-200" /> : <User className="w-12 h-12 text-slate-200" />}{" "}
            <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
              {" "}
              <Plus className="w-6 h-6 text-white" />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-2 mb-4">
          {" "}
          {/* Column 1 (Right in RTL): Address — matching Odoo */}{" "}
          <div className="space-y-1.5">
            {" "}
            <div className="grid grid-cols-[130px_1fr] items-start gap-1">
              {" "}
              <label className="text-[12px] font-bold text-slate-800 text-right pt-0.5">
                العنوان
              </label>{" "}
              <div className="space-y-0.5">
                {" "}
                <input {...register("street")} placeholder="سطر العنوان الأول.." className={inputClass} />{" "}
                <input {...register("street2")} placeholder="سطر العنوان الثاني.." className={inputClass} />{" "}
              </div>{" "}
            </div>{" "}
            <div className="grid grid-cols-[130px_1fr] items-center gap-1 mt-3">
              {" "}
              <label className="text-[12px] font-bold text-slate-600 text-right">
                فرع
              </label>{" "}
              <div className="text-[12px] text-slate-600 font-bold bg-slate-50 px-3 py-1 rounded border border-slate-200 w-fit cursor-not-allowed">
                {" "}
                الفرع الرئيسي{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {/* Column 2 (Left in RTL): Contact Info — matching Odoo */}{" "}
          <div className="space-y-1.5">
            {" "}
            <div className="grid grid-cols-[130px_1fr] items-center gap-1">
              {" "}
              <label className="text-[12px] font-bold text-slate-600 text-right">
                رقم الهاتف الأساسي
              </label>{" "}
              <div className="flex items-center gap-2">
                {" "}
                <input {...register("phone")} className={inputClass} />{" "}
                <button type="button" title="استخدام نفس الرقم للواتساب" onClick={() => setValue("mobile", watch("phone"), {
                shouldDirty: true
              })} className="text-[10px] bg-[#017E84]/10 text-[#017E84] hover:bg-[#017E84] hover:text-white px-2 py-0.5 rounded transition-colors whitespace-nowrap">
                  {" "}
                  نسخ لـ واتساب{" "}
                </button>{" "}
              </div>{" "}
            </div>{" "}
            <div className="grid grid-cols-[130px_1fr] items-center gap-1">
              {" "}
              <label className="text-[12px] font-bold text-slate-600 text-right">
                رقم واتساب (للإشعارات)
              </label>{" "}
              <div className="w-full flex items-center border-b border-transparent focus-within:border-indigo-400 hover:border-slate-300 transition-colors">
                {" "}
                <input {...register("mobile")} className="w-full outline-none py-0.5 text-[12px] text-slate-800 bg-transparent" />{" "}
                {watch("mobile") && <button type="button" title="إرسال رسالة واتساب" onClick={() => {
                const mobile = watch("mobile");
                if (mobile) window.open(`https://wa.me/${mobile.replace(/[^0-9+]/g, "")}`, "_blank");
              }} className="text-green-600 hover:scale-110 transition-transform px-1.5">
                    {" "}
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      {" "}
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />{" "}
                    </svg>{" "}
                  </button>}{" "}
              </div>{" "}
            </div>{" "}
            <div className="grid grid-cols-[130px_1fr] items-center gap-1 mt-2">
              {" "}
              <label className="text-[12px] font-bold text-slate-600 text-right">
                علامات التصنيف
              </label>{" "}
              <div className="flex gap-1.5 items-center flex-wrap py-0.5">
                {" "}
                <Controller name="customerType" control={control} render={({
                field
              }) => {
                const tags = field.value && field.value !== "none" ? field.value.split(",").filter(Boolean) : [];
                const toggleTag = (tag: string) => {
                  if (tags.includes(tag)) {
                    const newTags = tags.filter((t: string) => t !== tag);
                    field.onChange(newTags.length > 0 ? newTags.join(",") : "none");
                  } else {
                    field.onChange([...tags, tag].join(","));
                  }
                };
                return <>
                        {" "}
                        {tags.map((tag: string) => <span key={tag} className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 border border-yellow-300 rounded-sm px-2 py-0.5 text-[11px] font-bold">
                            {" "}
                            {tag === "commercial" ? "تجاري (آجل)" : tag === "cash" ? "نقدي" : tag}{" "}
                            <button type="button" onClick={() => toggleTag(tag)} className="text-yellow-600 hover:text-red-600 font-bold text-[13px] leading-none">
                              ×
                            </button>{" "}
                          </span>)}{" "}
                        <div className="relative group/tags">
                          {" "}
                          <button type="button" className="text-slate-400 hover:text-[#017E84] transition-colors">
                            {" "}
                            <Plus className="w-3.5 h-3.5" />{" "}
                          </button>{" "}
                          <div className="absolute right-0 top-full pt-1 hidden group-hover/tags:block z-50">
                            {" "}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-sm min-w-[130px] overflow-hidden">
                              {" "}
                              {permissions.canSetCommercial && !tags.includes("commercial") && <button type="button" onClick={() => toggleTag("commercial")} className="w-full text-right px-3 py-2 text-[12px] text-slate-700 hover:bg-[#017E84]/10 hover:text-[#017E84]">
                                    تجاري (آجل)
                                  </button>}{" "}
                              {!tags.includes("cash") && <button type="button" onClick={() => toggleTag("cash")} className="w-full text-right px-3 py-2 text-[12px] text-slate-700 hover:bg-[#017E84]/10 hover:text-[#017E84]">
                                  نقدي
                                </button>}{" "}
                              {tags.includes("cash") && (!permissions.canSetCommercial || tags.includes("commercial")) && <div className="px-3 py-2 text-[11px] text-slate-400 text-center bg-slate-50 italic">
                                    لا توجد خيارات أخرى
                                  </div>}{" "}
                            </div>{" "}
                          </div>{" "}
                        </div>{" "}
                      </>;
              }} />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* ═══════════════════════════════════════════════════ */}{" "}
      {/* 7 TABS — Matching Odoo's Contact Form */}{" "}
      {/* ═══════════════════════════════════════════════════ */}{" "}
      <Tabs defaultValue="contacts" className="w-full" dir="rtl">
        {" "}
        <TabsList className="bg-transparent border-b w-full justify-start rounded-none h-auto p-0 gap-4 flex-wrap">
          {" "}
          <TabsTrigger value="contacts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#017E84] data-[state=active]:text-[#017E84] data-[state=active]:bg-transparent px-1 pb-2 text-[13px]">
            جهات الاتصال والعناوين
          </TabsTrigger>{" "}
          <TabsTrigger value="sales_purchase" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#017E84] data-[state=active]:text-[#017E84] data-[state=active]:bg-transparent px-1 pb-2 text-[13px]">
            المبيعات والمشتريات
          </TabsTrigger>{" "}
          {!isModal && <TabsTrigger value="payment_followup" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#017E84] data-[state=active]:text-[#017E84] data-[state=active]:bg-transparent px-1 pb-2 text-[13px]">
              متابعة الدفع
            </TabsTrigger>}{" "}
          <TabsTrigger value="accounting" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#017E84] data-[state=active]:text-[#017E84] data-[state=active]:bg-transparent px-1 pb-2 text-[13px]">
            الفوترة
          </TabsTrigger>{" "}
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#017E84] data-[state=active]:text-[#017E84] data-[state=active]:bg-transparent px-1 pb-2 text-[13px]">
            الملاحظات الداخلية
          </TabsTrigger>{" "}
          {!isModal && <TabsTrigger value="sale_agreements" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#017E84] data-[state=active]:text-[#017E84] data-[state=active]:bg-transparent px-1 pb-2 text-[13px]">
              اتفاقيات البيع
            </TabsTrigger>}{" "}
          {!isModal && <TabsTrigger value="purchase_agreements" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#017E84] data-[state=active]:text-[#017E84] data-[state=active]:bg-transparent px-1 pb-2 text-[13px]">
              اتفاقيات الشراء
            </TabsTrigger>}{" "}
        </TabsList>{" "}
        {/* ─── Tab 1: Contacts & Addresses ─── */}{" "}
        <TabsContent value="contacts" className="py-6">
          {" "}
          <div className="space-y-4">
            {" "}
            {/* Children contacts list */}{" "}
            {initialData?.children && initialData.children.length > 0 ? <div className="space-y-2">
                {" "}
                {initialData.children.map((child: any) => <div key={child.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors">
                    {" "}
                    <div className="flex items-center gap-3">
                      {" "}
                      <div className="w-8 h-8 bg-[#017E84]/20 rounded-full flex items-center justify-center">
                        {" "}
                        <User className="w-4 h-4 text-[#017E84]" />{" "}
                      </div>{" "}
                      <div>
                        {" "}
                        <p className="text-sm font-medium text-slate-800">
                          {child.name}
                        </p>{" "}
                        <p className="text-xs text-slate-500">
                          {child.function || child.type}
                        </p>{" "}
                      </div>{" "}
                    </div>{" "}
                    <Link href={`/${locale}/contacts/${child.id}`} className="text-[#017E84] hover:text-[#015e63]">
                      {" "}
                      <ExternalLink className="w-4 h-4" />{" "}
                    </Link>{" "}
                  </div>)}{" "}
              </div> : null}{" "}
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-8 text-center text-slate-500">
              {" "}
              <Button type="button" variant="outline" className="gap-2">
                {" "}
                <Plus className="w-4 h-4" /> إضافة جهة اتصال{" "}
              </Button>{" "}
            </div>{" "}
          </div>{" "}
        </TabsContent>{" "}
        {/* ─── Tab 2: Sales & Purchases (Enhanced) ─── */}{" "}
        <TabsContent value="sales_purchase" className="py-6">
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {" "}
            {/* Sales Section */}{" "}
            <div className="space-y-4">
              {" "}
              <h3 className="font-bold text-slate-800 border-b pb-1 text-[14px]">
                المبيعات
              </h3>{" "}
              <Field label="مندوب المبيعات">
                {" "}
                <input {...register("userId")} placeholder="ابحث عن مستخدم..." className={inputClass} />{" "}
              </Field>{" "}
              <Field label="شروط السداد">
                {" "}
                <Select onValueChange={v => setValue("propertyPaymentTermId", v)} value={watch("propertyPaymentTermId") || ""}>
                  {" "}
                  <SelectTrigger dir="rtl" className="h-8 text-[13px] border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-400 rounded-none shadow-none">
                    {" "}
                    <SelectValue placeholder="اختر..." />{" "}
                  </SelectTrigger>{" "}
                  <SelectContent dir="rtl">
                    {" "}
                    {accountingOptions.paymentTerms?.map((t: any) => <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>)}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
              </Field>{" "}
              <Field label="قائمة الأسعار">
                {" "}
                <Select onValueChange={v => setValue("propertyPriceListId", v)} value={watch("propertyPriceListId") || ""}>
                  {" "}
                  <SelectTrigger dir="rtl" className="h-8 text-[13px] border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-400 rounded-none shadow-none">
                    {" "}
                    <SelectValue placeholder="اختر قائمة الأسعار..." />{" "}
                  </SelectTrigger>{" "}
                  <SelectContent dir="rtl">
                    {" "}
                    {accountingOptions.pricelists?.map((pl: any) => <SelectItem key={pl.id} value={pl.id}>
                        {pl.name}
                      </SelectItem>)}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
              </Field>{" "}
              <Field label="طريقة التوصيل">
                {" "}
                <input placeholder="—" className={inputClass} readOnly />{" "}
              </Field>{" "}
            </div>{" "}
            {/* Purchases Section */}{" "}
            <div className="space-y-4">
              {" "}
              <h3 className="font-bold text-slate-800 border-b pb-1 text-[14px]">
                المشتريات
              </h3>{" "}
              <Field label="شروط السداد">
                {" "}
                <Select onValueChange={v => setValue("propertySupplierPaymentTermId", v)} value={watch("propertySupplierPaymentTermId") || ""}>
                  {" "}
                  <SelectTrigger dir="rtl" className="h-8 text-[13px] border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-400 rounded-none shadow-none">
                    {" "}
                    <SelectValue placeholder="اختر..." />{" "}
                  </SelectTrigger>{" "}
                  <SelectContent dir="rtl">
                    {" "}
                    {accountingOptions.paymentTerms?.map((t: any) => <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>)}{" "}
                  </SelectContent>{" "}
                </Select>{" "}
              </Field>{" "}
              <Field label="تذكير الإيصال">
                {" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" />{" "}
                  <span className="text-[12px] text-slate-500">
                    إرسال تذكير تلقائي
                  </span>{" "}
                </div>{" "}
              </Field>{" "}
            </div>{" "}
          </div>{" "}
          {/* Financial Info & Misc Sections */}{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8 pt-6 border-t border-slate-200">
            {" "}
            <div className="space-y-4">
              {" "}
              <h3 className="font-bold text-slate-800 border-b pb-1 text-[14px]">
                معلومات مالية
              </h3>{" "}
              <Field label="الوضع المالي">
                {" "}
                <input placeholder="—" className={inputClass} readOnly />{" "}
              </Field>{" "}
            </div>{" "}
            <div className="space-y-4">
              {" "}
              <h3 className="font-bold text-slate-800 border-b pb-1 text-[14px]">
                متنوعات
              </h3>{" "}
              <Field label="مُعرّف الشركة">
                {" "}
                <input {...register("ref")} placeholder="المرجع" className={inputClass} />{" "}
              </Field>{" "}
              <Field label="مجال العمل">
                {" "}
                <input {...register("industry")} placeholder="مثل: تجارة أدوات صحية" className={inputClass} />{" "}
              </Field>{" "}
            </div>{" "}
          </div>{" "}
        </TabsContent>{" "}
        {/* ─── Tab 3: Payment Follow-up ─── */}{" "}
        <TabsContent value="payment_followup" className="py-6">
          {" "}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            {" "}
            <h3 className="font-bold text-slate-800 text-[14px]">
              إعدادات متابعة الدفع
            </h3>{" "}
            <p className="text-sm text-slate-500">
              {" "}
              تتيح لك متابعة الدفع إرسال تذكيرات تلقائية للعملاء الذين لديهم
              فواتير متأخرة.{" "}
            </p>{" "}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {" "}
              <div className="space-y-3">
                {" "}
                <Field label="مستوى المتابعة">
                  {" "}
                  <Select>
                    {" "}
                    <SelectTrigger dir="rtl" className="h-8 text-[13px]">
                      {" "}
                      <SelectValue placeholder="تلقائي" />{" "}
                    </SelectTrigger>{" "}
                    <SelectContent dir="rtl">
                      {" "}
                      <SelectItem value="auto">تلقائي</SelectItem>{" "}
                      <SelectItem value="manual">يدوي</SelectItem>{" "}
                      <SelectItem value="disabled">معطل</SelectItem>{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                </Field>{" "}
                <Field label="التذكير التالي">
                  {" "}
                  <span className="text-[13px] text-slate-500">—</span>{" "}
                </Field>{" "}
              </div>{" "}
              <div className="space-y-3">
                {" "}
                <Field label="آخر متابعة">
                  {" "}
                  <span className="text-[13px] text-slate-500">
                    لم يتم بعد
                  </span>{" "}
                </Field>{" "}
                <Field label="المبلغ المستحق">
                  {" "}
                  <span className="text-[13px] font-bold text-red-600">
                    {(initialData?.totalReceivable || 0).toLocaleString()} ج.م
                  </span>{" "}
                </Field>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </TabsContent>{" "}
        {/* ─── Tab 4: Accounting / Invoicing (Odoo Exact) ─── */}{" "}
        <TabsContent value="accounting" className="py-4">
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {" "}
            {/* الحسابات البنكية (Left Side) */}{" "}
            <div className="order-2 md:order-1">
              {" "}
              <h3 className="font-bold text-slate-800 text-[13px] mb-3">
                الحسابات البنكية
              </h3>{" "}
              <div className="border border-slate-200 rounded-sm mb-6 overflow-hidden">
                {" "}
                <table className="w-full text-[12px]" dir="rtl">
                  {" "}
                  <thead>
                    {" "}
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {" "}
                      <th className="text-right py-2 px-3 font-bold text-slate-700">
                        البنك
                      </th>{" "}
                      <th className="text-right py-2 px-3 font-bold text-slate-700">
                        رقم الحساب
                      </th>{" "}
                      <th className="text-right py-2 px-3 font-bold text-slate-700">
                        إرسال المال
                      </th>{" "}
                      <th className="w-8"></th>{" "}
                    </tr>{" "}
                  </thead>{" "}
                  <tbody>
                    {" "}
                    {bankFields.length > 0 ? bankFields.map((field, index) => <tr key={field.id} className="border-b border-slate-100 hover:bg-slate-50 focus-within:bg-slate-50">
                          {" "}
                          <td className="py-1 px-1">
                            {" "}
                            <input {...register(`bankAccounts.${index}.bankName`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800" placeholder="البنك..." />{" "}
                          </td>{" "}
                          <td className="py-1 px-1">
                            {" "}
                            <input {...register(`bankAccounts.${index}.accNumber`, {
                        required: true
                      })} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" placeholder="رقم الحساب..." />{" "}
                          </td>{" "}
                          <td className="py-2 px-3 text-slate-500 text-center">
                            —
                          </td>{" "}
                          <td className="py-2 px-1 text-center">
                            {" "}
                            <Trash2 onClick={() => removeBank(index)} className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 cursor-pointer inline" />{" "}
                          </td>{" "}
                        </tr>) : <tr>
                        <td colSpan={4} className="text-center py-3 text-slate-400">
                          لا توجد سجلات
                        </td>
                      </tr>}{" "}
                  </tbody>{" "}
                </table>{" "}
                <div className="px-3 py-2 text-right border-t border-slate-100">
                  {" "}
                  <button type="button" onClick={() => appendBank({
                  bankName: "",
                  accNumber: ""
                })} className="text-[12px] font-bold text-[#017E84] hover:text-[#015e63] transition-colors">
                    إضافة بند
                  </button>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* القيود المحاسبية (Right Side) */}{" "}
            <div className="order-1 md:order-2">
              {" "}
              <h3 className="font-bold text-slate-800 text-[13px] mb-3">
                القيود المحاسبية
              </h3>{" "}
              <div className="space-y-3 mb-6">
                {" "}
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  {" "}
                  <label className="text-[12px] font-bold text-slate-600 text-right">
                    حساب مدين{" "}
                    <span className="text-slate-400 text-[10px] cursor-help" title="الحساب المدين الذي سيسجل عليه ديون هذا العميل (المرتبطة بفواتيره)">
                      ؟
                    </span>
                  </label>{" "}
                  <Select onValueChange={v => setValue("propertyAccountReceivableId", v, {
                  shouldDirty: true
                })} value={watch("propertyAccountReceivableId") || ""}>
                    {" "}
                    <SelectTrigger dir="rtl" className="h-8 text-[12px] border-0 border-b border-slate-200 hover:border-slate-300 focus:border-indigo-400 rounded-none shadow-none">
                      {" "}
                      <SelectValue placeholder="اختر حساب..." />{" "}
                    </SelectTrigger>{" "}
                    <SelectContent dir="rtl">
                      {" "}
                      {accountingOptions.receivableAccounts?.map((acc: any) => <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} {acc.name}
                        </SelectItem>)}{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                </div>{" "}
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  {" "}
                  <label className="text-[12px] font-bold text-slate-600 text-right">
                    حساب الدائن{" "}
                    <span className="text-slate-400 text-[10px] cursor-help" title="الحساب الدائن الذي يسجل عليه استحقاقات هذا المورد (مرتبطة بفواتير الشراء)">
                      ؟
                    </span>
                  </label>{" "}
                  <Select onValueChange={v => setValue("propertyAccountPayableId", v, {
                  shouldDirty: true
                })} value={watch("propertyAccountPayableId") || ""}>
                    {" "}
                    <SelectTrigger dir="rtl" className="h-8 text-[12px] border-0 border-b border-slate-200 hover:border-slate-300 focus:border-indigo-400 rounded-none shadow-none">
                      {" "}
                      <SelectValue placeholder="اختر حساب..." />{" "}
                    </SelectTrigger>{" "}
                    <SelectContent dir="rtl">
                      {" "}
                      {accountingOptions.payableAccounts?.map((acc: any) => <SelectItem key={acc.id} value={acc.id}>
                          {acc.code} {acc.name}
                        </SelectItem>)}{" "}
                    </SelectContent>{" "}
                  </Select>{" "}
                </div>{" "}
              </div>{" "}
              {!isModal && initialData?.id && <div className="text-right">
                  {" "}
                  <Link href={`/${locale}/accounting/partner_ledger?partnerId=${initialData.id}&partnerName=${initialData.name || ""}`} className="text-[12px] font-bold text-[#017E84] hover:text-[#015e63] transition-colors flex items-center gap-1 group">
                    {" "}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform ltr:hidden">
                      {" "}
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />{" "}
                    </svg>{" "}
                    <span>عرض تفاصيل الحسابات لدفتر الأستاذ</span>{" "}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-1 transition-transform rtl:hidden">
                      {" "}
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />{" "}
                    </svg>{" "}
                  </Link>{" "}
                </div>}{" "}
            </div>{" "}
          </div>{" "}
        </TabsContent>{" "}
        {/* ─── Tab 5: Internal Notes ─── */}{" "}
        <TabsContent value="notes" className="py-6">
          {" "}
          <Textarea {...register("notes")} placeholder="ملاحظات داخلية... مثل: رقم تليفون الاستاذ/محمد اسامه المحاسب" className="min-h-[200px] text-right text-[13px]" />{" "}
        </TabsContent>{" "}
        {/* ─── Tab 6: Sales Agreements (Odoo Exact) ─── */}{" "}
        <TabsContent value="sale_agreements" className="py-4">
          {" "}
          <div className="border border-slate-200 rounded-sm overflow-hidden">
            {" "}
            <table className="w-full text-[12px]" dir="rtl">
              {" "}
              <thead>
                {" "}
                <tr className="bg-slate-50 border-b border-slate-200">
                  {" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    المجموعة
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    خصم بيع 1
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    خصم بيع 2
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    خصم بيع 3
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    اضافة
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    تاريخ البدء
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    تاريخ الانتهاء
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    اللسنة
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    الفرع
                  </th>{" "}
                  <th className="w-8"></th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {saleAgreements.length > 0 ? saleAgreements.map((field, i) => <tr key={field.id} className="border-b border-slate-100 hover:bg-slate-50 focus-within:bg-slate-50 transition-colors">
                      {" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input {...register(`saleAgreements.${i}.group`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800" placeholder="المجموعة..." />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`saleAgreements.${i}.discount1`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`saleAgreements.${i}.discount2`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`saleAgreements.${i}.discount3`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`saleAgreements.${i}.addition`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="date" {...register(`saleAgreements.${i}.startDate`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="date" {...register(`saleAgreements.${i}.endDate`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input {...register(`saleAgreements.${i}.season`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800" placeholder="اللسنة..." />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input {...register(`saleAgreements.${i}.branch`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800" placeholder="الفرع..." />{" "}
                      </td>{" "}
                      <td className="py-2 px-1 text-center">
                        {" "}
                        <Trash2 onClick={() => removeSaleAgreement(i)} className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 cursor-pointer inline" />{" "}
                      </td>{" "}
                    </tr>) : <tr>
                    <td colSpan={10} className="text-center py-3 text-slate-400">
                      لا توجد سجلات
                    </td>
                  </tr>}{" "}
              </tbody>{" "}
            </table>{" "}
            <div className="px-3 py-2 text-right border-t border-slate-100">
              {" "}
              <button type="button" onClick={() => appendSaleAgreement({
              discount1: 0,
              discount2: 0,
              discount3: 0,
              addition: 0
            })} className="text-[12px] font-bold text-[#017E84] hover:text-[#015e63] transition-colors">
                إضافة بند
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </TabsContent>{" "}
        {/* ─── Tab 7: Purchase Agreements (Odoo Exact) ─── */}{" "}
        <TabsContent value="purchase_agreements" className="py-4">
          {" "}
          <div className="border border-slate-200 rounded-sm overflow-hidden">
            {" "}
            <table className="w-full text-[12px]" dir="rtl">
              {" "}
              <thead>
                {" "}
                <tr className="bg-slate-50 border-b border-slate-200">
                  {" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    المجموعة
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    خصم شراء 1
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    خصم شراء 2
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    خصم شراء 3
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    اضافة
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    تاريخ البدء
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    تاريخ الانتهاء
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    اللسنة
                  </th>{" "}
                  <th className="text-right py-2 px-3 font-bold text-slate-700">
                    الفرع
                  </th>{" "}
                  <th className="w-8"></th>{" "}
                </tr>{" "}
              </thead>{" "}
              <tbody>
                {" "}
                {purchaseAgreements.length > 0 ? purchaseAgreements.map((field, i) => <tr key={field.id} className="border-b border-slate-100 hover:bg-slate-50 focus-within:bg-slate-50 transition-colors">
                      {" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input {...register(`purchaseAgreements.${i}.group`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800" placeholder="المجموعة..." />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`purchaseAgreements.${i}.discount1`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`purchaseAgreements.${i}.discount2`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`purchaseAgreements.${i}.discount3`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="number" step="0.01" {...register(`purchaseAgreements.${i}.addition`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="date" {...register(`purchaseAgreements.${i}.startDate`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input type="date" {...register(`purchaseAgreements.${i}.endDate`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800 text-left font-numbers" dir="ltr" />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input {...register(`purchaseAgreements.${i}.season`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800" placeholder="اللسنة..." />{" "}
                      </td>{" "}
                      <td className="py-1 px-1">
                        {" "}
                        <input {...register(`purchaseAgreements.${i}.branch`)} className="w-full bg-transparent px-2 py-1 outline-none text-slate-800" placeholder="الفرع..." />{" "}
                      </td>{" "}
                      <td className="py-2 px-1 text-center">
                        {" "}
                        <Trash2 onClick={() => removePurchaseAgreement(i)} className="w-3.5 h-3.5 text-slate-400 hover:text-red-500 cursor-pointer inline" />{" "}
                      </td>{" "}
                    </tr>) : <tr>
                    <td colSpan={10} className="text-center py-3 text-slate-400">
                      لا توجد سجلات
                    </td>
                  </tr>}{" "}
              </tbody>{" "}
            </table>{" "}
            <div className="px-3 py-2 text-right border-t border-slate-100">
              {" "}
              <button type="button" onClick={() => appendPurchaseAgreement({
              discount1: 0,
              discount2: 0,
              discount3: 0,
              addition: 0
            })} className="text-[12px] font-bold text-[#017E84] hover:text-[#015e63] transition-colors">
                إضافة بند
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </TabsContent>{" "}
      </Tabs>{" "}
      {/* Removed internal chatter here, it is now in OdooFormShell */}{" "}
      {isModal && <div className="flex items-center justify-start gap-2 mt-4 bg-slate-50 p-3 rounded-md border border-slate-200">
          {" "}
          <button type="submit" disabled={loading} className="bg-[#017E84] text-white px-6 py-2 rounded-sm text-sm font-bold flex items-center justify-center min-w-[100px]">
            {" "}
            {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : "حفظ"}{" "}
          </button>{" "}
          {isDirty && <button type="button" onClick={() => {
        setClean();
        toast.info("تم تجاهل التعديلات");
      }} className="px-6 py-2 text-slate-500 hover:text-slate-800 text-sm font-bold bg-slate-200 hover:bg-slate-300 rounded-sm">
              {" "}
              تجاهل{" "}
            </button>}{" "}
        </div>}{" "}
    </form>;
  if (isModal) {
    return formContent;
  }
  return <>
      {" "}
      <MacStatusBar />{" "}
      {!isModal && isEdit && <TopPortal>
          {" "}
          <HeaderDropdowns />{" "}
        </TopPortal>}{" "}
      <OdooFormShell statusSteps={[]} currentStatus="" contextActions={[]} smartButtons={smartButtonsElement} chatterId={initialData?.id} chatterModel="partner">
        {" "}
        {formContent}{" "}
      </OdooFormShell>{" "}
    </>;
}