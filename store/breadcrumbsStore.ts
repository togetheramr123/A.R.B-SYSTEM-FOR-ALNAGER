import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryEntry {
    id: string;      // The unique identifier for the path level (usually cleanPath)
    url: string;     // The full URL to navigate back to (including searchParams)
    label: string;   // The human-readable label
}

interface BreadcrumbsState {
    routeLabels: Record<string, string>;
    historyStack: HistoryEntry[];
    
    updateCurrentLabel: (label: string, pathname: string) => void;
    pushToStack: (url: string, label: string) => void;
    resetStack: () => void;
    
    // Legacy mapping aliases to prevent crashing existing code temporarily
    history: any[];
    pushPath: () => void;
    clear: () => void;
}

export const useBreadcrumbsStore = create<BreadcrumbsState>()(
    persist(
        (set, get) => ({
            routeLabels: {},
            historyStack: [],
            
            updateCurrentLabel: (label, currentPathname) => set((state) => {
                const cleanPath = currentPathname.split('?')[0];
                let shouldUpdate = false;
                
                // Update Route Labels dictionary
                const newRouteLabels = { ...state.routeLabels };
                if (newRouteLabels[cleanPath] !== label) {
                    newRouteLabels[cleanPath] = label;
                    shouldUpdate = true;
                }

                // Update label in History stack dynamically
                const newHistoryStack = [...state.historyStack];
                if (newHistoryStack.length > 0) {
                    const lastEntry = newHistoryStack[newHistoryStack.length - 1];
                    if (lastEntry.id === cleanPath && lastEntry.label !== label) {
                        newHistoryStack[newHistoryStack.length - 1] = { ...lastEntry, label };
                        shouldUpdate = true;
                    }
                }

                if (shouldUpdate) {
                    return { routeLabels: newRouteLabels, historyStack: newHistoryStack };
                }
                return state;
            }),

            pushToStack: (url, defaultLabel) => set((state) => {
                const cleanPath = url.split('?')[0];
                const label = state.routeLabels[cleanPath] || defaultLabel;

                const newEntry: HistoryEntry = {
                    id: cleanPath,
                    url,
                    label
                };

                // Check if this path already exists in the stack
                const existingIndex = state.historyStack.findIndex(entry => entry.id === cleanPath);
                
                if (existingIndex !== -1) {
                    // Truncate the stack to this point (used browser back, or clicked a breadcrumb)
                    return { historyStack: state.historyStack.slice(0, existingIndex + 1) };
                } else {
                    // Check if we are transitioning from "new" to "saved" (e.g. /sales/new -> /sales/123)
                    if (state.historyStack.length > 0) {
                        const lastEntry = state.historyStack[state.historyStack.length - 1];
                        if (lastEntry.id.endsWith('/new')) {
                            const basePath = lastEntry.id.replace(/\/new$/, '');
                            if (cleanPath.startsWith(basePath + '/') && cleanPath !== lastEntry.id) {
                                // Replace the "new" entry with the saved entity
                                const newStack = [...state.historyStack];
                                newStack[newStack.length - 1] = newEntry;
                                return { historyStack: newStack };
                            }
                        }
                    }
                    
                    // Push deeply
                    return { historyStack: [...state.historyStack, newEntry] };
                }
            }),

            resetStack: () => set({ historyStack: [] }),

            // Legacy
            history: [],
            pushPath: () => {},
            clear: () => set({ historyStack: [] }),
        }),
        {
            name: 'odoo-breadcrumbs-history-v2', // Changed version intentionally
        }
    )
);
