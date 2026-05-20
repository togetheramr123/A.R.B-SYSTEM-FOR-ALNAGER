'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createScrapOrder, validateScrap } from '@/app/actions/inventory';
import { Loader2 } from 'lucide-react';
import { convertArabicToEnglishNumbers } from '@/lib/utils/numberUtils';
interface Props {
  products: {
    id: string;
    name: string;
  }[];
  sourceLocations: {
    id: string;
    name: string;
  }[];
  scrapLocations: {
    id: string;
    name: string;
  }[];
  locale: string;
}
export default function ScrapOrderForm({
  products,
  sourceLocations,
  scrapLocations,
  locale
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true);
      setError('');
      const res = await createScrapOrder(null, formData);
      if (res?.error) {
        setError(res.error);
        return;
      }
      const valRes = await validateScrap(res.id);
      if (valRes?.error) {
        setError("Created but failed to validate: " + valRes.error);
      } else {
        router.push(`/${locale}/inventory/scrap`);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }
  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Product</label>
        <select name="productId" required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">Select Product...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
        <input type="number" name="quantity" step="0.01" min="0" onChange={e => {
          const val = convertArabicToEnglishNumbers(e.target.value);
          if (val !== undefined) {
            e.target.value = val;
          }
        }} required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Source Location</label>
          <select name="sourceLocationId" required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">Select Source...</option>
            {sourceLocations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Scrap Location</label>
          <select name="scrapLocationId" required className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">Select Scrap Location...</option>
            {scrapLocations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end gap-3">
        <button type="button" onClick={() => router.push(`/${locale}/inventory/scrap`)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded" disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700 shadow-sm disabled:opacity-50" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Validate Scrap
        </button>
      </div>
    </form>
  );
}