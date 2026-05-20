"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ensureAccess } from "@/lib/access";
import bcrypt from "bcryptjs"; // --- Company Settings Actions ---
export async function getCompanySettings() {
  var session = await getSession();
  if (!session) return null;

  try {
    const company = await prisma.company.findFirst({
      select: {
        id: true,
        allowHalfQuantities: true,
        demoPin: true
      }
    });
    return company || {
      allowHalfQuantities: false,
      demoPin: "3000"
    };
  } catch (error) {
    console.error("Failed to fetch company settings:", error);
    return {
      allowHalfQuantities: false,
      demoPin: "3000"
    };
  }
} // --- User Management Actions ---
export async function getUsers() {
  var session = await getSession();
  if (!session) return [];

  try {
    const users = await prisma.user.findMany({
      include: {
        groups: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
    return users.map(user => ({
      id: user.id,
      name: user.name || "Unknown",
      email: user.email,
      phone: user.phone,
      image: user.image,
        role: user.role, // Base role (ADMIN/USER)
        canViewCost: user.canViewCost,
        allowedCustomerType: user.allowedCustomerType,
        canCreateFreeVouchers: user.canCreateFreeVouchers,
        canAccessTreasury: user.canAccessTreasury,
        // Flatten groups for UI
      groups: user.groups.map(g => g.name).join(', '),
      lastLogin: user.updatedAt.toISOString().split('T')[0] // Approximation
    }));
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}
export async function getUser(id: string) {
  var session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: {
        id
      },
      include: {
        groups: true
      }
    });
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}
export async function saveUser(data: any) {
  var session = await getSession();
  if (!session) return { success: false, error: "غير مصرح - يرجى تسجيل الدخول مرة أخرى" };
  if (session.role !== "ADMIN") {
    return { success: false, error: "فقط مدير النظام يمكنه تعديل المستخدمين" };
  }
  try {
    let user;
    const groupConnections = data.groupIds ? data.groupIds.map((id: string) => ({
      id
    })) : [];
    if (data.id && data.id !== "new") {
      const updateData: any = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        image: data.image || null,
        managerId: data.managerId || null,
        role: data.role,
        enforceNotificationBlock: data.enforceNotificationBlock,
        canSellFractions: data.canSellFractions ?? false,
        canViewCost: data.canViewCost ?? true,
        allowedCustomerType: data.allowedCustomerType || "ALL",
        canCreateFreeVouchers: data.canCreateFreeVouchers ?? true,
        canAccessTreasury: data.canAccessTreasury ?? true,
        groups: {
          set: groupConnections
        }
      };

      if (data.password && data.password.trim() !== "") {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      user = await prisma.user.update({
        where: {
          id: data.id
        },
        data: updateData
      }); // If user updates their own profile, notify their manager (or an Admin)
      if (session.userId === data.id) {
        let targetManagerId = user.managerId;
        if (!targetManagerId) {
          const admin = await prisma.user.findFirst({
            where: {
              role: "ADMIN",
              id: {
                not: user.id
              }
            }
          });
          if (admin) targetManagerId = admin.id;
        }
        if (targetManagerId) {
          await prisma.notification.create({
            data: {
              title: "تحديث بيانات موظف",
              message: `الموظف ${user.name} قام بتحديث بياناته الشخصية (الصورة أو الهاتف). يرجى المراجعة.`,
              type: "info",
              userId: targetManagerId,
              senderId: user.id
            }
          });
        }
      }
    } else {
      const hashedPassword = await bcrypt.hash(data.password || "changeme123", 10);
      user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          image: data.image || null,
          managerId: data.managerId || null,
          password: hashedPassword,
          role: data.role,
          enforceNotificationBlock: data.enforceNotificationBlock,
          canSellFractions: data.canSellFractions ?? false,
          canViewCost: data.canViewCost ?? true,
          allowedCustomerType: data.allowedCustomerType || "ALL",
          canCreateFreeVouchers: data.canCreateFreeVouchers ?? true,
          canAccessTreasury: data.canAccessTreasury ?? true,
          groups: {
            connect: groupConnections
          }
        }
      });
    }
    revalidatePath("/[locale]/settings/users");
    return {
      success: true,
      user
    };
  } catch (error) {
    console.error("Failed to save user:", error);
    return {
      success: false,
      error: "Failed to save user"
    };
  }
} // --- Role & Permissions (ResGroup) Management Actions ---
export async function getGroups() {
  var session = await getSession();
  if (!session) return [];

  try {
    const groups = await prisma.resGroup.findMany({
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        category: "asc"
      }
    });
    return groups.map(group => ({
      id: group.id,
      name: group.name,
      category: group.category || "General",
      userCount: group._count.users
    }));
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return [];
  }
}
export async function getGroupWithAccessRights(id: string) {
  var session = await getSession();
  if (!session) return null;

  try {
    if (id === "new") return null;
    const group = await prisma.resGroup.findUnique({
      where: { id },
      include: { accessRights: true }
    });
    if (!group) return null;
    // Parse permissions JSON back to object
    let parsedPermissions: Record<string, boolean> = {};
    if (group.permissions) {
      try {
        parsedPermissions = JSON.parse(group.permissions);
      } catch { }
    }
    return { ...group, parsedPermissions };
  } catch (error) {
    console.error("Failed to fetch group:", error);
    return null;
  }
}
export async function saveGroup(data: {
  id: string;
  name: string;
  category: string;
  permissions?: Record<string, boolean>;
  canPrintInvoices?: boolean;
  canChangePrices?: boolean;
  canAllowNegativeInventory?: boolean;
  canAccessBeta?: boolean;
  accessRights: any[];
}) {
  var session = await getSession();
  if (!session) return { success: false, error: "غير مصرح" };
  if (session.role !== "ADMIN") return { success: false, error: "فقط مدير النظام" };
  try {
    let savedGroup: any;

    // Serialize permissions to JSON string
    const permissionsJson = data.permissions ? JSON.stringify(data.permissions) : null;

    // Ensure ID is a valid UUID string (not "new" or empty)
    const isUpdate = data.id && typeof data.id === "string" && data.id !== "new" && data.id.length > 10;

    if (isUpdate) {
      // Update Group Info
      savedGroup = await prisma.resGroup.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category,
          permissions: permissionsJson
        }
      });

      // Handle Access Rights (IrModelAccess)
      // 1. Delete all existing rules for this group
      await prisma.irModelAccess.deleteMany({
        where: { groupId: data.id }
      });

      // 2. Insert new rules (only if provided)
      if (data.accessRights && data.accessRights.length > 0) {
        for (const ar of data.accessRights) {
          await prisma.irModelAccess.create({
            data: {
              name: `${data.name}_${ar.model}_access_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              model: ar.model,
              groupId: data.id,
              permRead: ar.permRead ?? false,
              permWrite: ar.permWrite ?? false,
              permCreate: ar.permCreate ?? false,
              permUnlink: ar.permUnlink ?? false,
              canPrintInvoices: data.canPrintInvoices || false,
              canChangePrices: data.canChangePrices || false,
              canAllowNegativeInventory: data.canAllowNegativeInventory || false,
              canAccessBeta: data.canAccessBeta || false
            }
          });
        }
      }
    } else {
      // Create New Group
      savedGroup = await prisma.resGroup.create({
        data: {
          name: data.name,
          category: data.category,
          permissions: permissionsJson,
          accessRights: {
            create: data.accessRights?.map((ar: any) => ({
              name: `${data.name}_${ar.model}_access_${Date.now()}_${Math.random().toString(36).substring(7)}`,
              model: ar.model,
              permRead: ar.permRead ?? false,
              permWrite: ar.permWrite ?? false,
              permCreate: ar.permCreate ?? false,
              permUnlink: ar.permUnlink ?? false,
              canPrintInvoices: data.canPrintInvoices || false,
              canChangePrices: data.canChangePrices || false,
              canAllowNegativeInventory: data.canAllowNegativeInventory || false,
              canAccessBeta: data.canAccessBeta || false
            })) || []
          }
        }
      });
    }

    revalidatePath("/[locale]/settings/groups");
    revalidatePath(`/[locale]/settings/groups/${data.id}`);
    return {
      success: true,
      group: {
        id: savedGroup.id
      }
    };
  } catch (error) {
    console.error("Failed to save group:", error);
    return {
      success: false,
      error: "فشل في حفظ الدور والصلاحيات: " + (error as any)?.message
    };
  }
}

export async function deleteGroup(id: string) {
  var session = await getSession();
  if (!session) return { success: false, error: "غير مصرح" };
  if (session.role !== "ADMIN") return { success: false, error: "فقط مدير النظام" };
  try {
    // Check if group has users assigned
    const group = await prisma.resGroup.findUnique({
      where: { id },
      include: { users: true }
    });
    if (!group) {
      return { success: false, error: "الدور غير موجود" };
    }
    if (group.users.length > 0) {
      return { success: false, error: `لا يمكن حذف هذا الدور لأنه مرتبط بـ ${group.users.length} مستخدم. قم بإزالة المستخدمين أولاً.` };
    }
    // Delete access rights first (cascade should handle this but just in case)
    await prisma.irModelAccess.deleteMany({ where: { groupId: id } });
    // Delete the group
    await prisma.resGroup.delete({ where: { id } });
    revalidatePath("/[locale]/settings/groups");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete group:", error);
    return { success: false, error: "فشل في حذف الدور: " + (error as any)?.message };
  }
}

export async function deleteUser(id: string) {
  var session = await getSession();
  if (!session) return { success: false, error: "غير مصرح" };
  if (session.role !== "ADMIN") return { success: false, error: "فقط مدير النظام" };
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return { success: false, error: "المستخدم غير موجود" };
    if (user.role === "ADMIN") return { success: false, error: "لا يمكن حذف مدير النظام" };
    await prisma.user.delete({ where: { id } });
    revalidatePath("/[locale]/settings/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "فشل في حذف المستخدم: " + (error as any)?.message };
  }
}