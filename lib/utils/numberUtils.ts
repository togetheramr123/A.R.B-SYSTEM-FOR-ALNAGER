import Decimal from 'decimal.js';

export function convertArabicToEnglishNumbers(str: string): string {
    if (!str) return str;
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(str).replace(/[٠-٩]/g, function (w) {
        return arabicNumbers.indexOf(w).toString();
    });
}

export function safeDecimal(val: any, fallback = 0) {
    if (val === undefined || val === null || val === '') return new Decimal(fallback);
    // Pre-convert Arabic digits if string
    const sanitized = convertArabicToEnglishNumbers(String(val)).replace(/[^\d.-]/g, '');
    const num = parseFloat(sanitized);
    if (isNaN(num)) return new Decimal(fallback);
    return new Decimal(num);
}


export function formatCurrency(amount: any, currency = 'LE', locale = 'en-US') {
    const num = Number(amount);
    if (isNaN(num)) return `0.00 ${currency}`;
    return `${currency} ${num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function safeNumber(val: any, fallback = 0) {
    if (val === undefined || val === null || val === '') return fallback;
    const sanitized = convertArabicToEnglishNumbers(String(val)).replace(/[^\d.-]/g, '');
    const num = parseFloat(sanitized);
    if (isNaN(num)) return fallback;
    return num;
}
