
import React from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch, Control, FieldErrors } from "react-hook-form";
import { ProductFormValues, Option, SupplierLine, BomLine, AttributeState, Metrics } from "./types";

export function ProductSalesTab({ register, setValue, convertArabicToEnglishNumbers }: {
  register: UseFormRegister<ProductFormValues>;
  setValue: UseFormSetValue<ProductFormValues>;
  convertArabicToEnglishNumbers: (val: string) => string;
}) {
  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in- duration-300">
                {" "}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {" "}
                  <div>
                    {" "}
                    <h4 className="border-b border-slate-300 pb-1 mb-4 text-slate-800 font-bold text-sm">
                      وصف المبيعات
                    </h4>{" "}
                    <textarea
                      {...register("descriptionSale")}
                      placeholder="هذا الوصف سيظهر في أوامر البيع والفواتير..."
                      className="w-full h-24 border border-slate-300 rounded p-2 text-sm focus:border-[#2563EB] outline-none resize-none"
                    />{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h4 className="border-b border-slate-300 pb-1 mb-4 text-slate-800 font-bold text-sm">
                      ضرائب العميل
                    </h4>{" "}
                    <div className="grid grid-cols-[130px_1fr] items-center">
                      {" "}
                      <label className="text-sm font-bold text-slate-700 pl-2">
                        نسبة الضريبة %
                      </label>{" "}
                      <div className="flex items-center gap-2">
                        {" "}
                        <input
                          type="number"
                          step="0.01"
                          {...register("tax_customer", {
                            onChange: (e) => {
                              const englishVal = convertArabicToEnglishNumbers(
                                e.target.value,
                              );
                              setValue("tax_customer", englishVal, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });
                            },
                          })}
                          className="w-full border-b border-slate-300 focus:border-[#2563EB] outline-none py-1 text-sm bg-transparent text-left"
                          dir="ltr"
                        />{" "}
                        <span className="text-sm text-slate-500">%</span>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            
    </>
  );
}
