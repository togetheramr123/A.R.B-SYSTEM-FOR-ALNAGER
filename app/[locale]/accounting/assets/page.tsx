import { getAllAssets } from "@/app/actions/assets";
import { TopPortal } from "@/components/common/TopPortal";
import Link from "next/link";
import { Plus } from "lucide-react";
export default async function AssetsListPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const assets = await getAllAssets();
  return <div className="p-4" dir="rtl">
      {" "}
      <TopPortal>
        {" "}
        <Link href={`/${locale}/accounting/assets/new`} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm px-3 py-1 text-xs font-bold flex items-center gap-1.5 transition-colors">
          {" "}
          <Plus className="w-3.5 h-3.5" /> جديد{" "}
        </Link>{" "}
      </TopPortal>{" "}
      <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden">
        {" "}
        <table className="w-full text-right text-sm">
          {" "}
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            {" "}
            <tr>
              {" "}
              <th className="py-2.5 px-4 font-bold">اسم الأصل</th>{" "}
              <th className="py-2.5 px-4 font-bold">تاريخ الشراء</th>{" "}
              <th className="py-2.5 px-4 font-bold">الفئة</th>{" "}
              <th className="py-2.5 px-4 font-bold">القيمة الأصلية</th>{" "}
              <th className="py-2.5 px-4 font-bold">القيمة الحالية</th>{" "}
              <th className="py-2.5 px-4 font-bold">الحالة</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {assets.map((asset: any) => <tr key={asset.id} className="hover:bg-slate-50 group">
                {" "}
                <td className="py-2 px-4 font-medium text-indigo-700">
                  {" "}
                  <Link href={`/${locale}/accounting/assets/${asset.id}`}>
                    {" "}
                    {asset.name}{" "}
                  </Link>{" "}
                </td>{" "}
                <td className="py-2 px-4 text-slate-600">
                  {" "}
                  {new Date(asset.date).toLocaleDateString()}{" "}
                </td>{" "}
                <td className="py-2 px-4 text-slate-800">
                  {" "}
                  {asset.category?.name || "-"}{" "}
                </td>{" "}
                <td className="py-2 px-4 font-bold text-slate-900">
                  {" "}
                  {asset.originalValue.toLocaleString()}{" "}
                </td>{" "}
                <td className="py-2 px-4 font-bold text-slate-700">
                  {" "}
                  {asset.bookValue.toLocaleString()}{" "}
                </td>{" "}
                <td className="py-2 px-4">
                  {" "}
                  <span className={`px-2 py-0.5 rounded text-xs ${asset.state === "open" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                    {" "}
                    {asset.state === "open" ? "شغال" : asset.state === "closed" ? "مغلق" : "مسودة"}{" "}
                  </span>{" "}
                </td>{" "}
              </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}