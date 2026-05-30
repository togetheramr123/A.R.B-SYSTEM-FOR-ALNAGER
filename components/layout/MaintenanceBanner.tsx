'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Save, Clock } from 'lucide-react';

/**
 * بانر الصيانة العالمي
 * ──────────────────────
 * يتحقق من حالة الصيانة كل 30 ثانية عبر API
 * عند تفعيل وضع الصيانة:
 *   - يظهر شريط تحذيري في أعلى الشاشة
 *   - عد تنازلي حتى وقت الصيانة
 *   - يحث المستخدم على حفظ عمله
 *   - بعد انتهاء العد التنازلي يتحول لشاشة كاملة "جاري التحديث"
 */
export function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState(false);
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Poll maintenance status every 30 seconds
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/maintenance/status', { cache: 'no-store' });
      const data = await res.json();
      
      if (data.maintenance) {
        setMaintenance(true);
        setMessage(data.message || 'جاري تحديث النظام');
        setScheduledAt(data.scheduledAt ? new Date(data.scheduledAt) : null);
        setDismissed(false); // Re-show if maintenance was re-enabled
      } else {
        setMaintenance(false);
        setIsExpired(false);
        setDismissed(false);
      }
    } catch {
      // Silent fail — don't bother user if API is down
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [checkStatus]);

  // Countdown timer
  useEffect(() => {
    if (!scheduledAt || !maintenance) return;

    const tick = () => {
      const now = new Date();
      const diff = scheduledAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setIsExpired(true);
        setCountdown('الآن');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      
      if (minutes > 0) {
        setCountdown(`${minutes} دقيقة و ${seconds} ثانية`);
      } else {
        setCountdown(`${seconds} ثانية`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt, maintenance]);

  if (!maintenance || dismissed) return null;

  // ═══════════════════════════════════════════
  // حالة ما بعد العد التنازلي — شاشة كاملة
  // ═══════════════════════════════════════════
  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
        <div className="text-center max-w-lg">
          {/* Animated refresh icon */}
          <div className="mx-auto w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center mb-8 animate-pulse">
            <RefreshCw className="w-12 h-12 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
          </div>

          <h1 className="text-3xl font-bold text-white mb-4 font-arabic">
            جاري تحديث النظام
          </h1>
          <p className="text-lg text-slate-300 mb-6 leading-relaxed font-arabic">
            {message}
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-8 border border-white/10">
            <p className="text-amber-300 text-sm font-arabic">
              ⏳ سيعود النظام للعمل تلقائياً خلال دقائق قليلة
            </p>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300 flex items-center gap-3 mx-auto text-lg group"
          >
            <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
            <span>إعادة تحميل للتحديث</span>
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // بانر التحذير — شريط علوي مع عد تنازلي
  // ═══════════════════════════════════════════
  return (
    <div className="fixed top-0 left-0 right-0 z-[99998] animate-in slide-in-from-top duration-500" dir="rtl">
      <div className="bg-gradient-to-l from-amber-600 via-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* Right: Warning icon + message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="shrink-0 p-1.5 bg-white/20 rounded-lg animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate font-arabic">
                ⚠️ تنبيه: تحديث النظام قادم!
              </p>
              <p className="text-amber-100 text-xs truncate font-arabic">
                {message} — يرجى حفظ عملك الحالي قبل التحديث
              </p>
            </div>
          </div>

          {/* Center: Countdown */}
          {countdown && (
            <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-lg border border-white/20">
              <Clock className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold font-mono whitespace-nowrap">
                {countdown}
              </span>
            </div>
          )}

          {/* Left: Save + Dismiss buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors font-arabic"
            >
              فهمت
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
