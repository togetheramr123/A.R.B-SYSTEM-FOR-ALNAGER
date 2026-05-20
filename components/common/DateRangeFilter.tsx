'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

export default function DateRangeFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [from, setFrom] = useState(searchParams.get('from') || '');
  const [to, setTo] = useState(searchParams.get('to') || '');

  const apply = () => {
    const params = new URLSearchParams(searchParams);
    if (from) params.set('from', from);
    else params.delete('from');
    
    if (to) params.set('to', to);
    else params.delete('to');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex items-center gap-2 mb-4 bg-white p-2 border border-slate-200 rounded-lg max-w-fit shadow-sm">
      <div className="flex items-center gap-2" dir="ltr">
        <input 
          type="date" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)} 
          className="border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#017E84] w-32 outline-none text-slate-700"
        />
        <span className="text-slate-500 font-bold">-</span>
        <input 
          type="date" 
          value={to} 
          onChange={(e) => setTo(e.target.value)} 
          className="border border-slate-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-[#017E84] w-32 outline-none text-slate-700"
        />
      </div>
      <button 
        onClick={apply}
        disabled={isPending}
        className="px-4 py-1.5 bg-[#017E84] text-white rounded text-sm font-bold hover:bg-[#016E73] disabled:opacity-50 transition-colors mr-2"
      >
        تطبيق
      </button>
    </div>
  );
}