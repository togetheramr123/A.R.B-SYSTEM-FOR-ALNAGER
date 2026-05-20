import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const intlMiddleware = createMiddleware({
    locales: ['ar', 'en'],
    defaultLocale: 'ar'
});

// ERP secret — MUST match lib/auth.ts
const secretKey = process.env.JWT_SECRET || 'secret-key-change-me-in-production';
const key = new TextEncoder().encode(secretKey);

// Portal secret (separate!)
const portalSecretKey = process.env.PORTAL_JWT_SECRET || 'portal-secret-key-change-me';
const portalKey = new TextEncoder().encode(portalSecretKey);

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

    // ===== ERP ROUTES (existing logic) =====
    const session = request.cookies.get('auth_session')?.value;

    // Helper to strip locale
    const pathnameWithoutLocale = pathname.replace(/^\/(ar|en)/, '');

    // 1. Check if user is authenticated
    let isAuthenticated = false;
    if (session) {
        try {
            await jwtVerify(session, key, { algorithms: ['HS256'] });
            isAuthenticated = true;
        } catch (err) {
            isAuthenticated = false;
        }
    }

    // 2. Define Protected Routes
    // Public: / (landing), /login
    const isPublicPage = pathnameWithoutLocale === '/login';

    // 3. Logic
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

    // 4. Continue with Internationalization
    return intlMiddleware(request);
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
