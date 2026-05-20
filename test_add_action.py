with open("app/actions/inventory.ts", "a") as f:
    f.write("""

export async function fetchProductsForGroup(companyId: string, groupBy: string, groupKey: string) {
  // We need to fetch products matching this group
  let where: any = { companyId, active: true };
  if (groupBy === 'category') {
    if (groupKey === 'بدون فئة') {
      where.categoryId = null;
    } else {
      where.category = { name: groupKey };
    }
  } else if (groupBy === 'type') {
    // groupKey is the label, e.g., "مخزني"
    const typeMap: any = { "مخزني": "storable", "خدمة": "service", "الاستهلاكي": "consu" };
    where.type = typeMap[groupKey] || groupKey;
  }
  
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      tags: true,
      stockQuants: { include: { location: true } }
    },
    take: 100 // limit to 100 per group for performance
  });
  
  const userIds = [...new Set(products.map((p: any) => p.createdById).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds as string[] } },
    select: { id: true, name: true }
  });
  const userMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.name }), {});

  const enhanced = await Promise.all(
    products.map(async (product: any) => {
      const metrics = await getProductMetrics(product.id);
      const totalStock = product.stockQuants?.reduce((sum: number, q: any) => sum + (Number(q.quantity) || 0), 0) || 0;
      return {
        ...product,
        totalStock,
        salePrice: Number(product.salePrice),
        costPrice: Number(product.costPrice),
        forecastedQty: metrics.forecasted,
        responsibleName: product.createdById ? userMap[product.createdById] || "غير معروف" : "غير محدد"
      };
    })
  );
  
  return JSON.parse(JSON.stringify(enhanced));
}
""")
print("Added action")
