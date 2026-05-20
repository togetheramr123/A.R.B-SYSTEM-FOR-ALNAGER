import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# Modify the group header row
group_row_search = """                          <tr className="bg-white hover:bg-gray-50 border-y border-gray-200 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                            <td className="px-3 py-2"></td>
                            <td className="px-3 py-2 font-bold text-gray-900 flex items-center gap-2">
                              {isCollapsed ? <ChevronLeft className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                              {groupName} <span className="text-gray-500 font-normal">({groupProducts.length})</span>
                            </td>"""

group_row_replace = """                          <tr className="bg-gray-50/80 hover:bg-gray-100 border-y border-gray-200 cursor-pointer" onClick={() => toggleGroup(groupName)}>
                            <td colSpan={2} className="px-3 py-2 font-bold text-gray-900">
                              <div className="flex items-center gap-1.5">
                                {isCollapsed ? <ChevronLeft className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                                {groupName} <span className="text-gray-500 font-normal">({groupProducts.length})</span>
                              </div>
                            </td>"""
content = content.replace(group_row_search, group_row_replace)

# Ensure the child row name column has some indentation to look like Odoo
child_row_search = """                                <td className="px-3 py-2 font-bold text-gray-900 truncate max-w-[250px] pl-8">
                                  <Link href={`/${locale}/inventory/products/${product.id}`} className="hover:text-[#017E84] pr-6 border-r-2 border-gray-200">
                                    {product.name}
                                  </Link>
                                </td>"""

child_row_replace = """                                <td className="px-3 py-2 font-bold text-gray-900 truncate max-w-[250px]">
                                  <Link href={`/${locale}/inventory/products/${product.id}`} className="hover:text-[#017E84] pr-4">
                                    {product.name}
                                  </Link>
                                </td>"""
content = content.replace(child_row_search, child_row_replace)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated group headers")
