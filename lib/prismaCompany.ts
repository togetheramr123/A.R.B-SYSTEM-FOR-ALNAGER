/**
 * lib/prismaCompany.ts
 * ====================
 * Multi-Tenant Data Isolation Helper
 * 
 * Provides a company-scoped Prisma client that automatically
 * injects `companyId` into WHERE clauses for all read operations
 * and INTO data for all create operations.
 * 
 * Usage:
 *   import { getCompanyPrisma } from '@/lib/prismaCompany';
 *   const cprisma = await getCompanyPrisma();
 *   const products = await cprisma.product.findMany(); // Auto-filtered by companyId
 * 
 * This follows the Odoo "Record Rules" pattern where each company
 * can only see its own data.
 */

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Models that have companyId field and should be auto-filtered
const COMPANY_SCOPED_MODELS = new Set([
    'account', 'analyticAccount', 'approvalRequest', 'asset', 'assetCategory',
    'auditLog', 'bankStatement', 'bankStatementLine', 'billOfMaterial',
    'budget', 'budgetLine', 'cashRegister', 'cashSettlement', 'cashTransaction',
    'catalog', 'cheque', 'collectionMessage', 'debtFollowUp', 'deferredEntry',
    'fiscalYearClosing', 'inventoryAdjustmentRecord', 'invoice', 'journal',
    'journalEntry', 'journalItem', 'notification', 'operationType',
    'partner', 'payment', 'priceList', 'product', 'productCategory',
    'productSupplierInfo', 'purchaseOrder', 'saleOrder', 'stockLot',
    'stockMove', 'stockPicking', 'stockQuant', 'stockScrap',
    'stockValuationLayer', 'tax', 'location', 'warehouse',
    'portalUser', 'portalBanner',
]);

/**
 * Get a company-scoped Prisma client.
 * All findMany/findFirst/count/aggregate calls will automatically
 * filter by the current user's companyId.
 * 
 * Returns the raw prisma client if no session is available (for scripts).
 */
export async function getCompanyPrisma(): Promise<typeof prisma> {
    const session = await getSession();
    const companyId = session?.companyId;

    if (!companyId) {
        // No session or no company — return raw prisma
        // This happens in scripts or when auto-login provides no company
        return prisma;
    }

    return prisma.$extends({
        query: {
            $allModels: {
                async findMany({ model, args, query }: any) {
                    if (COMPANY_SCOPED_MODELS.has(toCamelCase(model))) {
                        args.where = { ...args.where, companyId };
                    }
                    return query(args);
                },
                async findFirst({ model, args, query }: any) {
                    if (COMPANY_SCOPED_MODELS.has(toCamelCase(model))) {
                        args.where = { ...args.where, companyId };
                    }
                    return query(args);
                },
                async count({ model, args, query }: any) {
                    if (COMPANY_SCOPED_MODELS.has(toCamelCase(model))) {
                        args.where = { ...args.where, companyId };
                    }
                    return query(args);
                },
                async aggregate({ model, args, query }: any) {
                    if (COMPANY_SCOPED_MODELS.has(toCamelCase(model))) {
                        args.where = { ...args.where, companyId };
                    }
                    return query(args);
                },
                async groupBy({ model, args, query }: any) {
                    if (COMPANY_SCOPED_MODELS.has(toCamelCase(model))) {
                        args.where = { ...args.where, companyId };
                    }
                    return query(args);
                },
                async create({ model, args, query }: any) {
                    if (COMPANY_SCOPED_MODELS.has(toCamelCase(model))) {
                        if (!args.data?.companyId && !args.data?.company) {
                            args.data.companyId = companyId;
                        }
                    }
                    return query(args);
                },
                async createMany({ model, args, query }: any) {
                    if (COMPANY_SCOPED_MODELS.has(toCamelCase(model))) {
                        if (Array.isArray(args.data)) {
                            args.data = args.data.map((d: any) => ({
                                ...d,
                                companyId: d.companyId || companyId,
                            }));
                        } else if (!args.data?.companyId) {
                            args.data.companyId = companyId;
                        }
                    }
                    return query(args);
                },
            },
        },
    }) as unknown as typeof prisma;
}

/**
 * Convert PascalCase model name to camelCase
 * e.g. "SaleOrder" -> "saleOrder", "Product" -> "product"
 */
function toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

/**
 * Get the current company ID from session.
 * Throws if no session or company is found.
 */
export async function requireCompanyId(): Promise<string> {
    const session = await getSession();
    if (!session?.companyId) {
        throw new Error('غير مصرح — لا يوجد شركة مرتبطة بالجلسة');
    }
    return session.companyId;
}
