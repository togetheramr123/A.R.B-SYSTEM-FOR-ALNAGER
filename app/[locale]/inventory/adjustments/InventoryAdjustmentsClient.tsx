'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ClipboardCheck, CheckCircle, Search, Save, Filter } from 'lucide-react';
import { applyMultipleAdjustments } from '@/app/actions/inventoryAdjustments';
import { useRouter } from 'next/navigation';
interface Quant {
  id: string;
  productId: string;
  productName: string;
  uom: string;
  locationId: string;
  locationName: string;
  lotId: string | null;
  lotName: string;
  theoreticalQty: number;
  realQty: number;
  isChanged: boolean;
}
export default function InventoryAdjustmentsClient({
  initialQuants,
  locations,
  products
}: {
  initialQuants: Quant[];
  locations: any[];
  products: any[];
}) {
  const router = useRouter();
  const [quants, setQuants] = useState<Quant[]>(initialQuants);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const changedLines = quants.filter(q => q.isChanged);
  const handleQtyChange = (id: string, newQty: string) => {
    const val = parseFloat(newQty);
    setQuants(quants.map(q => {
      if (q.id === id) {
        const isValid = !isNaN(val);
        const finalQty = isValid ? val : 0;
        isChanged: finalQty !== q.theoreticalQty;
      }
      ;
    }));
  };
  const handleSetStateQty = (id: string, val: number) => {
    setQuants(quants.map(q => {
      if (q.id === id) {
        return {
          ...q,
          realQty: val,
          isChanged: val !== q.theoreticalQty
        };
      }
      return q;
    }));
  };
  const addNewLine = () => {
    if (!products.length || !locations.length) {
      toast.error("لا يوجد منتجات أو مخازن متاحة");
      return;
    }
    const newQ: Quant = {
      id: `new-${Date.now()}`,
      productId: products[0].id,
      productName: products[0].name,
      uom: products[0].uom,
      locationId: locations[0].id,
      locationName: locations[0].name,
      lotId: null,
      lotName: '',
      theoreticalQty: 0,
      realQty: 0,
      isChanged: true
    };
    setQuants([newQ, ...quants]);
  };
  const updateNewLine = (id: string, field: keyof Quant, value: any) => {
    setQuants(quants.map(q => {
      if (q.id === id) {
        const updated = {
          ...q,
          [field]: value
        };
        if (field === 'productId') {
          const p = products.find(p => p.id === value);
          if (p) {
            updated.productName = p.name;
            updated.uom = p.uom;
          }
        }
        if (field === 'locationId') {
          const l = locations.find(l => l.id === value);
          if (l) updated.locationName = l.name;
        }
        return updated;
      }
      return q;
    }));
  };
  const applyAdjustments = async () => {
    if (changedLines.length === 0) {
      toast.warning('لم تقم بتعديل أي كميات.');
      return;
    }
    setSaving(true);
    const payload = changedLines.map(l => ({
      locationId: l.locationId,
      productId: l.productId,
      realQty: l.realQty
    }));
    const res = await applyMultipleAdjustments(payload);
    setSaving(false);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success('تم تسوية الجرد بنجاح وإصدار القيود.');
      router.refresh();
    }
  };
  const filteredQuants = quants.filter(q => q.productName.toLowerCase().includes(searchTerm.toLowerCase()) || q.locationName.toLowerCase().includes(searchTerm.toLowerCase()));
  return <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl"> {/* Odoo Style Header */} <div className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm flex items-center justify-between"> <div> <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2"> التسويات الجردية (Inventory Adjustments) </h1> </div> <div className="flex gap-2"> <button onClick={addNewLine} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded text-sm font-medium transition-colors"> إنشاء تسوية جديدة </button> {filteredQuants.length > 0 && changedLines.length === 0 && <button onClick={() => setQuants(quants.map(q => ({
          ...q,
          realQty: q.theoreticalQty,
          isChanged: true
        })))} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded text-sm font-medium transition-colors border border-slate-200 shadow-sm"> اعتماد الكميات الدفترية (Set Counted) </button>} {changedLines.length > 0 && <button onClick={applyAdjustments} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"> {saving ? 'جاري التنفيذ...' : `تطبيق (${changedLines.length})`} </button>} </div> </div> <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full"> {/* Search Bar */} <div className="bg-white rounded-t-lg border-b-0 border border-slate-200 p-2 flex items-center gap-2"> <Search className="w-5 h-5 text-slate-400 ml-2" /> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" placeholder="بحث عن منتج أو مخزن..." className="w-full lg:w-1/3 outline-none text-sm text-slate-700 bg-transparent" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /> </div> {/* Grid */} <div className="bg-white rounded-b-lg border border-slate-200 shadow-sm overflow-hidden"> <table className="w-full text-sm text-right"> <thead> <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-600"> <th className="px-4 py-3 font-semibold w-1/4">المنتج</th> <th className="px-4 py-3 font-semibold w-1/5">الموقع (Location)</th> <th className="px-4 py-3 font-semibold">رقم الدفعة (Lot)</th> <th className="px-4 py-3 font-semibold text-center w-32">الكمية الدفترية</th> <th className="px-4 py-3 font-semibold text-center w-32">الكمية الفعلية</th> <th className="px-4 py-3 font-semibold text-center w-24">فرق</th> <th className="px-4 py-3 font-semibold w-24">الوحدة</th> </tr> </thead> <tbody className="divide-y divide-slate-100"> {filteredQuants.length === 0 ? <tr> <td colSpan={7} className="p-8 text-center text-slate-500">لا يوجد بيانات مخزنية مطابقة.</td> </tr> : filteredQuants.map(q => {
              const isNew = q.id.startsWith('new-');
              const diff = q.realQty - q.theoreticalQty;
              const hasDiff = diff !== 0;
              return <tr key={q.id} className={`hover:bg-slate-50 transition-colors ${q.isChanged ? 'bg-orange-50/30' : ''}`}> <td className="px-4 py-2 font-medium text-slate-800"> {isNew ? <select value={q.productId} onChange={e => updateNewLine(q.id, 'productId', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500"> {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)} </select> : q.productName} </td> <td className="px-4 py-2 text-slate-600"> {isNew ? <select value={q.locationId} onChange={e => updateNewLine(q.id, 'locationId', e.target.value)} className="w-full p-1 border border-slate-300 rounded text-sm outline-none focus:border-indigo-500"> {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)} </select> : q.locationName} </td> <td className="px-4 py-2 text-slate-500">{q.lotName || '-'}</td> <td className="px-4 py-2 text-center text-slate-600 font-mono"> {q.theoreticalQty} </td> <td className="px-4 py-2 text-center font-mono relative group"> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="number" value={q.realQty.toString()} onChange={e => handleQtyChange(q.id, e.target.value)} className={`w-20 text-center p-1 border rounded outline-none transition-colors ${hasDiff ? 'border-orange-400 bg-orange-50 text-orange-700 font-bold' : 'border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white bg-transparent text-slate-800'}`} /> </td> <td className="px-4 py-2 text-center"> {hasDiff ? <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}> {diff > 0 ? `+${diff}` : diff} </span> : <span className="text-slate-300">-</span>} </td> <td className="px-4 py-2 text-slate-500 text-xs">{q.uom}</td> </tr>;
            })} </tbody> </table> </div> </div> </div>;
}