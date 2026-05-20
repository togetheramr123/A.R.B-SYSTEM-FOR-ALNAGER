import { Decimal } from '@prisma/client/runtime/library';

/**
 * Recursively converts Prisma Decimal objects to numbers in a plain object or array.
 * This is necessary because Next.js Client Components cannot serialize Decimal objects.
 */
export function serializeDecimal<T>(data: T): T {
    if (data === null || data === undefined) {
        return data;
    }

    if (data === null || data === undefined) {
        return data;
    }
    // Using stringify and parse guarantees that all complex Prisma objects 
    // (Decimals, custom class instances) are flattened into plain properties.
    // Prisma Decimals implement toJSON which returns a string, preventing the 
    // "Only plain objects can be passed to Client Components" error.
    return JSON.parse(JSON.stringify(data));
}
