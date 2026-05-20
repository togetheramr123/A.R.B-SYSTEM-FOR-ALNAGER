
export interface TrackingValue {
    fieldDesc: string;
    oldValue: any;
    newValue: any;
}


export function getTrackingValues(
    original: any,
    current: any,
    fieldLabels: Record<string, string>
): TrackingValue[] {
    const changes: TrackingValue[] = [];

    // Helper to normalize values for comparison and display
    const normalize = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'boolean') return val ? 'نعم' : 'لا'; // Arabic boolean
        return String(val);
    };

    for (const key in fieldLabels) {
        const label = fieldLabels[key];
        const oldVal = original?.[key];
        const newVal = current?.[key];

        // Skip if both are empty/null
        if (!oldVal && !newVal) continue;

        const normOld = normalize(oldVal);
        const normNew = normalize(newVal);

        if (normOld !== normNew) {
            changes.push({
                fieldDesc: label,
                oldValue: normOld || 'فارغ',
                newValue: normNew || 'فارغ'
            });
        }
    }

    return changes;
}
