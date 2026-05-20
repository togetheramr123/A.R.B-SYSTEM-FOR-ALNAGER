import re
with open("components/inventory/ProductListClient.tsx", "r") as f:
    content = f.read()

# 1. Update Props
props_search = """  totalCount: number;
  locale: string;
}"""
props_replace = """  totalCount: number;
  locale: string;
  groupSummaries?: { key: string; count: number }[];
}"""
content = content.replace(props_search, props_replace)

# 2. Add imports
import_search = """import { Check, CheckCheck, FileSpreadsheet, Search, List, LayoutGrid, X, Filter, ChevronDown, AlignLeft, ChevronRight, ChevronLeft, Settings2, Archive, Upload, Star } from "lucide-react";"""
import_replace = """import { Check, CheckCheck, FileSpreadsheet, Search, List, LayoutGrid, X, Filter, ChevronDown, AlignLeft, ChevronRight, ChevronLeft, Settings2, Archive, Upload, Star, Loader2 } from "lucide-react";
import { fetchProductsForGroup } from "@/app/actions/inventory";"""
content = content.replace(import_search, import_replace)

# 3. Update component parameters
param_search = """export function ProductListClient({
  products: initialProducts,
  totalCount,
  locale
}: ProductListProps) {"""
param_replace = """export function ProductListClient({
  products: initialProducts,
  totalCount,
  locale,
  groupSummaries
}: ProductListProps) {"""
content = content.replace(param_search, param_replace)

# 4. Add dynamic loading states
state_search = """  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});"""
state_replace = """  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [loadedGroupProducts, setLoadedGroupProducts] = useState<Record<string, Product[]>>({});
  const [loadingGroups, setLoadingGroups] = useState<Record<string, boolean>>({});
  const { data: session } = useSession();
  const companyId = session?.user?.companyId as string;"""
content = content.replace(state_search, state_replace)

# 5. Add dynamic load logic to toggleGroup
toggle_search = """  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };"""
toggle_replace = """  const toggleGroup = async (groupName: string) => {
    const isCurrentlyCollapsed = collapsedGroups[groupName] ?? true;
    
    if (isCurrentlyCollapsed && !loadedGroupProducts[groupName] && groupBy) {
      // Need to fetch
      setLoadingGroups(prev => ({ ...prev, [groupName]: true }));
      try {
        const data = await fetchProductsForGroup(companyId || '', groupBy, groupName);
        setLoadedGroupProducts(prev => ({ ...prev, [groupName]: data }));
      } catch (e) {
        console.error("Failed to load group", e);
      } finally {
        setLoadingGroups(prev => ({ ...prev, [groupName]: false }));
      }
    }
    
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !isCurrentlyCollapsed }));
  };"""
content = content.replace(toggle_search, toggle_replace)

# 6. Update rendering logic to use groupSummaries
render_search = """                  } else {
                    // Grouping logic
                    const groups: Record<string, Product[]> = {};
                    products.forEach(p => {
                      const g = groupBy === "category" ? p.category?.name || "بدون فئة" : typeLabels[p.type]?.label || p.type;
                      if (!groups[g]) groups[g] = [];
                      groups[g].push(p);
                    });

                    return Object.entries(groups).map(([groupName, groupProducts]) => {"""

render_replace = """                  } else {
                    // Dynamic Grouping logic
                    const summaries = groupSummaries || [];
                    
                    return summaries.map(({ key: groupName, count }) => {"""
content = content.replace(render_search, render_replace)

# 7. Update inner render to use dynamically loaded products
inner_render_search = """                            <td colSpan={2} className="px-3 py-2 font-bold text-gray-900">
                              <div className="flex items-center gap-1.5">
                                {isCollapsed ? <ChevronLeft className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                                {groupName} <span className="text-gray-500 font-normal">({groupProducts.length})</span>
                              </div>
                            </td>
                            {/* Empty cells for group row to match Odoo structure */}"""

inner_render_replace = """                            <td colSpan={2} className="px-3 py-2 font-bold text-gray-900">
                              <div className="flex items-center gap-1.5">
                                {loadingGroups[groupName] ? (
                                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                ) : isCollapsed ? (
                                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-600" />
                                )}
                                {groupName} <span className="text-gray-500 font-normal">({count})</span>
                              </div>
                            </td>
                            {/* Empty cells for group row to match Odoo structure */}"""
content = content.replace(inner_render_search, inner_render_replace)

# 8. Loop over dynamically loaded products
map_search = """                          {!isCollapsed && groupProducts.map((product) => {"""
map_replace = """                          {!isCollapsed && (loadedGroupProducts[groupName] || []).map((product: any) => {"""
content = content.replace(map_search, map_replace)

with open("components/inventory/ProductListClient.tsx", "w") as f:
    f.write(content)

print("Updated ProductListClient dynamic grouping")
