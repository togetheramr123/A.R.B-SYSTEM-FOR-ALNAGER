import { getDeliveryMethods } from "@/app/actions/inventoryConfig";
export default async function DeliveryMethodsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const items = await getDeliveryMethods();
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
              <th className="py-3 px-4">اسم طريقة التوصيل</th>{" "}
              <th className="py-3 px-4">المزود الأساسي</th>{" "}
              <th className="py-3 px-4">السعر الثابت</th>{" "}
              <th className="py-3 px-4">الحالة</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {items.length === 0 ? <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  لا توجد طرق أو تسعير للتوصيل
                </td>
              </tr> : items.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="py-3 px-4 font-bold text-sky-700">
                    {item.name}
                  </td>{" "}
                  <td className="py-3 px-4">
                    {" "}
                    <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-xs">
                      {item.provider}
                    </span>{" "}
                  </td>{" "}
                  <td className="py-3 px-4 font-bold">
                    {Number(item.fixedPrice).toFixed(2)}
                  </td>{" "}
                  <td className="py-3 px-4">
                    {" "}
                    <span className={`px-2 py-1 rounded text-xs ${item.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {" "}
                      {item.active ? "نشط" : "مؤرشف"}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}