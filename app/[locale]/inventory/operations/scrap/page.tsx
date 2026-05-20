import { getScraps } from "@/app/actions/inventoryConfig";
export default async function ScrapPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const items = await getScraps();
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
              <th className="py-3 px-4">المرجع</th>{" "}
              <th className="py-3 px-4">التاريخ</th>{" "}
              <th className="py-3 px-4">المنتج</th>{" "}
              <th className="py-3 px-4">الكمية</th>{" "}
              <th className="py-3 px-4">من موقع</th>{" "}
              <th className="py-3 px-4">إلى موقع</th>{" "}
              <th className="py-3 px-4">الحالة</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {items.length === 0 ? <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  لا توجد عمليات إتلاف
                </td>
              </tr> : items.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {item.name}
                  </td>{" "}
                  <td className="py-3 px-4">
                    {new Date(item.date).toLocaleDateString()}
                  </td>{" "}
                  <td className="py-3 px-4">{item.product?.name}</td>{" "}
                  <td className="py-3 px-4 font-bold">
                    {Number(item.quantity).toFixed(2)}
                  </td>{" "}
                  <td className="py-3 px-4">{item.sourceLocation?.name}</td>{" "}
                  <td className="py-3 px-4">{item.scrapLocation?.name}</td>{" "}
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                      {item.state}
                    </span>
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}