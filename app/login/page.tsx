'use client';

import Image from 'next/image';
import { useState } from 'react';
import { authenticate } from '@/src/app/actions/auth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);

    async function handleAction(formData: FormData) {
        setIsPending(true);
        setError(null);

        const result = await authenticate(formData);

        if (result?.error) {
            setError(result.error);
            setIsPending(false);
        } else if (result?.success) {
            // Force full page reload to clear router cache and re-evaluate middleware
            window.location.href = '/';
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#041428] px-4 selection:bg-[#341280] selection:text-white">
            <div className="w-full max-w-sm flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Logo */}
                <div className="flex flex-col items-center gap-4">
                    <Image
                        src="/nbc-peacock-white.png"
                        alt="NBC Peacock"
                        width={180}
                        height={117}
                        className="w-40 h-auto drop-shadow-2xl"
                        priority
                    />
                    <h1 className="text-2xl font-extrabold tracking-[0.2em] text-white text-center ml-1">
                        SKILLS MANAGER
                    </h1>
                </div>

                {/* Login Form */}
                <form action={handleAction} className="w-full space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm shadow-2xl">
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-white/70 ml-1">
                            Access Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            disabled={isPending}
                            className="w-full rounded-xl border border-white/20 bg-[#041428]/50 px-4 py-3 text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all disabled:opacity-50"
                            placeholder="Enter password..."
                        />
                    </div>

                    {error && (
                        <div className="text-sm font-medium text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#041428] transition-all hover:bg-white/90 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            'Enter Application'
                        )}
                    </button>
                </form>

                {/* Footer faint text */}
                <div className="text-[10px] font-medium tracking-widest text-white/30 uppercase">
                    Confidential & Proprietary
                </div>
            </div>
        </div>
    );
}
