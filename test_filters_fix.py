import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# Find start of filters dropdown
start_marker = "{/* Filters Dropdown */}"
start_idx = content.find(start_marker)

# Find start of next dropdown (Group By Dropdown)
end_marker = "{/* Group By Dropdown */}"
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    new_filters = """{/* Filters Dropdown */}
              <div className="relative" ref={filtersRef}>
                <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors font-medium cursor-pointer ${showFilters ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"}`}>
                  <Filter className="w-3.5 h-3.5" /> عوامل التصفية <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {showFilters && (
                  <div className="absolute top-[110%] right-0 w-56 bg-white border border-gray-200 shadow-sm rounded py-1 z-50 text-right text-[13px]">
                    <button onClick={() => updateFilter("service")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>الخدمات</span>
                      {currentFilter === "service" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("storable")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>المنتجات</span>
                      {currentFilter === "storable" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("can_sell")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>يمكن بيعه</span>
                      {currentFilter === "can_sell" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("can_purchase")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>يمكن شراؤه</span>
                      {currentFilter === "can_purchase" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("available")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>المنتجات المتوفرة</span>
                      {currentFilter === "available" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("negative_forecast")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>الكمية المتوقعة السالبة</span>
                      {currentFilter === "negative_forecast" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>المفضلات</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>تحذيرات</span>
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("archived")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>مؤرشف</span>
                      {currentFilter === "archived" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center text-gray-700">
                      <span>إضافة عامل تصفية مخصص</span>
                      <ChevronLeft className="w-4 h-4 text-gray-400" />
                    </button>
                    {currentFilter && (
                      <>
                        <div className="border-t border-gray-200 my-1" />
                        <button onClick={() => updateFilter(null)} className="w-full px-4 py-1.5 hover:bg-gray-100 text-gray-500 transition-colors flex justify-between items-center font-bold">
                          إلغاء التصفية <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              """
    content = content[:start_idx] + new_filters + content[end_idx:]
    with open("components/inventory/ProductListClient.tsx", "w") as f:
        f.write(content)
    print("Fixed filters Dropdown!")
else:
    print("Could not find markers")
