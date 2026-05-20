import { getAllAssetCategories } from "@/app/actions/assets";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
export default async function AssetCategoriesPage() {
  const categories = await getAllAssetCategories();
  return <div className="p-6 max-w-7xl mx-auto">
      {" "}
      <div className="flex justify-between items-center mb-6">
        {" "}
        <h1 className="text-2xl font-bold text-slate-800">
          Asset Categories
        </h1>{" "}
        <Link href="/accounting/configuration/asset_categories/new">
          {" "}
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            {" "}
            <Plus className="w-4 h-4" /> New Category{" "}
          </Button>{" "}
        </Link>{" "}
      </div>{" "}
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {" "}
        <table className="w-full text-left text-sm">
          {" "}
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
            {" "}
            <tr>
              {" "}
              <th className="px-6 py-3">Name</th>{" "}
              <th className="px-6 py-3">Method</th>{" "}
              <th className="px-6 py-3">Duration (Years)</th>{" "}
              <th className="px-6 py-3 text-right">Actions</th>{" "}
            </tr>{" "}
          </thead>{" "}
          <tbody className="divide-y divide-slate-100">
            {" "}
            {categories.map((category: any) => <tr key={category.id} className="hover:bg-slate-50 transition-colors">
                {" "}
                <td className="px-6 py-3 font-medium text-slate-900">
                  {category.name}
                </td>{" "}
                <td className="px-6 py-3 text-slate-600 capitalize">
                  {category.method}
                </td>{" "}
                <td className="px-6 py-3 text-slate-600">
                  {category.duration}
                </td>{" "}
                <td className="px-6 py-3 text-right">
                  {" "}
                  <Link href={`/accounting/configuration/asset_categories/${category.id}`}>
                    {" "}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      {" "}
                      <Edit className="w-4 h-4 text-slate-500" />{" "}
                    </Button>{" "}
                  </Link>{" "}
                </td>{" "}
              </tr>)}{" "}
            {categories.length === 0 && <tr>
                {" "}
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  {" "}
                  No asset categories found. Create a new one to get
                  started.{" "}
                </td>{" "}
              </tr>}{" "}
          </tbody>{" "}
        </table>{" "}
      </div>{" "}
    </div>;
}