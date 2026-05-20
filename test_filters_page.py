import re
with open("app/[locale]/inventory/products/page.tsx", "r") as f:
    content = f.read()

# For 'available', Odoo usually filters where sum of quants > 0.
# Since our `stockQuants` are an array, we can filter using prisma.
available_filter = """  if (filter === "can_purchase") {
    where.canBePurchased = true;
    where.active = true;
  }
  if (filter === "available") {
    where.stockQuants = {
      some: {
        quantity: { gt: 0 }
      }
    };
    where.active = true;
  }"""
content = content.replace("""  if (filter === "can_purchase") {
    where.canBePurchased = true;
    where.active = true;
  }""", available_filter)

# negative_forecast requires calculation which we can't do in DB easily without a view.
# We can filter in memory or ignore negative_forecast if it's too complex.
# But wait, we can just do in-memory filtering for negative_forecast after fetching, or since it's paginated, it might be tricky.
# Odoo calculates forecast via SQL views.
# We'll just filter in memory for this page as a fallback for now.
memory_filter = """  // Enhance products with metrics and users
  let productsWithStock = await Promise.all(
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
  );

  if (filter === "negative_forecast") {
    productsWithStock = productsWithStock.filter((p: any) => p.forecastedQty < 0);
  }"""

old_memory_filter = """  // Enhance products with metrics and users
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

content = content.replace(old_memory_filter, memory_filter)

# Pass productsWithStock correctly
content = content.replace('products={productsWithStock}', 'products={productsWithStock}')

with open("app/[locale]/inventory/products/page.tsx", "w") as f:
    f.write(content)

print("Updated page.tsx filters")
