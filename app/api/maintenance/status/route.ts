import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/**
 * GET /api/maintenance/status
 * يتحقق من حالة وضع الصيانة - يستدعيه المتصفح كل 30 ثانية
 */
export async function GET() {
  try {
    const company = await prisma.company.findFirst({
      select: {
        maintenanceMode: true,
        maintenanceMessage: true,
        maintenanceAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ maintenance: false });
    }

    return NextResponse.json({
      maintenance: company.maintenanceMode,
      message: company.maintenanceMessage,
      scheduledAt: company.maintenanceAt,
    });
  } catch {
    return NextResponse.json({ maintenance: false });
  }
}

/**
 * POST /api/maintenance/status
 * تفعيل/إلغاء وضع الصيانة (OWNER/ADMIN فقط)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await req.json();
    const { enabled, message, minutesFromNow } = body;

    const company = await prisma.company.findFirst();
    if (!company) {
      return NextResponse.json({ error: 'لا توجد شركة' }, { status: 404 });
    }

    const maintenanceAt = minutesFromNow
      ? new Date(Date.now() + minutesFromNow * 60 * 1000)
      : null;

    await prisma.company.update({
      where: { id: company.id },
      data: {
        maintenanceMode: enabled,
        maintenanceMessage: message || (enabled ? 'جاري تحديث النظام — يرجى حفظ عملك الآن' : null),
        maintenanceAt: maintenanceAt,
      },
    });

    return NextResponse.json({
      success: true,
      maintenance: enabled,
      scheduledAt: maintenanceAt,
    });
  } catch (error) {
    console.error('Maintenance toggle error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
