'use server';

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// Portal uses a SEPARATE secret key from the ERP
const PORTAL_SECRET = process.env.PORTAL_JWT_SECRET || 'portal-secret-key-change-me';
const portalKey = new TextEncoder().encode(PORTAL_SECRET);

// Portal session duration: 30 days (longer than ERP shifts)
const PORTAL_SESSION_DAYS = 30;

export async function encryptPortal(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${PORTAL_SESSION_DAYS}d`)
        .sign(portalKey);
}

export async function decryptPortal(token: string): Promise<any> {
    const { payload } = await jwtVerify(token, portalKey, {
        algorithms: ['HS256'],
    });
    return payload;
}

export async function getPortalSession() {
    let sessionCookie: string | undefined;
    try {
        const cookieStore = await cookies();
        sessionCookie = cookieStore.get('portal_session')?.value;
    } catch {
        return null;
    }

    if (!sessionCookie) return null;

    try {
        const session = await decryptPortal(sessionCookie);
        return session;
    } catch {
        return null;
    }
}

export async function createPortalSession(portalUserId: string, partnerId: string, companyId: string) {
    const expires = new Date(Date.now() + PORTAL_SESSION_DAYS * 24 * 60 * 60 * 1000);
    const session = await encryptPortal({
        portalUserId,
        partnerId,
        companyId,
        type: 'portal', // Key differentiator from ERP tokens
        expires,
    });

    (await cookies()).set('portal_session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function logoutPortal() {
    (await cookies()).delete('portal_session');
}

/**
 * Get the full PortalUser with Partner data for the current session.
 * Returns null if not authenticated or company portal is disabled.
 */
export async function getPortalUser() {
    const session = await getPortalSession();
    if (!session?.portalUserId) return null;

    const portalUser = await prisma.portalUser.findUnique({
        where: { id: session.portalUserId },
        include: {
            partner: true,
            company: {
                select: {
                    id: true,
                    name: true,
                    logoUrl: true,
                    phone: true,
                    email: true,
                    address: true,
                    isTraderPortalEnabled: true,
                }
            },
        },
    });

    // Check: user exists, is active, and company has portal enabled
    if (!portalUser || !portalUser.active || !portalUser.company?.isTraderPortalEnabled) {
        return null;
    }

    return portalUser;
}
