import { getReplenishments } from "@/app/actions/inventoryConfig";
export default async function ReplenishmentPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const items = await getReplenishments();
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
              <th className="py-3 px-4">المنتج</th>{" "}
              <th className="py-3 px-4">الموقع</th>{" "}
              <th className="py-3 px-4">الحد الأدنى</th>{" "}
              <th className="py-3 px-4">الحد الأقصى</th>{" "}
              <th className="py-3 px-4">مضاعفات الطلب</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {items.length === 0 ? <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  لا توجد قواعد توريد تلقائي
                </td>
              </tr> : items.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.product?.name}
                  </td>{" "}
                  <td className="py-3 px-4">{item.location?.name}</td>{" "}
                  <td className="py-3 px-4 text-orange-600 font-bold">
                    {Number(item.minQty).toFixed(2)}
                  </td>{" "}
                  <td className="py-3 px-4 text-green-600 font-bold">
                    {Number(item.maxQty).toFixed(2)}
                  </td>{" "}
                  <td className="py-3 px-4">
                    {Number(item.qtyMultiple).toFixed(2)}
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}