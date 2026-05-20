"use server";
import { ensureAccess } from '@/lib/access';

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
export async function getUserNotifications() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return await prisma.notification.findMany({
    where: {
      userId: session.userId,
      OR: [
        { isRead: false },
        { type: 'approval_request', isAcknowledged: false }
      ]
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });
}
export async function getBlockingNotifications() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  const user = await prisma.user.findUnique({
    where: {
      id: session.userId
    }
  });
  if (session.role === "ADMIN") return [];
  if (!user?.enforceNotificationBlock) return [];
  const company = await prisma.company.findUnique({
    where: {
      id: session.companyId
    }
  });
  const blockHours = company?.notificationBlockHours || 24;
  const blockThreshold = new Date(Date.now() - blockHours * 60 * 60 * 1000);
  return await prisma.notification.findMany({
    where: {
      userId: session.userId,
      isAcknowledged: false,
      createdAt: {
        lt: blockThreshold
      },
      OR: [{
        snoozedUntil: null
      }, {
        snoozedUntil: {
          lt: new Date()
        }
      }]
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}
export async function markNotificationRead(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await prisma.notification.update({
    where: {
      id
    },
    data: {
      isRead: true
    }
  });
  revalidatePath("/");
}
export async function acknowledgeNotification(id: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await prisma.notification.update({
    where: {
      id,
      userId: session.userId
    },
    data: {
      isAcknowledged: true,
      isRead: true
    }
  });
  revalidatePath("/");
}
export async function snoozeBlockingNotifications() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const snoozedUntil = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours
  await prisma.notification.updateMany({
    where: {
      userId: session.userId,
      isAcknowledged: false
    },
    data: {
      snoozedUntil
    }
  });
  revalidatePath("/");
  return {
    success: true
  };
}
export async function getSystemUsers() {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return [];
  return await prisma.user.findMany({
    where: {
      companyId: session.companyId
    },
    select: {
      id: true,
      name: true,
      role: true
    }
  });
}
export async function sendManualNotification(params: {
  targetType: "MANAGER" | "GENERAL_MANAGER" | "ALL" | "SPECIFIC";
  targetUserId?: string;
  resourceModel: string;
  resourceId: string;
  resourceName: string;
  message: string;
  grantViewOnly: boolean;
}) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  const {
    targetType,
    targetUserId,
    resourceModel,
    resourceId,
    resourceName,
    message,
    grantViewOnly
  } = params;
  let targetUsers: {
    id: string;
  }[] = [];
  if (targetType === "SPECIFIC" && targetUserId) {
    targetUsers = [{
      id: targetUserId
    }];
  } else if (targetType === "MANAGER" || targetType === "GENERAL_MANAGER") {
    targetUsers = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        companyId: session.companyId
      },
      select: {
        id: true
      }
    });
  } else if (targetType === "ALL") {
    targetUsers = await prisma.user.findMany({
      where: {
        companyId: session.companyId,
        id: {
          not: session.userId
        }
      },
      select: {
        id: true
      }
    });
  }
  if (targetUsers.length === 0) return {
    success: false,
    error: "لم يتم العثور على مستخدمين"
  };
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days valid
  let returnedLinkUrl = "";
  for (const user of targetUsers) {
    let linkUrl = "";
    if (params.grantViewOnly) {
      const shareLink = await prisma.recordShareLink.create({
        data: {
          resourceModel: params.resourceModel,
          resourceId: params.resourceId,
          targetUserId: user.id,
          grantedById: session.userId,
          companyId: session.companyId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });
      linkUrl = `/shared/${shareLink.token}`;
      returnedLinkUrl = linkUrl;
    } else {
      // Determine standard link
      switch (resourceModel) {
        case "SaleOrder":
          linkUrl = `/sales/${resourceId}`;
          break;
        case "PurchaseOrder":
          linkUrl = `/purchases/${resourceId}`;
          break;
        case "Product":
          linkUrl = `/inventory/products/${resourceId}`;
          break;
        default:
          linkUrl = `/`;
      }
      returnedLinkUrl = linkUrl;
    }
    await prisma.notification.create({
      data: {
        title: `إشعار بخصوص ${resourceName}`,
        message: message || "يرجى مراجعة هذا المستند.",
        type: "info",
        userId: user.id,
        senderId: session.userId,
        linkUrl,
        resourceId,
        resourceModel,
        companyId: session.companyId
      }
    });
  }
  revalidatePath("/");
  return {
    success: true,
    linkUrl: returnedLinkUrl
  };
}
export async function resolveShareLink(token: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) return {
    error: "غير مصرح"
  };
  const link = await prisma.recordShareLink.findUnique({
    where: {
      token
    }
  });
  if (!link) return {
    error: "الرابط غير صالح أو محذوف"
  };
  if (link.expiresAt < new Date()) return {
    error: "الرابط منتهي الصلاحية"
  };
  if (link.targetUserId !== session.userId && session.role !== "ADMIN") return {
    error: "غير مصرح لك بعرض هذا الرابط"
  };
  return {
    success: true,
    link
  };
}
export async function fetchSharedResource(resourceModel: string, resourceId: string) {
  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  await ensureAccess("base", "read");

  var session = await getSession();
  if (!session) throw new Error("غير مصرح");
  switch (resourceModel) {
    case "SaleOrder":
      return await prisma.saleOrder.findUnique({
        where: {
          id: resourceId
        },
        include: {
          lines: {
            include: {
              product: true
            }
          },
          partner: true
        }
      });
    case "PurchaseOrder":
      return await prisma.purchaseOrder.findUnique({
        where: {
          id: resourceId
        },
        include: {
          lines: {
            include: {
              product: true
            }
          },
          partner: true
        }
      });
    case "Product":
      return await prisma.product.findUnique({
        where: {
          id: resourceId
        },
        include: {
          category: true
        }
      });
    default:
      return null;
  }
}