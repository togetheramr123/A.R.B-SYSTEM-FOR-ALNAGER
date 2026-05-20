import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# 1. Add Income Account and Expense Account to columns
columns_search = """  id: "uom",
  label: "وحدة القياس"
}];"""

columns_replace = """  id: "uom",
  label: "وحدة القياس"
}, {
  id: "income_account",
  label: "حساب الدخل"
}, {
  id: "expense_account",
  label: "حساب النفقات"
}];"""
content = content.replace(columns_search, columns_replace)

# 2. Modify Column Picker Dropdown to match Odoo (checkbox on the right)
# Our current code: <input type="checkbox" ... /> {col.label} (in RTL, this puts checkbox on the right if flex-row is used without direction change, but let's make it explicitly flex-row-reverse or space-between)
col_picker_search = """                            <input type="checkbox" checked={visibleColumns.includes(col.id)} readOnly className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84]" />{" "}
                            {col.label}{" "}"""

col_picker_replace = """                            <div className="flex items-center gap-2 w-full">
                              <input type="checkbox" checked={visibleColumns.includes(col.id)} readOnly className="rounded border-gray-300 text-[#017E84] focus:ring-[#017E84] ml-auto" />
                              <span className="flex-1 text-right">{col.label}</span>
                            </div>"""
content = content.replace(col_picker_search, col_picker_replace)

# 3. Add Pagination at the bottom of the table
# Find the end of the table
table_end_search = """            </table>{" "}
          </div>{" "}
        </div>{" "}"""

pagination_html = """            </table>{" "}
          </div>{" "}
          
          {/* Bottom Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-white rounded-b-lg">
            <div className="text-[13px] text-gray-500">
              {/* Optional footer info */}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[13px] text-gray-600 font-medium">
                <span className="hidden sm:inline-block">
                  {totalCount > 0 ? `${pagination.startRecord}-${pagination.endRecord} / ${totalCount}` : "0-0 / 0"}
                </span>
                <div className="flex items-center border border-gray-200 hover:border-gray-300 rounded shadow-sm bg-white overflow-hidden transition-colors" dir="ltr">
                  {pagination.prevUrl ? (
                    <Link href={pagination.prevUrl} className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors border-r border-gray-200">
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button disabled className="p-1.5 text-gray-300 border-r border-gray-200">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  {pagination.nextUrl ? (
                    <Link href={pagination.nextUrl} className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button disabled className="p-1.5 text-gray-300">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>{" "}"""

content = content.replace(table_end_search, pagination_html)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated column picker and bottom pagination")
