import re
with open("app/[locale]/inventory/products/page.tsx", "r") as f:
    content = f.read()

# Add groupSummaries calculation
group_search = """  const totalPages = Math.ceil(totalCount / pageSize);"""

group_replace = """  const totalPages = Math.ceil(totalCount / pageSize);

  // If grouping is active, calculate group summaries instead of paginating products blindly
  let groupSummaries = undefined;
  if (groupBy) {
    if (groupBy === "category") {
      const grouped = await prisma.product.groupBy({
        by: ['categoryId'],
        where,
        _count: { id: true }
      });
      const categoryIds = grouped.map(g => g.categoryId).filter(Boolean);
      const categories = await prisma.productCategory.findMany({
        where: { id: { in: categoryIds as string[] } }
      });
      const catMap = categories.reduce((acc: any, c: any) => ({...acc, [c.id]: c.name}), {});
      
      groupSummaries = grouped.map(g => ({
        key: g.categoryId ? catMap[g.categoryId] || "غير معروف" : "بدون فئة",
        count: g._count.id
      }));
    } else if (groupBy === "type") {
      const grouped = await prisma.product.groupBy({
        by: ['type'],
        where,
        _count: { id: true }
      });
      groupSummaries = grouped.map(g => ({
        key: typeLabels[g.type]?.label || g.type,
        count: g._count.id
      }));
    }
  }"""
content = content.replace(group_search, group_replace)

# Pass groupSummaries to ProductListClient
client_search = """<ProductListClient products={productsWithStock} totalCount={totalCount} locale={locale} />"""
client_replace = """<ProductListClient products={productsWithStock} totalCount={totalCount} locale={locale} groupSummaries={groupSummaries} />"""
content = content.replace(client_search, client_replace)

with open("app/[locale]/inventory/products/page.tsx", "w") as f:
    f.write(content)

print("Updated page.tsx with groupSummaries")
