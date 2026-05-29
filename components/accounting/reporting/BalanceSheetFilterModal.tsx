'use client';

import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
interface Journal {
  id: string;
  name: string;
  code: string;
}
interface BalanceSheetFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  journals: Journal[];
}
export function BalanceSheetFilterModal({
  isOpen,
  onClose,
  journals
}: BalanceSheetFilterModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [fromDate, setFromDate] = useState(searchParams.get('from') || '');
  const [toDate, setToDate] = useState(searchParams.get('to') || '');
  const [targetState, setTargetState] = useState<'posted' | 'all'>(searchParams.get('target') as any || 'posted');
  const [showDc, setShowDc] = useState(searchParams.get('showDc') === 'true');
  const [enableComparison, setEnableComparison] = useState(false);
  const initialJournals = searchParams.get('journals') ? searchParams.get('journals')!.split(',') : journals.map(j => j.id);
  const [selectedJournals, setSelectedJournals] = useState<string[]>(initialJournals);
  if (!isOpen) return null;
  const handleJournalToggle = (id: string) => {
    if (selectedJournals.includes(id)) {
      setSelectedJournals(selectedJournals.filter(jId => jId !== id));
    } else {
      setSelectedJournals([...selectedJournals, id]);
    }
  };
  const handleApply = () => {
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    if (targetState) params.set('target', targetState);
    if (showDc) params.set('showDc', 'true');
    if (selectedJournals.length > 0 && selectedJournals.length < journals.length) {
      params.set('journals', selectedJournals.join(','));
    }
    router.push(`${pathname}?${params.toString()}`);
    onClose();
  };
  const handleExportExcel = () => {
    window.dispatchEvent(new CustomEvent('export-pl-excel'));
    onClose();
  };
  const handleExportPdf = () => {
    window.dispatchEvent(new CustomEvent('export-pl-pdf'));
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" dir="rtl"> <div className="bg-white rounded shadow-sm w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200"> {} <div className="flex justify-between items-center p-4 border-b border-slate-200"> <h2 className="text-xl font-bold text-slate-800">الميزانية العمومية</h2> <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors"> <X className="w-5 h-5" /> </button> </div> {} <div className="p-6 overflow-y-auto flex-1 space-y-8"> {} <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> <div className="col-span-1 text-xs font-bold text-slate-400 tracking-wider">DATE RANGE</div> <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4"> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-700">مدى التاريخ</label> <select className="w-full border-b border-slate-300 bg-transparent text-sm py-1 focus:border-slate-800 outline-none"> <option>مخصص</option> <option>هذا العام</option> <option>هذا الشهر</option> </select> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-700">الحركات المستهدفة</label> <div className="space-y-2"> <label className="flex items-center gap-2 cursor-pointer group"> <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${targetState === 'posted' ? 'border-[#017E84]' : 'border-slate-300 group-hover:border-slate-400'}`}> {targetState === 'posted' && <div className="w-2 h-2 rounded-full bg-[#017E84]" />} </div> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="radio" className="hidden" checked={targetState === 'posted'} onChange={() => setTargetState('posted')} /> <span className="text-sm text-slate-700">كل الادخالات المرحلة</span> </label> <label className="flex items-center gap-2 cursor-pointer group"> <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${targetState === 'all' ? 'border-[#017E84]' : 'border-slate-300 group-hover:border-slate-400'}`}> {targetState === 'all' && <div className="w-2 h-2 rounded-full bg-[#017E84]" />} </div> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="radio" className="hidden" checked={targetState === 'all'} onChange={() => setTargetState('all')} /> <span className="text-sm text-slate-700">كل الادخالات</span> </label> </div> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-700">تاريخ البداية</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" lang="en" dir="ltr" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-full border-b border-slate-300 bg-transparent text-sm py-1 focus:border-slate-800 outline-none text-right" /> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-700">عرض أعمدة المدين/الدائن</label> <div className="flex items-center gap-1"> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={showDc} onChange={e => setShowDc(e.target.checked)} className="w-4 h-4 text-[#017E84] rounded border-slate-300 focus:ring-[#017E84]" /> <span className="text-slate-400 text-xs bg-slate-100 rounded-full w-4 h-4 flex items-center justify-center cursor-help" title="تفعيل هذا الخيار سيظهر أعمدة دائن ومدين بجانب عمود الرصيد">?</span> </div> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-700">تاريخ النهاية</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="date" lang="en" dir="ltr" value={toDate} onChange={e => setToDate(e.target.value)} className="w-full border-b border-slate-300 bg-transparent text-sm py-1 focus:border-slate-800 outline-none text-right" /> </div> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-700">تقارير الحسابات</label> <select className="w-full border-b border-slate-300 bg-transparent text-sm py-1 focus:border-slate-800 outline-none" disabled> <option>الميزانية العمومية</option> </select> </div> </div> </div> <hr className="border-slate-200" /> {} <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> <div className="col-span-1 text-xs font-bold text-slate-400 tracking-wider">COMPARISON</div> <div className="col-span-3"> <div className="grid grid-cols-[140px_1fr] items-center"> <label className="text-sm font-bold text-slate-700">تفعيل المقارنه</label> <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" checked={enableComparison} onChange={e => setEnableComparison(e.target.checked)} className="w-4 h-4 text-[#017E84] rounded border-slate-300 focus:ring-[#017E84]" /> </div> </div> </div> <hr className="border-slate-200" /> {} <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> <div className="col-span-1 text-sm font-bold text-slate-700">الدفاتر</div> <div className="col-span-3"> <div className="border border-slate-300 rounded p-3 min-h-[120px] max-h-[250px] overflow-y-auto bg-white flex flex-wrap gap-2"> {journals.map(journal => {
                const isSelected = selectedJournals.includes(journal.id);
                return <button key={journal.id} onClick={() => handleJournalToggle(journal.id)} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-colors ${isSelected ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-white border-dashed border-slate-300 text-slate-500 hover:bg-slate-50'}`}> {isSelected && <X className="w-3 h-3 hover:text-red-500" />} {journal.name} </button>;
              })} {} {selectedJournals.length !== journals.length && <button onClick={() => setSelectedJournals(journals.map(j => j.id))} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-transparent text-[#017E84] hover:bg-teal-50 transition-colors"> تحديد الكل </button>} </div> </div> </div> </div> {} <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-b"> <div className="flex gap-2"> <button onClick={handleExportPdf} className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold rounded transition-colors shadow-sm"> PDF </button> <button onClick={handleExportExcel} className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-bold rounded transition-colors shadow-sm"> اكسيل </button> </div> <div className="flex gap-2"> <button onClick={handleApply} className="px-6 py-2 bg-[#017E84] hover:bg-teal-800 text-white text-sm font-bold rounded transition-colors shadow-sm"> عرض </button> <button onClick={onClose} className="px-4 py-2 text-[#017E84] hover:bg-teal-50 text-sm font-bold rounded transition-colors"> إلغاء </button> </div> </div> </div> </div>;
}