"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";

export function GroupedListView({ groups, locale }: { groups: any[], locale: string }) {
  if (groups.length === 0) {
    return <div className="p-12 text-center text-slate-500">لا توجد قيود يومية</div>;
  }

  return (
    <div className="flex-1 overflow-auto bg-white">
      <table className="w-full text-right whitespace-nowrap table-fixed">
        <thead className="bg-white border-b border-slate-300 text-slate-800 text-[13px]">
          <tr>
            <th className="w-10 py-3 px-4 text-center">
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="rounded-sm border-slate-300 text-[#017E84] focus:ring-[#017E84]" />
            </th>
            <th className="py-3 px-2 font-bold w-32">التاريخ</th>
            <th className="py-3 px-2 font-bold w-48">عدد</th>
            <th className="py-3 px-2 font-bold w-48">الشريك</th>
            <th className="py-3 px-2 font-bold w-40">المرجع</th>
            <th className="py-3 px-2 font-bold w-40">دفتر اليومية</th>
            <th className="py-3 px-2 font-bold w-32">الإجمالي</th>
            <th className="py-3 px-4 font-bold w-32 text-left">الحالة</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white text-[13px]">
          {groups.map((group, idx) => (
            <GroupSection key={idx} group={group} locale={locale} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupSection({ group, locale }: { group: any, locale: string }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <tr className="bg-slate-100/80 border-b border-slate-200 cursor-pointer hover:bg-slate-200/60" onClick={() => setIsOpen(!isOpen)}>
        <td colSpan={8} className="py-2.5 px-4 font-bold text-slate-800">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
            <span>{group.key || "غير محدد"}</span>
            <span className="text-slate-500 font-normal">({group.entries.length})</span>
          </div>
        </td>
      </tr>
      
      {isOpen && group.entries.map((entry: any) => {
        const total = entry.items?.reduce((s: number, it: any) => s + Number(it.debit || 0), 0) || 0;
        const dateStr = entry.date ? new Date(entry.date).toLocaleDateString("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric"
        }) : "-";
        
        return (
          <tr key={entry.id} className="hover:bg-slate-50 transition-colors group/row cursor-pointer text-slate-700 border-b border-slate-100 last:border-0">
            <td className="py-2.5 px-4 text-center">
              <input autoComplete="off" autoCorrect="off" spellCheck={false} type="checkbox" className="rounded-sm border-slate-300 text-[#017E84] focus:ring-[#017E84] opacity-0 group-hover/row:opacity-100 checked:opacity-100 transition-opacity" />
            </td>
            <td className="py-2.5 px-2 truncate" title={dateStr}>{dateStr}</td>
            <td className="py-2.5 px-2 font-bold truncate text-slate-800" title={entry.name}>
              <Link href={`/${locale}/accounting/journal-entries/${entry.id}`} className="hover:text-[#017E84]">
                {entry.name}
              </Link>
            </td>
            <td className="py-2.5 px-2 truncate" title={entry.partner?.name || ""}>{entry.partner?.name || ""}</td>
            <td className="py-2.5 px-2 truncate" title={entry.ref || ""}>{entry.ref || ""}</td>
            <td className="py-2.5 px-2 truncate" title={entry.journal?.name || ""}>{entry.journal?.name || ""}</td>
            <td className="py-2.5 px-2 font-medium text-slate-800">
              {total.toLocaleString("en-US", { minimumFractionDigits: 2 })} <span className="text-slate-500 text-[11px]">LE</span>
            </td>
            <td className="py-2.5 px-4 text-left">
              {entry.state === "posted" ? (
                <span className="bg-[#28A745] text-white px-2 py-0.5 rounded-[12px] text-[11px] font-bold shadow-sm">
                  تم الترحيل
                </span>
              ) : (
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-[12px] text-[11px] font-bold shadow-sm">
                  مسودة
                </span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
