'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingBag, Trash2, Plus, Minus, Send, Loader2, Package, MessageSquare, CheckCircle } from 'lucide-react';
import { submitPortalOrder } from '@/app/actions/portalOrders';
type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  uom: string;
  image?: string;
};
function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('portal_cart') || '[]');
  } catch {
    return [];
  }
}
function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('portal_cart', JSON.stringify(items));
  window.dispatchEvent(new Event('cart-updated'));
}
export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{
    orderName: string;
  } | null>(null);
  useEffect(() => {
    setItems(getCart());
  }, []);
  const updateQuantity = (productId: string, delta: number) => {
    const updated = items.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty
        };
      }
      return item;
    });
    setItems(updated);
    saveCart(updated);
  };
  const removeItem = (productId: string) => {
    const updated = items.filter(i => i.productId !== productId);
    setItems(updated);
    saveCart(updated);
  };
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const handleSubmit = async () => {
    if (items.length === 0) return;
    setLoading(true);
    const result = await submitPortalOrder({
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        name: i.name,
        uom: i.uom
      })),
      notes: notes || undefined
    });
    setLoading(false);
    if (result && result.success) {
      saveCart([]);
      setSuccess({ orderName: result.orderName || '' });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="max-w-sm mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">تم إرسال الطلب بنجاح!</h2>
          <p className="text-sm text-slate-500 mb-1">رقم الطلب: <span className="font-bold text-teal-700">{success.orderName}</span></p>
          <p className="text-xs text-slate-400 mb-6">سيتم مراجعة طلبك والرد عليك في أقرب وقت</p>
          <div className="space-y-2">
            <Link href="/portal/orders" className="block w-full py-3 bg-emerald-500 text-white text-sm font-bold rounded-sm hover:bg-emerald-600 transition-colors">
              متابعة الطلبات
            </Link>
            <Link href="/portal/products" className="block w-full py-3 bg-slate-100 text-slate-600 text-sm font-medium rounded-sm hover:bg-slate-200 transition-colors">
              تصفح المنتجات
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/portal/products" className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <ArrowRight className="w-4 h-4" />
          </Link>
          <h1 className="text-sm font-bold text-slate-800 flex-1">السلة</h1>
          <span className="text-xs text-slate-400">{items.length} صنف</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {items.length > 0 ? (
          <>
            <div className="space-y-2 mb-4">
              {items.map(item => (
                <div key={item.productId} className="bg-white rounded-sm border border-slate-200 p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img src={item.image} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-800 truncate">{item.name}</h3>
                    <p className="text-xs text-teal-700 font-bold mt-0.5">
                      {item.price.toFixed(2)} ج.م
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700 hover:bg-emerald-200 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-left shrink-0 flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-700 w-16 text-left">
                      {(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button onClick={() => removeItem(item.productId)} className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-sm border border-slate-200 p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">ملاحظات (اختياري)</span>
              </div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="مثال: التوصيل صباحاً أو ملاحظات خاصة..." className="w-full text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 outline-none resize-none h-16 placeholder:text-slate-400" />
            </div>

            <div className="bg-white rounded-sm border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-500">الإجمالي</span>
                <span className="text-xl font-bold text-slate-800">
                  {total.toFixed(2)} <span className="text-xs text-slate-400 font-normal">ج.م</span>
                </span>
              </div>
              <button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 bg-[#714B67] text-white font-bold rounded-sm shadow-sm hover: transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <Send className="w-4 h-4" /> <span>إرسال الطلب</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag className="w-16 h-16 text-slate-200 mb-4" />
            <p className="text-sm text-slate-500 font-medium">السلة فارغة</p>
            <p className="text-xs text-slate-400 mt-1">أضف منتجات من الكتالوج</p>
            <Link href="/portal/products" className="mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
              تصفح المنتجات
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}