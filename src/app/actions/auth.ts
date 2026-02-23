'use server';

import { cookies } from 'next/headers';

export async function authenticate(formData: FormData) {
    const password = formData.get('password');

    if (password === 'NBC!planning') {
        // Set cookie to expire in 12 hours
        const expires = new Date(Date.now() + 12 * 60 * 60 * 1000);

        const cookieStore = await cookies();
        cookieStore.set('site_auth', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expires,
        });

        return { success: true };
    }

    return { error: 'Incorrect password' };
}
