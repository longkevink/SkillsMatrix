import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthCookieName, verifySignedAuthToken } from '@/src/lib/auth-session';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Allow static assets, images, and the login page itself to pass through
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/login') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.includes('favicon')
    ) {
        return NextResponse.next();
    }

    const authCookie = request.cookies.get(getAuthCookieName());

    if (!authCookie || !(await verifySignedAuthToken(authCookie.value))) {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    // Match all request paths except for the ones starting with API routes, _next/static, _next/image, and favicon
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
