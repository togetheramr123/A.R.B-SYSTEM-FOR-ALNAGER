import prisma from "@/lib/prisma";
import { CategoryListClient } from "./CategoryListClient";

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

  return (
    <div className="p-4" dir="rtl">
      <CategoryListClient categories={categories} locale={locale} />
    </div>
  );
}