import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BreadcrumbItem {
    id: string; // Unique identifier for the page (e.g., pathname)
    label: string; // Human-readable title
    href: string; // URL to navigate to
}

interface BreadcrumbState {
    stack: BreadcrumbItem[];
    // Push a new page onto the stack. If the page (by ID or href) is already in the stack, 
    // it trims the stack down to that page (acting like a "back" navigation).
    push: (item: BreadcrumbItem) => void;
    
    // Updates the label of the current (last) item in the stack (useful for async title loading)
    updateCurrentLabel: (label: string) => void;
    
    // Navigate back to a specific item by its id, popping everything after it
    popTo: (id: string) => void;
    
    // Completely reset the stack (used when clicking sidemenu links)
    reset: (initialItem?: BreadcrumbItem) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>()(
    persist(
        (set, get) => ({
            stack: [],
            
            push: (item) => {
                set((state) => {
                    // If the user navigates to an item already in the stack, this is a "back" action.
                    // We should slice the stack up to that point.
                    const existingIndex = state.stack.findIndex(i => Math.abs(i.href.localeCompare(item.href)) === 0 || i.id === item.id);
                    
                    if (existingIndex !== -1) {
                        // If it's the exact same as the last item, avoid state mutation
                        if (existingIndex === state.stack.length - 1 && state.stack[existingIndex].label === item.label) {
                            return state;
                        }
                        
                        // Update the label just in case it changed, and slice off the future items
                        const newStack = state.stack.slice(0, existingIndex + 1);
                        newStack[existingIndex] = { ...newStack[existingIndex], label: item.label, href: item.href };
                        return { stack: newStack };
                    }
                    
                    // Otherwise, just push the new item
                    return { stack: [...state.stack, item] };
                });
            },
            
            updateCurrentLabel: (label) => {
                set((state) => {
                    if (state.stack.length === 0) return state;
                    const newStack = [...state.stack];
                    newStack[newStack.length - 1].label = label;
                    return { stack: newStack };
                });
            },
            
            popTo: (id) => {
                set((state) => {
                    const existingIndex = state.stack.findIndex(i => i.id === id);
                    if (existingIndex !== -1) {
                        return { stack: state.stack.slice(0, existingIndex + 1) };
                    }
                    return state;
                });
            },
            
            reset: (initialItem) => {
                set({ stack: initialItem ? [initialItem] : [] });
            }
        }),
        {
            name: 'erp-breadcrumb-stack',
        }
    )
);
