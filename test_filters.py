import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# Filter structure replacement
old_filters_regex = r'\{\/\* Filters Dropdown \*\/\}\s*<div className="relative" ref=\{filterRef\}>.*?(?=<div className="relative" ref=\{groupByRef\})'

new_filters = """{/* Filters Dropdown */}
              <div className="relative" ref={filterRef}>
                <button onClick={() => setShowFilters(!showFilters)} className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded transition-colors font-medium cursor-pointer", showFilters ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:text-gray-900 hover:bg-gray-100")}>
                  <Filter className="w-3.5 h-3.5" /> عوامل التصفية <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {showFilters && (
                  <div className="absolute top-[110%] right-0 w-56 bg-white border border-gray-200 shadow-sm rounded py-1 z-50 text-right text-[13px]">
                    <button onClick={() => updateFilter("service")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center">
                      <span>الخدمات</span>
                      {currentFilter === "service" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("storable")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center">
                      <span>المنتجات</span>
                      {currentFilter === "storable" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("can_sell")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center">
                      <span>يمكن بيعه</span>
                      {currentFilter === "can_sell" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("can_purchase")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center">
                      <span>يمكن شراؤه</span>
                      {currentFilter === "can_purchase" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("available")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center">
                      <span>المنتجات المتوفرة</span>
                      {currentFilter === "available" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <button onClick={() => updateFilter("negative_forecast")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center">
                      <span>الكمية المتوقعة السالبة</span>
                      {currentFilter === "negative_forecast" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button onClick={() => updateFilter("archived")} className="w-full px-4 py-1.5 hover:bg-gray-100 transition-colors flex justify-between items-center">
                      <span>مؤرشف</span>
                      {currentFilter === "archived" && <Check className="w-4 h-4 text-[#017E84]" />}
                    </button>
                    {currentFilter && (
                      <>
                        <div className="border-t border-gray-200 my-1" />
                        <button onClick={() => updateFilter(null)} className="w-full px-4 py-1.5 hover:bg-gray-100 text-gray-500 transition-colors flex justify-between items-center">
                          إلغاء التصفية <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              """

content = re.sub(old_filters_regex, new_filters, content, flags=re.DOTALL)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated filters in ProductListClient.tsx")
