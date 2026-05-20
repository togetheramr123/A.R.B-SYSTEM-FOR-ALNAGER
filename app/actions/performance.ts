"use server";
import { ensureAccess } from '@/lib/access';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendWhatsAppNotification, buildManagerMistakeReport } from '@/lib/whatsapp';
export async function logUserMistake(errorType: string, severity: number, context: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session || !session.userId) return {
    success: false,
    error: 'Unauthorized'
  };
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId
      }
    });
    if (!user) return {
      success: false,
      error: 'User not found'
    };
    prisma.userPerformanceLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        errorType,
        severity,
        context
      }
    });
    const deductionMap: Record<number, number> = {
      1: 0.5,
      2: 1,
      3: 2,
      4: 5,
      5: 10
    };
    const deduction = deductionMap[severity] || 1;
    let newScore = Math.max(0, user.efficiencyScore - deduction);
    let lockedUntil = user.lockedUntil;
    let isNewlyLocked = false;
    if (severity >= 4) {
      lockedUntil = new Date(Date.now() + 3 * 60 * 1000);
    }
    prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        efficiencyScore: newScore,
        lockedUntil
      }
    });
    const managerPhone = '+1234567890';
    const report = buildManagerMistakeReport(user.name || user.email || "Unknown User", errorType, severity, context, newScore);
    return {
      success: true,
      isLocked: isNewlyLocked,
      lockedUntil,
      newScore,
      managerNotified: true
    };
  } catch (error) {
    console.error("Error logging user mistake:", error);
    return {
      success: false,
      error: 'Failed to log mistake'
    };
  }
}