import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# 1. State for the top action dropdown
state_search = """  const [showColPicker, setShowColPicker] = useState(false);"""
state_replace = """  const [showColPicker, setShowColPicker] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);"""
content = content.replace(state_search, state_replace)

# Add event listener for action menu
event_search = """      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);"""
event_replace = """      if (colPickerRef.current && !colPickerRef.current.contains(e.target as Node)) setShowColPicker(false);
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);"""
content = content.replace(event_search, event_replace)

# 2. Modify Bottom Row containing Filters and Actions
# Find the exact string for the actions area
actions_search = """          {/* Actions & Filters */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Link href={`/${locale}/inventory/products/new`} className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1.5 rounded font-bold text-[13px] transition-colors shadow-sm">
                جديد
              </Link>
              <button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded transition-colors" title="استيراد">
                <Upload className="w-4 h-4" />
              </button>
            </div>
            <div className="h-5 w-px bg-gray-300 my-auto hidden sm:block" />
            <div className="flex items-center gap-1 text-[13px]">
              {/* Filters Dropdown */}"""

actions_replace = """          {/* Actions & Filters */}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {!someSelected ? (
              <>
                <div className="flex items-center gap-1">
                  <Link href={`/${locale}/inventory/products/new`} className="bg-[#017E84] hover:bg-[#01656a] text-white px-3 py-1.5 rounded font-bold text-[13px] transition-colors shadow-sm">
                    جديد
                  </Link>
                  <button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2.5 py-1.5 rounded transition-colors" title="استيراد">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-5 w-px bg-gray-300 my-auto hidden sm:block" />
              </>
            ) : (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                <button className="text-[#017E84] hover:text-[#01656a] font-medium text-[13px] hover:underline underline-offset-2">
                  طباعة بطاقات العناوين
                </button>
                <div className="bg-[#E6F2F3] text-[#017E84] font-bold text-[13px] px-3 py-1.5 rounded">
                  {selectedIds.size} محدد
                </div>
                {totalCount > products.length && !allPageSelected && (
                  <button onClick={selectByFilter} className="bg-[#017E84] text-white font-bold text-[13px] px-3 py-1.5 rounded hover:bg-[#01656a] flex items-center gap-1 transition-colors">
                    تحديد الكل {totalCount} <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {totalCount > products.length && allPageSelected && (
                  <div className="bg-[#017E84] text-white font-bold text-[13px] px-3 py-1.5 rounded flex items-center gap-1">
                    تم تحديد الكل {totalCount} <CheckCheck className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="relative ml-2" ref={actionMenuRef}>
                  <button onClick={() => setShowActionMenu(!showActionMenu)} className="flex items-center gap-1.5 text-gray-700 hover:text-gray-900 font-medium text-[13px] px-2 py-1.5 rounded hover:bg-gray-100 transition-colors">
                    <Settings2 className="w-3.5 h-3.5" /> إجراء <ChevronDown className="w-3 h-3 opacity-60" />
                  </button>
                  {showActionMenu && (
                    <div className="absolute top-[110%] right-0 w-48 bg-white border border-gray-200 shadow-sm rounded py-1 z-50 text-right overflow-hidden">
                      <button onClick={exportExcel} className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100 transition-colors flex items-center gap-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> تصدير
                      </button>
                      <button className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100 transition-colors flex items-center gap-2">
                        <Archive className="w-3.5 h-3.5 text-amber-600" /> الأرشيف
                      </button>
                      <button className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-gray-100 transition-colors flex items-center gap-2">
                        <Archive className="w-3.5 h-3.5 text-gray-400" /> إلغاء الأرشفة
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button className="w-full text-right px-4 py-1.5 text-[13px] hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2">
                        <X className="w-3.5 h-3.5" /> حذف
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={clearSelection} className="mr-2 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors" title="إلغاء التحديد">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <div className={cn("flex items-center gap-1 text-[13px]", someSelected && "opacity-50 pointer-events-none")}>
              {/* Filters Dropdown */}"""

# We need to format the strings correctly since spacing matters
content = re.sub(r'\{\/\* Actions & Filters \*\/\}\s*<div className="flex items-center gap-2 sm:gap-4 flex-wrap">\s*<div className="flex items-center gap-1">\s*<Link href={`/\$\{locale\}/inventory/products/new`} className="bg-\[\#017E84\] hover:bg-\[\#01656a\] text-white px-3 py-1\.5 rounded font-bold text-\[13px\] transition-colors shadow-sm">\s*جديد\s*</Link>\s*<button className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-2\.5 py-1\.5 rounded transition-colors" title="استيراد">\s*<Upload className="w-4 h-4" />\s*</button>\s*</div>\s*<div className="h-5 w-px bg-gray-300 my-auto hidden sm:block" />\s*<div className="flex items-center gap-1 text-\[13px\]">\s*\{\/\* Filters Dropdown \*\/\}', actions_replace, content)


# 3. Remove the old Select All Banner since we moved it into the top bar
select_all_banner_regex = r'\{\/\* Select All Banner \*\/\}\s*\{allPageSelected && totalCount > products\.length && <div className="bg-blue-50/50 border-b border-blue-100 px-4 py-2 text-center text-\[13px\] text-gray-700 flex justify-center items-center gap-2">.*?</div>\}'
content = re.sub(select_all_banner_regex, '', content, flags=re.DOTALL)

# 4. Remove the Floating Action Bar completely
floating_bar_regex = r'\{\/\* ════════ FLOATING ACTION BAR ════════ \*\/\}\s*<div className=\{cn\("fixed bottom-6 left-1/2.*?</div>\s*</div>\s*</div>'
content = re.sub(floating_bar_regex, '', content, flags=re.DOTALL)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated top bar")
