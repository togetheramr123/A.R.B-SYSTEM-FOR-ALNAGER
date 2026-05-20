"use server";

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
const loginAttempts = new Map<string, {
  count: number;
  lastAttempt: number;
}>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;
const ATTEMPT_WINDOW = 5 * 60 * 1000;
function checkRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (!entry) return {
    allowed: true
  };
  if (now - entry.lastAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(identifier);
    return {
      allowed: true
    };
  }
  if (entry.count >= MAX_ATTEMPTS) {
    const timeSinceLast = now - entry.lastAttempt;
    if (timeSinceLast < LOCKOUT_DURATION) {
      return {
        allowed: false,
        retryAfterMs: LOCKOUT_DURATION - timeSinceLast
      };
    }
    return {
      allowed: true
    };
  }
  return {
    allowed: true
  };
}
function recordFailedAttempt(identifier: string) {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);
  if (entry) {
    entry.count++;
    entry.lastAttempt = now;
  } else {
    loginAttempts.set(identifier, {
      count: 1,
      lastAttempt: now
    });
  }
}
function clearAttempts(identifier: string) {
  loginAttempts.delete(identifier);
}
export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const locale = formData.get('locale') as string || 'ar';
  if (!username || !password) {
    return {
      error: 'يرجى إدخال اسم المستخدم وكلمة المرور'
    };
  }
  const rateLimitKey = `login:${username.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    const minutesLeft = Math.ceil((rateCheck.retryAfterMs || 0) / 60000);
    return {
      error: `تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد ${minutesLeft} دقيقة.`
    };
  }
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { name: username },
          { email: username },
          { phone: username }
        ]
      }
    });
    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return {
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      };
    }
    if (!user.password || user.password === "") {
      return {
        error: 'فشل المصادقة. يرجى التواصل مع المسؤول'
      };
    }
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      recordFailedAttempt(rateLimitKey);
      return {
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      };
    }
    await createSession(user.id, user.companyId || '', user.role, {
      canViewCost: user.canViewCost,
      allowedCustomerType: user.allowedCustomerType,
      canCreateFreeVouchers: user.canCreateFreeVouchers,
      canAccessTreasury: user.canAccessTreasury
    });
  } catch (error) {
    console.error('Login error:', error);
    return {
      error: 'حدث خطأ غير متوقع'
    };
  }
  redirect(`/${locale}/dashboard`);
}

export async function verifyDemoPin(pin: string) {
  try {
    const company = await prisma.company.findFirst({
      select: { demoPin: true }
    });
    
    if (company && company.demoPin === pin) {
      return { 
        success: true, 
        url: process.env.NEXT_PUBLIC_DEMO_URL || 'https://erp-demo.onrender.com' 
      };
    }
    
    return { success: false, error: 'الرقم السري غير صحيح' };
  } catch (error) {
    console.error('Verify PIN error:', error);
    return { success: false, error: 'حدث خطأ غير متوقع' };
  }
}