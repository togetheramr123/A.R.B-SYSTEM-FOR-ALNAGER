'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { X, Search, Package, ChevronLeft, Check, AlertTriangle, Minus, Plus } from 'lucide-react';
interface ProductOption {
  id: string;
  name: string;
  label?: string;
  internalRef?: string;
  type?: string;
  categoryId?: string;
  categoryName?: string;
  salePrice?: number;
  costPrice?: number;
  quantityOnHand?: number;
  reservedQty?: number;
  uom?: string;
  secondaryUom?: string;
  secondaryUomFactor?: number;
  hasSecondaryUnit?: boolean;
}
interface Category {
  id: string;
  name: string;
  productCount: number;
}
interface SelectedProduct {
  productId: string;
  quantity: number;
  secondaryQuantity: number;
}
interface ProductBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductOption[];
  categories: Category[];
  existingProductIds?: string[];
  onConfirm: (products: SelectedProduct[]) => void;
}
export function ProductBrowserModal({
  isOpen,
  onClose,
  products,
  categories,
  existingProductIds = [],
  onConfirm
}: ProductBrowserModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Map<string, SelectedProduct>>(new Map());
  const [duplicateAction, setDuplicateAction] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [duplicateChoice, setDuplicateChoice] = useState<'add' | 'new' | null>(null);
  const filteredProducts = useMemo(() => {
    if (!isOpen) return [];
    let result = products;
    if (selectedCategoryId) {
      result = result.filter(p => p.categoryId === selectedCategoryId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p => (p.name || p.label || '').toLowerCase().includes(q) || (p.internalRef || '').toLowerCase().includes(q));
    }
    return result;
  }, [products, selectedCategoryId, search, isOpen]);
  const categoryList = useMemo(() => {
    if (!isOpen) return [];
    const allCount = search.trim() ? products.filter(p => {
      const q = search.toLowerCase();
      return (p.name || p.label || '').toLowerCase().includes(q) || (p.internalRef || '').toLowerCase().includes(q);
    }).length : products.length;
    const cats: Category[] = [{
      id: '__all__',
      name: 'كل الأصناف',
      productCount: allCount
    }, ...categories.map(c => ({
      ...c,
      productCount: search.trim() ? products.filter(p => {
        const q = search.toLowerCase();
        return p.categoryId === c.id && ((p.name || p.label || '').toLowerCase().includes(q) || (p.internalRef || '').toLowerCase().includes(q));
      }).length : c.productCount
    }))];
    return cats;
  }, [categories, products, search, isOpen]);
  const toggleProduct = (product: any) => {
    const isDuplicate = existingProductIds.includes(product.id);
    if (isDuplicate && !selections.has(product.id)) {
      setDuplicateAction({ productId: product.id, productName: product.name || product.label });
      return;
    }
    setSelections(prev => {
      const next = new Map(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.set(product.id, {
          productId: product.id,
          quantity: 1,
          secondaryQuantity: 0
        });
      }
      return next;
    });
  };
const handleDuplicateConfirm = (choice: 'add' | 'new') => {
  if (!duplicateAction) return;
  setDuplicateChoice(choice);
  setSelections(prev => {
    const next = new Map(prev);
    next.set(duplicateAction.productId, {
      productId: duplicateAction.productId,
      quantity: 1,
      secondaryQuantity: 0
    });
    return next;
  });
  setDuplicateAction(null);
};
const updateQuantity = (productId: string, qty: number) => {
  if (qty < 1) qty = 1;
  setSelections(prev => {
    const next = new Map(prev);
    const existing = next.get(productId);
    if (existing) {
      next.set(productId, {
        ...existing,
        quantity: qty
      });
    }
    return next;
  });
};
const updateSecondaryQty = (productId: string, qty: number) => {
  if (qty < 0) qty = 0;
  setSelections(prev => {
    const next = new Map(prev);
    const existing = next.get(productId);
    if (existing) {
      next.set(productId, {
        ...existing,
        secondaryQuantity: qty
      });
    }
    return next;
  });
};
const handleConfirm = () => {
  const selected = Array.from(selections.values());
  if (selected.length === 0) {
    onClose();
    return;
  }
  onConfirm(selected);
  setSelections(new Map());
  setSearch('');
  setSelectedCategoryId(null);
  onClose();
};
const selectionCount = selections.size;
if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded w-[1100px] max-w-[98vw] max-h-[90vh] flex flex-col overflow-hidden shadow-sm" onClick={e => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-slate-800">بحث المنتج</h2>
              <Package className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
            </div>
            <p className="text-[13px] text-slate-500">اختر الأصناف المطلوبة وحدد الكميات</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-[#e5e7eb]">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم أو الكود..." className="w-full border border-[#ccc] rounded py-1.5 pr-9 pl-3 text-sm focus:outline-none focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84] transition" autoFocus />
            {search && (
              <button onClick={() => setSearch('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[12px] text-slate-500">
            <span>{filteredProducts.length} من {products.length} منتج</span>
            {selectedCategoryId && selectedCategoryId !== '__all__' && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                {categoryList.find(c => c.id === selectedCategoryId)?.name}
                <button onClick={() => setSelectedCategoryId(null)} className="hover:text-red-500 font-bold">✕</button>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto border-l border-[#e5e7eb]">
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-white z-10 border-b border-[#ccc]">
                <tr className="text-slate-600">
                  <th className="py-2.5 px-3 text-right font-medium w-8">#</th>
                  <th className="py-2.5 px-3 text-right font-medium">المنتج</th>
                  <th className="py-2.5 px-2 text-center font-medium w-20">المتاح</th>
                  <th className="py-2.5 px-2 text-center font-medium w-20">المحجوز</th>
                  <th className="py-2.5 px-2 text-center font-medium w-24">السعر</th>
                  <th className="py-2.5 px-2 text-center font-medium w-16">و.ق</th>
                  <th className="py-2.5 px-2 text-center font-medium w-24">الكمية</th>
                  <th className="py-2.5 px-2 text-center font-medium w-24">الثانوية</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">لا توجد أصناف مطابقة</td>
                  </tr>
                ) : filteredProducts.map((product, idx) => {
                  const isSelected = selections.has(product.id);
                  const isDuplicate = existingProductIds.includes(product.id);
                  const qty = Number(product.quantityOnHand) || 0;
                  const reserved = Number(product.reservedQty) || 0;
                  const selection = selections.get(product.id);

                  return (
                    <tr key={product.id} onClick={() => toggleProduct(product)} className={`cursor-pointer border-b border-[#eee] transition-colors ${isSelected ? 'bg-[#f0f0f0]' : isDuplicate ? 'bg-[#fffbeb] hover:bg-[#fef3c7]' : 'hover:bg-[#f8f9fa]'}`}>
                      <td className="py-2 px-3 align-middle">
                        <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={isSelected} onChange={() => {}} className="w-4 h-4 text-[#017E84] rounded border-slate-300 focus:ring-[#017E84] cursor-pointer" />
                      </td>
                      <td className="py-2 px-3 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{product.name || product.label}</span>
                          <div className="flex items-center gap-1">
                            {isDuplicate && <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded">موجود</span>}
                            {product.internalRef && <span className="text-[11px] text-slate-500">{product.internalRef}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center align-middle">
                        <span className={`font-medium ${qty > 0 ? 'text-[#017E84]' : 'text-red-500'}`}>{qty}</span>
                      </td>
                      <td className="py-2 px-2 text-center text-slate-500 align-middle">{reserved > 0 ? reserved : '—'}</td>
                      <td className="py-2 px-2 text-center font-medium text-slate-700 align-middle">LE {(Number(product.salePrice) || 0).toFixed(2)}</td>
                      <td className="py-2 px-2 text-center text-[12px] text-slate-500 align-middle">{product.uom || 'Unit'}</td>
                      <td className="py-2 px-2 align-middle" onClick={e => e.stopPropagation()}>
                        {isSelected && selection ? (
                          <div className="flex items-center justify-center">
                            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" value={selection.quantity} onChange={e => updateQuantity(product.id, parseInt(e.target.value) || 1)} className="w-16 text-center border border-[#ccc] rounded py-1 text-sm focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84] outline-none" min={1} />
                          </div>
                        ) : <span className="text-slate-300 flex justify-center">—</span>}
                      </td>
                      <td className="py-2 px-2 align-middle" onClick={e => e.stopPropagation()}>
                        {isSelected && selection && product.hasSecondaryUnit ? (
                          <div className="flex items-center justify-center">
                            <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" value={selection.secondaryQuantity} onChange={e => updateSecondaryQty(product.id, parseInt(e.target.value) || 0)} className="w-16 text-center border border-[#ccc] rounded py-1 text-sm focus:border-[#017E84] focus:ring-1 focus:ring-[#017E84] outline-none" min={0} />
                          </div>
                        ) : <span className="text-slate-300 flex justify-center">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="w-[180px] bg-white overflow-y-auto shrink-0 py-2">
            <div className="px-4 py-2 text-[12px] font-bold text-slate-400">الفئات</div>
            {categoryList.map(cat => {
              const isCatSelected = cat.id === '__all__' && !selectedCategoryId || cat.id === selectedCategoryId;
              return (
                <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id === '__all__' ? null : cat.id)} className={`w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between transition-colors ${isCatSelected ? 'bg-slate-100 font-medium text-slate-900 border-r-2 border-[#017E84]' : 'text-slate-700 hover:bg-slate-50 border-r-2 border-transparent'}`}>
                  <span className="truncate">{cat.name}</span>
                  <span className="text-[11px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{cat.productCount}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 p-4 border-t border-[#e5e7eb] bg-white">
          <button onClick={handleConfirm} disabled={selectionCount === 0} className="px-4 py-1.5 bg-[#017E84] text-white rounded text-[14px] hover:bg-[#016269] disabled:opacity-50 disabled:cursor-not-allowed transition">
            {selectionCount > 0 ? `تحديد (${selectionCount})` : 'اختر أصناف أولاً'}
          </button>
          <button onClick={onClose} className="px-4 py-1.5 text-slate-700 bg-white border border-[#ccc] rounded text-[14px] hover:bg-slate-50 transition">إلغاء</button>
        </div>

        {duplicateAction && (
          <div className="fixed inset-0 z-[10000] bg-black/40 flex items-center justify-center p-4" onClick={() => setDuplicateAction(null)}>
            <div className="bg-white rounded w-[400px] overflow-hidden shadow-sm" onClick={e => e.stopPropagation()} dir="rtl">
              <div className="p-4 border-b border-[#e5e7eb] flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-medium text-slate-800 text-[15px]">تأكيد صنف مكرر</h3>
              </div>
              <div className="p-4">
                <p className="text-[13px] text-slate-600 mb-4">الصنف "{duplicateAction.productName}" موجود بالفعل في الطلب. هل تريد دمج الكمية أم إضافة سطر جديد؟</p>
                <div className="space-y-2">
                  <button onClick={() => handleDuplicateConfirm('add')} className="w-full text-right px-4 py-2 border border-[#ccc] rounded hover:bg-slate-50 transition flex items-center gap-3 text-[13px]">
                    <Plus className="w-4 h-4 text-[#017E84]" /> <span>دمج الكمية مع السطر الحالي</span>
                  </button>
                  <button onClick={() => handleDuplicateConfirm('new')} className="w-full text-right px-4 py-2 border border-[#ccc] rounded hover:bg-slate-50 transition flex items-center gap-3 text-[13px]">
                    <Package className="w-4 h-4 text-slate-500" /> <span>إضافة كسطر جديد</span>
                  </button>
                </div>
              </div>
              <div className="p-3 border-t border-[#e5e7eb] flex justify-end">
                <button onClick={() => setDuplicateAction(null)} className="px-4 py-1.5 text-slate-700 bg-white border border-[#ccc] rounded text-[13px] hover:bg-slate-50 transition">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}