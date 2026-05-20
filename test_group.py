import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# 1. Add collapsedGroups state
state_search = """  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());"""
state_replace = """  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});"""
content = content.replace(state_search, state_replace)

# 2. Add toggleGroup function
toggle_search = """  const toggleAll = () => {"""
toggle_replace = """  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const toggleAll = () => {"""
content = content.replace(toggle_search, toggle_replace)

# 3. Modify table body for List view grouping
body_search = """              <tbody className="divide-y divide-gray-100">
                {" "}
                {(() => {
              let currentGroup: string | null = null;
              return products.map((product, index) => {
                const groupVal = groupBy === "category" ? product.category?.name || "بدون فئة" : groupBy === "type" ? typeLabels[product.type]?.label || product.type : null;
                const isNewGroup = groupBy && groupVal !== currentGroup;
                if (isNewGroup) currentGroup = groupVal;
                const isSelected = selectedIds.has(product.id);
                return <Fragment key={product.id}>
                        {" "}
                        {isNewGroup && <tr className="bg-gray-100/70 border-y border-gray-200">
                            {" "}
                            <td colSpan={visibleColumns.length + 3} className="px-5 py-2.5 font-bold text-gray-800 text-right">
                              {" "}
                              {groupVal}{" "}
                              <span className="bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5 text-[11px] mr-2 shadow-sm font-medium">
                                {products.filter(p => (groupBy === "category" ? p.category?.name || "بدون فئة" : typeLabels[p.type]?.label || p.type) === groupVal).length}{" "}
                                عناصر
                              </span>{" "}
                            </td>{" "}
                          </tr>}{" "}
                        <tr className={cn("hover:bg-gray-50 transition-colors group", isSelected && "bg-blue-50/30")}>"""

# We need to completely rewrite the tbody part to group products properly first, then map groups.
# Since we need to render group headers and then their children.

