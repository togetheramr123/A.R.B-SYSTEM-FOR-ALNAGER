import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
    id: string;        // unique identifier (usually the path)
    path: string;      // full URL path (e.g. /ar/inventory/products)
    title: string;     // display title
    icon?: string;     // optional icon name
    pinned?: boolean;  // pinned tabs can't be closed
    closeable?: boolean;
}

interface TabState {
    tabs: Tab[];
    activeTabId: string | null;
    maxTabs: number;

    addTab: (tab: Omit<Tab, 'id' | 'closeable'> & { id?: string }) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTabTitle: (id: string, title: string) => void;
    closeOtherTabs: (id: string) => void;
    closeAllTabs: () => void;
}

// Mapping from route segments to Arabic labels and icons
const ROUTE_LABELS: Record<string, { label: string; icon: string }> = {
    dashboard: { label: 'لوحة التحكم', icon: '🏠' },
    contacts: { label: 'جهات الاتصال', icon: '👥' },
    inventory: { label: 'المخازن', icon: '📦' },
    products: { label: 'المنتجات', icon: '📦' },
    operations: { label: 'العمليات', icon: '🔄' },
    lots: { label: 'اللوتات', icon: '#️⃣' },
    adjustments: { label: 'تعديلات المخزون', icon: '📋' },
    valuation: { label: 'تقييم المخزون', icon: '📊' },
    sales: { label: 'المبيعات', icon: '🛒' },
    purchases: { label: 'المشتريات', icon: '🛍️' },
    accounting: { label: 'المحاسبة', icon: '💰' },
    invoices: { label: 'الفواتير', icon: '📄' },
    bills: { label: 'فواتير الشراء', icon: '🧾' },
    payments: { label: 'المدفوعات', icon: '💳' },
    receipts: { label: 'سندات القبض', icon: '📥' },
    disbursements: { label: 'سندات الصرف', icon: '📤' },
    journals: { label: 'الدفاتر', icon: '📒' },
    'journal-entries': { label: 'قيود اليومية', icon: '📝' },
    'journal-items': { label: 'عناصر اليومية', icon: '📝' },
    'chart-of-accounts': { label: 'دليل الحسابات', icon: '📚' },
    reporting: { label: 'التقارير', icon: '📊' },
    returns: { label: 'المرتجعات', icon: '↩️' },
    'profit-loss': { label: 'أرباح وخسائر', icon: '📈' },
    'price-lists': { label: 'قوائم الأسعار', icon: '💲' },
    analytic: { label: 'حسابات تحليلية', icon: '📊' },
    budgets: { label: 'الميزانيات', icon: '🎯' },
    hr: { label: 'الموارد البشرية', icon: '👔' },
    employees: { label: 'الموظفين', icon: '👤' },
    departments: { label: 'الأقسام', icon: '🏢' },
    contracts: { label: 'العقود', icon: '📝' },
    payslips: { label: 'كشوف المرتبات', icon: '💵' },
    settings: { label: 'الإعدادات', icon: '⚙️' },
    new: { label: 'جديد', icon: '➕' },
    variants: { label: 'المتغيرات', icon: '🔀' },
    categories: { label: 'الفئات', icon: '📁' },
    scrap: { label: 'الإتلاف', icon: '🗑️' },
    analysis: { label: 'التحليل', icon: '📊' },
    configuration: { label: 'التهيئة', icon: '⚙️' },
    create: { label: 'جديد', icon: '➕' },
    edit: { label: 'تعديل', icon: '✏️' },
    orders: { label: 'الطلبات', icon: '📋' },
    transfers: { label: 'التحويلات', icon: '🚚' },
    warehouses: { label: 'المستودعات', icon: '🏠' },
    'stock': { label: 'المخزون', icon: '📦' },
};

/**
 * Build a user-friendly tab title from a URL path.
 * e.g. /ar/inventory/products → "المنتجات"
 * e.g. /ar/purchases/new → "مشتريات / جديد"
 */
export function buildTabTitle(path: string): string {
    // Remove locale prefix
    const segments = path.split('/').filter(s => s && s.length <= 20 && s !== 'ar' && s !== 'en');

    if (segments.length === 0) return 'لوحة التحكم';

    // Get the last meaningful segment
    const lastSeg = segments[segments.length - 1];
    const info = ROUTE_LABELS[lastSeg];

    if (info) return info.label;

    // If it's "new" or "create" with a parent context
    if ((lastSeg === 'new' || lastSeg === 'create') && segments.length >= 2) {
        const parentInfo = ROUTE_LABELS[segments[segments.length - 2]];
        if (parentInfo) return `${parentInfo.label} / جديد`;
    }

    return lastSeg;
}

