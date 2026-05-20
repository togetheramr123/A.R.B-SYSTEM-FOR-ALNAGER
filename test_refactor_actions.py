import re

with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# 1. Import ExportDialog and ExportField
if 'import { ExportDialog, ExportField }' not in content:
    content = content.replace('import { getProductIdsByFilter, fetchProductsForGroup } from "@/app/actions/inventory";', 'import { getProductIdsByFilter, fetchProductsForGroup } from "@/app/actions/inventory";\nimport { ExportDialog, ExportField } from "@/components/common/ExportDialog";')

# 2. Add state for showExportDialog
if 'const [showExportDialog, setShowExportDialog] = useState(false);' not in content:
    content = content.replace('const [showActionMenu, setShowActionMenu] = useState(false);', 'const [showActionMenu, setShowActionMenu] = useState(false);\n  const [showExportDialog, setShowExportDialog] = useState(false);\n  const [isExporting, setIsExporting] = useState(false);')

# 3. Handle export logic
export_logic = """
  const handleExport = async (format: "csv" | "xlsx", selectedFields: string[]) => {
    setIsExporting(true);
    try {
      // Create a dummy file for now
      const content = format === "csv" ? "dummy,csv,data\\n1,2,3" : "dummy xlsx data";
      const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products_export_${new Date().getTime()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setIsExporting(false);
      setShowExportDialog(false);
    }
  };
"""
if 'const handleExport = async' not in content:
    content = content.replace('// Selection Logic', export_logic + '\n  // Selection Logic')

# 4. Replace top bar action area
top_bar_search = """            <div className="flex items-center gap-1">
              <Link href={`/${locale}/inventory/products/new`} className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1.5 rounded font-bold text-[13px] transition-colors shadow-sm">
                جديد
              </Link>
              <button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded transition-colors" title="استيراد">
                <Upload className="w-4 h-4" />
              </button>
            </div>"""

top_bar_replace = """            <div className="flex items-center gap-1">
              <Link href={`/${locale}/inventory/products/new`} className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1.5 rounded font-bold text-[13px] transition-colors shadow-sm">
                جديد
              </Link>
              {!someSelected && (
                <button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded transition-colors" title="استيراد">
                  <Upload className="w-4 h-4" />
                </button>
              )}
              {someSelected && (
                <>
                  <button className="text-[#017E84] hover:text-[#01656a] hover:bg-[#017E84]/10 px-3 py-1.5 rounded font-medium text-[13px] transition-colors">
                    طباعة بطاقات العناوين
                  </button>
                  <div className="flex items-center bg-[#D8F0F0] text-[#017E84] px-3 py-1.5 rounded text-[13px] gap-2">
                    <span className="font-bold">{selectedIds.size} محدد</span>
                    {!allPageSelected && products.length > 0 && (
                      <button onClick={selectAll} className="hover:underline font-bold mr-2 border-r border-[#017E84]/30 pr-2">تحديد الكل {totalCount}</button>
                    )}
                  </div>
                  {/* Action Dropdown */}
                  <div className="relative" ref={actionMenuRef}>
                    <button onClick={() => setShowActionMenu(!showActionMenu)} className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded font-medium text-[13px] transition-colors">
                      <Settings2 className="w-4 h-4" />
                      إجراء
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                    {showActionMenu && (
                      <div className="absolute top-[110%] right-0 w-48 bg-white border border-gray-200 shadow-sm rounded py-1 z-50 text-right text-[13px]">
                        <button onClick={() => { setShowActionMenu(false); setShowExportDialog(true); }} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex items-center text-gray-700">
                          تصدير
                        </button>
                        <button onClick={() => setShowActionMenu(false)} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex items-center text-gray-700">
                          الأرشيف
                        </button>
                        <button onClick={() => setShowActionMenu(false)} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex items-center text-gray-700">
                          إلغاء الأرشفة
                        </button>
                        <button onClick={() => setShowActionMenu(false)} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex items-center text-red-600">
                          حذف
                        </button>
                        <button onClick={() => setShowActionMenu(false)} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex items-center text-gray-700">
                          إنشاء تقرير قائمة الأسعار
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>"""
content = content.replace(top_bar_search, top_bar_replace)

# 5. Delete floating bottom action bar
bottom_bar_regex = r'\{\/\* FLOATING BULK ACTION BAR \*\/\}.*?</div>\s*</div>\s*</div>'
content = re.sub(bottom_bar_regex, '', content, flags=re.DOTALL)

# 6. Add ExportDialog to the render tree
if '<ExportDialog' not in content:
    # We pass AVAILABLE_COLUMNS to ExportDialog
    export_dialog_jsx = """      <ExportDialog 
        isOpen={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        availableFields={AVAILABLE_COLUMNS}
        defaultSelectedFieldIds={["internal_reference", "barcode", "cost_price", "sale_price", "stock", "forecasted"]}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>"""
    content = content.replace("    </div>;", export_dialog_jsx + ";")


with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated top bar and removed floating bar!")
