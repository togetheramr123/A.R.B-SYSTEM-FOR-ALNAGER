import { getPutawayRules } from "@/app/actions/inventoryConfig";
export default async function PutawayRulesPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const items = await getPutawayRules();
  return <div className="p-4" dir="rtl">
      {" "}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
        {" "}
        <table className="w-full text-right text-sm">
          {" "}
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            {" "}
            <tr>
              {" "}
              <th className="py-3 px-4">رقم التسلسل</th>{" "}
              <th className="py-3 px-4">عند استلام المنتج في الموقع</th>{" "}
              <th className="py-3 px-4">المنتج / الفئة</th>{" "}
              <th className="py-3 px-4">يخزن في الموقع الفرعي</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {items.length === 0 ? <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  لا توجد قواعد تخزين. ابدأ بإنشاء قاعدة.
                </td>
              </tr> : items.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="py-3 px-4 text-slate-500">
                    {item.sequence}
                  </td>{" "}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.inLocation?.name}
                  </td>{" "}
                  <td className="py-3 px-4">
                    {item.product?.name || item.category?.name || "الكل"}
                  </td>{" "}
                  <td className="py-3 px-4 text-sky-700 font-bold">
                    {item.outLocation?.name}
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}