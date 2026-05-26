
import React from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch, Control, FieldErrors } from "react-hook-form";
import { ProductFormValues, Option, SupplierLine, BomLine, AttributeState, Metrics } from "./types";
import { OdooCombobox } from "@/components/ui/OdooCombobox";
import { Controller } from "react-hook-form";

export function ProductGeneralTab({ register, control, watch, errors, fetchedCategories, uomOptionsState, secondaryUomOptionsState, isAdmin }: {
  register: UseFormRegister<ProductFormValues>;
  control: Control<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  fetchedCategories: Option[];
  uomOptionsState: Option[];
  secondaryUomOptionsState: Option[];
  isAdmin: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                {" "}
                {}{" "}
                <div className="space-y-3">
                  {" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2 border-l border-transparent">
                      {t("type")}
                    </label>{" "}
                    <select
                      {...register("detailedType")}
                      className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                    >
                      {" "}
                      <option value="consu" className="font-bold">
                        استهلاكي
                      </option>{" "}
                      <option value="service">خدمة</option>{" "}
                      <option value="storable">منتج قابل للتخزين</option>{" "}
                    </select>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      سياسة الفوترة
                    </label>{" "}
                    <select
                      {...register("invoicingPolicy")}
                      className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                    >
                      {" "}
                      <option value="ordered">الكميات المطلوبة</option>{" "}
                      <option value="delivered">الكميات المستلمة</option>{" "}
                    </select>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      وحدة القياس
                    </label>{" "}
                    <div className="flex items-center gap-1 w-full">
                      {" "}
                      <div className="flex-1">
                        {" "}
                        <Controller
                          name="uom"
                          control={control}
                          render={({ field }) => (
                            <OdooCombobox
                              options={uomOptionsState}
                              value={field.value}
                              onChange={field.onChange}
                              onCreate={(val) => openUomDialog("uom")}
                              placeholder="قطعه"
                              className={!field.value ? "border-b-red-500" : ""}
                              searchable={true}
                              disabled={hasStock}
                            />
                          )}
                        />{" "}
                      </div>{" "}
                      <button
                        type="button"
                        onClick={() => !hasStock && openUomDialog("uom")}
                        disabled={hasStock}
                        className={`p-1 rounded transition-colors ${hasStock ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-100 text-slate-400 hover:text-[#2563EB]"}`}
                        title={
                          hasStock
                            ? "لا يمكن تعديل وحدة القياس لوجود رصيد"
                            : "إدارة وحدات القياس"
                        }
                      >
                        {" "}
                        <ExternalLink className="w-4 h-4" />{" "}
                      </button>{" "}
                    </div>{" "}
                  </div>{" "}
                  {}{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center mt-2">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      وحدة ثانوية؟
                    </label>{" "}
                    <Controller
                      name="hasSecondaryUnit"
                      control={control}
                      render={({ field }) => (
                        <input autoComplete="off" autoCorrect="off" spellCheck={false}
                          type="checkbox"
                          checked={!!field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            setHasUnsavedChangesSync(true);
                          }}
                          disabled={hasStock}
                          className="checkbox checkbox-xs rounded-sm border-slate-400 checked:bg-[#2563EB]"
                        />
                      )}
                    />{" "}
                  </div>{" "}
                  {hasSecondaryUnit && (
                    <>
                      {" "}
                      <div className="grid grid-cols-[130px_1fr] items-center mt-2">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2 text-right w-full cursor-pointer hover:text-blue-600 transition-colors">
                          الثانوية UOM.
                        </label>{" "}
                        <div className="flex items-center gap-1 w-full">
                          {" "}
                          <div className="flex-1">
                            {" "}
                            <Controller
                              name="secondaryUom"
                              control={control}
                              render={({ field }) => (
                                <OdooCombobox
                                  options={secondaryUomOptionsState}
                                  value={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
                                    if (val) {
                                      const converted =
                                        convertArabicToEnglishNumbers(
                                          String(val),
                                        );
                                      const match =
                                        converted.match(/(\d+[\d.]*)/);
                                      if (match) {
                                        const extractedFactor = parseFloat(
                                          match[1],
                                        );
                                        if (extractedFactor > 0) {
                                          setValue(
                                            "secondaryUomFactor",
                                            extractedFactor,
                                          );
                                        }
                                      }
                                    }
                                  }}
                                  onCreate={(val) =>
                                    openUomDialog("secondaryUom")
                                  }
                                  placeholder="اختر وحدة ثانوية..."
                                  searchable={true}
                                  disabled={hasStock}
                                  className="w-full text-lg font-bold min-h-[40px] flex items-center"
                                />
                              )}
                            />{" "}
                          </div>{" "}
                          <button
                            type="button"
                            onClick={() =>
                              !hasStock && openUomDialog("secondaryUom")
                            }
                            disabled={hasStock}
                            className={`p-1 rounded transition-colors ${hasStock ? "text-slate-300 cursor-not-allowed" : "hover:bg-slate-100 text-slate-400 hover:text-[#2563EB]"}`}
                            title={
                              hasStock
                                ? "لا يمكن التعديل لوجود رصيد"
                                : "إدارة وحدات القياس"
                            }
                          >
                            {" "}
                            <ExternalLink className="w-4 h-4" />{" "}
                          </button>{" "}
                        </div>{" "}
                      </div>{" "}
                      {}{" "}
                      <div className="hidden">
                        {" "}
                        <label className="text-sm font-bold text-slate-700 pl-2 text-right w-full">
                          معامل التحويل
                        </label>{" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <input autoComplete="off" autoCorrect="off" spellCheck={false}
                            type="number"
                            step="0.01"
                            {...register("secondaryUomFactor")}
                            onChange={(e) => {
                              const val = convertArabicToEnglishNumbers(
                                e.target.value,
                              );
                              setValue(
                                "secondaryUomFactor",
                                val ? parseFloat(val) : 1,
                              );
                            }}
                            disabled={hasStock}
                            className="w-32 border border-slate-200 rounded focus:border-[#2563EB] outline-none py-1.5 px-2 text-sm bg-transparent font-bold"
                            placeholder="مثال: 70"
                          />{" "}
                        </div>{" "}
                      </div>{" "}
                    </>
                  )}
                </div>{" "}
                {}{" "}
                <div className="space-y-3">
                  {" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      {t("salePrice")}
                    </label>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <Controller
                        name="price"
                        control={control}
                        render={({ field }) => (
                          <input autoComplete="off" autoCorrect="off" spellCheck={false}
                            type="text"
                            inputMode="decimal"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = convertArabicToEnglishNumbers(
                                e.target.value,
                              ).replace(/[^0-9.]/g, "");
                              field.onChange(val);
                              setHasUnsavedChangesSync(true);
                            }}
                            className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-lg font-bold text-slate-800 bg-transparent text-left"
                            dir="ltr"
                          />
                        )}
                      />{" "}
                      <span className="text-sm text-slate-500 font-bold">
                        ج.م
                      </span>{" "}
                    </div>{" "}
                  </div>{" "}
                  {isAdmin && (
                    <div className="grid grid-cols-[130px_1fr] items-center">
                      {" "}
                      <label className="text-sm font-bold text-slate-700 pl-2">
                        {t("cost")}
                      </label>{" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <Controller
                          name="cost"
                          control={control}
                          render={({ field }) => (
                            <input autoComplete="off" autoCorrect="off" spellCheck={false}
                              type="text"
                              inputMode="decimal"
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const val = convertArabicToEnglishNumbers(
                                  e.target.value,
                                ).replace(/[^0-9.]/g, "");
                                field.onChange(val);
                                setHasUnsavedChangesSync(true);
                              }}
                              className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-lg font-bold text-slate-800 bg-transparent text-left"
                              dir="ltr"
                            />
                          )}
                        />{" "}
                        <span className="text-sm text-slate-500 font-bold">
                          ج.م
                        </span>{" "}
                      </div>{" "}
                    </div>
                  )}
                  <div className="grid grid-cols-[130px_1fr] items-center mt-4 group">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2 text-right w-full cursor-pointer hover:text-blue-600 transition-colors">
                      فئة المنتج
                    </label>{" "}
                    <div className="flex items-center w-full">
                      {" "}
                      <div className="flex-1">
                        {" "}
                        <Controller
                          name="category"
                          control={control}
                          render={({ field }) => (
                            <OdooCombobox
                              options={finalCategoryOptions}
                              value={field.value}
                              onChange={field.onChange}
                              onCreate={(val) => handleOpenCategoryDialog(val)}
                              onExternalLink={(val) => handleEditCategory(val)}
                              onSearchMore={async () => {
                                const name = watch("name");
                                if (name && name.trim()) {
                                  try {
                                    const savedId = await handleSave(
                                      true,
                                      true,
                                    );
                                    if (savedId) {
                                      router.push(
                                        `/${locale}/inventory/config/categories?returnUrl=/${locale}/inventory/products/${savedId}`,
                                      );
                                      return;
                                    }
                                  } catch (e) {}
                                }
                                router.push(
                                  `/${locale}/inventory/config/categories`,
                                );
                              }}
                              placeholder="اختر فئة المنتج..."
                              className="w-full text-lg font-bold min-h-[40px] flex items-center border-b border-slate-300 focus-within:border-[#2563EB]"
                              searchable={true}
                              maxOptions={6}
                            />
                          )}
                        />{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            
    </>
  );
}
