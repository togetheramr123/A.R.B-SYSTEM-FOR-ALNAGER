import { useEffect, useRef, useCallback } from 'react';

/**
 * useAutoSaveOnLeave
 * A hook that fires a background save operation when a component unmounts (e.g. user navigates away).
 * It will explicitly NOT fire if the user has triggered a discard action or an explicit save action.
 * 
 * Supports two modes:
 * 1. Boolean isDirty: uses a synced ref internally (may have 1 render cycle delay).
 * 2. MutableRefObject<boolean> isDirty: reads directly from the ref (zero delay, fully synchronous).
 * 
 * Also supports an optional `keepaliveSave` callback that uses fetch with keepalive:true
 * to guarantee the save survives page navigation (unlike Server Actions which get aborted).
 */
export function useAutoSaveOnLeave(
    isDirty: boolean | React.MutableRefObject<boolean>,
    onSave: () => void | Promise<void>,
    keepaliveSave?: () => void
) {
    const isDiscardedRef = useRef(false);
    const isDirtyRef = useRef(typeof isDirty === 'boolean' ? isDirty : isDirty.current);
    const onSaveRef = useRef(onSave);
    const keepaliveSaveRef = useRef(keepaliveSave);

    // Keep refs fully synchronized with current render
    useEffect(() => {
        if (typeof isDirty === 'boolean') {
            isDirtyRef.current = isDirty;
        }
        onSaveRef.current = onSave;
        keepaliveSaveRef.current = keepaliveSave;
    }, [isDirty, onSave, keepaliveSave]);

    // Mark the form as intentionally discarded (do not save on leave)
    const setDiscarded = useCallback(() => {
        isDiscardedRef.current = true;
    }, []);

    // Mark the form as clean (do not save on leave)
    const setClean = useCallback(() => {
        isDirtyRef.current = false;
        if (typeof isDirty !== 'boolean') {
            isDirty.current = false;
        }
    }, [isDirty]);

    useEffect(() => {
        return () => {
            // When the component unmounts, check if we need to auto-save
            const isCurrentlyDirty = typeof isDirty === 'boolean' 
                ? isDirtyRef.current 
                : isDirty.current;
            
            console.log('[useAutoSaveOnLeave] UNMOUNT cleanup. isCurrentlyDirty=', isCurrentlyDirty, 
                'isDiscarded=', isDiscardedRef.current, 
                'hasKeepalive=', !!keepaliveSaveRef.current,
                'isDirtyType=', typeof isDirty);
            
            if (isCurrentlyDirty && !isDiscardedRef.current) {
                console.log('[useAutoSaveOnLeave] Dirty and not discarded — SAVING!');
                try {
                    // Prefer keepalive save (survives navigation) over server action
                    if (keepaliveSaveRef.current) {
                        console.log('[useAutoSaveOnLeave] Using keepaliveSave');
                        keepaliveSaveRef.current();
                    } else {
                        console.log('[useAutoSaveOnLeave] Using onSave (server action)');
                        onSaveRef.current();
                    }
                } catch (error) {
                    console.error('[useAutoSaveOnLeave] Failed background save:', error);
                }
            } else {
                console.log('[useAutoSaveOnLeave] Skipping save (not dirty or discarded).');
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { setDiscarded, setClean };
}
