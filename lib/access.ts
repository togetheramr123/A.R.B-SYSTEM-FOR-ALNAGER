
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

type AccessOperation = 'read' | 'write' | 'create' | 'unlink';

export async function checkAccess(model: string, operation: AccessOperation): Promise<boolean> {
    const session = await getSession();

    // 1. Superuser / Admin Bypass
    if (session?.role === 'ADMIN') {
        return true;
    }

    if (!session?.userId) {
        console.warn(`checkAccess: No session for model ${model}`);
        return false; // Deny by default if not logged in (unless public pages which shouldn't call this)
    }

    // 2. Fetch User Groups and their Access Rights for this model
    // We need to see if *any* of the user's groups grant this permission.
    try {
        const userWithGroups = await prisma.user.findUnique({
            where: { id: session.userId },
            include: {
                groups: {
                    include: {
                        accessRights: {
                            where: { model: model }
                        }
                    }
                }
            }
        });

        if (!userWithGroups) return false;

        // 3. Check Permissions
        // If any group has the bit set to true, access is granted (inclusive OR).
        for (const group of userWithGroups.groups) {
            for (const access of group.accessRights) {
                if (operation === 'read' && access.permRead) return true;
                if (operation === 'write' && access.permWrite) return true;
                if (operation === 'create' && access.permCreate) return true;
                if (operation === 'unlink' && access.permUnlink) return true;
            }
        }

        // 4. Fallback: check UI permissions JSON configured on each group
        for (const group of userWithGroups.groups) {
            if (!group.permissions) continue;
            let perms: Record<string, boolean> = {};
            try {
                perms = JSON.parse(group.permissions);
            } catch {
                continue;
            }

            const modelClean = model.toLowerCase().replace(/_/g, '.');

            // Check base permission (some modules check base)
            if (modelClean === 'base') {
                return true; // base is allowed if user has a valid group
            }

            // Check pricelist permissions
            if (modelClean === 'pricelist' || modelClean === 'product.pricelist') {
                if (operation === 'read' && (perms.pricelist_view || perms.canManageDiscounts)) return true;
                if (operation === 'create' && perms.pricelist_create) return true;
                if (operation === 'write' && perms.pricelist_edit) return true;
                if (operation === 'unlink' && perms.pricelist_delete) return true;
            }

            // Check sale order permissions
            if (modelClean === 'sale.order' || modelClean === 'sale' || modelClean === 'saleorder') {
                if (operation === 'read' && (perms.sales_view || perms.canCreateOrders || perms.canApproveOrders)) return true;
                if (operation === 'create' && (perms.sales_create || perms.canCreateOrders)) return true;
                if (operation === 'write' && (perms.sales_edit || perms.canCreateOrders || perms.canApproveOrders)) return true;
                if (operation === 'unlink' && (perms.sales_delete || perms.canCreateOrders)) return true;
            }

            // Check purchase order permissions
            if (modelClean === 'purchase.order' || modelClean === 'purchase' || modelClean === 'purchaseorder') {
                if (operation === 'read' && (perms.purch_view || perms.canCreatePurchaseOrders || perms.canApprovePurchases)) return true;
                if (operation === 'create' && (perms.purch_create || perms.canCreatePurchaseOrders)) return true;
                if (operation === 'write' && (perms.purch_edit || perms.canCreatePurchaseOrders || perms.canApprovePurchases)) return true;
                if (operation === 'unlink' && (perms.purch_delete || perms.canCreatePurchaseOrders)) return true;
            }

            // Check partner permissions
            if (modelClean === 'partner' || modelClean === 'res.partner') {
                if (operation === 'read' && (perms.cust_view || perms.canCreateOrders || perms.canCreatePurchaseOrders || perms.canManageVendors)) return true;
                if (operation === 'create' && (perms.cust_create || perms.canCreateOrders || perms.canCreatePurchaseOrders || perms.canManageVendors)) return true;
                if (operation === 'write' && (perms.cust_edit || perms.canCreateOrders || perms.canCreatePurchaseOrders || perms.canManageVendors)) return true;
                if (operation === 'unlink' && (perms.cust_edit || perms.canCreateOrders || perms.canCreatePurchaseOrders || perms.canManageVendors)) return true;
            }

            // Check product permissions
            if (modelClean === 'product' || modelClean === 'product.product' || modelClean === 'product.template') {
                if (operation === 'read' && (perms.inv_view || perms.canManageProducts || perms.canViewStock || perms.canManageWarehouse || perms.canReceiveGoods || perms.canShipGoods)) return true;
                if (operation === 'create' && (perms.inv_create_product || perms.canManageProducts)) return true;
                if (operation === 'write' && (perms.inv_edit_product || perms.canManageProducts)) return true;
                if (operation === 'unlink' && (perms.inv_edit_product || perms.canManageProducts)) return true;
            }

            // Check stock picking permissions
            if (modelClean === 'stock.picking' || modelClean === 'stock_picking') {
                if (operation === 'read' && (perms.inv_view || perms.inv_view_picking || perms.canViewStock || perms.canManageWarehouse || perms.canReceiveGoods || perms.canShipGoods)) return true;
                if (operation === 'create' && (perms.inv_view_picking || perms.canManageWarehouse || perms.canReceiveGoods)) return true;
                if (operation === 'write' && (perms.inv_validate_picking || perms.canManageWarehouse || perms.canReceiveGoods || perms.canShipGoods)) return true;
                if (operation === 'unlink' && (perms.inv_validate_picking || perms.canManageWarehouse || perms.canReceiveGoods || perms.canShipGoods)) return true;
            }

            // Check accounting move / invoice permissions
            if (modelClean === 'account.move' || modelClean === 'account_move' || modelClean === 'invoice') {
                if (operation === 'read' && (perms.acc_view_invoices || perms.canManageAccounts || perms.canViewReports)) return true;
                if (operation === 'create' && (perms.acc_create_invoice || perms.canCreateJournalEntries)) return true;
                if (operation === 'write' && (perms.acc_create_invoice || perms.canCreateJournalEntries)) return true;
                if (operation === 'unlink' && (perms.acc_cancel_invoice || perms.canCreateJournalEntries)) return true;
            }
        }

        // If explicitly no matching rule found, Odoo usually defaults to Deny.
        return false;

    } catch (error) {
        console.error('checkAccess error:', error);
        return false;
    }
}

export async function ensureAccess(model: string, operation: AccessOperation) {
    const allowed = await checkAccess(model, operation);
    if (!allowed) {
        throw new Error(`Access Denied: You do not have permission to ${operation} ${model}.`);
    }
}
