
import React from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch, Control, FieldErrors } from "react-hook-form";
import { ProductFormValues, Option, SupplierLine, BomLine, AttributeState, Metrics } from "./types";
import { Plus, Trash2 } from "lucide-react";
import { OdooCombobox } from "@/components/ui/OdooCombobox";

export function ProductComponentsTab({ bomLines, productOptions, handleAddComponent, handleComponentChange, handleRemoveComponent, convertArabicToEnglishNumbers, initialDataId, uomOptionsState }: {
  bomLines: BomLine[];
  productOptions: Option[];
  handleAddComponent: () => void;
  handleComponentChange: (id: string, field: string, value: any) => void;
  handleRemoveComponent: (id: string) => void;
  convertArabicToEnglishNumbers: (val: string) => string;
  initialDataId?: string;
  uomOptionsState: Option[];
}) {
  return (
    <>
      <div className="space-y-4">
                {" "}
                <div className="border border-slate-200 rounded-sm overflow-hidden">
                  {" "}
                  <table className="w-full text-sm text-right">
                    {" "}
                    <thead className="bg-slate-50 text-slate-700 font-bold">
                      {" "}
                      <tr>
                        {" "}
                        <th className="px-4 py-2 border-b w-1/2 border-l border-slate-200">
                          <div className="flex items-center resize-x overflow-hidden min-w-[80px]">
                            المكون (الصنف)
                          </div>
                        </th>{" "}
                        <th className="px-4 py-2 border-b w-1/4 border-l border-slate-200">
                          <div className="flex items-center resize-x overflow-hidden min-w-[60px]">
                            الكمية
                          </div>
                        </th>{" "}
                        <th className="px-4 py-2 border-b w-1/4 border-l border-slate-200">
                          <div className="flex items-center resize-x overflow-hidden min-w-[80px]">
                            وحدة القياس
                          </div>
                        </th>{" "}
                        <th className="px-4 py-2 border-b w-[50px]"></th>{" "}
                      </tr>{" "}
                    </thead>{" "}
                    <tbody className="divide-y divide-slate-100">
                      {" "}
                      {bomLines.map((line) => (
                        <tr key={line.id} className="group hover:bg-slate-50">
                          {" "}
                          <td className="px-4 py-2">
                            {" "}
                            <OdooCombobox
                              options={productOptions.filter(
                                (p) => p.value !== initialDataId,
                              )}
                              value={line.componentId}
                              onChange={(val) =>
                                handleComponentChange(line.id, "componentId", val)
                              }
                              placeholder="اختر المكون الداخلي..."
                              className="w-full"
                              searchable={true}
                            />{" "}
                          </td>{" "}
                          <td className="px-4 py-2">
                            {" "}
                            <input autoComplete="off" autoCorrect="off" spellCheck={false}
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={line.quantity}
                              onChange={(e) => {
                                const val = convertArabicToEnglishNumbers(
                                  e.target.value,
                                );
                                handleComponentChange(
                                  line.id,
                                  "quantity",
                                  val ? parseFloat(val) : 0,
                                );
                              }}
                              className="w-full bg-transparent border-b border-transparent focus:border-[#2563EB] outline-none px-1"
                            />{" "}
                          </td>{" "}
                          <td className="px-4 py-2">
                            {" "}
                            <OdooCombobox
                              options={uomOptionsState}
                              value={line.uom}
                              onChange={(val) =>
                                handleComponentChange(line.id, "uom", val)
                              }
                              placeholder="الوحدة"
                              searchable={true}
                            />{" "}
                          </td>{" "}
                          <td className="px-4 py-2 text-center">
                            {" "}
                            <button
                              onClick={() => handleRemoveComponent(line.id)}
                              className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              {" "}
                              <Trash2 className="w-4 h-4" />{" "}
                            </button>{" "}
                          </td>{" "}
                        </tr>
                      ))}
                      {bomLines.length === 0 && (
                        <tr>
                          {" "}
                          <td
                            colSpan={4}
                            className="p-8 text-center text-slate-400 italic"
                          >
                            {" "}
                            لا توجد مكونات حالياً. أضف مكونات لإنشاء
                            حزمة/مجموعة.{" "}
                          </td>{" "}
                        </tr>
                      )}
                    </tbody>{" "}
                    <tfoot className="bg-slate-50 border-t">
                      {" "}
                      <tr>
                        {" "}
                        <td colSpan={4} className="p-2">
                          {" "}
                          <button
                            onClick={handleAddComponent}
                            className="text-[#2563EB] hover:underline font-bold text-sm px-2"
                          >
                            {" "}
                            إضافة مكون{" "}
                          </button>{" "}
                        </td>{" "}
                      </tr>{" "}
                    </tfoot>{" "}
                  </table>{" "}
                </div>{" "}
              </div>
            
    </>
  );
}
