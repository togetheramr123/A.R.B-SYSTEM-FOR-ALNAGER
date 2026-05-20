
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
