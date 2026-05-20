import { getTranslations } from "next-intl/server";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Plus } from "lucide-react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function ScrapListPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const session = await getSession();
  if (!session) redirect(`/${locale}/login`);
  const t = await getTranslations("Inventory");
  const scraps = await prisma.stockScrap.findMany({
    where: {
      companyId: session.companyId
    },
    include: {
      product: true,
      sourceLocation: true,
      scrapLocation: true
    },
    orderBy: {
      date: "desc"
    }
  });
  return <div className="p-6 space-y-6">
      {" "}
      <div className="flex justify-between items-center">
        {" "}
        <h1 className="text-2xl font-bold text-slate-800">
          Scrap Orders (إهلاك المخزون)
        </h1>{" "}
        <Link href={`/${locale}/inventory/scrap/create`}>
          {" "}
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition-colors">
            {" "}
            <Plus className="w-5 h-5" /> <span>إنشاء أمر تالف</span>{" "}
          </button>{" "}
        </Link>{" "}
      </div>{" "}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {" "}
        <table className="w-full text-left">
          {" "}
          <thead className="bg-slate-50 border-b border-slate-200 font-medium text-slate-500">
            {" "}
            <tr>
              {" "}
              <th className="p-4">Reference</th> <th className="p-4">Date</th>{" "}
              <th className="p-4">Product</th> <th className="p-4">Quantity</th>{" "}
              <th className="p-4">Source Location</th>{" "}
              <th className="p-4">Scrap Location</th>{" "}
              <th className="p-4">Status</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {scraps.length === 0 ? <tr>
                {" "}
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  {" "}
                  No scrap orders found.{" "}
                </td>{" "}
              </tr> : scraps.map(scrap => <tr key={scrap.id} className="hover:bg-slate-50">
                  {" "}
                  <td className="p-4 font-bold text-slate-700">
                    {scrap.name}
                  </td>{" "}
                  <td className="p-4 text-slate-600">
                    {new Date(scrap.date).toLocaleDateString()}
                  </td>{" "}
                  <td className="p-4 text-slate-800 font-medium">
                    {scrap.product.name}
                  </td>{" "}
                  <td className="p-4 text-slate-800">
                    {Number(scrap.quantity)}
                  </td>{" "}
                  <td className="p-4 text-slate-600">
                    {scrap.sourceLocation.name}
                  </td>{" "}
                  <td className="p-4 text-slate-600">
                    {scrap.scrapLocation.name}
                  </td>{" "}
                  <td className="p-4">
                    {" "}
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${scrap.state === "done" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                      {" "}
                      {scrap.state.toUpperCase()}{" "}
                    </span>{" "}
                  </td>{" "}
                </tr>)}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}