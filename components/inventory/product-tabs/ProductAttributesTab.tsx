
import React from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch, Control, FieldErrors } from "react-hook-form";
import { ProductFormValues, Option, SupplierLine, BomLine, AttributeState, Metrics } from "./types";
import { Plus, Trash2 } from "lucide-react";
import { OdooCombobox } from "@/components/ui/OdooCombobox";

export function ProductAttributesTab({
  attributeLines,
  availableAttributes,
  handleAddAttributeLine,
  handleRemoveAttributeLine,
  handleAttributeChange,
  handleCreateAttribute,
  handleValueSelect,
  handleValueRemove,
  handleCreateValue
}: {
  attributeLines: AttributeState[];
  availableAttributes: any[];
  handleAddAttributeLine: () => void;
  handleRemoveAttributeLine: (id: string) => void;
  handleAttributeChange: (lineId: string, attrId: string) => void;
  handleCreateAttribute: (lineId: string, name: string) => void;
  handleValueSelect: (lineId: string, valId: string) => void;
  handleValueRemove: (lineId: string, valId: string) => void;
  handleCreateValue: (lineId: string, attrId: string, name: string) => void;
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
                        <th className="p-2 border-b w-1/4 ">
                          <div className="flex items-center resize-x overflow-hidden min-w-[80px]">
                            الخاصية
                          </div>
                        </th>{" "}
                        <th className="p-2 border-b w-2/4 ">
                          <div className="flex items-center resize-x overflow-hidden min-w-[80px]">
                            القيم
                          </div>
                        </th>{" "}
                        <th className="p-2 border-b w-1/4"></th>{" "}
                      </tr>{" "}
                    </thead>{" "}
                    <tbody className="divide-y divide-slate-100">
                      {" "}
                      {attributeLines.map((line) => {
                        const attr = availableAttributes.find(
                          (a) => a.id === line.attributeId,
                        );
                        const values = attr ? attr.values : [];
                        return (
                          <tr key={line.id} className="group hover:bg-slate-50">
                            {" "}
                            <td className="px-4 py-2 align-top">
                              {" "}
                              <OdooCombobox
                                options={availableAttributes.map((a) => ({
                                  value: a.id,
                                  label: a.name,
                                }))}
                                value={line.attributeId}
                                onChange={(val) =>
                                  handleAttributeChange(line.id, val)
                                }
                                onCreate={(val) =>
                                  handleCreateAttribute(line.id, val)
                                }
                                placeholder="اختر سمة..."
                                className="w-full"
                              />{" "}
                            </td>{" "}
                            <td className="px-4 py-2">
                              {" "}
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                {" "}
                                {line.valueIds.map((vid) => {
                                  const v = values.find(
                                    (tv: any) => tv.id === vid,
                                  );
                                  if (!v) return null;
                                  const colors = [
                                    "bg-[#875A7B]",
                                    "bg-[#17A2B8]",
                                    "bg-[#28A745]",
                                    "bg-[#FFC107]",
                                    "bg-[#DC3545]",
                                    "bg-[#6F42C1]",
                                    "bg-[#FD7E14]",
                                    "bg-[#20C997]",
                                  ];
                                  const hash = v.name
                                    .split("")
                                    .reduce(
                                      (acc: number, char: string) =>
                                        acc + char.charCodeAt(0),
                                      0,
                                    );
                                  const bgColor = colors[hash % colors.length];
                                  return (
                                    <span
                                      key={vid}
                                      className={`${bgColor} text-white px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 shadow-sm`}
                                    >
                                      {" "}
                                      {v.name}{" "}
                                      <button
                                        onClick={() =>
                                          handleValueRemove(line.id, vid)
                                        }
                                        className="opacity-70 hover:opacity-100 flex items-center justify-center"
                                      >
                                        {" "}
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          width="12"
                                          height="12"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <path d="M18 6 6 18" />
                                          <path d="m6 6 12 12" />
                                        </svg>
                                      </button>{" "}
                                    </span>
                                  );
                                })}
                              </div>{" "}
                              {line.attributeId && (
                                <OdooCombobox
                                  options={values
                                    .filter(
                                      (v: any) => !line.valueIds.includes(v.id),
                                    )
                                    .map((v: any) => ({
                                      value: v.id,
                                      label: v.name,
                                    }))}
                                  value=""
                                  onChange={(val) =>
                                    handleValueSelect(line.id, val)
                                  }
                                  onCreate={(val) =>
                                    handleCreateValue(
                                      line.id,
                                      line.attributeId,
                                      val,
                                    )
                                  }
                                  placeholder="أضف قيمة..."
                                  className="max-w-[200px]"
                                />
                              )}
                            </td>{" "}
                            <td className="p-2 align-top text-left">
                              {" "}
                              <div className="flex items-center justify-end gap-3 w-full h-full pt-1">
                                {" "}
                                <button
                                  type="button"
                                  className="text-slate-700 hover:text-[#2563EB] text-sm"
                                >
                                  {" "}
                                  تهيئة{" "}
                                </button>{" "}
                                <button
                                  onClick={() =>
                                    handleRemoveAttributeLine(line.id)
                                  }
                                  className="text-slate-500 hover:text-red-500 transition-colors"
                                >
                                  {" "}
                                  <Trash2 className="w-4 h-4" />{" "}
                                </button>{" "}
                              </div>{" "}
                            </td>{" "}
                          </tr>
                        );
                      })}
                    </tbody>{" "}
                  </table>{" "}
                  {attributeLines.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic">
                      {" "}
                      لا توجد سمات مضافة.{" "}
                    </div>
                  )}
                  <div className="p-2 border-t border-slate-200">
                    {" "}
                    <button
                      onClick={handleAddAttributeLine}
                      className="text-[#2563EB] hover:underline text-sm px-2"
                    >
                      {" "}
                      إضافة بند{" "}
                    </button>{" "}
                  </div>{" "}
                </div>{" "}
                <div className="mt-8 text-slate-500 text-sm mb-8 pr-2">
                  {" "}
                  تحذير: سيؤدى إضافة أو حذف خصائص إلى حذف المتغيرات الموجودة
                  وإعادة إنشائها مما سيؤدي إلى خسارة أي تخصيصات تم القيام بها
                  عليهم.{" "}
                </div>{" "}
              </div>
            
    </>
  );
}
