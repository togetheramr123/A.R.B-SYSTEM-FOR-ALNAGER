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
                    const cleanItemHref = item.href.split('?')[0];

                    // Find if the exact URL or a parent path is in the stack
                    let matchIndex = -1;
                    let isExact = false;

                    for (let i = state.stack.length - 1; i >= 0; i--) {
                        const cleanStackHref = state.stack[i].href.split('?')[0];
                        
                        // Ignore pure locale paths like /ar or /en as parent indicators
                        const isPureLocale = /^\/(ar|en)\/?$/.test(cleanStackHref);
                        if (isPureLocale) continue;

                        if (cleanItemHref === cleanStackHref || state.stack[i].id === item.id) {
                            matchIndex = i;
                            isExact = true;
                            break;
                        }
                        // Check if cleanStackHref is a parent path of cleanItemHref
                        if (cleanItemHref.startsWith(cleanStackHref + '/')) {
                            matchIndex = i;
                            break;
                        }
                    }

                    if (matchIndex !== -1) {
                        if (isExact) {
                            // Exact match found: treat as back navigation and trim the stack
                            if (matchIndex === state.stack.length - 1 && state.stack[matchIndex].label === item.label) {
                                return state;
                            }
                            const newStack = state.stack.slice(0, matchIndex + 1);
                            newStack[matchIndex] = { ...newStack[matchIndex], label: item.label, href: item.href };
                            return { stack: newStack };
                        } else {
                            // Ancestor match found: trim to the ancestor, and append the new item
                            const newStack = state.stack.slice(0, matchIndex + 1);
                            return { stack: [...newStack, item] };
                        }
                    }

                    // No relation found: start a clean stack for this new branch/module
                    return { stack: [item] };
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
