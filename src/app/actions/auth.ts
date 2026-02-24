'use server';

import { cookies } from 'next/headers';
import {
    createSignedAuthToken,
    getAuthCookieName,
    getAuthTokenTtlSeconds,
    getFailedLoginState,
    getLoginAttemptsCookieName,
    isPasswordConfigured,
    isPasswordMatch,
    isLockedOut,
    parseLoginAttemptState,
} from '@/src/lib/auth-session';

export async function authenticate(formData: FormData) {
    const password = formData.get('password');
    const cookieStore = await cookies();
    const attemptsCookieName = getLoginAttemptsCookieName();
    const authCookieName = getAuthCookieName();
    const attemptsState = parseLoginAttemptState(cookieStore.get(attemptsCookieName)?.value);

    if (isLockedOut(attemptsState)) {
        return { error: 'Too many attempts. Try again in 15 minutes.' };
    }

    if (!isPasswordConfigured()) {
        return { error: 'Authentication is not configured. Set SITE_PASSWORD and SITE_AUTH_SECRET.' };
    }

    if (isPasswordMatch(password)) {
        const expires = new Date(Date.now() + getAuthTokenTtlSeconds() * 1000);
        const token = await createSignedAuthToken();
        if (!token) {
            return { error: 'Authentication is not configured. Set SITE_AUTH_SECRET.' };
        }

        cookieStore.set(authCookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expires,
        });
        cookieStore.delete(attemptsCookieName);

        return { success: true };
    }

    const nextAttempts = getFailedLoginState(attemptsState);
    cookieStore.set(attemptsCookieName, JSON.stringify(nextAttempts), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
    });

    return { error: 'Incorrect password' };
}
