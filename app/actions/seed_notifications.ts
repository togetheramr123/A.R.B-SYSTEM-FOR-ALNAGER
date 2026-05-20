"use server";
import { getSession } from "@/lib/auth";
import { ensureAccess } from '@/lib/access';

import prisma from "@/lib/prisma";
export async function seedNotificationRules() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  const rules = [
  // CRM / Emails
  {
    eventCode: "NEW_TICKET_CREATED",
    title: "تذكرة دعم فني جديدة (New Ticket Created)",
    description: "إرسال إيميل أو إشعار لمدير النظام أو الموظف المعني عند استلام شكوى أو تذكرة جديدة من العميل عبر الإيميل أو البوابة.",
    category: "email",
    isActive: true,
    isCritical: false,
    targetType: "all_admins"
  },
  // Inventory
  {
    eventCode: "LOW_STOCK_ALERT",
    title: "نقص المخزون (Low Stock Alerts)",
    description: "يظهر تنبيه جرس عند وصول صنف لدرجة إعادة الطلب.",
    category: "in_app",
    isActive: true,
    isCritical: false,
    targetType: "all_admins"
  },
  // Purchases
  {
    eventCode: "PURCHASE_APPROVAL_REQUEST",
    title: "موافقات أوامر الشراء (Purchase Order Approvals)",
    description: "التنبيه عندما يتجاوز أمر الشراء الحد المسموح ويحتاج موافقة مدير.",
    category: "in_app",
    isActive: true,
    isCritical: false,
    targetType: "all_admins"
  }, {
    eventCode: "PURCHASE_ORDER_CONFIRMED",
    title: "تأكيد أمر الشراء (Purchase Order Confirmed)",
    description: "عند اعتماد مسودة وعمل أمر شراء رسمي.",
    category: "in_app",
    isActive: false // Default off to avoid noise isCritical: false, targetType: 'all_admins'
  },
  // Sales
  {
    eventCode: "SALE_ORDER_CONFIRMED",
    title: "تأكيد أمر البيع (Sale Order Confirmed)",
    description: "تنبيه عند اعتماد أمر بيع جديد وتسليمه للمخازن للتجهيز.",
    category: "in_app",
    isActive: true,
    isCritical: false,
    targetType: "all_admins"
  }, {
    eventCode: "NEGATIVE_INVENTORY_ISSUE",
    title: "صرف مخزون بالسالب (Negative Inventory Issued)",
    description: "تنبيه أمني يرسل في حال تم صرف بضاعة من المخزن والرصيد بالسالب!",
    category: "critical",
    isActive: true,
    isCritical: false // Made non-critical per user request targetType: 'all_admins'
  },
  // Accounting & Finance
  {
    eventCode: "PAYMENT_REGISTERED",
    title: "تسجيل سند مالي (قبض/صرف) (Payment Voucher Registered)",
    description: "إشعار صامت ومباشر للإدارة عند تسجيل أي سند مالي (قبض أو صرف) لغرض المراقبة والمراجعة.",
    category: "in_app",
    isActive: true,
    isCritical: false,
    targetType: "all_admins"
  }, {
    eventCode: "JOURNAL_ENTRY_CREATED",
    title: "إنشاء قيد يومية مالي (Journal Entry Created)",
    description: "إشعار صامت ومباشر للإدارة عند تسجيل أي قيد محاسبي يدوي لغرض المراقبة والمراجعة.",
    category: "in_app",
    isActive: true,
    isCritical: false,
    targetType: "all_admins"
  }, {
    eventCode: "INVOICE_CONFIRMED",
    title: "اعتماد وتقييد الفاتورة (Invoice Confirmed)",
    description: "عند تأكيد الفاتورة وتقييدها في دفتر اليومية المحاسبي.",
    category: "in_app",
    isActive: false,
    isCritical: false,
    targetType: "all_admins"
  },
  // Security & System
  {
    eventCode: "FAILED_LOGIN_ATTEMPTS",
    title: "محاولات تسجيل دخول فاشلة (Failed Login Attempts)",
    description: "إشعار أمني عند وجود محاولات اختراق أو تسجيل دخول خاطئ للحسابات.",
    category: "critical",
    isActive: true,
    isCritical: true // CANNOT BE TURNED OFF targetType: 'all_admins'
  }, {
    eventCode: "SYNC_ERROR",
    title: "أخطاء المزامنة والنسخ الاحتياطي (Sync & Backup Errors)",
    description: "إبلاغ فوري في حال توقف النسخ الاحتياطي التلقائي أو مزامنة الفروع.",
    category: "critical",
    isActive: true,
    isCritical: true,
    targetType: "all_admins"
  }];
  let createdCount = 0;
  for (const rule of rules) {
    const existing = await prisma.notificationRule.findUnique({
      where: {
        eventCode: rule.eventCode
      }
    });
    if (!existing) {
      await prisma.notificationRule.create({
        data: rule
      });
      createdCount++;
    }
  }
  return {
    success: true,
    message: `Seeded ${createdCount} new notification rules.`
  };
}