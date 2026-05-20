import Link from "next/link";
import { getPutawayRules } from "@/app/actions/inventoryConfig";
export default async function PutawayRulesPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const rules = await getPutawayRules();
  return <div className="p-4" dir="rtl">
      {" "}
      <div className="flex justify-end mb-3">
        {" "}
        <Link href={`/${locale}/inventory/config/putaway/new`} className="bg-indigo-600 text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-indigo-700 transition">
          {" "}
          قاعدة جديدة{" "}
        </Link>{" "}
      </div>{" "}
      <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden">
        {" "}
        <table className="w-full text-sm text-right">
          {" "}
          <thead className="bg-[#f8f9fa] text-slate-500 border-b border-slate-200">
            {" "}
            <tr>
              {" "}
              <th className="px-4 py-3 font-bold">عند وصول المنتج إلى</th>{" "}
              <th className="px-4 py-3 font-bold">المنتج المُطبق عليه</th>{" "}
              <th className="px-4 py-3 font-bold">فئة المنتجات</th>{" "}
              <th className="px-4 py-3 font-bold">خزّن في الوجهة</th>{" "}
              <th className="px-4 py-3 font-bold w-16">التسلسل</th>{" "}
              <th className="px-4 py-3 font-bold w-20">إجراءات</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {rules.map(rule => <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                {" "}
                <td className="px-4 py-3 font-bold text-slate-700">
                  {rule.inLocation?.name}
                </td>{" "}
                <td className="px-4 py-3 text-slate-600">
                  {rule.product?.name || <span className="text-slate-400 italic">الكل</span>}
                </td>{" "}
                <td className="px-4 py-3 text-slate-600">
                  {rule.category?.name || <span className="text-slate-400 italic">الكل</span>}
                </td>{" "}
                <td className="px-4 py-3 text-green-700 font-bold">
                  {rule.outLocation?.name}
                </td>{" "}
                <td className="px-4 py-3 text-slate-500 text-center">
                  {rule.sequence}
                </td>{" "}
                <td className="px-4 py-3 text-left">
                  {" "}
                  <Link href={`/${locale}/inventory/config/putaway/${rule.id}`} className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 flex items-center justify-center rounded transition-colors text-xs font-bold border border-transparent hover:border-indigo-200">
                    {" "}
                    تعديل{" "}
                  </Link>{" "}
                </td>{" "}
              </tr>)}{" "}
            {rules.length === 0 && <tr>
                {" "}
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  لا توجد قواعد تخزين. قم بإنشاء قاعدة جديدة لبدء التوجيه الآلي
                  للمخزون.
                </td>{" "}
              </tr>}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}