/**
 * Get icon for a path
 */
export function getTabIcon(path: string): string {
    const segments = path.split('/').filter(s => s && s.length <= 20 && s !== 'ar' && s !== 'en');
    if (segments.length === 0) return '🏠';

    // Try last segment first, then second to last
    for (let i = segments.length - 1; i >= 0; i--) {
        const info = ROUTE_LABELS[segments[i]];
        if (info) return info.icon;
    }
    return '📄';
}

export const useTabStore = create<TabState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,
            maxTabs: 15,

            addTab: (tabInput) => {
                const state = get();
                const id = tabInput.id || tabInput.path;
                const newCleanPath = tabInput.path.split('?')[0];

                // Check if a tab with the exact same path exists
                let existing = state.tabs.find(t => t.path.split('?')[0] === newCleanPath);
                
                // If not exact match, check if there's an ACTIVE tab belonging to the same root module.
                // Examples: /ar/inventory/products and /ar/inventory/categories both belong to "inventory"
                if (!existing && state.activeTabId) {
                    const activeTab = state.tabs.find(t => t.id === state.activeTabId);
                    if (activeTab && !activeTab.pinned) {
                        const getRootModule = (p: string) => p.split('/').filter(s => s && s !== 'ar' && s !== 'en')[0];
                        
                        const currentRoot = getRootModule(activeTab.path);
                        const newRoot = getRootModule(tabInput.path);
                        
                        // If they share the same root app/module (e.g., both are 'inventory'), reuse the active tab!
                        if (currentRoot && currentRoot === newRoot) {
                            existing = activeTab;
                        }
                    }
                }

                if (existing) {
                    // Just activate it, update path and title
                    set({
                        activeTabId: existing.id,
                        tabs: state.tabs.map(t =>
                            t.id === existing.id
                                ? { ...t, path: tabInput.path, title: tabInput.title || t.title, icon: tabInput.icon || t.icon }
                                : t
                        )
                    });
                    return;
                }

                // Enforce max tabs - remove oldest non-pinned tab
                let currentTabs = [...state.tabs];
                if (currentTabs.length >= state.maxTabs) {
                    const removableIndex = currentTabs.findIndex(t => !t.pinned);
                    if (removableIndex !== -1) {
                        currentTabs.splice(removableIndex, 1);
                    }
                }

                const newTab: Tab = {
                    id,
                    path: tabInput.path,
                    title: tabInput.title || buildTabTitle(tabInput.path),
                    icon: tabInput.icon || getTabIcon(tabInput.path),
                    pinned: tabInput.pinned || false,
                    closeable: !tabInput.pinned,
                };

                set({
                    tabs: [...currentTabs, newTab],
                    activeTabId: newTab.id,
                });
            },

            removeTab: (id) => {
                const state = get();
                const tab = state.tabs.find(t => t.id === id);
                if (!tab || tab.pinned) return; // Can't close pinned tabs

                const newTabs = state.tabs.filter(t => t.id !== id);

                // If we're closing the active tab, activate the previous one
                let newActiveId = state.activeTabId;
                if (state.activeTabId === id) {
                    const closedIndex = state.tabs.findIndex(t => t.id === id);
                    if (newTabs.length > 0) {
                        // Prefer the tab to the left (or right if leftmost)
                        const newIndex = Math.min(closedIndex, newTabs.length - 1);
                        newActiveId = newTabs[newIndex]?.id || newTabs[0]?.id || null;
                    } else {
                        newActiveId = null;
                    }
                }

                set({ tabs: newTabs, activeTabId: newActiveId });

                // Return the path to navigate to
                return newTabs.find(t => t.id === newActiveId)?.path;
            },

            setActiveTab: (id) => {
                set({ activeTabId: id });
            },

            updateTabTitle: (id, title) => {
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === id ? { ...t, title } : t
                    )
                }));
            },

            closeOtherTabs: (id) => {
                set(state => ({
                    tabs: state.tabs.filter(t => t.id === id || t.pinned),
                    activeTabId: id,
                }));
            },

            closeAllTabs: () => {
                set(state => ({
                    tabs: state.tabs.filter(t => t.pinned),
                    activeTabId: state.tabs.find(t => t.pinned)?.id || null,
                }));
            },
        }),
        {
            name: 'erp-taskbar-tabs',
        }
    )
);
