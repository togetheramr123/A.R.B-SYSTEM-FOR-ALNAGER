import React, { useState, useEffect } from "react";
import { getVariantGridData } from "@/app/actions/products";
import { X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
interface VariantGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string | null;
  onConfirm: (
    selectedVariants: { productId: string; quantity: number }[],
  ) => void;
}
export function VariantGridModal({
  isOpen,
  onClose,
  productId,
  onConfirm,
}: VariantGridModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  useEffect(() => {
    const load = async () => {
      if (!productId || !isOpen) return;
      setLoading(true);
      try {
        const res = await getVariantGridData(productId);
        setData(res);
        setQuantities({});
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId, isOpen]);
  if (!isOpen) return null;
  const handleConfirm = () => {
    const selected = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([variantId, qty]) => ({ productId: variantId, quantity: qty }));
    onConfirm(selected);
    onClose();
  };
  const handleQuantityChange = (variantId: string, val: string) => {
    const num = parseFloat(val);
    setQuantities((prev) => ({
      ...prev,
      [variantId]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };
  let content = null;
  if (loading) {
    content = (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        {" "}
        <Loader2 className="w-8 h-8 animate-spin mb-4" />{" "}
        <p>جاري تحميل متغيرات المنتج...</p>{" "}
      </div>
    );
  } else if (!data || data.attributes.length === 0) {
    content = (
      <div className="p-8 text-center text-slate-500">
        {" "}
        لا يحتوي هذا المنتج على استمارة شبكة مبيعات (متغيرات).{" "}
      </div>
    );
  } else {
    const { attributes, variants } = data;
    if (attributes.length >= 2) {
      const rowAttr = attributes[0];
      const colAttr = attributes[1];
      content = (
        <div className="overflow-x-auto w-full border border-slate-200 rounded-sm">
          {" "}
          <table className="w-full text-sm text-center">
            {" "}
            <thead className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
              {" "}
              <tr>
                {" "}
                <th className="p-3 border-l border-slate-200 bg-white text-right text-slate-500 font-normal">
                  {" "}
                  <span className="font-bold text-slate-800 ml-1">
                    {data.templateName}
                  </span>{" "}
                </th>{" "}
                {colAttr.values.map((colVal: any) => (
                  <th
                    key={colVal.id}
                    className="p-3 border-l border-slate-200 text-slate-600 font-bold bg-white min-w-[200px]"
                  >
                    {" "}
                    {colVal.name}{" "}
                  </th>
                ))}{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100 bg-white">
              {" "}
              {rowAttr.values.map((rowVal: any) => (
                <tr
                  key={rowVal.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  {" "}
                  <td className="p-4 border-l border-slate-200 text-right font-bold text-slate-800 bg-white sticky right-0 z-10 shadow-[1px_0_4px_rgba(0,0,0,0.05)]">
                    {" "}
                    {rowVal.name}{" "}
                  </td>{" "}
                  {colAttr.values.map((colVal: any) => {
                    // Find
                    // variant matching both row and col value IDs
                    const variant = variants.find(
                      (v: any) =>
                        v.values.includes(rowVal.id) &&
                        v.values.includes(colVal.id),
                    );
                    if (!variant) {
                      return (
                        <td
                          key={colVal.id}
                          className="p-3 border-l border-slate-200 bg-slate-50 opacity-50"
                        >
                          غير متوفر
                        </td>
                      );
                    }
                    const qty = quantities[variant.id] || 0;
                    return (
                      <td
                        key={colVal.id}
                        className="p-0 border-l border-slate-200 align-top"
                      >
                        {" "}
                        <div className="flex flex-col h-full w-full relative group">
                          {" "}
                          {/* Top info section: Stock details exactly as in Odoo screenshot */}{" "}
                          <div className="grid grid-cols-4 gap-1 p-2 text-[11px] border-b border-transparent group-hover:border-slate-100">
                            {" "}
                            <div className="flex flex-col items-center">
                              {" "}
                              <span className="text-slate-500 mb-1">
                                المتوقع
                              </span>{" "}
                              <span className="font-bold text-slate-700">
                                {variant.expected}
                              </span>{" "}
                            </div>{" "}
                            <div className="flex flex-col items-center">
                              {" "}
                              <span className="text-red-500 mb-1 font-bold">
                                المحجوز
                              </span>{" "}
                              <span className="font-bold text-slate-700">
                                {variant.reserved}
                              </span>{" "}
                            </div>{" "}
                            <div className="flex flex-col items-center">
                              {" "}
                              <span className="text-[#20C997] mb-1 font-bold">
                                تحت الشراء
                              </span>{" "}
                              <span className="font-bold text-slate-700">
                                {variant.incoming}
                              </span>{" "}
                            </div>{" "}
                            <div className="flex flex-col items-center">
                              {" "}
                              <span className="text-slate-500 mb-1">
                                الرصيد
                              </span>{" "}
                              <span className="font-bold text-[#28A745]">
                                {variant.quantityOnHand}
                              </span>{" "}
                              <span className="text-[#28A745]">0</span>{" "}
                            </div>{" "}
                          </div>{" "}
                          {/* Bottom section: Quantity Input */}{" "}
                          <div className="flex items-center justify-center p-2 mt-auto pb-4">
                            {" "}
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={qty}
                              onChange={(e) =>
                                handleQuantityChange(variant.id, e.target.value)
                              }
                              className="w-16 h-8 text-center border border-slate-300 rounded focus:border-[#2563EB] outline-none text-sm transition-colors"
                            />{" "}
                          </div>{" "}
                        </div>{" "}
                      </td>
                    );
                  })}{" "}
                </tr>
              ))}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>
      );
    } else {
      const attr = attributes[0];
      content = (
        <div className="overflow-x-auto w-full border border-slate-200 rounded-sm">
          {" "}
          <table className="w-full text-sm text-center">
            {" "}
            <thead className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
              {" "}
              <tr>
                {" "}
                <th className="p-3 border-l border-slate-200 bg-white text-right text-slate-500 font-normal">
                  {" "}
                  <span className="font-bold text-slate-800 ml-1">
                    {data.templateName}
                  </span>{" "}
                </th>{" "}
                <th className="p-3 border-l border-slate-200 text-slate-600 font-bold bg-white">
                  {" "}
                  الكمية المطلوبة{" "}
                </th>{" "}
              </tr>{" "}
            </thead>{" "}
            <tbody className="divide-y divide-slate-100 bg-white">
              {" "}
              {attr.values.map((rowVal: any) => {
                const variant = variants.find((v: any) =>
                  v.values.includes(rowVal.id),
                );
                if (!variant) return null;
                const qty = quantities[variant.id] || 0;
                return (
                  <tr
                    key={rowVal.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {" "}
                    <td className="p-4 border-l border-slate-200 text-right font-bold text-slate-800 bg-white sticky right-0 z-10">
                      {" "}
                      {rowVal.name}{" "}
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 font-normal">
                        {" "}
                        <span>
                          الرصيد:{" "}
                          <strong className="text-[#28A745]">
                            {variant.quantityOnHand}
                          </strong>
                        </span>{" "}
                        <span>المتوقع: {variant.expected}</span>{" "}
                      </div>{" "}
                    </td>{" "}
                    <td className="p-4 border-l border-slate-200 max-w-[200px]">
                      {" "}
                      <div className="flex justify-center">
                        {" "}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={qty}
                          onChange={(e) =>
                            handleQuantityChange(variant.id, e.target.value)
                          }
                          className="w-24 h-10 text-center border border-slate-300 rounded focus:border-[#2563EB] outline-none text-base font-bold transition-colors"
                        />{" "}
                      </div>{" "}
                    </td>{" "}
                  </tr>
                );
              })}{" "}
            </tbody>{" "}
          </table>{" "}
        </div>
      );
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {" "}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[90vw] p-0">
        {" "}
        <DialogHeader className="p-4 pb-2 border-b border-slate-100 text-right sticky top-0 bg-white z-20 flex flex-row items-center justify-between">
          {" "}
          <DialogTitle>
            {" "}
            <span className="text-lg font-normal text-slate-700 m-0">
              اختر متغيرات المنتج
            </span>{" "}
          </DialogTitle>{" "}
        </DialogHeader>{" "}
        <div className="p-4 bg-slate-50/50 min-h-[300px]"> {content} </div>{" "}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 sm:justify-end sticky bottom-0 z-20">
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium transition-colors"
            >
              {" "}
              إغلاق{" "}
            </button>{" "}
            <button
              type="button"
              disabled={loading}
              onClick={handleConfirm}
              className="px-5 py-2 text-white bg-[#017E84] rounded hover:bg-[#01686D] text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {" "}
              تأكيد{" "}
            </button>{" "}
          </div>{" "}
        </DialogFooter>{" "}
      </DialogContent>{" "}
    </Dialog>
  );
}
