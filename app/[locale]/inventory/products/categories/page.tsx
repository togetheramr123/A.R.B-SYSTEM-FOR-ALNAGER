import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, FolderTree, Settings, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryListActions } from "./CategoryListActions";
export default async function ProductCategoriesPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const categories = await prisma.productCategory.findMany({
    orderBy: {
      name: "asc"
    },
    include: {
      parent: {
        select: {
          name: true
        }
      },
      _count: {
        select: {
          products: true
        }
      }
    }
  });
  const costingLabels: Record<string, string> = {
    standard: "السعر القياسي",
    fifo: "FIFO",
    avco: "متوسط التكلفة (AVCO)"
  };
  const valuationLabels: Record<string, string> = {
    manual_periodic: "يدوي (دوري)",
    real_time: "آلي (مؤتمت)"
  };
  return <div className="p-4" dir="rtl">
      {" "}
      <CategoryListActions />{" "}
      <div className="bg-white rounded-sm border-t border-gray-200 shadow-sm overflow-hidden min-h-[calc(100vh-140px)]">
        <table className="w-full text-right text-[13px] text-[#212529]">
          <thead className="border-b border-gray-300">
            <tr>
              <th className="w-10 px-4 py-3 text-center">
                <input type="checkbox" className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] cursor-pointer" />
              </th>
              <th className="px-3 py-3 text-right font-bold text-[#495057]">اسم الفئة</th>
              <th className="px-3 py-3 text-right font-bold text-[#495057]">الفئة الأم</th>
              <th className="px-3 py-3 text-right font-bold text-[#495057]">طريقة التكلفة</th>
              <th className="px-3 py-3 text-right font-bold text-[#495057]">تقييم المخزون</th>
              <th className="px-3 py-3 text-center font-bold text-[#495057]">المنتجات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((cat: any) => (
              <tr key={cat.id} className="hover:bg-gray-100 transition-colors group cursor-pointer">
                <td className="px-4 py-2.5 text-center">
                  <input type="checkbox" className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" />
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/${locale}/inventory/products/categories/${cat.id}`} className="font-semibold text-gray-900 group-hover:text-[#017E84] transition-colors block w-full">
                    {cat.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-gray-700">
                  {cat.parent?.name || ""}
                </td>
                <td className="px-3 py-2.5 text-gray-700">
                  {costingLabels[cat.costingMethod] || cat.costingMethod}
                </td>
                <td className="px-3 py-2.5 text-gray-700">
                  {valuationLabels[cat.valuation] || cat.valuation}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-700">
                  {cat._count.products > 0 ? cat._count.products : ""}
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                  <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold">لا توجد فئات</p>
                  <p className="text-sm mt-1">أضف فئة جديدة للبدء</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
}