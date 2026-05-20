import re

with open("app/actions/inventory.ts", "a") as f:
    f.write("""
export async function getProductsForExport(selectedIds: string[], filter: string | null, companyId: string) {
  let where: any = { companyId, active: true };
  if (selectedIds.length > 0) {
    where.id = { in: selectedIds };
  } else if (filter) {
    if (filter === 'storable') where.type = 'storable';
    if (filter === 'service') where.type = 'service';
    if (filter === 'can_sell') where.canSell = true;
    if (filter === 'can_purchase') where.canPurchase = true;
    if (filter === 'archived') where.active = false;
  }
  
  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      stockQuants: true
    }
  });
  
  return products.map((p: any) => ({
    id: p.id,
    internal_reference: p.internalReference || '',
    barcode: p.barcode || '',
    name: p.name,
    category: p.category?.name || '',
    type: p.type === 'storable' ? 'المنتجات (المخزني)' : p.type === 'service' ? 'الخدمات' : 'الاستهلاكي',
    cost_price: Number(p.costPrice),
    sale_price: Number(p.salePrice),
    stock: p.stockQuants?.reduce((sum: number, q: any) => sum + Number(q.quantity || 0), 0) || 0,
    uom: p.uom || ''
  }));
}
""")
print("Added getProductsForExport action")
