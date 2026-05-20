import prisma from "@/lib/prisma";
export default async function LocationsReportPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const items = await prisma.stockQuant.findMany({
    include: {
      location: true,
      product: true
    },
    where: {
      quantity: {
        gt: 0
      }
    },
    orderBy: {
      location: {
        name: "asc"
      }
    }
  });
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
              <th className="py-3 px-4">الموقع</th>{" "}
              <th className="py-3 px-4">المنتج</th>{" "}
              <th className="py-3 px-4">الكمية المتوفرة</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {items.length === 0 ? <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500">
                  لا يوجد مخزون متاح الآن في أي موقع.
                </td>
              </tr> : items.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="py-3 px-4 font-bold text-indigo-700">
                    {item.location?.name}
                  </td>{" "}
                  <td className="py-3 px-4 text-slate-700">
                    {item.product?.name}
                  </td>{" "}
                  <td className="py-3 px-4 font-bold text-green-700">
                    {Number(item.quantity).toFixed(2)}
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}