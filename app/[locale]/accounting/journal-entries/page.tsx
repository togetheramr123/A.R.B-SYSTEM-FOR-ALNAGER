import { getTranslations } from "next-intl/server";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Search, Upload } from "lucide-react";
import { serializeDecimal } from "@/lib/serialize";
import { OdooControlPanel } from "@/components/ui/OdooControlPanel";
import { KanbanView } from "./KanbanView";
import { GroupedListView } from "./GroupedListView";

export default async function JournalEntriesPage(props: {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
    filter?: string;
    groupBy?: string;
    view?: string;
    q?: string;
  }>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  
  const filterParams = searchParams?.filter?.split(",") || [];
  const groupBy = searchParams?.groupBy;
  const view = searchParams?.view || "list";
  const q = searchParams?.q;
  
  const currentPage = parseInt(searchParams?.page || "1");
  const pageSize = 80;
  const skip = (currentPage - 1) * pageSize;

  const where: any = {};
  
  // Basic states
  if (filterParams.includes("posted")) where.state = "posted";
  if (filterParams.includes("draft")) where.state = "draft";
  if (filterParams.includes("reversed")) where.state = "reversed";
  
  // Journals
  const journalTypes = [];
  if (filterParams.includes("sales")) journalTypes.push("sales");
  if (filterParams.includes("purchases")) journalTypes.push("purchase");
  if (filterParams.includes("bank")) journalTypes.push("bank");
  if (filterParams.includes("cash")) journalTypes.push("cash");
  if (filterParams.includes("general")) journalTypes.push("general");
  
  if (journalTypes.length > 0) {
    where.journal = { type: { in: journalTypes } };
  }
  
  // Dates
  if (filterParams.includes("date_year")) {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    where.date = { gte: startOfYear };
  } else if (filterParams.includes("date_month")) {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    where.date = { gte: startOfMonth };
  }
  
  // Search
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { ref: { contains: q } },
      { partner: { name: { contains: q } } }
    ];
  }

  const [entries, totalCount] = await Promise.all([
    prisma.journalEntry.findMany({
      where,
      include: {
        journal: true,
        partner: true,
        items: { include: { account: true } }
      },
      orderBy: { date: "desc" },
      skip,
      take: pageSize
    }),
    prisma.journalEntry.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);
  const serializedEntries = serializeDecimal(entries);
  const startRecord = totalCount > 0 ? skip + 1 : 0;
  const endRecord = Math.min(skip + pageSize, totalCount);

  // Handle Grouping
  let groupedEntries: any[] = [];
  if (groupBy) {
    const groupsMap = new Map<string, any[]>();
    serializedEntries.forEach((entry: any) => {
      let key = "غير محدد";
      if (groupBy === "partner") key = entry.partner?.name || "بدون شريك";
      else if (groupBy === "journal") key = entry.journal?.name || "بدون دفتر";
      else if (groupBy === "state") key = entry.state === "posted" ? "مرحل" : "مسودة";
      else if (groupBy === "date") {
        key = entry.date ? new Date(entry.date).toLocaleDateString("ar-EG", { month: "long", year: "numeric" }) : "بدون تاريخ";
      }
      
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(entry);
    });
    
    groupedEntries = Array.from(groupsMap.entries()).map(([key, entries]) => ({
      key,
      entries
    }));
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 text-[13px] text-slate-700 font-sans">
      {/* Odoo Control Panel */}
      <div className="border-b border-slate-300 bg-white px-4 py-3 flex flex-col gap-3 shrink-0">
        {/* Top Row: Title & Search */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Link href={`/${locale}/accounting`} className="hover:text-slate-800">المحاسبة</Link>
              <span>/</span>
              <span className="text-slate-800">قيود اليومية</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">قيود اليومية</h1>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-1">
              <Link 
                href={`/${locale}/accounting/journal-entries/new`} 
                className="bg-[#017E84] hover:bg-[#016e73] text-white px-3 py-1.5 rounded-[4px] text-[13px] font-bold transition-colors shadow-sm"
              >
                جديد
              </Link>
              <button className="text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-[4px] hover:bg-slate-100 transition-colors shadow-sm border border-transparent hover:border-slate-300 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                استيراد السجلات
              </button>
            </div>
          </div>
          
          <div className="w-[500px]">
            <form className="relative flex flex-wrap items-center w-full border border-slate-300 rounded bg-white px-2 py-0.5 focus-within:border-[#017E84] focus-within:ring-1 focus-within:ring-[#017E84]">
              {filterParams.map((f: string) => (
                <div key={f} className="flex items-center bg-[#e0e0e0] text-slate-800 px-1.5 py-0.5 rounded text-xs ml-2 gap-1 my-1">
                  <span>
                    {f === 'posted' ? 'تم الترحيل' : f === 'draft' ? 'مسودة' : f === 'sales' ? 'المبيعات' : f === 'purchases' ? 'المشتريات' : f}
                  </span>
                  <Link href={`/${locale}/accounting/journal-entries?filter=${filterParams.filter((p: string) => p !== f).join(",")}`} className="hover:text-red-500">×</Link>
                </div>
              ))}
              {groupBy && (
                <div className="flex items-center bg-[#017E84]/10 text-[#017E84] px-1.5 py-0.5 rounded text-xs ml-2 gap-1 my-1">
                  <span>تجميع: {groupBy === 'journal' ? 'الدفتر' : groupBy === 'partner' ? 'الشريك' : groupBy}</span>
                  <Link href={`/${locale}/accounting/journal-entries?filter=${searchParams?.filter || ""}`} className="hover:text-red-500">×</Link>
                </div>
              )}
              <input 
                type="text" 
                name="q"
                defaultValue={q}
                placeholder="بحث..." 
                className="flex-1 py-1.5 min-w-[100px] bg-transparent border-none focus:ring-0 outline-none text-[13px] text-slate-800"
              />
              <input type="hidden" name="filter" value={searchParams?.filter || ""} />
              <input type="hidden" name="groupBy" value={searchParams?.groupBy || ""} />
              <input type="hidden" name="view" value={searchParams?.view || "list"} />
              <button type="submit">
                <Search className="w-4 h-4 text-slate-500 mr-2 cursor-pointer hover:text-slate-800" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Row: Odoo Control Panel (Filters, GroupBy, Favorites, View Toggle, Pager) */}
        <OdooControlPanel 
          totalCount={totalCount}
          startRecord={startRecord}
          endRecord={endRecord}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>

      {/* Main Content Area */}
      {view === "kanban" ? (
        <KanbanView entries={serializedEntries} locale={locale} />
      ) : groupBy ? (
        <GroupedListView groups={groupedEntries} locale={locale} />
      ) : (
        <div className="flex-1 overflow-auto bg-white">
          <table className="w-full text-right whitespace-nowrap table-fixed">
            <thead className="bg-white border-b border-slate-300 text-slate-800 text-[13px]">
              <tr>
                <th className="w-10 py-3 px-4 text-center">
                  <input type="checkbox" className="rounded-sm border-slate-300 text-[#017E84] focus:ring-[#017E84]" />
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
              {serializedEntries.map((entry: any) => {
                const total = entry.items?.reduce((s: number, it: any) => s + Number(it.debit || 0), 0) || 0;
                const dateStr = entry.date ? new Date(entry.date).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                }) : "-";
                
                return (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors group cursor-pointer text-slate-700 border-b border-slate-100 last:border-0">
                    <td className="py-2.5 px-4 text-center">
                      <input type="checkbox" className="rounded-sm border-slate-300 text-[#017E84] focus:ring-[#017E84] opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity" />
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
              {serializedEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 bg-white">
                    لا توجد قيود يومية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
