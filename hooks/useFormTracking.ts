
import { useCallback } from 'react';
import { getTrackingValues, TrackingValue } from '@/lib/tracking';

interface UseFormTrackingProps {
    fieldLabels: Record<string, string>;
}

export function useFormTracking({ fieldLabels }: UseFormTrackingProps) {
    const getChanges = useCallback((original: any, current: any) => {
        return getTrackingValues(original, current, fieldLabels);
    }, [fieldLabels]);

    return { getChanges };
}
