import prisma from '@/lib/prisma';

/**
 * Auto-generate account code based on account type
 * Each type has a prefix range:
 * - receivable: 120xxx
 * - payable: 210xxx
 * - bank_cash / bank / cash: 110xxx
 * - current_asset: 100xxx
 * - non_current_asset / fixed_asset: 150xxx
 * - current_liability: 200xxx
 * - non_current_liability: 250xxx
 * - equity: 300xxx
 * - income / revenue: 400xxx
 * - expense: 600xxx
 * - cost_of_revenue / cogs: 500xxx
 * - other: 900xxx
 */
export async function generateAccountCode(type: string): Promise<string> {
    const prefixMap: Record<string, string> = {
        receivable: '120',
        payable: '210',
        bank_cash: '110',
        bank: '110',
        cash: '110',
        asset: '100',
        asset_current: '100',
        current_asset: '100',
        non_current_asset: '150',
        fixed_asset: '150',
        prepayments: '130',
        credit_card: '115',
        current_liability: '200',
        non_current_liability: '250',
        equity: '300',
        current_year_earnings: '310',
        income: '400',
        other_income: '450',
        revenue: '400',
        expense: '600',
        depreciation: '680',
        cost_of_revenue: '500',
        cogs: '500',
        other: '900',
    };

    const prefix = prefixMap[type] || '900';
    
    // Find highest existing code with this prefix
    const existing = await prisma.account.findMany({
        where: {
            code: { startsWith: prefix }
        },
        select: { code: true },
        orderBy: { code: 'desc' },
        take: 1
    });

    if (existing.length > 0) {
        const lastCode = parseInt(existing[0].code);
        return String(lastCode + 1);
    }
    
    // Start from prefix + 001
    return `${prefix}001`;
}

/**
 * Auto-generate journal short code based on type
 * - sale: INV, INV2, INV3...
 * - purchase: BILL, BILL2, BILL3...
 * - cash: CSH, CSH2, CSH3...
 * - bank: BNK, BNK2, BNK3...
 * - general: MISC, MISC2, MISC3...
 */
export async function generateJournalCode(type: string): Promise<string> {
    const baseMap: Record<string, string> = {
        sale: 'INV',
        purchase: 'BILL',
        cash: 'CSH',
        bank: 'BNK',
        general: 'MISC',
    };

    const base = baseMap[type] || 'JRN';
    
    // Check if base code already exists
    const existing = await prisma.journal.findMany({
        where: {
            code: { startsWith: base }
        },
        select: { code: true }
    });

    if (existing.length === 0) {
        return base; // First of its type, use base code
    }

    // Find next available number
    let maxNum = 1;
    for (const j of existing) {
        const suffix = j.code.replace(base, '');
        if (suffix === '') {
            maxNum = Math.max(maxNum, 1);
        } else {
            const num = parseInt(suffix);
            if (!isNaN(num)) {
                maxNum = Math.max(maxNum, num);
            }
        }
    }

    return `${base}${maxNum + 1}`;
}

/**
 * Auto-generate analytic account code
 * Simple sequential: AA001, AA002, AA003...
 */
export async function generateAnalyticCode(): Promise<string> {
    const existing = await prisma.$queryRaw<{code: string}[]>`
        SELECT code FROM "AnalyticAccount" WHERE code IS NOT NULL ORDER BY code DESC LIMIT 1
    `;

    if (existing.length > 0 && existing[0].code) {
        const num = parseInt(existing[0].code.replace('AA', ''));
        if (!isNaN(num)) {
            return `AA${String(num + 1).padStart(3, '0')}`;
        }
    }

    return 'AA001';
}
