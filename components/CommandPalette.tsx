"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Command, FileText, Settings, User, Box, Wallet } from "lucide-react";
import { useLocale } from "next-intl";
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  const commands = [{
    name: locale === "ar" ? "لوحة التحكم" : "Dashboard",
    icon: Command,
    path: `/${locale}/dashboard`
  }, {
    name: locale === "ar" ? "المبيعات" : "Sales Orders",
    icon: FileText,
    path: `/${locale}/sales`
  }, {
    name: locale === "ar" ? "المخزون" : "Inventory",
    icon: Box,
    path: `/${locale}/inventory`
  }, {
    name: locale === "ar" ? "الفواتير" : "Invoices",
    icon: Wallet,
    path: `/${locale}/accounting/invoices`
  }, {
    name: locale === "ar" ? "الشركاء" : "Partners",
    icon: User,
    path: `/${locale}/accounting/partners`
  }, {
    name: locale === "ar" ? "الإعدادات" : "Settings",
    icon: Settings,
    path: `/${locale}/settings`
  }];
  const filtered = commands.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm transition-all" onClick={() => setOpen(false)}>
      {" "}
      <div className="bg-white w-full max-w-lg rounded-sm shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {" "}
        <div className="flex items-center border-b border-slate-100 px-4">
          {" "}
          <Search className="w-5 h-5 text-slate-400" />{" "}
          <input autoComplete="off" autoCorrect="off" spellCheck={false} className="flex-1 px-4 py-4 outline-none text-lg bg-transparent" placeholder={locale === "ar" ? "ابحث عن أمر أو صفحة..." : "Type a command or search..."} autoFocus value={search} onChange={e => setSearch(e.target.value)} />{" "}
          <div className="text-xs text-slate-400 font-medium px-2 py-1 bg-slate-100 rounded">
            ESC
          </div>{" "}
        </div>{" "}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {" "}
          {filtered.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">
              {" "}
              {locale === "ar" ? "لا توجد نتائج." : "No results found."}{" "}
            </div>}{" "}
          {filtered.map((cmd, i) => <button key={i} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-100 text-left transition-colors group" onClick={() => {
          router.push(cmd.path);
          setOpen(false);
        }}>
              {" "}
              <div className="p-2 bg-slate-50 rounded-md text-slate-500 group-hover:text-[#017E84] group-hover:bg-[#017E84]/10 transition-colors">
                {" "}
                <cmd.icon className="w-5 h-5" />{" "}
              </div>{" "}
              <span className="font-medium text-slate-700">
                {cmd.name}
              </span>{" "}
            </button>)}{" "}
        </div>{" "}
        <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          {" "}
          Smart ERP Command Center{" "}
        </div>{" "}
      </div>{" "}
    </div>;
}