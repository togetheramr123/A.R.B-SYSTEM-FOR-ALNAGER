"use server";

import { extendSession } from "@/lib/auth";

export async function extendShiftAction(hours: number) {
    try {
        const success = await extendSession(hours);
        return { success };
    } catch (error) {
        console.error("Failed to extend shift:", error);
        return { success: false, error: "حدث خطأ أثناء تمديد الشيفت" };
    }
}
