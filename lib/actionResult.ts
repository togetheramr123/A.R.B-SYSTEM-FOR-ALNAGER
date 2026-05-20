/**
 * Standardized Action Result
 * كل server action ترجع هذا النمط
 */
export type ActionResult<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};

export function ok<T>(data?: T): ActionResult<T> {
    return { success: true, data };
}

export function fail(error: string): ActionResult {
    return { success: false, error };
}
