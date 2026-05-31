
import React from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch, Control, FieldErrors, Controller } from "react-hook-form";
import { ProductFormValues, Option, SupplierLine, BomLine, AttributeState, Metrics } from "./types";
import { OdooCombobox } from "@/components/ui/OdooCombobox";

export function ProductAccountingTab({ register, setValue, watch, control, accountOptions, handleOpenAccountDialog }: {
  register: UseFormRegister<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  watch: UseFormWatch<ProductFormValues>;
  control: Control<ProductFormValues>;
  accountOptions: { income: Option[], expense: Option[] };
  handleOpenAccountDialog: (name: string, type: "income" | "expense", field: "propertyAccountIncomeId" | "propertyAccountExpenseId") => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4">
                {" "}
                <div className="space-y-4">
                  {" "}
                  <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-1">
                    المدينين
                  </h3>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center group">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      {" "}
                      حساب الدخل{" "}
                      <span
                        className="text-slate-400 cursor-help px-2"
                        title="سيتم استخدام هذا الحساب في الفواتير لتقييم المبيعات."
                      >
                        ?
                      </span>{" "}
                    </label>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <Controller
                        name="propertyAccountIncomeId"
                        control={control}
                        render={({ field }) => (
                          <OdooCombobox
                            options={accountOptions.income}
                            value={field.value}
                            onChange={field.onChange}
                            onCreate={(val) =>
                              handleOpenAccountDialog(
                                val,
                                "income",
                                "propertyAccountIncomeId",
                              )
                            }
                            placeholder="إفتراضي (من الفئة)"
                            className="w-full"
                            searchable={true}
                            alwaysShowCreate={true}
                          />
                        )}
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="space-y-4">
                  {" "}
                  <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wide border-b border-slate-100 pb-1">
                    الدائنون
                  </h3>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center group">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      {" "}
                      حساب النفقات{" "}
                      <span
                        className="text-slate-400 cursor-help px-2"
                        title="سيتم استخدام هذا الحساب في فواتير الموردين لتقييم المشتريات."
                      >
                        ?
                      </span>{" "}
                    </label>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <Controller
                        name="propertyAccountExpenseId"
                        control={control}
                        render={({ field }) => (
                          <OdooCombobox
                            options={accountOptions.expense}
                            value={field.value}
                            onChange={field.onChange}
                            onCreate={(val) =>
                              handleOpenAccountDialog(
                                val,
                                "expense",
                                "propertyAccountExpenseId",
                              )
                            }
                            placeholder="إفتراضي (من الفئة)"
                            className="w-full"
                            searchable={true}
                            alwaysShowCreate={true}
                          />
                        )}
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2 text-right w-full cursor-pointer hover:text-blue-600 transition-colors">
                      نوع الأصل
                    </label>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <input autoComplete="off" autoCorrect="off" spellCheck={false}
                        type="text"
                        {...register("assetType")}
                        className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent"
                        placeholder="مثال: أصل ثابت، إلخ."
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                  <div className="grid grid-cols-[130px_1fr] items-center group">
                    {" "}
                    <label className="text-sm font-bold text-slate-700 pl-2">
                      {" "}
                      حساب فرق السعر{" "}
                      <span
                        className="text-slate-400 cursor-help px-2"
                        title="سيتم استخدام هذا الحساب لتقييم الفرق بين سعر الشراء والتكلفة المحاسبية."
                      >
                        ?
                      </span>{" "}
                    </label>{" "}
                    <div className="flex items-center gap-2">
                      {" "}
                      <Controller
                        name="priceDifferenceAccount"
                        control={control}
                        render={({ field }) => (
                          <OdooCombobox
                            options={accountOptions.expense}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="اختر حسابا..."
                            className="w-full"
                            searchable={true}
                          />
                        )}
                      />{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            
    </>
  );
}
