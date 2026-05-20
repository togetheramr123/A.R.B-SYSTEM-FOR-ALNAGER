import re
with open("app/[locale]/inventory/products/page.tsx", "r") as f:
    content = f.read()

# Add getProductMetrics import
content = content.replace('import { getProductList } from "@/app/actions/inventory";', 'import { getProductList, getProductMetrics } from "@/app/actions/inventory";')
if 'getProductMetrics' not in content:
    content = content.replace('import { ProductListClient } from "@/components/inventory/ProductListClient";', 'import { ProductListClient } from "@/components/inventory/ProductListClient";\nimport { getProductMetrics } from "@/app/actions/inventory";')

# Add new filters
filters_str = """  if (filter === "storable") {
    where.type = "storable";
    where.active = true;
  }
  if (filter === "service") {
    where.type = "service";
    where.active = true;
  }
  if (filter === "consu") {
    where.type = "consu";
    where.active = true;
  }"""

new_filters = """  if (filter === "storable") {
    where.type = "storable";
    where.active = true;
  }
  if (filter === "service") {
    where.type = "service";
    where.active = true;
  }
  if (filter === "consu") {
    where.type = "consu";
    where.active = true;
  }
  if (filter === "can_sell") {
    where.canBeSold = true;
    where.active = true;
  }
  if (filter === "can_purchase") {
    where.canBePurchased = true;
    where.active = true;
  }"""
content = content.replace(filters_str, new_filters)

# Add tags to include
include_str = """    include: {
      category: true,
      stockQuants: {
        include: {
          location: true
        }
      }
    },"""

new_include = """    include: {
      category: true,
      tags: true,
      stockQuants: {
        include: {
          location: true
        }
      }
    },"""
content = content.replace(include_str, new_include)

# Map users and metrics
map_str = """  const productsWithStock = serializedProducts.map((product: any) => ({
    ...product,
    totalStock: product.stockQuants?.reduce((sum: number, q: any) => sum + (Number(q.quantity) || 0), 0) || 0
  }));"""

new_map_str = """  // Fetch responsible users
  const userIds = [...new Set(serializedProducts.map((p: any) => p.createdById).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds as string[] } },
    select: { id: true, name: true }
  });
  const userMap = users.reduce((acc: any, u: any) => ({ ...acc, [u.id]: u.name }), {});

  // Enhance products with metrics and users
  const productsWithStock = await Promise.all(
    serializedProducts.map(async (product: any) => {
      const metrics = await getProductMetrics(product.id);
      const totalStock = product.stockQuants?.reduce((sum: number, q: any) => sum + (Number(q.quantity) || 0), 0) || 0;
      return {
        ...product,
        totalStock,
        forecastedQty: metrics.forecasted,
        responsibleName: product.createdById ? userMap[product.createdById] || "غير معروف" : "غير محدد"
      };
    })
  );"""
content = content.replace(map_str, new_map_str)

# If 'available' filter is set, we need to filter after fetching or before?
# Prisma cannot filter by calculated totalStock easily. We can do it after fetching if available is selected, but it breaks pagination.
# We will skip 'available' filter for now, or just let it be client-side. The user didn't strictly list 'available' in their new text, only "الاضافه الاليه" meaning Automatic Addition.

with open("app/[locale]/inventory/products/page.tsx", "w") as f:
    f.write(content)

print("Updated page.tsx")
