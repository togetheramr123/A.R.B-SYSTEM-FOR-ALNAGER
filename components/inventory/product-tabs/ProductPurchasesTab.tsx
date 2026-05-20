
import React from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch, Control, FieldErrors } from "react-hook-form";
import { ProductFormValues, Option, SupplierLine, BomLine, AttributeState, Metrics } from "./types";
import { Plus, Trash2 } from "lucide-react";
import { OdooCombobox } from "@/components/ui/OdooCombobox";

export function ProductPurchasesTab({ supplierLines, vendorOptions, handleAddSupplierLine, handleSupplierChange, handleRemoveSupplierLine, register, setValue, convertArabicToEnglishNumbers }: any) {
  return (
    <>
      <div className="space-y-8 animate-in fade-in slide-in- duration-300">
                {" "}
                {}{" "}
                <div>
                  {" "}
                  <div className="flex items-center justify-between mb-4">
                    {" "}
                    <h3 className="text-lg font-bold text-slate-800">
                      الموردين
                    </h3>{" "}
                    <button
                      onClick={handleAddSupplierLine}
                      className="text-sm text-[#2563EB] hover:underline font-medium flex items-center gap-1"
                    >
                      {" "}
                      <span>+ إضافة مورد</span>{" "}
                    </button>{" "}
                  </div>{" "}
                  <div className="border rounded-sm overflow-hidden">
                    {" "}
                    <table className="w-full text-sm text-right">
                      {" "}
                      <thead className="bg-slate-50 text-slate-600 font-medium">
                        {" "}
                        <tr>
                          {" "}
                          <th className="p-3 border-b border-l border-slate-200">
                            <div className="flex items-center resize-x overflow-hidden min-w-[80px]">
                              المورد
                            </div>
                          </th>{" "}
                          <th className="p-3 border-b border-l border-slate-200 w-32">
                            <div className="flex items-center resize-x overflow-hidden min-w-[60px]">
                              الكمية (الحد الأدنى)
                            </div>
                          </th>{" "}
                          <th className="p-3 border-b border-l border-slate-200 w-32">
                            <div className="flex items-center resize-x overflow-hidden min-w-[60px]">
                              السعر
                            </div>
                          </th>{" "}
                          <th className="p-3 border-b border-l border-slate-200 w-32">
                            <div className="flex items-center resize-x overflow-hidden min-w-[60px]">
                              وقت التسليم (أيام)
                            </div>
                          </th>{" "}
                          <th className="p-3 border-b border-l border-slate-200 w-10"></th>{" "}
                        </tr>{" "}
                      </thead>{" "}
                      <tbody className="divide-y">
                        {" "}
                        {supplierLines.map((line) => (
                          <tr key={line.id} className="group hover:bg-slate-50">
                            {" "}
                            <td className="p-1">
                              {" "}
                              <OdooCombobox
                                options={vendorOptions}
                                value={line.partnerId}
                                onChange={(val) =>
                                  handleSupplierChange(
                                    line.id,
                                    "partnerId",
                                    val,
                                  )
                                }
                                placeholder="اختر مورد..."
                              />{" "}
                            </td>{" "}
                            <td className="p-1 border-r">
                              {" "}
                              <input
                                type="number"
                                value={line.minQty}
                                onChange={(e) => {
                                  const val = convertArabicToEnglishNumbers(
                                    e.target.value,
                                  );
                                  handleSupplierChange(
                                    line.id,
                                    "minQty",
                                    val ? parseFloat(val) : 0,
                                  );
                                }}
                                className="w-full p-1 bg-transparent outline-none focus:bg-white"
                              />{" "}
                            </td>{" "}
                            <td className="p-1 border-r">
                              {" "}
                              <input
                                type="number"
                                value={line.price}
                                onChange={(e) => {
                                  const val = convertArabicToEnglishNumbers(
                                    e.target.value,
                                  );
                                  handleSupplierChange(
                                    line.id,
                                    "price",
                                    val ? parseFloat(val) : 0,
                                  );
                                }}
                                className="w-full p-1 bg-transparent outline-none focus:bg-white"
                              />{" "}
                            </td>{" "}
                            <td className="p-1 border-r">
                              {" "}
                              <input
                                type="number"
                                value={line.delay}
                                onChange={(e) => {
                                  const val = convertArabicToEnglishNumbers(
                                    e.target.value,
                                  );
                                  handleSupplierChange(
                                    line.id,
                                    "delay",
                                    val ? parseInt(val) : 0,
                                  );
                                }}
                                className="w-full p-1 bg-transparent outline-none focus:bg-white"
                              />{" "}
                            </td>{" "}
                            <td className="p-1 border-r text-center">
                              {" "}
                              <button
                                onClick={() =>
                                  handleRemoveSupplierLine(line.id)
                                }
                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                {" "}
                                <Trash2 className="w-4 h-4" />{" "}
                              </button>{" "}
                            </td>{" "}
                          </tr>
                        ))}
                        {supplierLines.length === 0 && (
                          <tr>
                            {" "}
                            <td
                              colSpan={5}
                              className="p-8 text-center text-slate-400 italic"
                            >
                              {" "}
                              لا يوجد موردين محددين لهذا المنتج.{" "}
                            </td>{" "}
                          </tr>
                        )}
                      </tbody>{" "}
                    </table>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                  {" "}
                  <div>
                    {" "}
                    <h4 className="border-b border-slate-300 pb-1 mb-4 text-slate-800 font-bold text-sm">
                      فواتير المورد
                    </h4>{" "}
                    <div className="space-y-4">
                      {" "}
                      <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                        {" "}
                        <label className="text-sm text-slate-700 font-bold">
                          ضرائب المورد %
                        </label>{" "}
                        <div className="flex items-center gap-2">
                          {" "}
                          <input
                            type="number"
                            step="0.01"
                            {...register("tax_vendor", {
                              onChange: (e) => {
                                const englishVal =
                                  convertArabicToEnglishNumbers(e.target.value);
                                setValue("tax_vendor", englishVal, {
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
                      <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                        {" "}
                        <label className="text-sm text-slate-700 font-bold pt-1">
                          التحكم في الفواتير
                        </label>{" "}
                        <div className="space-y-2">
                          {" "}
                          <label className="flex items-center gap-2 cursor-pointer">
                            {" "}
                            <input
                              type="radio"
                              value="ordered"
                              {...register("controlPolicy")}
                              className="text-[#2563EB] focus:ring-[#2563EB]"
                            />{" "}
                            <span className="text-sm text-slate-700">
                              على الكميات المطلوبة
                            </span>{" "}
                          </label>{" "}
                          <label className="flex items-center gap-2 cursor-pointer">
                            {" "}
                            <input
                              type="radio"
                              value="received"
                              {...register("controlPolicy")}
                              className="text-[#2563EB] focus:ring-[#2563EB]"
                            />{" "}
                            <span className="text-sm text-slate-700">
                              على الكميات المستلمة
                            </span>{" "}
                          </label>{" "}
                        </div>{" "}
                      </div>{" "}
                    </div>{" "}
                  </div>{" "}
                  <div>
                    {" "}
                    <h4 className="border-b border-slate-300 pb-1 mb-4 text-slate-800 font-bold text-sm">
                      وصف الشراء
                    </h4>{" "}
                    <textarea
                      {...register("descriptionPurchase")}
                      placeholder="هذا الوصف سيظهر في أوامر الشراء..."
                      className="w-full h-24 border border-slate-300 rounded p-2 text-sm focus:border-[#2563EB] outline-none resize-none"
                    />{" "}
                  </div>{" "}
                </div>{" "}
              </div>
            
    </>
  );
}
