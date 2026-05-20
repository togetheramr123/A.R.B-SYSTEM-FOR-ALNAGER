'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const SHIFT_DURATION_MS = 9 * 60 * 60 * 1000; // 9 hours
const WARNING_BEFORE_MS = 5 * 60 * 1000; // 5 minutes warning

/**
 * useShiftTimer — Enforces 9-hour shift expiration.
 * Reads `shift_login_at` cookie (set on login) and calculates remaining time.
 * Shows a warning toast 5 minutes before expiration.
 * Force-logouts the user when the shift ends.
 */
export function useShiftTimer(disable: boolean = false) {
    const router = useRouter();
    const [remainingMs, setRemainingMs] = useState<number | null>(null);
    const [warningShown, setWarningShown] = useState(false);

    const getLoginAt = useCallback(() => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(/(?:^|;\s*)shift_login_at=(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }, []);

    useEffect(() => {
        if (disable) return; // Skip shift timer for managers/admins
        const loginAt = getLoginAt();
        if (!loginAt) return; // No session cookie — skip (dev mode or not logged in)

        const tick = () => {
            const elapsed = Date.now() - loginAt;
            const remaining = SHIFT_DURATION_MS - elapsed;
            setRemainingMs(remaining);

            if (remaining <= 0) {
                // Force logout
                toast.error('انتهى الشيفت الخاص بك. سيتم تسجيل خروجك الآن.', {
                    duration: 5000,
                });
                // Clear cookies client-side
                document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                document.cookie = 'shift_login_at=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
                return;
            }

            // Show warning 5 minutes before
            if (remaining <= WARNING_BEFORE_MS && !warningShown) {
                setWarningShown(true);
                const minutesLeft = Math.ceil(remaining / 60000);
                
                toast.custom((t) => (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-md shadow-lg flex flex-col gap-3 w-full" dir="rtl">
                        <div className="flex items-center gap-2 text-orange-800 font-bold">
                            <span className="text-xl">⚠️</span>
                            تنبيه: سينتهي الشيفت الخاص بك بعد {minutesLeft} دقائق.
                        </div>
                        <p className="text-sm text-orange-700">يرجى حفظ عملك أو تمديد الشيفت إذا أردت مواصلة العمل:</p>
                        <div className="flex gap-2 justify-start mt-1 flex-wrap">
                            {[1, 2, 3, 4, 9].map(hours => (
                                <button
                                    key={hours}
                                    onClick={async () => {
                                        toast.dismiss(t);
                                        const { extendShiftAction } = await import('@/app/actions/session');
                                        await extendShiftAction(hours);
                                        setWarningShown(false);
                                        toast.success(`تم تمديد الشيفت لمدة ${hours} ${hours === 1 ? 'ساعة' : 'ساعات'}`);
                                    }}
                                    className="bg-white border border-orange-300 text-orange-700 hover:bg-orange-100 px-3 py-1.5 rounded-sm text-xs font-bold transition-colors"
                                >
                                    {hours} {hours === 1 ? 'ساعة' : 'ساعات'}
                                </button>
                            ))}
                        </div>
                    </div>
                ), { duration: 60000, id: 'shift-warning' });
            }
        };

        // Initial check
        tick();

        // Check every 30 seconds
        const interval = setInterval(tick, 30000);
        return () => clearInterval(interval);
    }, [getLoginAt, router, warningShown]);

    return { remainingMs };
}
