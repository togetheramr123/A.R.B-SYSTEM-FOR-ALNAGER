"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, Target } from "lucide-react";
import { getPromotedProducts } from "@/app/actions/products";

interface PromotedProduct {
  id: string;
  name: string;
  salePrice: number;
  costPrice: number;
  uom: string;
  taxes: number;
}

interface PromotedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProducts: (products: { product: PromotedProduct; qty: number }[]) => void;
}

export function PromotedProductsModal({
  isOpen,
  onClose,
  onAddProducts,
}: PromotedProductsModalProps) {
  const [products, setProducts] = useState<PromotedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    } else {
      setSearchTerm("");
      setQuantities({});
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getPromotedProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load promoted products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (id: string, qty: string) => {
    const val = parseInt(qty);
    setQuantities((prev) => ({
      ...prev,
      [id]: isNaN(val) ? 0 : val,
    }));
  };

  const handleAdd = () => {
    const toAdd = products
      .filter((p) => quantities[p.id] > 0)
      .map((p) => ({
        product: p,
        qty: quantities[p.id],
      }));
    
    if (toAdd.length > 0) {
      onAddProducts(toAdd);
    }
    onClose();
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#017E84]">
            <Target className="w-5 h-5" />
            الأصناف المستهدفة للبيع
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث في الأصناف المستهدفة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-[#017E84]"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto border border-slate-200 rounded-md">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#017E84]" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                لا توجد أصناف مستهدفة حالياً
              </div>
            ) : (
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-bold text-slate-700">الصنف</th>
                    <th className="px-4 py-3 font-bold text-slate-700 w-32">السعر</th>
                    <th className="px-4 py-3 font-bold text-slate-700 w-32 text-center">الكمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-bold text-slate-800">
                        {product.name}
                      </td>
                      <td className="px-4 py-2 font-bold text-slate-600">
                        {product.salePrice.toLocaleString()} ج.م
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={quantities[product.id] || ""}
                          onChange={(e) => handleQtyChange(product.id, e.target.value)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-center focus:outline-none focus:border-[#017E84] font-bold"
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} className="font-bold">
            إلغاء
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-[#017E84] hover:bg-[#006A6F] text-white font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة الأصناف المحددة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
