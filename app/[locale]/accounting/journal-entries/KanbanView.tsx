"use client";
import Link from "next/link";
import { format } from "date-fns";
import { arEG } from "date-fns/locale";

export function KanbanView({ entries, locale }: { entries: any[], locale: string }) {
  if (entries.length === 0) {
    return <div className="p-8 text-center text-slate-500">لا توجد قيود يومية</div>;
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-slate-50 h-full overflow-auto">
      {entries.map(entry => {
        const total = entry.items?.reduce((s: number, it: any) => s + Number(it.debit || 0), 0) || 0;
        const dateStr = entry.date ? format(new Date(entry.date), 'dd MMM yyyy', { locale: arEG }) : "-";
        
        return (
          <Link href={`/${locale}/accounting/journal-entries/${entry.id}`} key={entry.id}>
            <div className="bg-white border border-slate-200 rounded shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-2 h-full cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="font-bold text-slate-800 text-sm truncate">{entry.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${entry.state === 'posted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {entry.state === 'posted' ? 'مرحل' : 'مسودة'}
                </span>
              </div>
              <div className="text-[12px] text-slate-500 flex flex-col gap-1 mt-1">
                <div className="flex justify-between">
                  <span>التاريخ:</span>
                  <span className="text-slate-700 font-medium">{dateStr}</span>
                </div>
                <div className="flex justify-between">
                  <span>الدفتر:</span>
                  <span className="text-slate-700 font-medium truncate max-w-[100px]">{entry.journal?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>الشريك:</span>
                  <span className="text-slate-700 font-medium truncate max-w-[100px]">{entry.partner?.name || "-"}</span>
                </div>
              </div>
              <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-end">
                <span className="text-[11px] text-slate-400">الإجمالي</span>
                <span className="font-bold text-[#017E84] text-sm">
                  {total.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-[10px]">LE</span>
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
