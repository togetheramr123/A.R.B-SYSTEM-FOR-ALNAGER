'use server';

import prisma from '@/lib/prisma';
import { format } from 'date-fns';

/**
 * Generate the next sequence string for a specific sequence code.
 * Replaces placeholders like %(year)s and %(month)s inside the prefix.
 * Example of code: 'sale.order', 'purchase.order', 'stock.picking.out'
 */
export async function getNextSequence(
    sequenceCode: string,
    tx?: any // Optional Prisma transaction client to ensure atomicity
): Promise<string> {
    const operation = async (prismaTx: any) => {
        const seq = await prismaTx.irSequence.findUnique({
            where: { code: sequenceCode }
        });

        if (!seq) {
            throw new Error(`التسلسل غير موجود: ${sequenceCode}`);
        }

        const nextNum = seq.nextNumber;

        await prismaTx.irSequence.update({
            where: { id: seq.id },
            data: { nextNumber: nextNum + (seq?.numberIncrement || 1) }
        });

        return { ...seq, numberToUse: nextNum };
    };

    const sequence = tx ? await operation(tx) : await prisma.$transaction(operation);

    // Formatting Prefix
    let prefix = sequence.prefix || '';
    const now = new Date();
    if (prefix.includes('%(year)s')) {
        prefix = prefix.replace('%(year)s', format(now, 'yyyy'));
    }
    if (prefix.includes('%(month)s')) {
        prefix = prefix.replace('%(month)s', format(now, 'MM'));
    }

    // Number Padding
    const paddedNumber = String(sequence.numberToUse).padStart(sequence.padding, '0');

    // Combine
    let finalSequence = prefix + paddedNumber;
    if (sequence.suffix) {
        finalSequence += sequence.suffix;
    }

    return finalSequence;
}

// Fallback for old code using getNextSequence(prefix, model)
export async function getNextSequenceLegacy(
    prefix: string,
    model: string,
    filter?: Record<string, any>,
    tx?: any,
    docDate?: Date
): Promise<string> {
    const db = tx || prisma;
    const targetDate = docDate || new Date();
    const yearStr = String(targetDate.getFullYear());
    const monthStr = String(targetDate.getMonth() + 1).padStart(2, '0');

    // Determine if this is an accounting sequence that resets monthly
    const isMonthlyAccounting = ['journalEntry', 'invoice', 'payment'].includes(model);

    const where: any = { ...filter };
    
    if (isMonthlyAccounting) {
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const nextMonthStart = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
        
        // We need to query the specific date field based on the model
        let dateField = 'createdAt';
        if (model === 'invoice') dateField = 'dateInvoice';
        if (model === 'journalEntry') dateField = 'date';
        if (model === 'payment') dateField = 'date';
        
        where[dateField] = { gte: monthStart, lt: nextMonthStart };
    }

    let count: number;
    switch (model) {
        case 'journalEntry': count = await db.journalEntry.count({ where }); break;
        case 'invoice': count = await db.invoice.count({ where }); break;
        case 'payment': count = await db.payment.count({ where }); break;
        case 'stockPicking': count = await db.stockPicking.count({ where }); break;
        case 'stockScrap': count = await db.stockScrap.count({ where }); break;
        case 'bankStatement': count = await db.bankStatement.count({ where }); break;
        case 'saleOrder': count = await db.saleOrder.count({ where }); break;
        case 'purchaseOrder': count = await db.purchaseOrder.count({ where }); break;
        default: count = 0;
    }

    if (isMonthlyAccounting) {
        const seq = String(count + 1).padStart(4, '0'); // Odoo accounting uses 4 digits usually
        return `${prefix}/${yearStr}/${monthStr}/${seq}`;
    } else {
        const seq = String(count + 1).padStart(5, '0');
        return `${prefix}${seq}`;
    }
}

