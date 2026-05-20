import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET;
if (!secretKey) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const key = new TextEncoder().encode(secretKey);

// Shift duration: 9 hours (configurable)
export const SHIFT_DURATION_HOURS = 9;
export const SHIFT_DURATION_MS = SHIFT_DURATION_HOURS * 60 * 60 * 1000;

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(`${SHIFT_DURATION_HOURS}h`)
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ['HS256'],
    });
    return payload;
}

import prisma from '@/lib/prisma';

export async function getSession() {
    let sessionCookie = undefined;
    let activeCompanyId = undefined;
    try {
        const cookieStore = await cookies();
        sessionCookie = cookieStore.get('auth_session')?.value;
        activeCompanyId = cookieStore.get('active_company_id')?.value;
    } catch (e) {
        // Ignored: Likely running in script environment
    }

    let session: any = null;

    if (sessionCookie) {
        try {
            session = await decrypt(sessionCookie);
        } catch (error) {
            // If decryption fails, fall through to auto-login
        }
    }

    if (!session && process.env.NODE_ENV !== 'production' && process.env.DEV_AUTO_LOGIN === 'true') {
        // Auto-login as Admin — DEVELOPMENT ONLY
        // Requires BOTH: NODE_ENV != production AND DEV_AUTO_LOGIN=true
        const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
        if (admin) {
            session = {
                userId: admin.id,
                companyId: admin.companyId,
                role: admin.role,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
            };
        }
    }

    // Override companyId with active_company_id cookie if present and valid
    // The cookie value might be stale after a database reseed
    if (session && activeCompanyId) {
        const companyExists = await prisma.company.findUnique({ where: { id: activeCompanyId } });
        if (companyExists) {
            session.companyId = activeCompanyId;
        }
    }

    return session;
}

export async function createSession(userId: string, companyId: string, role: string, options: any = {}) {
    const loginAt = Date.now();
    const expires = new Date(loginAt + SHIFT_DURATION_MS);
    const session = await encrypt({ 
        userId, 
        companyId, 
        role, 
        loginAt, 
        expires,
        canViewCost: options.canViewCost ?? true,
        allowedCustomerType: options.allowedCustomerType ?? "ALL",
        canCreateFreeVouchers: options.canCreateFreeVouchers ?? true,
        canAccessTreasury: options.canAccessTreasury ?? true
    });

    (await cookies()).set('auth_session', session, {
        expires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    // Store loginAt in a non-httpOnly cookie so the client can read it for countdown
    (await cookies()).set('shift_login_at', String(loginAt), {
        expires,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function logout() {
    (await cookies()).delete('auth_session');
}

export async function extendSession(additionalHours: number) {
    const session = await getSession();
    if (!session) return false;

    const additionalMs = additionalHours * 60 * 60 * 1000;
    const newLoginAt = session.loginAt + additionalMs;
    const newExpires = new Date(new Date(session.expires).getTime() + additionalMs);

    const newSessionToken = await encrypt({
        ...session,
        loginAt: newLoginAt,
        expires: newExpires
    });

    (await cookies()).set('auth_session', newSessionToken, {
        expires: newExpires,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    (await cookies()).set('shift_login_at', String(newLoginAt), {
        expires: newExpires,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });

    return true;
}
