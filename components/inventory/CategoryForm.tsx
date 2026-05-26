"use client";

import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { OdooCombobox } from "@/components/ui/OdooCombobox";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  duplicateCategory,
} from "@/app/actions/categories";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  RotateCcw,
  Box,
  Shuffle,
  Settings,
  ChevronDown,
  Copy,
  Trash2,
  Loader2,
} from "lucide-react";
import { TopPortal } from "@/components/common/TopPortal";
import { useFormDraft } from "@/hooks/useFormDraft";
import { useStatusStore } from "@/store/statusStore";
import { Chatter } from "@/components/chatter/Chatter";
interface CategoryFormProps {
  category?: any;
  categories: any[];
  accounts: any[];
  journals: any[];
}
export function CategoryForm({
  category,
  categories,
  accounts,
  journals,
}: CategoryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const locale = useLocale();
  const isNewRecord = !category?.id;
  const { saveDraft, loadDraft, clearDraft } = useFormDraft(
    "category_new",
    isNewRecord,
  );
  const getAccountByCode = (code: string) => {
    if (category) return "";
    return accounts.find((a) => a.code === code)?.id || "";
  };

  const getJournalByNameOrCode = () => {
    if (category) return "";
    const j = journals.find(
      (j) =>
        j.name.includes("المخزون") ||
        j.name.includes("مخازن") ||
        j.code === "INV" ||
        j.code === "STK"
    ) || journals[0];
    return j?.id || "";
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      name: category?.name || "",
      parentId: category?.parentId || "",
      removalStrategy: category?.removalStrategy || "",
      costingMethod: category?.costingMethod || "avco",
      valuation: category?.valuation || "real_time",
      propertyAccountIncomeId: category?.propertyAccountIncomeId || getAccountByCode("500001"),
      propertyAccountExpenseId: category?.propertyAccountExpenseId || getAccountByCode("400002"),
      propertyAccountPriceDifferenceId:
        category?.propertyAccountPriceDifferenceId || "",
      propertyStockValuationAccountId:
        category?.propertyStockAccountId || getAccountByCode("103029"),
      propertyStockJournalId: category?.propertyStockJournalId || getJournalByNameOrCode(),
      propertyStockInputAccountId: category?.propertyStockAccountInputId || getAccountByCode("103039"),
      propertyStockOutputAccountId:
        category?.propertyStockAccountOutputId || getAccountByCode("103049"),
    },
  });
  const valuationMethod = watch("valuation");
  const autoSaveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showActionsMenu, setShowActionsMenu] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { setFormStatus, clearStatus } = useStatusStore();
  const handleAction = async (action: "duplicate" | "delete") => {
    if (!category?.id) return;
    try {
      if (action === "delete") {
        setShowActionsMenu(false);
        setShowDeleteConfirm(true);
      } else if (action === "duplicate") {
        setShowActionsMenu(false);
        const newCat = await duplicateCategory(category.id);
        toast.success("تم أخذ نسخة بنجاح");
        router.push(`/${locale}/inventory/products/categories/${newCat.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ غير متوقع");
    }
  };
  const onSubmit = React.useCallback(async (data: any) => {
    try {
      const cleanData = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [
          k,
          v === "" || v === "null" ? null : v,
        ]),
      );
      if (category) {
        await updateCategory(category.id, cleanData);
        reset(data);
        if (returnUrl) {
          router.push(returnUrl);
        }
      } else {
        const newCat = await createCategory(cleanData);
        clearDraft();
        if (returnUrl) {
          router.replace(returnUrl);
        } else {
          router.replace(`/${locale}/inventory/config/categories/${newCat.id}`);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء الحفظ");
    }
  }, [category, clearDraft, returnUrl, router, locale]);
  React.useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (type === "change") {
        if (isNewRecord) {
          // Do not auto-save new records to prevent duplicate creation errors
          return;
        } else {
          if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = setTimeout(() => {
            handleSubmit(async (data) => {
              try {
                const cleanData = Object.fromEntries(
                  Object.entries(data).map(([k, v]) => [
                    k,
                    v === "" || v === "null" ? null : v,
                  ]),
                );
                await updateCategory(category.id, cleanData);
              } catch (error) {
                console.error("Auto-save error:", error);
              }
            })();
          }, 1500);
        }
      }
    });
    return () => {
      subscription.unsubscribe();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [
    watch,
    isNewRecord,
    handleSubmit,
    category?.id,
  ]);

  React.useEffect(() => {
    setFormStatus({
      isSaving: isSubmitting,
      hasUnsavedChanges: isDirty,
      saveTriggerFn: () => handleSubmit(onSubmit)(),
      discardTriggerFn: () =>
        returnUrl
          ? router.push(returnUrl)
          : router.push(`/${locale}/inventory/products/categories`),
    });
    return () => clearStatus();
  }, [
    isSubmitting,
    isDirty,
    handleSubmit,
    onSubmit,
    returnUrl,
    router,
    locale,
    setFormStatus,
    clearStatus,
  ]);
  const parentCategoryOptions = categories
    .filter((c) => c.id !== category?.id)
    .map((c: any) => ({
      value: c.id,
      label: c.name,
    }));
  const allAccountOptions = accounts.map((a: any) => ({
    value: a.id,
    label: `${a.code} ${a.name}`,
  }));
  const incomeAccountOptions = allAccountOptions;
  const expenseAccountOptions = allAccountOptions;
  const journalOptions = journals.map((j: any) => ({
    value: j.id,
    label: `${j.code} - ${j.name}`,
  }));
  return (
    <div
      className="bg-white min-h-screen w-full font-sans text-right"
      dir="rtl"
    >
      {" "}
      <TopPortal>
        {" "}
        <div
          className="flex items-center gap-1.5 shrink-0 rtl:flex-row-reverse"
          dir="rtl"
        >
          {" "}
          {}{" "}
          {category && (
            <div className="flex items-center pr-2 mr-2 border-r border-gray-200">
              {" "}
              <button
                type="button"
                className="p-1.5 rounded-sm transition-colors text-gray-300 cursor-not-allowed"
              >
                {" "}
                <ChevronLeft className="w-4 h-4" />{" "}
              </button>{" "}
              <button
                type="button"
                className="p-1.5 rounded-sm transition-colors text-gray-300 cursor-not-allowed"
              >
                {" "}
                <ChevronRight className="w-4 h-4" />{" "}
              </button>{" "}
            </div>
          )}{" "}
          {}{" "}
          {category && (
            <div className="relative">
              {" "}
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                type="button"
                className="flex items-center gap-1.5 bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-sm text-[11px] hover:bg-gray-50 transition-colors font-semibold"
              >
                {" "}
                <Settings className="w-3.5 h-3.5 text-gray-400" /> إجراء{" "}
                <ChevronDown className="w-3 h-3 text-gray-400" />{" "}
              </button>{" "}
              {showActionsMenu && (
                <div
                  className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.08)] rounded-md py-1 z-50 overflow-hidden text-right"
                  dir="rtl"
                >
                  {" "}
                  <button
                    onClick={() => handleAction("duplicate")}
                    type="button"
                    className="w-full text-right px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    {" "}
                    <Copy className="w-3.5 h-3.5 text-gray-400" /> إنشاء نسخة
                    مطابقة{" "}
                  </button>{" "}
                  <div className="border-t border-gray-100 my-1"></div>{" "}
                  <button
                    onClick={() => handleAction("delete")}
                    type="button"
                    className="w-full text-right px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    {" "}
                    <Trash2 className="w-3.5 h-3.5 text-red-500" /> حذف
                    نهائي{" "}
                  </button>{" "}
                </div>
              )}{" "}
            </div>
          )}{" "}
          {isDirty && (
            <>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="bg-[#017E84] text-white px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-[#006A6F] transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5" />
                )}
                حفظ يدوي
              </button>
              <button
                onClick={() => router.push(`/${locale}/inventory/products/categories`)}
                disabled={isSubmitting}
                className="bg-white border border-slate-300 text-slate-700 px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> تجاهل
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() =>
              router.push(`/${locale}/inventory/products/categories/new`)
            }
            className="bg-white text-gray-700 border border-gray-200 px-3 py-1 rounded-sm text-[11px] font-bold hover:bg-gray-50 transition-colors"
          >
            {" "}
            جديد{" "}
          </button>{" "}
        </div>{" "}
      </TopPortal>{" "}
      <div className="w-full pb-20">
        {" "}
        {}{" "}
        {category && (
          <div
            className="flex justify-end bg-white border-b border-slate-200"
            dir="ltr"
          >
            {" "}
            <div className="flex divide-x divide-slate-200 border-l border-slate-200 h-[44px]">
              {" "}
              {}{" "}
              <Link
                href={`/${locale}/inventory/products?categoryId=${category.id}`}
                className="h-full px-4 hover:bg-slate-50 flex items-center justify-between gap-3 min-w-[120px] transition-colors"
              >
                {" "}
                <div className="flex flex-col items-center justify-center w-full leading-tight">
                  {" "}
                  <span className="font-bold text-[#017E84] text-[13px]">
                    {category._count?.products || 0}
                  </span>{" "}
                  <span className="text-[11px] text-slate-600 font-bold">
                    المنتجات
                  </span>{" "}
                </div>{" "}
                <Box className="w-4 h-4 text-slate-600" />{" "}
              </Link>{" "}
              {}{" "}
              <button className="h-full px-4 hover:bg-slate-50 flex items-center justify-between gap-3 min-w-[120px] transition-colors">
                {" "}
                <div className="flex flex-col items-center justify-center w-full leading-tight">
                  {" "}
                  <span className="font-bold text-[#017E84] text-[13px]">
                    0
                  </span>{" "}
                  <span className="text-[11px] text-slate-600 font-bold">
                    قواعد التخزين
                  </span>{" "}
                </div>{" "}
                <Shuffle className="w-4 h-4 text-slate-600" />{" "}
              </button>{" "}
            </div>{" "}
          </div>
        )}{" "}
        {}{" "}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white px-4 sm:px-8 pt-4 pb-12 w-full relative"
          autoComplete="off"
        >
          {" "}
          {}{" "}
          <div className="mb-6 flex gap-4">
            {" "}
            <div className="flex-1">
              {" "}
              <label className="text-[12px] font-bold text-slate-600 block mb-1">
                فئة
              </label>{" "}
              <input
                {...register("name", {
                  required: true,
                })}
                autoComplete="new-password"
                className="text-3xl font-bold bg-transparent outline-none w-full text-slate-900 placeholder-slate-200 border-b border-transparent hover:border-slate-300 focus:border-slate-800 transition-all pb-1"
                placeholder="e.g. All"
              />{" "}
            </div>{" "}
          </div>{" "}
          {}{" "}
          <div className="grid grid-cols-[130px_1fr] items-center mb-6">
            {" "}
            <label className="text-sm font-bold text-slate-700">
              الفئة الرئيسية
            </label>{" "}
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <OdooCombobox
                  options={[
                    {
                      value: "",
                      label: "بدون فئة أم",
                    },
                    ...parentCategoryOptions,
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                  searchMoreUrl={`/${locale}/inventory/products/categories`}
                  createUrl={`/${locale}/inventory/products/categories/new`}
                  placeholder="بدون فئة أم"
                  searchable={true}
                />
              )}
            />{" "}
          </div>{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0">
            {" "}
            {}{" "}
            <div>
              {" "}
              {}{" "}
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide border-b border-slate-200 pb-2 mt-6">
                اللوجستيات
              </h3>{" "}
              <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                {" "}
                <label className="text-sm font-bold text-slate-700">
                  المسارات
                </label>{" "}
                <div className="text-sm text-slate-400 italic py-1 border-b border-slate-200">
                  {" "}
                  (يُورث من الفئة الأم){" "}
                </div>{" "}
              </div>{" "}
              <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                {" "}
                <label className="text-sm font-bold text-slate-700">
                  استراتيجية فرض الإزالة
                </label>{" "}
                <select
                  {...register("removalStrategy")}
                  className="w-full border-b border-slate-300 focus:border-indigo-500 outline-none py-1 text-sm bg-transparent"
                >
                  {" "}
                  <option value="">---</option>{" "}
                  <option value="fifo">الوارد أولاً يخرج أولاً (FIFO)</option>{" "}
                  <option value="lifo">الوارد أخيراً يخرج أولاً (LIFO)</option>{" "}
                  <option value="fefo">أول انتهاء يخرج أولاً (FEFO)</option>{" "}
                  <option value="closest">أقرب موقع</option>{" "}
                </select>{" "}
              </div>{" "}
            </div>{" "}
            {}{" "}
            <div>
              {" "}
              {}{" "}
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide border-b border-slate-200 pb-2 mt-6">
                تقييم المخزون
              </h3>{" "}
              <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                {" "}
                <label className="text-sm font-bold text-slate-700">
                  طريقة حساب التكاليف
                </label>{" "}
                <select
                  {...register("costingMethod")}
                  className="w-full border-b border-slate-300 focus:border-indigo-500 outline-none py-1 text-sm bg-transparent"
                >
                  {" "}
                  <option value="avco">متوسط التكلفة (AVCO)</option>{" "}
                  <option value="standard">السعر القياسي</option>{" "}
                  <option value="fifo">الوارد أولاً يخرج أولاً (FIFO)</option>{" "}
                </select>{" "}
              </div>{" "}
              <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                {" "}
                <label className="text-sm font-bold text-slate-700">
                  تقييم المخزون
                </label>{" "}
                <select
                  {...register("valuation")}
                  className="w-full border-b border-slate-300 focus:border-indigo-500 outline-none py-1 text-sm bg-transparent"
                >
                  {" "}
                  <option value="real_time">مؤتمت</option>{" "}
                  <option value="manual_periodic">يدوي</option>{" "}
                </select>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {}{" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0 mt-8">
            {" "}
            {}{" "}
            <div>
              {" "}
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide border-b border-slate-200 pb-2">
                خصائص الحساب
              </h3>{" "}
              <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                {" "}
                <label className="text-sm font-bold text-slate-700">
                  حساب الدخل
                </label>{" "}
                <Controller
                  name="propertyAccountIncomeId"
                  control={control}
                  render={({ field }) => (
                    <OdooCombobox
                      options={incomeAccountOptions}
                      value={field.value}
                      onChange={field.onChange}
                      searchMoreUrl={`/${locale}/accounting/chart-of-accounts`}
                      detailUrl={`/${locale}/accounting/chart-of-accounts`}
                      placeholder="اختر حساب..."
                      searchable={true}
                    />
                  )}
                />{" "}
              </div>{" "}
              <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                {" "}
                <label className="text-sm font-bold text-slate-700">
                  حساب النفقات
                </label>{" "}
                <Controller
                  name="propertyAccountExpenseId"
                  control={control}
                  render={({ field }) => (
                    <OdooCombobox
                      options={expenseAccountOptions}
                      value={field.value}
                      onChange={field.onChange}
                      searchMoreUrl={`/${locale}/accounting/chart-of-accounts`}
                      detailUrl={`/${locale}/accounting/chart-of-accounts`}
                      placeholder="اختر حساب..."
                      searchable={true}
                    />
                  )}
                />{" "}
              </div>{" "}
              {}{" "}
              {valuationMethod === "real_time" && (
                <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    حساب فرق السعر
                  </label>{" "}
                  <Controller
                    name="propertyAccountPriceDifferenceId"
                    control={control}
                    render={({ field }) => (
                      <OdooCombobox
                        options={expenseAccountOptions}
                        value={field.value}
                        onChange={field.onChange}
                        searchMoreUrl={`/${locale}/accounting/chart-of-accounts`}
                        detailUrl={`/${locale}/accounting/chart-of-accounts`}
                        placeholder="اختر حساب..."
                        searchable={true}
                      />
                    )}
                  />{" "}
                </div>
              )}{" "}
            </div>{" "}
            {}{" "}
            {valuationMethod === "real_time" && (
              <div>
                {" "}
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide border-b border-slate-200 pb-2">
                  خصائص حساب المخزون
                </h3>{" "}
                <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    حساب تقييم المخزون
                  </label>{" "}
                  <Controller
                    name="propertyStockValuationAccountId"
                    control={control}
                    render={({ field }) => (
                      <OdooCombobox
                        options={allAccountOptions}
                        value={field.value}
                        onChange={field.onChange}
                        searchMoreUrl={`/${locale}/accounting/chart-of-accounts`}
                        detailUrl={`/${locale}/accounting/chart-of-accounts`}
                        placeholder="اختر حساب..."
                        searchable={true}
                      />
                    )}
                  />{" "}
                </div>{" "}
                <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    دفتر يومية المخزون
                  </label>{" "}
                  <Controller
                    name="propertyStockJournalId"
                    control={control}
                    render={({ field }) => (
                      <OdooCombobox
                        options={journalOptions}
                        value={field.value}
                        onChange={field.onChange}
                        searchMoreUrl={`/${locale}/accounting/configuration/journals`}
                        detailUrl={`/${locale}/accounting/configuration/journals`}
                        placeholder="اختر دفتر يومية..."
                        searchable={true}
                      />
                    )}
                  />{" "}
                </div>{" "}
                <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    حساب مدخلات المخزون
                  </label>{" "}
                  <Controller
                    name="propertyStockInputAccountId"
                    control={control}
                    render={({ field }) => (
                      <OdooCombobox
                        options={allAccountOptions}
                        value={field.value}
                        onChange={field.onChange}
                        searchMoreUrl={`/${locale}/accounting/chart-of-accounts`}
                        detailUrl={`/${locale}/accounting/chart-of-accounts`}
                        placeholder="اختر حساب..."
                        searchable={true}
                      />
                    )}
                  />{" "}
                </div>{" "}
                <div className="grid grid-cols-[130px_1fr] items-center mb-4">
                  {" "}
                  <label className="text-sm font-bold text-slate-700">
                    حساب مخرجات المخزون
                  </label>{" "}
                  <Controller
                    name="propertyStockOutputAccountId"
                    control={control}
                    render={({ field }) => (
                      <OdooCombobox
                        options={allAccountOptions}
                        value={field.value}
                        onChange={field.onChange}
                        searchMoreUrl={`/${locale}/accounting/chart-of-accounts`}
                        detailUrl={`/${locale}/accounting/chart-of-accounts`}
                        placeholder="اختر حساب..."
                        searchable={true}
                      />
                    )}
                  />{" "}
                </div>{" "}
                {}{" "}
              </div>
            )}{" "}
          </div>{" "}
        </form>{" "}
        {}{" "}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="حذف الفئة"
          message="هل أنت متأكد من حذف هذه الفئة نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
          confirmLabel="حذف نهائي"
          cancelLabel="إلغاء"
          variant="danger"
          loading={isDeleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            setIsDeleting(true);
            try {
              const result = await deleteCategory(category.id);
              if (result?.error) {
                toast.error(result.error);
              } else {
                router.push(`/${locale}/inventory/products/categories`);
              }
            } catch (e: any) {
              toast.error(e?.message || "حدث خطأ أثناء حذف الفئة");
            } finally {
              setIsDeleting(false);
              setShowDeleteConfirm(false);
            }
          }}
        />{" "}
      </div>{" "}
    </div>
  );
}
