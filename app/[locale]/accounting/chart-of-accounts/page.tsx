import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getAllAccounts } from '@/app/actions/accounts';
import { Plus, Search, FolderTree, Download, Settings, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';
export default async function ChartOfAccountsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const accounts = await getAllAccounts();
  const typeLabels: Record<string, {
    label: string;
    color: string;
  }> = {
    receivable: {
      label: 'المدين',
      color: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    asset_receivable: {
      label: 'أصول مدينة',
      color: 'bg-blue-50 text-blue-700 border-blue-100'
    },
    payable: {
      label: 'الدائن',
      color: 'bg-slate-50 text-slate-700 border-slate-200'
    },
    asset_payable: {
      label: 'خصوم دائنة',
      color: 'bg-slate-50 text-slate-700 border-slate-200'
    },
    bank: {
      label: 'البنك',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    asset_bank: {
      label: 'البنك',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    cash: {
      label: 'النقد',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    asset_cash: {
      label: 'الصندوق',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    asset: {
      label: 'الأصول المتداولة',
      color: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    asset_current: {
      label: 'أصول متداولة',
      color: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    non_current_asset: {
      label: 'أصول غير متداولة',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-100'
    },
    asset_non_current: {
      label: 'أصول غير متداولة',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-100'
    },
    asset_fixed: {
      label: 'أصول ثابتة',
      color: 'bg-cyan-50 text-cyan-700 border-cyan-100'
    },
    asset_prepayments: {
      label: 'مصاريف مدفوعة مقدماً',
      color: 'bg-teal-50 text-teal-700 border-teal-100'
    },
    income: {
      label: 'الإيرادات',
      color: 'bg-green-50 text-green-700 border-green-100'
    },
    income_other: {
      label: 'إيرادات أخرى',
      color: 'bg-green-50 text-green-700 border-green-100'
    },
    expense: {
      label: 'المصروفات',
      color: 'bg-red-50 text-red-700 border-red-100'
    },
    expense_depreciation: {
      label: 'إهلاك',
      color: 'bg-red-50 text-red-700 border-red-100'
    },
    expense_direct_cost: {
      label: 'تكاليف مباشرة',
      color: 'bg-orange-50 text-orange-700 border-orange-100'
    },
    equity: {
      label: 'حقوق الملكية',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    equity_unaffected: {
      label: 'أرباح غير موزعة',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    liability: {
      label: 'الخصوم',
      color: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    liability_current: {
      label: 'خصوم متداولة',
      color: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    liability_non_current: {
      label: 'خصوم طويلة الأجل',
      color: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    liability_payable: {
      label: 'ذمم دائنة',
      color: 'bg-slate-50 text-slate-700 border-slate-200'
    },
    cost_of_goods: {
      label: 'تكلفة البضاعة المباعة',
      color: 'bg-orange-50 text-orange-700 border-orange-100'
    },
    cost_of_revenue: {
      label: 'تكلفة الإيرادات',
      color: 'bg-orange-50 text-orange-700 border-orange-100'
    },
    current_asset: {
      label: 'الأصول المتداولة',
      color: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    current_assets: {
      label: 'الأصول المتداولة',
      color: 'bg-sky-50 text-sky-700 border-sky-100'
    },
    off_balance: {
      label: 'خارج الميزانية',
      color: 'bg-gray-50 text-gray-600 border-gray-100'
    }
  };
  const typeGroups = Object.entries(accounts.reduce((groups: Record<string, number>, acc: any) => {
    groups[acc.type] = (groups[acc.type] || 0) + 1;
    return groups;
  }, {} as Record<string, number>));
  return <div className="p-6 space-y-5"> {} <div className="flex justify-between items-center"> <h1 className="text-xl font-bold text-gray-900">شجرة الحسابات</h1> <div className="flex gap-3 items-center"> <span className="text-sm text-gray-500 font-medium"> {accounts.length} حساب </span> <Link href={`/${locale}/accounting/chart-of-accounts/new`} className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold shadow-sm"> <Plus className="w-4 h-4" /> جديد </Link> <button className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium border border-gray-200"> <Download className="w-4 h-4" /> تصدير </button> </div> </div> {} <div className="flex gap-2 flex-wrap"> <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100 cursor-pointer"> الكل ({accounts.length}) </span> {typeGroups.map(([type, count]) => {
        const info = typeLabels[type] || {
          label: type,
          color: 'bg-gray-50 text-gray-600 border-gray-100'
        };
        return <span key={type} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity", info.color)}> {info.label} ({count}) </span>;
      })} </div> {} <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden"> <div className="p-4 border-b border-gray-50 flex gap-4 items-center"> <form className="relative flex-1 max-w-sm"> <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /> <input type="text" placeholder="بحث..." className="w-full pr-10 pl-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm bg-gray-50/50" /> </form> </div> <div className="overflow-x-auto"> <table className="w-full text-right"> <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider"> <tr> <th className="px-5 py-3 w-8"><input type="checkbox" className="rounded border-gray-300" /></th> <th className="px-5 py-3 w-28">الكود</th> <th className="px-5 py-3">اسم الحساب</th> <th className="px-5 py-3">النوع</th> <th className="px-5 py-3 w-40">السماح بالتسوية</th> <th className="px-5 py-3 w-24"></th> </tr> </thead> <tbody className="divide-y divide-gray-50"> {accounts.map((acc: any) => {
              const typeInfo = typeLabels[acc.type] || {
                label: acc.type,
                color: 'bg-gray-50 text-gray-600 border-gray-100'
              };
              const isReconcilable = acc.type === 'receivable' || acc.type === 'payable' || acc.type === 'bank' || acc.type === 'cash';
              const accLink = `/${locale}/accounting/chart-of-accounts/${acc.id}`;
              return <tr key={acc.id} className="hover:bg-blue-50/30 transition-colors"> <td className="px-5 py-3"> <input type="checkbox" className="rounded border-gray-300" /> </td> <td className="px-5 py-3 font-mono text-blue-600 font-bold text-sm"> <Link href={accLink}>{acc.code}</Link> </td> <td className="px-5 py-3 text-gray-900 font-medium text-sm"> <Link href={accLink} className="block">{acc.name}</Link> </td> <td className="px-5 py-3"> <span className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold border", typeInfo.color)}> {typeInfo.label} </span> </td> <td className="px-5 py-3 text-center"> {isReconcilable ? <div className="w-9 h-5 bg-blue-500 rounded-full relative inline-block"> <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" /> </div> : <div className="w-9 h-5 bg-gray-200 rounded-full relative inline-block"> <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" /> </div>} </td> <td className="px-5 py-3"> <Link href={accLink} className="text-gray-400 hover:text-gray-600 text-xs font-medium px-2 py-1 rounded bg-gray-50 border border-gray-100"> الإعداد </Link> </td> </tr>;
            })} {accounts.length === 0 && <tr> <td colSpan={6} className="px-6 py-12 text-center text-gray-400"> <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" /> <p className="font-bold">لا توجد حسابات</p> </td> </tr>} </tbody> </table> </div> </div> </div>;
}