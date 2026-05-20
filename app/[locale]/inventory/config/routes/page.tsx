import { getRoutes } from "@/app/actions/inventoryConfig";
import Link from "next/link";
export default async function RoutesPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const items = await getRoutes();
  return <div className="p-4" dir="rtl">
      {" "}
      <div className="flex justify-end mb-3">
        {" "}
        <Link href={`/${locale}/inventory/config/routes/new`} className="bg-indigo-600 text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-indigo-700 transition">
          {" "}
          مسار جديد{" "}
        </Link>{" "}
      </div>{" "}
      <div className="bg-white border border-slate-200 shadow-sm rounded-sm overflow-hidden">
        {" "}
        <table className="w-full text-right text-sm">
          {" "}
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
            {" "}
            <tr>
              {" "}
              <th className="py-3 px-4">رقم التسلسل</th>{" "}
              <th className="py-3 px-4">اسم المسار</th>{" "}
              <th className="py-3 px-4">الحالة</th>{" "}
              <th className="py-3 px-4 text-left">إجراءات</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {items.length === 0 ? <tr>
                <td colSpan={4} className="py-8 text-center text-slate-500">
                  لا توجد مسارات مضافة
                </td>
              </tr> : items.map((item: any) => <tr key={item.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="py-3 px-4 text-slate-500">
                    {item.sequence}
                  </td>{" "}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {item.name}
                  </td>{" "}
                  <td className="py-3 px-4">
                    {" "}
                    <span className={`px-2 py-1 rounded text-xs ${item.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {" "}
                      {item.active ? "نشط" : "مؤرشف"}{" "}
                    </span>{" "}
                  </td>{" "}
                  <td className="py-3 px-4 text-left">
                    {" "}
                    <Link href={`/${locale}/inventory/config/routes/${item.id}`} className="text-indigo-600 font-medium text-xs hover:underline bg-indigo-50 px-3 py-1.5 rounded-md">
                      {" "}
                      تعديل{" "}
                    </Link>{" "}
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}