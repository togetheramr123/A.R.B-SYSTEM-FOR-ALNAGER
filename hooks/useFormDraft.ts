'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to persist form data as a draft in localStorage.
 * Used for new records that haven't been saved to the database yet.
 * 
 * @param formKey - Unique key for this form (e.g., 'product_new')
 * @param isNewRecord - Whether this is a new record (no database ID yet)
 * @param watchFn - The react-hook-form watch function to get current form values
 * @param resetFn - The react-hook-form reset/setValue function to restore values
 */
export function useFormDraft(
    formKey: string,
    isNewRecord: boolean,
) {
    const STORAGE_KEY = `erp_draft_${formKey}`;
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Save draft to localStorage with debounce
    const saveDraft = useCallback((data: any) => {
        if (!isNewRecord) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            try {
                const draftData = {
                    ...data,
                    _draftTimestamp: Date.now(),
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
            } catch (e) {
                console.warn('Failed to save draft:', e);
            }
        }, 500); // 500ms debounce
    }, [isNewRecord, STORAGE_KEY]);

    // Load draft from localStorage
    const loadDraft = useCallback((): any | null => {
        if (!isNewRecord) return null;

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) return null;

            const data = JSON.parse(saved);

            // Check if draft is older than 24 hours - if so, discard it
            if (data._draftTimestamp && (Date.now() - data._draftTimestamp) > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }

            // Remove internal fields
            delete data._draftTimestamp;
            return data;
        } catch (e) {
            console.warn('Failed to load draft:', e);
            return null;
        }
    }, [isNewRecord, STORAGE_KEY]);

    // Clear draft (call after successful save)
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            console.warn('Failed to clear draft:', e);
        }
    }, [STORAGE_KEY]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return { saveDraft, loadDraft, clearDraft };
}
