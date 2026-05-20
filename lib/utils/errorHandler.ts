// lib/utils/errorHandler.ts
import { Prisma } from '@prisma/client';

export function parsePrismaError(error: any, customMessages?: Record<string, string>): string {
    if (!error) return "حدث خطأ غير معروف";

    // If it's a direct string error thrown manually
    if (typeof error === 'string') return error;

    // Custom Error objects thrown by our actions
    if (error instanceof Error) {
        // Many Prisma errors are wrapped in standard Errors.
        if (error.message.includes('Foreign key constraint failed')) {
            return "لا يمكن إتمام العملية لارتباط هذا السجل بسجلات أخرى مهمة بالنظام.";
        }
        if (error.message.includes('Unique constraint failed')) {
            return "هذا السجل (أو الاسم) موجود مسبقاً، يرجى تغييره.";
        }
    }

    // Prisma specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
            case 'P2002':
                return customMessages?.P2002 || "يوجد سجل آخر بنفس البيانات المميزة (مثل الاسم أو الرمز)، يرجى استخدام تفاصيل أخرى لمنع التكرار.";
            case 'P2003':
                return customMessages?.P2003 || "لا يمكن الحذف أو التعديل لأن هذا السجل مرتبط بحركات أخرى في النظام.";
            case 'P2025':
                return customMessages?.P2025 || "السجل المطلوب غير موجود، ربما تم حذفه مسبقاً.";
            case 'P2014':
                return customMessages?.P2014 || "العملية التي تحاول القيام بها ستكسر ترابط البيانات في قاعدة البيانات.";
            default:
                return `حدث خطأ في قاعدة البيانات (الرمز: ${error.code}). يرجى الاتصال بالدعم.`;
        }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
        return "بيانات غير صالحة تم إرسالها لقاعدة البيانات. يرجى مراجعة الحقول المطلوبة.";
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
        return "فشل الاتصال بقاعدة البيانات. تأكد من عمل السيرفر.";
    }

    // Validation Zod Errors (if passed through here)
    if (error.name === 'ZodError') {
        return "توجد بيانات غير صحيحة أو ناقصة في النموذج. يرجى مراجعة الخانات الحمراء.";
    }

    return error.message || error.toString() || "حدث خطأ غير متوقع بالخادم.";
}
