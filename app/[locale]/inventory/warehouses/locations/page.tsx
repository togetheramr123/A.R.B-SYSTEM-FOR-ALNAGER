import prisma from "@/lib/prisma";
export default async function LocationsPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const items = await prisma.location.findMany({
    include: {
      warehouse: true,
      parent: true
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
              <th className="py-3 px-4">الاسم</th>{" "}
              <th className="py-3 px-4">النوع</th>{" "}
              <th className="py-3 px-4">المستودع الرئيسي</th>{" "}
              <th className="py-3 px-4">الموقع الأب</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {items.length === 0 ? <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  لا توجد مواقع تخزين
                </td>
              </tr> : items.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="py-3 px-4 font-bold text-sky-700">
                    {item.name}
                  </td>{" "}
                  <td className="py-3 px-4">
                    {" "}
                    <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs">
                      {item.type}
                    </span>{" "}
                  </td>{" "}
                  <td className="py-3 px-4">{item.warehouse?.name || "-"}</td>{" "}
                  <td className="py-3 px-4">{item.parent?.name || "-"}</td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}