new_body = """              <tbody className="divide-y divide-gray-100">
                {" "}
                {(() => {
                  if (!groupBy) {
                    return products.map((product, index) => {
                      const isSelected = selectedIds.has(product.id);
                      return (
                        <tr key={product.id} className={cn("hover:bg-gray-50 transition-colors group", isSelected && "bg-blue-50/30")}>
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={isSelected} onChange={e => toggleOne(product.id, index, (e.nativeEvent as any).shiftKey)} className="rounded border-gray-300 w-4 h-4 accent-[#017E84] focus:ring-[#017E84] opacity-50 group-hover:opacity-100 data-[checked=true]:opacity-100 transition-opacity cursor-pointer" data-checked={isSelected} />
                          </td>
                          <td className="px-3 py-2 font-bold text-gray-900 truncate max-w-[250px]">
                            <Link href={`/${locale}/inventory/products/${product.id}`} className="hover:text-[#017E84]">
                              {product.name}
                            </Link>
                          </td>
                          {visibleColumns.includes("internal_reference") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.sku || "—"}</td>}
                          {visibleColumns.includes("barcode") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.barcode || "—"}</td>}
                          {visibleColumns.includes("tags") && <td className="px-3 py-2">
                              {product.tags && product.tags.length > 0 ? (
                                <div className="flex gap-1 flex-wrap">
                                  {product.tags.map((t: any) => (
                                    <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium" style={{ backgroundColor: t.color + '20', color: t.color }}>
                                      {t.name}
                                    </span>
                                  ))}
                                </div>
                              ) : "—"}
                          </td>}
                          {visibleColumns.includes("responsible") && <td className="px-3 py-2 text-gray-600">
                              {product.responsibleName ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                    {product.responsibleName[0]}
                                  </div>
                                  {product.responsibleName}
                                </div>
                              ) : "—"}
                          </td>}
                          {visibleColumns.includes("category") && <td className="px-3 py-2 text-gray-600">{product.category?.name || "—"}</td>}
                          {visibleColumns.includes("type") && <td className="px-3 py-2 text-gray-600">{typeLabels[product.type]?.label || product.type}</td>}
                          {visibleColumns.includes("uom") && <td className="px-3 py-2 text-gray-600">{product.uom || "—"}</td>}
                          {visibleColumns.includes("sale_price") && <td className="px-3 py-2 text-gray-800">{Number(product.salePrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                          {visibleColumns.includes("cost_price") && <td className="px-3 py-2 text-gray-800">{Number(product.costPrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                          {visibleColumns.includes("forecasted") && <td className="px-3 py-2 font-medium">
                              {product.type === "storable" ? <span className={(product.forecastedQty || 0) > 0 ? "text-gray-900" : (product.forecastedQty || 0) < 0 ? "text-red-600" : "text-gray-400"}>
                                  {product.forecastedQty}
                                </span> : <span className="text-gray-300">—</span>}
                          </td>}
                          {visibleColumns.includes("stock") && <td className="px-3 py-2 font-medium">
                              {product.type === "storable" ? <span className={product.totalStock > 0 ? "text-gray-900" : "text-gray-400"}>
                                  {product.totalStock}
                                </span> : <span className="text-gray-300">—</span>}
                          </td>}
                          <td className="px-3 py-2"></td>
                        </tr>
                      );
                    });
                  } else {
                    // Grouping logic
                    const groups: Record<string, Product[]> = {};
                    products.forEach(p => {
                      const g = groupBy === "category" ? p.category?.name || "بدون فئة" : typeLabels[p.type]?.label || p.type;
                      if (!groups[g]) groups[g] = [];
                      groups[g].push(p);
                    });

                    return Object.entries(groups).map(([groupName, groupProducts]) => {
                      const isCollapsed = collapsedGroups[groupName] ?? true; // Default to collapsed in Odoo style
                      return (
                        <Fragment key={groupName}>
                          <tr className="bg-white hover:bg-gray-50 border-y border-gray-200 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                            <td className="px-3 py-2"></td>
                            <td className="px-3 py-2 font-bold text-gray-900 flex items-center gap-2">
                              {isCollapsed ? <ChevronLeft className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                              {groupName} <span className="text-gray-500 font-normal">({groupProducts.length})</span>
                            </td>
                            {/* Empty cells for group row to match Odoo structure */}
                            {visibleColumns.includes("internal_reference") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("barcode") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("tags") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("responsible") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("category") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("type") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("uom") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("sale_price") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("cost_price") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("forecasted") && <td className="px-3 py-2"></td>}
                            {visibleColumns.includes("stock") && <td className="px-3 py-2"></td>}
                            <td className="px-3 py-2"></td>
                          </tr>
                          {!isCollapsed && groupProducts.map((product) => {
                            const index = products.findIndex(p => p.id === product.id);
                            const isSelected = selectedIds.has(product.id);
                            return (
                              <tr key={product.id} className={cn("hover:bg-gray-50 transition-colors group", isSelected && "bg-blue-50/30")}>
                                <td className="px-3 py-2">
                                  <input type="checkbox" checked={isSelected} onChange={e => toggleOne(product.id, index, (e.nativeEvent as any).shiftKey)} className="rounded border-gray-300 w-4 h-4 accent-[#017E84] focus:ring-[#017E84] opacity-50 group-hover:opacity-100 data-[checked=true]:opacity-100 transition-opacity cursor-pointer" data-checked={isSelected} />
                                </td>
                                <td className="px-3 py-2 font-bold text-gray-900 truncate max-w-[250px] pl-8">
                                  <Link href={`/${locale}/inventory/products/${product.id}`} className="hover:text-[#017E84] pr-6 border-r-2 border-gray-200">
                                    {product.name}
                                  </Link>
                                </td>
                                {visibleColumns.includes("internal_reference") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.sku || "—"}</td>}
                                {visibleColumns.includes("barcode") && <td className="px-3 py-2 text-gray-500 font-mono text-[11px]">{product.barcode || "—"}</td>}
                                {visibleColumns.includes("tags") && <td className="px-3 py-2">
                                    {product.tags && product.tags.length > 0 ? (
                                      <div className="flex gap-1 flex-wrap">
                                        {product.tags.map((t: any) => (
                                          <span key={t.id} className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium" style={{ backgroundColor: t.color + '20', color: t.color }}>
                                            {t.name}
                                          </span>
                                        ))}
                                      </div>
                                    ) : "—"}
                                </td>}
                                {visibleColumns.includes("responsible") && <td className="px-3 py-2 text-gray-600">
                                    {product.responsibleName ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                                          {product.responsibleName[0]}
                                        </div>
                                        {product.responsibleName}
                                      </div>
                                    ) : "—"}
                                </td>}
                                {visibleColumns.includes("category") && <td className="px-3 py-2 text-gray-600">{product.category?.name || "—"}</td>}
                                {visibleColumns.includes("type") && <td className="px-3 py-2 text-gray-600">{typeLabels[product.type]?.label || product.type}</td>}
                                {visibleColumns.includes("uom") && <td className="px-3 py-2 text-gray-600">{product.uom || "—"}</td>}
                                {visibleColumns.includes("sale_price") && <td className="px-3 py-2 text-gray-800">{Number(product.salePrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                                {visibleColumns.includes("cost_price") && <td className="px-3 py-2 text-gray-800">{Number(product.costPrice).toLocaleString("ar-EG", {minimumFractionDigits: 2})} ج.م</td>}
                                {visibleColumns.includes("forecasted") && <td className="px-3 py-2 font-medium">
                                    {product.type === "storable" ? <span className={(product.forecastedQty || 0) > 0 ? "text-gray-900" : (product.forecastedQty || 0) < 0 ? "text-red-600" : "text-gray-400"}>
                                        {product.forecastedQty}
                                      </span> : <span className="text-gray-300">—</span>}
                                </td>}
                                {visibleColumns.includes("stock") && <td className="px-3 py-2 font-medium">
                                    {product.type === "storable" ? <span className={product.totalStock > 0 ? "text-gray-900" : "text-gray-400"}>
                                        {product.totalStock}
                                      </span> : <span className="text-gray-300">—</span>}
                                </td>}
                                <td className="px-3 py-2"></td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    });
                  }
                })()}"""

# We need to replace the entire tbody content with new_body
start_index = content.find('<tbody className="divide-y divide-gray-100">')
end_index = content.find('{products.length === 0 && <tr>', start_index)
content = content[:start_index] + new_body + "\n                " + content[end_index:]

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated Grouping in ProductListClient.tsx")
