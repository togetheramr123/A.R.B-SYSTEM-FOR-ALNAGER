/**
 * ===================================================
 *  سكربت إعداد الصلاحيات للنسخة الأصلية (Live)
 *  ملف: scripts/setup_live_permissions.ts
 * ===================================================
 *
 *  يقوم هذا السكربت بـ:
 *  1. إنشاء المجموعات (Groups) الأساسية مع صلاحياتها
 *  2. إنشاء اليوزرات الأساسيين مع ربطهم بالمجموعات
 *  3. إعداد حقوق الوصول (Access Rights) لكل مجموعة
 *
 *  ملاحظة: هذا السكربت آمن ولن يحذف بيانات موجودة.
 *  إذا كان المستخدم أو المجموعة موجودة، يتم تحديثها فقط.
 *
 *  الاستخدام:
 *    npm run permissions:setup
 * ===================================================
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ===================================================
// 1. تعريف المجموعات والأدوار
// ===================================================
const GROUPS = [
  {
    name: 'مالك النظام',
    category: 'الإدارة',
    permissions: JSON.stringify({
      fullAccess: true,
      canManageUsers: true,
      canManageSettings: true,
      canResetData: true,
      canViewReports: true,
      canExport: true,
    }),
  },
  {
    name: 'مدير عام',
    category: 'الإدارة',
    permissions: JSON.stringify({
      canManageUsers: true,
      canManageSettings: false,
      canViewReports: true,
      canExport: true,
      canApproveOrders: true,
      canApprovePayments: true,
    }),
  },
  {
    name: 'مدير المبيعات',
    category: 'المبيعات',
    permissions: JSON.stringify({
      canViewReports: true,
      canExport: true,
      canApproveOrders: true,
      canManageDiscounts: true,
      canViewCost: true,
    }),
  },
  {
    name: 'بائع',
    category: 'المبيعات',
    permissions: JSON.stringify({
      canCreateOrders: true,
      canViewCost: false,
      canManageDiscounts: false,
      maxDiscountLimit: 5.0,
    }),
  },
  {
    name: 'محاسب',
    category: 'المحاسبة',
    permissions: JSON.stringify({
      canViewReports: true,
      canExport: true,
      canManageAccounts: true,
      canReconcile: true,
      canCreateJournalEntries: true,
    }),
  },
  {
    name: 'مدير المخزون',
    category: 'المخزون',
    permissions: JSON.stringify({
      canManageWarehouse: true,
      canAdjustInventory: true,
      canViewReports: true,
      canManageProducts: true,
    }),
  },
  {
    name: 'أمين مخزن',
    category: 'المخزون',
    permissions: JSON.stringify({
      canReceiveGoods: true,
      canShipGoods: true,
      canViewStock: true,
      canAdjustInventory: false,
    }),
  },
];

// ===================================================
// 2. حقوق الوصول لكل مجموعة
// ===================================================

// تعريف الموديلات الأساسية في النظام
const MODELS = [
  'accounting',    // المحاسبة
  'sales',         // المبيعات
  'purchases',     // المشتريات
  'inventory',     // المخزون
  'products',      // المنتجات
  'partners',      // جهات الاتصال
  'reports',       // التقارير
  'settings',      // الإعدادات
  'users',         // إدارة المستخدمين
  'crm',           // إدارة العلاقات
  'hr',            // الموارد البشرية
];

// خريطة الصلاحيات: المجموعة → الموديل → (read, write, create, unlink)
const ACCESS_RIGHTS: Record<string, Record<string, [boolean, boolean, boolean, boolean]>> = {
  'مالك النظام': {
    // الكل: قراءة، كتابة، إنشاء، حذف
    accounting:  [true, true, true, true],
    sales:       [true, true, true, true],
    purchases:   [true, true, true, true],
    inventory:   [true, true, true, true],
    products:    [true, true, true, true],
    partners:    [true, true, true, true],
    reports:     [true, true, true, true],
    settings:    [true, true, true, true],
    users:       [true, true, true, true],
    crm:         [true, true, true, true],
    hr:          [true, true, true, true],
  },
  'مدير عام': {
    accounting:  [true, true, true, false],
    sales:       [true, true, true, true],
    purchases:   [true, true, true, true],
    inventory:   [true, true, true, true],
    products:    [true, true, true, true],
    partners:    [true, true, true, true],
    reports:     [true, true, true, false],
    settings:    [true, true, false, false],
    users:       [true, true, true, false],
    crm:         [true, true, true, true],
    hr:          [true, true, true, true],
  },
  'مدير المبيعات': {
    accounting:  [true, false, false, false],
    sales:       [true, true, true, true],
    purchases:   [true, false, false, false],
    inventory:   [true, false, false, false],
    products:    [true, true, false, false],
    partners:    [true, true, true, false],
    reports:     [true, false, false, false],
    settings:    [false, false, false, false],
    users:       [false, false, false, false],
    crm:         [true, true, true, true],
    hr:          [false, false, false, false],
  },
  'بائع': {
    accounting:  [false, false, false, false],
    sales:       [true, true, true, false],
    purchases:   [false, false, false, false],
    inventory:   [true, false, false, false],
    products:    [true, false, false, false],
    partners:    [true, true, true, false],
    reports:     [false, false, false, false],
    settings:    [false, false, false, false],
    users:       [false, false, false, false],
    crm:         [true, true, true, false],
    hr:          [false, false, false, false],
  },
  'محاسب': {
    accounting:  [true, true, true, false],
    sales:       [true, false, false, false],
    purchases:   [true, false, false, false],
    inventory:   [true, false, false, false],
    products:    [true, false, false, false],
    partners:    [true, true, false, false],
    reports:     [true, true, true, false],
    settings:    [false, false, false, false],
    users:       [false, false, false, false],
    crm:         [true, false, false, false],
    hr:          [false, false, false, false],
  },
  'مدير المخزون': {
    accounting:  [false, false, false, false],
    sales:       [true, false, false, false],
    purchases:   [true, true, true, false],
    inventory:   [true, true, true, true],
    products:    [true, true, true, true],
    partners:    [true, true, true, false],
    reports:     [true, false, false, false],
    settings:    [false, false, false, false],
    users:       [false, false, false, false],
    crm:         [true, false, false, false],
    hr:          [false, false, false, false],
  },
  'أمين مخزن': {
    accounting:  [false, false, false, false],
    sales:       [true, false, false, false],
    purchases:   [true, false, false, false],
    inventory:   [true, true, true, false],
    products:    [true, false, false, false],
    partners:    [true, false, false, false],
    reports:     [false, false, false, false],
    settings:    [false, false, false, false],
    users:       [false, false, false, false],
    crm:         [false, false, false, false],
    hr:          [false, false, false, false],
  },
};

// ===================================================
// 3. اليوزرات الافتراضيون للنسخة الأصلية
// ===================================================
const DEFAULT_USERS = [
  {
    name: 'Admin Owner',
    email: 'togetheramr123@mail.com',
    password: '3080',
    role: 'OWNER',
    groupName: 'مالك النظام',
    canViewCost: true,
    allowedCustomerType: 'ALL',
    canCreateFreeVouchers: true,
    canAccessTreasury: true,
    cashRegisterEnabled: true,
    canReceive: true,
    canDisburse: true,
  },
];

// ===================================================
// 4. الدالة الرئيسية
// ===================================================
async function main() {
  console.log('==========================================');
  console.log('🔐 بدء إعداد الصلاحيات للنسخة الأصلية');
  console.log('==========================================\n');

  // الحصول على أول شركة موجودة
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('❌ لا توجد شركة في النظام. يرجى تشغيل seed أولاً.');
    process.exit(1);
  }
  console.log(`✅ الشركة: ${company.name} (${company.id})\n`);

  // --- إنشاء/تحديث المجموعات ---
  console.log('--- 1. إعداد المجموعات ---');
  const groupMap: Record<string, string> = {};

  for (const group of GROUPS) {
    const existing = await prisma.resGroup.findUnique({
      where: { name: group.name },
    });

    if (existing) {
      await prisma.resGroup.update({
        where: { id: existing.id },
        data: {
          category: group.category,
          permissions: group.permissions,
        },
      });
      groupMap[group.name] = existing.id;
      console.log(`  ✏️  تحديث مجموعة: ${group.name}`);
    } else {
      const created = await prisma.resGroup.create({
        data: {
          name: group.name,
          category: group.category,
          permissions: group.permissions,
        },
      });
      groupMap[group.name] = created.id;
      console.log(`  ✅ إنشاء مجموعة: ${group.name}`);
    }
  }

  // --- إنشاء حقوق الوصول ---
  console.log('\n--- 2. إعداد حقوق الوصول ---');

  for (const [groupName, models] of Object.entries(ACCESS_RIGHTS)) {
    const groupId = groupMap[groupName];
    if (!groupId) {
      console.warn(`  ⚠️ المجموعة "${groupName}" غير موجودة، تخطي...`);
      continue;
    }

    for (const [model, [read, write, create, unlink]] of Object.entries(models)) {
      const accessName = `${groupName} / ${model}`;

      const existing = await prisma.irModelAccess.findUnique({
        where: { name: accessName },
      });

      const accessData = {
        model,
        groupId,
        permRead: read,
        permWrite: write,
        permCreate: create,
        permUnlink: unlink,
      };

      if (existing) {
        await prisma.irModelAccess.update({
          where: { id: existing.id },
          data: accessData,
        });
      } else {
        await prisma.irModelAccess.create({
          data: {
            name: accessName,
            ...accessData,
          },
        });
      }
    }
    console.log(`  ✅ صلاحيات ${groupName}: ${Object.keys(models).length} موديل`);
  }

  // --- إنشاء/تحديث اليوزرات ---
  console.log('\n--- 3. إعداد المستخدمين ---');

  for (const userData of DEFAULT_USERS) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const groupId = groupMap[userData.groupName];

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: userData.email },
          { name: userData.name },
        ],
      },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          role: userData.role,
          canViewCost: userData.canViewCost,
          allowedCustomerType: userData.allowedCustomerType,
          canCreateFreeVouchers: userData.canCreateFreeVouchers,
          canAccessTreasury: userData.canAccessTreasury,
          cashRegisterEnabled: userData.cashRegisterEnabled,
          canReceive: userData.canReceive,
          canDisburse: userData.canDisburse,
          companyId: company.id,
          groups: groupId ? { connect: [{ id: groupId }] } : undefined,
        },
      });
      console.log(`  ✏️  تحديث مستخدم: ${userData.name} (${userData.role})`);
    } else {
      await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          canViewCost: userData.canViewCost,
          allowedCustomerType: userData.allowedCustomerType,
          canCreateFreeVouchers: userData.canCreateFreeVouchers,
          canAccessTreasury: userData.canAccessTreasury,
          cashRegisterEnabled: userData.cashRegisterEnabled,
          canReceive: userData.canReceive,
          canDisburse: userData.canDisburse,
          companyId: company.id,
          groups: groupId ? { connect: [{ id: groupId }] } : undefined,
        },
      });
      console.log(`  ✅ إنشاء مستخدم: ${userData.name} (${userData.role})`);
    }
  }

  // --- ملخص ---
  console.log('\n==========================================');
  console.log('✅ تم إعداد الصلاحيات بنجاح!');
  console.log('==========================================');
  console.log(`  📁 المجموعات: ${GROUPS.length}`);
  console.log(`  🔑 حقوق الوصول: ${Object.values(ACCESS_RIGHTS).reduce((sum, m) => sum + Object.keys(m).length, 0)}`);
  console.log(`  👤 المستخدمين: ${DEFAULT_USERS.length}`);
  console.log('\n📋 الأدوار المتاحة في النظام:');
  console.log('  OWNER           → مالك النظام (صلاحيات كاملة)');
  console.log('  ADMIN           → مدير النظام (صلاحيات كاملة)');
  console.log('  MANAGER         → مدير عام');
  console.log('  WAREHOUSE_MANAGER → مدير مخزون');
  console.log('  ACCOUNTANT      → محاسب');
  console.log('  SALESMAN        → بائع');
  console.log('  USER            → مستخدم عادي');
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('❌ خطأ:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
