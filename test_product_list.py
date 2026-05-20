import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# Remove Favorite Star from Kanban
content = re.sub(r'\{/\* Star \(Top Left\) \*/\}.*?</div>', '', content, flags=re.DOTALL)

# Add Columns to AVAILABLE_COLUMNS
old_cols = """const AVAILABLE_COLUMNS = [{
  id: "internal_reference",
  label: "مرجع داخلي"
}, {
  id: "barcode",
  label: "باركود"
}, {
  id: "category",
  label: "فئة المنتج"
}, {
  id: "type",
  label: "نوع المنتج"
}, {
  id: "uom",
  label: "وحدة القياس"
}, {
  id: "sale_price",
  label: "سعر البيع"
}, {
  id: "cost_price",
  label: "التكلفة"
}, {
  id: "stock",
  label: "الكمية في اليد"
}];"""

new_cols = """const AVAILABLE_COLUMNS = [{
  id: "internal_reference",
  label: "مرجع داخلي"
}, {
  id: "barcode",
  label: "باركود"
}, {
  id: "tags",
  label: "علامات تصنيف"
}, {
  id: "responsible",
  label: "المسؤول"
}, {
  id: "category",
  label: "فئة المنتج"
}, {
  id: "type",
  label: "نوع المنتج"
}, {
  id: "sale_price",
  label: "سعر البيع"
}, {
  id: "cost_price",
  label: "التكلفة"
}, {
  id: "forecasted",
  label: "الكمية المتوقعة"
}, {
  id: "stock",
  label: "الكمية في اليد"
}, {
  id: "uom",
  label: "وحدة القياس"
}];"""
content = content.replace(old_cols, new_cols)

# Update visibleColumns initial state
old_vis = """const [visibleColumns, setVisibleColumns] = useState<string[]>(["internal_reference", "category", "type", "uom", "sale_price", "cost_price", "stock"]); // Selection States"""
new_vis = """const [visibleColumns, setVisibleColumns] = useState<string[]>(["internal_reference", "category", "tags", "responsible", "sale_price", "cost_price", "forecasted", "stock", "uom"]); // Selection States"""
content = content.replace(old_vis, new_vis)

# Add new filters to Dropdown
old_filters_dd = """                    {[{
                  id: null,
                  label: "الكل"
                }, {
                  id: "storable",
                  label: "المنتجات (المخزني)"
                }, {
                  id: "service",
                  label: "الخدمات"
                }, {
                  id: "consu",
                  label: "الاستهلاكي"
                }].map(f => <button key={f.id || "all"} onClick={() => updateFilter(f.id)} className="w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between hover:bg-gray-100 transition-colors">"""

new_filters_dd = """                    {[{
                  id: null,
                  label: "الكل"
                }, {
                  id: "storable",
                  label: "المنتجات (المخزني)"
                }, {
                  id: "service",
                  label: "الخدمات"
                }, {
                  id: "can_sell",
                  label: "يمكن بيعه"
                }, {
                  id: "can_purchase",
                  label: "يمكن شراؤه"
                }].map(f => <button key={f.id || "all"} onClick={() => updateFilter(f.id)} className="w-full text-right px-4 py-1.5 text-[13px] flex items-center justify-between hover:bg-gray-100 transition-colors">"""
content = content.replace(old_filters_dd, new_filters_dd)

# Remove Favorites Dropdown completely
content = re.sub(r'\{/\* Favorites Dropdown \*/\}.*?</div>\s*</div>\s*</div>', '</div> </div>', content, flags=re.DOTALL)


# Update Table Headers
old_th = """                  {visibleColumns.includes("barcode") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      باركود
                    </th>}"""

new_th = """                  {visibleColumns.includes("barcode") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      باركود
                    </th>}
                  {visibleColumns.includes("tags") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      علامات تصنيف
                    </th>}
                  {visibleColumns.includes("responsible") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      المسؤول
                    </th>}"""
content = content.replace(old_th, new_th)

old_th2 = """                  {visibleColumns.includes("stock") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      الكمية
                    </th>}"""
new_th2 = """                  {visibleColumns.includes("forecasted") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      الكمية المتوقعة
                    </th>}
                  {visibleColumns.includes("stock") && <th className="px-3 py-2.5 font-bold text-gray-600">
                      الكمية في اليد
                    </th>}"""
content = content.replace(old_th2, new_th2)

# Update Table Body Cells
old_td = """                          {visibleColumns.includes("barcode") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">
                              {product.barcode || "—"}
                            </td>}"""

new_td = """                          {visibleColumns.includes("barcode") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">
                              {product.barcode || "—"}
                            </td>}
                          {visibleColumns.includes("tags") && <td className="px-3 py-2">
                              {product.tags?.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {product.tags.map((t: any) => (
                                    <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium" style={{ backgroundColor: t.color + '20', color: t.color }}>
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              ) : "—"}
                            </td>}
                          {visibleColumns.includes("responsible") && <td className="px-3 py-2 text-gray-600 flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                {product.responsibleName ? product.responsibleName[0] : "—"}
                              </div>
                              {product.responsibleName}
                            </td>}"""
content = content.replace(old_td, new_td)

old_td2 = """                          {visibleColumns.includes("stock") && <td className="px-3 py-2 font-medium">
                              {" "}
                              {product.type === "storable" ? <span className={product.totalStock > 0 ? "text-gray-900" : "text-gray-400"}>
                                  {product.totalStock}
                                </span> : <span className="text-gray-300">—</span>}{" "}
                            </td>}"""

new_td2 = """                          {visibleColumns.includes("forecasted") && <td className="px-3 py-2 font-medium">
                              {" "}
                              {product.type === "storable" ? <span className={product.forecastedQty > 0 ? "text-gray-900" : product.forecastedQty < 0 ? "text-red-600" : "text-gray-400"}>
                                  {product.forecastedQty}
                                </span> : <span className="text-gray-300">—</span>}{" "}
                            </td>}
                          {visibleColumns.includes("stock") && <td className="px-3 py-2 font-medium">
                              {" "}
                              {product.type === "storable" ? <span className={product.totalStock > 0 ? "text-gray-900" : "text-gray-400"}>
                                  {product.totalStock}
                                </span> : <span className="text-gray-300">—</span>}{" "}
                            </td>}"""
content = content.replace(old_td2, new_td2)

# Update Interface to include new fields
old_interface = """interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  category?: {
    name: string;
    id?: string;
  };
  type: string;
  uom: string;
  hasSecondaryUnit?: boolean;
  secondaryUom?: string;
  salePrice: number;
  costPrice: number;
  totalStock: number;
  image?: string;
  categoryId?: string;
}"""

new_interface = """interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku?: string;
  category?: {
    name: string;
    id?: string;
  };
  type: string;
  uom: string;
  hasSecondaryUnit?: boolean;
  secondaryUom?: string;
  salePrice: number;
  costPrice: number;
  totalStock: number;
  forecastedQty?: number;
  responsibleName?: string;
  tags?: any[];
  image?: string;
  categoryId?: string;
}"""
content = content.replace(old_interface, new_interface)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated ProductListClient.tsx")
