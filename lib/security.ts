
import { PrismaClient } from '@prisma/client';
import { getSession } from './auth'; // Assuming a session helper exists, or we mock it for now.
import prisma from '@/lib/prisma'; // Ensure correct import path

export async function checkAccess(model: string, operation: 'read' | 'write' | 'create' | 'unlink') {
    // Delegate to the canonical implementation in lib/access.ts
    const { checkAccess: check } = await import('./access');
    return await check(model, operation);
}

export async function validateAccess(userId: string, model: string, operation: 'read' | 'write' | 'create' | 'unlink') {
    const user = await prisma.user.findUnique({
        where: { id: userId },
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

    if (!user) throw new Error("User not found");

    // Superuser check (optional, e.g. role === 'ADMIN')
    if (user.role === 'ADMIN') return true;

    // Check permissions across all groups
    const hasPermission = user.groups.some(group => {
        return group.accessRights.some(access => {
            if (operation === 'read') return access.permRead;
            if (operation === 'write') return access.permWrite;
            if (operation === 'create') return access.permCreate;
            if (operation === 'unlink') return access.permUnlink;
            return false;
        });
    });

    if (!hasPermission) {
        throw new Error(`Access Denied: You do not have '${operation}' rights on '${model}'.`);
    }

    return true;
}
