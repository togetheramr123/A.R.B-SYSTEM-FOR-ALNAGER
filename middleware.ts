import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const intlMiddleware = createMiddleware({
    locales: ['ar', 'en'],
    defaultLocale: 'ar'
});

// ERP secret — MUST match lib/auth.ts
const secretKey = process.env.JWT_SECRET!;
const key = new TextEncoder().encode(secretKey);

// Portal secret (separate!)
const portalSecretKey = process.env.PORTAL_JWT_SECRET!;
const portalKey = new TextEncoder().encode(portalSecretKey);

// ===== Role-Based Access Control (RBAC) =====
// Define which route prefixes each role can access.
// ADMIN can access everything (no restrictions).
const ROLE_ROUTES: Record<string, string[]> = {
    OWNER: [], // Owner = full access (empty = no restrictions)
    ADMIN: [], // Admin = full access
    MANAGER: [
        '/dashboard', '/sales', '/purchases', '/inventory',
        '/accounting', '/contacts', '/crm', '/catalogs', '/reports',
        '/shared', '/analytics',
    ],
    WAREHOUSE_MANAGER: [
        '/dashboard', '/inventory', '/purchases', '/contacts',
        '/catalogs', '/crm', '/shared',
    ],
    ACCOUNTANT: [
        '/dashboard', '/accounting', '/contacts', '/reports',
        '/catalogs', '/crm', '/shared',
    ],
    SALESMAN: [
        '/dashboard', '/sales', '/contacts', '/catalogs',
        '/crm', '/shared',
    ],
    USER: [
        '/dashboard', '/crm', '/catalogs', '/shared',
    ],
};

function isRouteAllowed(role: string, pathnameWithoutLocale: string): boolean {
    // ADMIN and OWNER have full access
    if (role === 'ADMIN' || role === 'OWNER') return true;

    const allowedPrefixes = ROLE_ROUTES[role] || ROLE_ROUTES['USER'];
    // Empty array means full access
    if (allowedPrefixes.length === 0) return true;

    // Root path is always allowed
    if (pathnameWithoutLocale === '' || pathnameWithoutLocale === '/') return true;

    return allowedPrefixes.some(prefix => pathnameWithoutLocale.startsWith(prefix));
}

export default async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // ===== PORTAL ROUTES =====
    if (pathname.startsWith('/portal')) {
        const portalSession = request.cookies.get('portal_session')?.value;
        const isPortalLogin = pathname === '/portal/login';

        let isPortalAuthenticated = false;
        if (portalSession) {
            try {
                const payload = await jwtVerify(portalSession, portalKey, { algorithms: ['HS256'] });
                // Ensure it's a portal token
                if ((payload.payload as any).type === 'portal') {
                    isPortalAuthenticated = true;
                }
            } catch {
                isPortalAuthenticated = false;
            }
        }

        // If authenticated and on login page → redirect to portal home
        if (isPortalAuthenticated && isPortalLogin) {
            return NextResponse.redirect(new URL('/portal', request.url));
        }

        // If NOT authenticated and NOT on login page → redirect to portal login
        if (!isPortalAuthenticated && !isPortalLogin) {
            return NextResponse.redirect(new URL('/portal/login', request.url));
        }

        // Portal routes don't go through intl middleware
        return NextResponse.next();
    }

    // ===== ERP ROUTES =====
    const session = request.cookies.get('auth_session')?.value;

    // Helper to strip locale
    const pathnameWithoutLocale = pathname.replace(/^\/(ar|en)/, '');

    // 1. Check if user is authenticated
    let isAuthenticated = false;
    let userRole = 'USER';
    if (session) {
        try {
            const { payload } = await jwtVerify(session, key, { algorithms: ['HS256'] });
            isAuthenticated = true;
            userRole = (payload as any).role || 'USER';
        } catch (err) {
            isAuthenticated = false;
        }
    }

    // 2. Define Protected Routes
    // Public: / (landing), /login
    const isPublicPage = pathnameWithoutLocale === '/login';

    // 3. Authentication Logic
    if (isAuthenticated && isPublicPage && pathnameWithoutLocale === '/login') {
        // Already logged in, trying to access login -> go to dashboard
        const locale = pathname.match(/^\/(ar|en)/)?.[1] || 'ar';
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    if (!isAuthenticated && !isPublicPage) {
        // Not logged in, trying to access protected route -> go to login
        const locale = pathname.match(/^\/(ar|en)/)?.[1] || 'ar';
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    // 4. Role-Based Access Control — redirect unauthorized routes to dashboard
    if (isAuthenticated && !isPublicPage) {
        if (!isRouteAllowed(userRole, pathnameWithoutLocale)) {
            const locale = pathname.match(/^\/(ar|en)/)?.[1] || 'ar';
            return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
        }
    }

    // 5. Continue with Internationalization
    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
