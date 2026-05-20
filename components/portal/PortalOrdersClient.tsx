'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle2, XCircle, RefreshCw, Printer, ChevronDown, Package } from 'lucide-react';
import Link from 'next/link';
type OrderLine = {
  id: string;
  productId: string | null;
  name: string;
  quantity: number;
  priceUnit: number;
  priceSubtotal: number;
  unitName: string | null;
};
type PortalOrder = {
  id: string;
  name: string;
  status: string;
  source: string;
  dateOrder: string;
  amountTotal: number;
  note: string | null;
  lines: OrderLine[];
};
export default function PortalOrdersClient({
  initialOrders
}: {
  initialOrders: PortalOrder[];
}) {
  const router = useRouter();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const toggleOrder = (id: string) => {
    if (expandedOrder === id) setExpandedOrder(null);else setExpandedOrder(id);
  };
  const handleReorder = (order: PortalOrder) => {
    // This is a naive reorder, we just put it in local storage
    if (typeof window !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('portal_cart') || '[]');
      const newItems = order.lines.map(l => ({
        product: { id: l.productId, name: l.name, price: l.priceUnit, image: null },
        quantity: l.quantity
      }));
      localStorage.setItem('portal_cart', JSON.stringify([...existing, ...newItems]));
      window.dispatchEvent(new Event('cart-updated'));
      router.push('/portal/cart');
    }
  };
const getStatusInfo = (status: string) => {
  switch (status) {
    case 'draft':
      return {
        label: 'قيد المراجعة',
        icon: Clock,
        color: 'text-amber-500',
        bg: 'bg-amber-50'
      };
    case 'sale':
      return {
        label: 'مؤكد',
        icon: CheckCircle2,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
      };
    case 'done':
      return {
        label: 'مكتمل',
        icon: CheckCircle2,
        color: 'text-teal-700',
        bg: 'bg-teal-50'
      };
    case 'cancel':
      return {
        label: 'ملغي',
        icon: XCircle,
        color: 'text-red-500',
        bg: 'bg-red-50'
      };
    default:
      return {
        label: status,
        icon: Clock,
        color: 'text-slate-500',
        bg: 'bg-slate-50'
      };
  }
};
return(<div className="space-y-4"> {initialOrders.map(order => {
    const statusInfo = getStatusInfo(order.status);
    const StatusIcon = statusInfo.icon;
    const isExpanded = expandedOrder === order.id;
    return <div key={order.id} className="bg-white rounded-sm border border-slate-200 shadow-sm overflow-hidden transition-all"> {} <div onClick={() => toggleOrder(order.id)} className="p-4 flex flex-col gap-3 cursor-pointer hover:bg-slate-50 transition-colors"> <div className="flex items-center justify-between"> <div className="flex items-center gap-2"> <span className="text-sm font-bold text-slate-800">{order.name}</span> <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}> <StatusIcon className="w-3 h-3" /> {statusInfo.label} </span> </div> <span className="text-sm font-bold text-slate-800"> {order.amountTotal.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">ج.م</span> </span> </div> <div className="flex items-center justify-between text-xs text-slate-500"> <span>{new Date(order.dateOrder).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span> <div className="flex items-center gap-1"> <span>{order.lines.length} أصناف</span> <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} /> </div> </div> </div> {} {isExpanded && <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4 animate-in slide-in-"> {} <div className="space-y-2"> {order.lines.map(line => <div key={line.id} className="flex items-center justify-between bg-white p-2.5 rounded-sm border border-slate-100 shadow-sm"> <div className="flex items-center gap-3"> <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0"> <Package className="w-5 h-5 text-slate-400" /> </div> <div> <p className="text-xs font-bold text-slate-800 line-clamp-1">{line.name}</p> <p className="text-[10px] text-slate-500 mt-0.5"> {line.quantity} {line.unitName || 'وحدة'} × {line.priceUnit.toFixed(2)} ج.م </p> </div> </div> <span className="text-xs font-bold text-slate-700"> {line.priceSubtotal.toFixed(2)} </span> </div>)} </div> {} <div className="flex items-center gap-2 pt-2"> <button onClick={() => handleReorder(order)} className="flex-1 py-2.5 bg-emerald-50 text-teal-700 hover:bg-teal-50 font-bold text-xs rounded-sm transition-colors flex items-center justify-center gap-2"> <RefreshCw className="w-4 h-4" /> إعادة الطلب </button> {order.status !== 'draft' && <a href={`/ar/sales/${order.id}/print`} target="_blank" className="w-12 h-10 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-sm flex items-center justify-center transition-colors"> <Printer className="w-4 h-4" /> </a>} </div> {order.note && <div className="p-3 bg-blue-50/50 rounded-sm border border-blue-100"> <p className="text-[10px] font-bold text-blue-800 mb-1">ملاحظات الطلب:</p> <p className="text-xs text-blue-600/80">{order.note}</p> </div>} </div>} </div>;
  })} </div>);
}
