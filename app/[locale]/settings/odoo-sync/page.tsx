'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { syncOdooProducts, syncOdooInvoices } from '@/app/actions/odoo-sync';
type SyncResult = {
  success: boolean;
  message: string;
};
export default function OdooSyncPage() {
  const t = useTranslations('Common');
  const [config, setConfig] = useState({
    url: 'http://161.97.141.100:10016',
    db: 'hosien_alnagar',
    username: 'togetheramr123@mail.com',
    password: '1993'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const handleSyncProducts = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await syncOdooProducts(config);
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        message: e.message
      });
    } finally {
      setLoading(false);
    }
  };
  const handleSyncInvoices = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await syncOdooInvoices(config);
      setResult(res);
    } catch (e: any) {
      setResult({
        success: false,
        message: e.message
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="max-w-2xl mx-auto space-y-8 p-6"> <h1 className="text-2xl font-bold text-slate-900">Odoo Data Synchronization</h1> <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4"> <h2 className="text-lg font-semibold text-slate-800">Connection Details</h2> <div className="grid grid-cols-1 gap-4"> <div> <label className="block text-sm font-medium text-slate-700 mb-1">Odoo URL</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="https://your-odoo-instance.com" value={config.url} onChange={e => setConfig({
            ...config,
            url: e.target.value
          })} /> </div> <div> <label className="block text-sm font-medium text-slate-700 mb-1">Database Name</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="my_db" value={config.db} onChange={e => setConfig({
            ...config,
            db: e.target.value
          })} /> </div> <div> <label className="block text-sm font-medium text-slate-700 mb-1">Username / Email</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="text" className="w-full border border-slate-300 rounded p-2 text-sm" placeholder="admin@example.com" value={config.username} onChange={e => setConfig({
            ...config,
            username: e.target.value
          })} /> </div> <div> <label className="block text-sm font-medium text-slate-700 mb-1">Password / API Key</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="password" className="w-full border border-slate-300 rounded p-2 text-sm" value={config.password} onChange={e => setConfig({
            ...config,
            password: e.target.value
          })} /> </div> </div> </div> <div className="flex gap-4"> <button onClick={handleSyncProducts} disabled={loading || !config.db} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"> {loading ? 'Syncing...' : 'Sync Products & Prices'} </button> <button onClick={handleSyncInvoices} disabled={loading || !config.db} className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 disabled:opacity-50"> {loading ? 'Syncing...' : 'Sync Invoices (Keep History)'} </button> </div> {result && <div className={`p-4 rounded border ${result.success ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}> {result.message} </div>} </div>;
}