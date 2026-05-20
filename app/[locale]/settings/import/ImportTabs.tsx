'use client';

import { useState } from "react";
import ImportClient from "./ImportClient";
import ImportPartnersClient from "./ImportPartnersClient";
import { Package, Users } from "lucide-react";

export default function ImportTabs() {
  const [activeTab, setActiveTab] = useState<'products' | 'partners'>('products');

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mx-auto md:mx-0 shadow-inner">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'products'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          المنتجات والمخزون
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'partners'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          العملاء والأرصدة التاريخية
        </button>
      </div>

      {activeTab === 'products' && <ImportClient />}
      {activeTab === 'partners' && <ImportPartnersClient />}
    </div>
  );
}
