import { create } from 'zustand';

export interface StatusStoreProps {
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    setIsSaving: (val: boolean) => void;
    setHasUnsavedChanges: (val: boolean) => void;
    
    // Remote trigger functions injected by the active form
    saveTriggerFn: (() => Promise<any>) | null;
    discardTriggerFn: (() => void) | null;
    setTriggers: (saveFn: () => Promise<any>, discardFn: () => void) => void;
    clearTriggers: () => void;
}

export const useStatusStore = create<StatusStoreProps & { setFormStatus: (data: any) => void; clearStatus: () => void }>((set) => ({
    isSaving: false,
    hasUnsavedChanges: false,
    setIsSaving: (val) => set({ isSaving: val }),
    setHasUnsavedChanges: (val) => set({ hasUnsavedChanges: val }),
    
    saveTriggerFn: null,
    discardTriggerFn: null,
    setTriggers: (saveFn, discardFn) => set({ saveTriggerFn: saveFn, discardTriggerFn: discardFn }),
    clearTriggers: () => set({ saveTriggerFn: null, discardTriggerFn: null, hasUnsavedChanges: false }),

    setFormStatus: (data: any) => set({
        isSaving: data.isSaving,
        hasUnsavedChanges: data.hasUnsavedChanges,
        saveTriggerFn: data.saveTriggerFn,
        discardTriggerFn: data.discardTriggerFn
    }),
    clearStatus: () => set({
        saveTriggerFn: null,
        discardTriggerFn: null,
        hasUnsavedChanges: false,
        isSaving: false
    })
}));
