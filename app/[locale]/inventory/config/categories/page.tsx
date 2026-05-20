import { getTranslations } from "next-intl/server";
import { getCategories } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Folder } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export default async function CategoriesPage(props: {
  params: Promise<{
    locale: string;
  }>;
}) {
  const {
    locale
  } = await props.params;
  const t = await getTranslations("Category");
  const categories = await getCategories();
  return <div className="bg-white min-h-screen w-full font-sans" dir="rtl">
      {" "}
      {/* Control Panel */}{" "}
      <div className="border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
        {" "}
        <div className="flex items-center gap-4">
          {" "}
          <h1 className="text-xl text-gray-800 font-bold whitespace-nowrap">
            {" "}
            {t("title")}{" "}
          </h1>{" "}
          <Link href={`/${locale}/inventory/config/categories/new`}>
            {" "}
            <Button className="bg-[#017E84] hover:bg-[#01686d] text-white rounded-sm px-4 h-8 text-sm font-bold shadow-none">
              {" "}
              جديد{" "}
            </Button>{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
      <div className="w-full">
        {" "}
        <Table className="w-full text-right" dir="rtl">
          {" "}
          <TableHeader className="bg-white sticky top-0 z-10 border-b-2 border-gray-200">
            {" "}
            <TableRow className="border-none hover:bg-transparent">
              {" "}
              <TableHead className="text-right">{t("name")}</TableHead>{" "}
              <TableHead className="text-right">{t("parent")}</TableHead>{" "}
              <TableHead className="text-right">{t("costingMethod")}</TableHead>{" "}
              <TableHead className="text-right">{t("valuation")}</TableHead>{" "}
              <TableHead className="text-right">
                {t("removalStrategy")}
              </TableHead>{" "}
            </TableRow>{" "}
          </TableHeader>{" "}
          <TableBody>
            {" "}
            {categories.map((category: any) => <TableRow key={category.id} className="cursor-pointer hover:bg-gray-100 border-b border-gray-100 group">
                {" "}
                <TableCell className="py-2 px-4 font-medium">
                  {" "}
                  <Link href={`/${locale}/inventory/config/categories/${category.id}`} className="block w-full h-full text-gray-900 group-hover:text-gray-900">
                    {" "}
                    {category.name}{" "}
                  </Link>{" "}
                </TableCell>{" "}
                <TableCell>
                  {" "}
                  <Link href={`/${locale}/inventory/config/categories/${category.id}`} className="block w-full h-full">
                    {" "}
                    {category.parent?.name || "-"}{" "}
                  </Link>{" "}
                </TableCell>{" "}
                <TableCell>
                  {" "}
                  <Link href={`/${locale}/inventory/config/categories/${category.id}`} className="block w-full h-full">
                    {" "}
                    {category.costingMethod}{" "}
                  </Link>{" "}
                </TableCell>{" "}
                <TableCell>
                  {" "}
                  <Link href={`/${locale}/inventory/config/categories/${category.id}`} className="block w-full h-full">
                    {" "}
                    {category.valuation}{" "}
                  </Link>{" "}
                </TableCell>{" "}
                <TableCell>
                  {" "}
                  <Link href={`/${locale}/inventory/config/categories/${category.id}`} className="block w-full h-full">
                    {" "}
                    {category.removalStrategy}{" "}
                  </Link>{" "}
                </TableCell>{" "}
              </TableRow>)}{" "}
          </TableBody>{" "}
        </Table>{" "}
      </div>{" "}
    </div>;
}