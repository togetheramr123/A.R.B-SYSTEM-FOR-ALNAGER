/**
 * ===================================================
 *  سكربت إنشاء يوزرات الديمو للتدريب
 *  ملف: scripts/setup_demo_users.ts
 * ===================================================
 *
 *  يقوم هذا السكربت بـ:
 *  1. إنشاء المجموعات (Groups) الأساسية بصلاحياتها
 *  2. إنشاء 5 يوزرات ديمو (مبيعات، مشتريات، مخازن، مالية، مدير عام)
 *  3. ربط كل يوزر بالمجموعة المناسبة وبحقوق الوصول الصحيحة
 *
 *  الاستخدام:
 *    npx ts-node scripts/setup_demo_users.ts
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
    name: 'مدير المشتريات',
    category: 'المشتريات',
    permissions: JSON.stringify({
      canCreatePurchaseOrders: true,
      canApprovePurchases: true,
      canViewReports: true,
      canManageVendors: true,
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
const MODELS = [
  'accounting', 'sales', 'purchases', 'inventory',
  'products', 'partners', 'reports', 'settings',
  'users', 'crm', 'hr',
];

// [read, write, create, unlink]
const ACCESS_RIGHTS: Record<string, Record<string, [boolean, boolean, boolean, boolean]>> = {
  'مالك النظام': {
    accounting: [true, true, true, true],
    sales:      [true, true, true, true],
    purchases:  [true, true, true, true],
    inventory:  [true, true, true, true],
    products:   [true, true, true, true],
    partners:   [true, true, true, true],
    reports:    [true, true, true, true],
    settings:   [true, true, true, true],
    users:      [true, true, true, true],
    crm:        [true, true, true, true],
    hr:         [true, true, true, true],
  },
  'مدير عام': {
    accounting: [true, true, true, false],
    sales:      [true, true, true, true],
    purchases:  [true, true, true, true],
    inventory:  [true, true, true, true],
    products:   [true, true, true, true],
    partners:   [true, true, true, true],
    reports:    [true, true, true, false],
    settings:   [true, true, false, false],
    users:      [true, true, true, false],
    crm:        [true, true, true, true],
    hr:         [true, true, true, true],
  },
  'مدير المبيعات': {
    accounting: [true, false, false, false],
    sales:      [true, true, true, true],
    purchases:  [true, false, false, false],
    inventory:  [true, false, false, false],
    products:   [true, true, false, false],
    partners:   [true, true, true, false],
    reports:    [true, false, false, false],
    settings:   [false, false, false, false],
    users:      [false, false, false, false],
    crm:        [true, true, true, true],
    hr:         [false, false, false, false],
  },
  'بائع': {
    accounting: [false, false, false, false],
    sales:      [true, true, true, false],
    purchases:  [false, false, false, false],
    inventory:  [true, false, false, false],
    products:   [true, false, false, false],
    partners:   [true, true, true, false],
    reports:    [false, false, false, false],
    settings:   [false, false, false, false],
    users:      [false, false, false, false],
    crm:        [true, true, true, false],
    hr:         [false, false, false, false],
  },
  'مدير المشتريات': {
    accounting: [true, false, false, false],
    sales:      [true, false, false, false],
    purchases:  [true, true, true, true],
    inventory:  [true, true, true, false],
    products:   [true, true, true, false],
    partners:   [true, true, true, false],
    reports:    [true, false, false, false],
    settings:   [false, false, false, false],
    users:      [false, false, false, false],
    crm:        [true, false, false, false],
    hr:         [false, false, false, false],
  },
  'محاسب': {
    accounting: [true, true, true, false],
    sales:      [true, false, false, false],
    purchases:  [true, false, false, false],
    inventory:  [true, false, false, false],
    products:   [true, false, false, false],
    partners:   [true, true, false, false],
    reports:    [true, true, true, false],
    settings:   [false, false, false, false],
    users:      [false, false, false, false],
    crm:        [true, false, false, false],
    hr:         [false, false, false, false],
  },
  'مدير المخزون': {
    accounting: [false, false, false, false],
    sales:      [true, false, false, false],
    purchases:  [true, true, true, false],
    inventory:  [true, true, true, true],
    products:   [true, true, true, true],
    partners:   [true, true, true, false],
    reports:    [true, false, false, false],
    settings:   [false, false, false, false],
    users:      [false, false, false, false],
    crm:        [true, false, false, false],
    hr:         [false, false, false, false],
  },
  'أمين مخزن': {
    accounting: [false, false, false, false],
    sales:      [true, false, false, false],
    purchases:  [true, false, false, false],
    inventory:  [true, true, true, false],
    products:   [true, false, false, false],
    partners:   [true, false, false, false],
    reports:    [false, false, false, false],
    settings:   [false, false, false, false],
    users:      [false, false, false, false],
    crm:        [false, false, false, false],
    hr:         [false, false, false, false],
  },
};

// ===================================================
// 3. يوزرات الديمو
// ===================================================
const DEMO_USERS = [
  // --- المالك (موجود بالفعل) ---
  {
    name: 'Admin Owner',
    email: 'togetheramr123@mail.com',
    phone: null,
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
  // --- يوزر المبيعات ---
  {
    name: 'مبيعات',
    email: 'sales@demo.arb',
    phone: '01000000001',
    password: 'sales123',
    role: 'USER',
    groupName: 'مدير المبيعات',
    canViewCost: false,
    allowedCustomerType: 'ALL',
    canCreateFreeVouchers: false,
    canAccessTreasury: false,
    cashRegisterEnabled: false,
    canReceive: false,
    canDisburse: false,
  },
  // --- يوزر المشتريات ---
  {
    name: 'مشتريات',
    email: 'purchases@demo.arb',
    phone: '01000000002',
    password: 'purchases123',
    role: 'USER',
    groupName: 'مدير المشتريات',
    canViewCost: true,
    allowedCustomerType: 'ALL',
    canCreateFreeVouchers: false,
    canAccessTreasury: false,
    cashRegisterEnabled: false,
    canReceive: false,
    canDisburse: false,
  },
  // --- يوزر المخازن ---
  {
    name: 'مخازن',
    email: 'inventory@demo.arb',
    phone: '01000000003',
    password: 'inventory123',
    role: 'USER',
    groupName: 'مدير المخزون',
    canViewCost: true,
    allowedCustomerType: 'ALL',
    canCreateFreeVouchers: false,
    canAccessTreasury: false,
    cashRegisterEnabled: false,
    canReceive: false,
    canDisburse: false,
  },
  // --- يوزر المحاسبة ---
  {
    name: 'محاسبه',
    email: 'accounting@demo.arb',
    phone: '01000000004',
    password: 'accounting123',
    role: 'USER',
    groupName: 'محاسب',
    canViewCost: true,
    allowedCustomerType: 'ALL',
    canCreateFreeVouchers: false,
    canAccessTreasury: true,
    cashRegisterEnabled: true,
    canReceive: true,
    canDisburse: true,
  },
  // --- يوزر المدير العام ---
  {
    name: 'مدير',
    email: 'manager@demo.arb',
    phone: '01000000005',
    password: 'manager123',
    role: 'MANAGER',
    groupName: 'مدير عام',
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
  console.log('🎓 بدء إعداد يوزرات الديمو للتدريب');
  console.log('==========================================\n');

  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('❌ لا توجد شركة في النظام. يرجى تشغيل seed أولاً.');
    process.exit(1);
  }
  console.log(`✅ الشركة: ${company.name}\n`);

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
        data: { category: group.category, permissions: group.permissions },
      });
      groupMap[group.name] = existing.id;
      console.log(`  ✏️  تحديث: ${group.name}`);
    } else {
      const created = await prisma.resGroup.create({
        data: { name: group.name, category: group.category, permissions: group.permissions },
      });
      groupMap[group.name] = created.id;
      console.log(`  ✅ إنشاء: ${group.name}`);
    }
  }

  // --- إنشاء حقوق الوصول ---
  console.log('\n--- 2. إعداد حقوق الوصول ---');
  for (const [groupName, models] of Object.entries(ACCESS_RIGHTS)) {
    const groupId = groupMap[groupName];
    if (!groupId) continue;
    for (const [model, [read, write, create, unlink]] of Object.entries(models)) {
      const accessName = `${groupName} / ${model}`;
      const existing = await prisma.irModelAccess.findUnique({ where: { name: accessName } });
      const data = { model, groupId, permRead: read, permWrite: write, permCreate: create, permUnlink: unlink };
      if (existing) {
        await prisma.irModelAccess.update({ where: { id: existing.id }, data });
      } else {
        await prisma.irModelAccess.create({ data: { name: accessName, ...data } });
      }
    }
    console.log(`  ✅ صلاحيات ${groupName}: ${Object.keys(models).length} موديل`);
  }

  // --- إنشاء/تحديث اليوزرات ---
  console.log('\n--- 3. إنشاء يوزرات الديمو ---');
  for (const userData of DEMO_USERS) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const groupId = groupMap[userData.groupName];

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(userData.email ? [{ email: userData.email }] : []),
          ...(userData.phone ? [{ phone: userData.phone }] : []),
        ],
      },
    });

    const userPayload = {
      role: userData.role,
      canViewCost: userData.canViewCost,
      allowedCustomerType: userData.allowedCustomerType,
      canCreateFreeVouchers: userData.canCreateFreeVouchers,
      canAccessTreasury: userData.canAccessTreasury,
      cashRegisterEnabled: userData.cashRegisterEnabled,
      canReceive: userData.canReceive,
      canDisburse: userData.canDisburse,
      companyId: company.id,
      groups: groupId ? { set: [{ id: groupId }] } : undefined,
    };

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: userPayload,
      });
      console.log(`  ✏️  تحديث: ${userData.name} (${userData.groupName})`);
    } else {
      await prisma.user.create({
        data: {
          email: userData.email,
          phone: userData.phone,
          name: userData.name,
          password: hashedPassword,
          ...userPayload,
          groups: groupId ? { connect: [{ id: groupId }] } : undefined,
        },
      });
      console.log(`  ✅ إنشاء: ${userData.name} (${userData.groupName})`);
    }
  }

  // --- ملخص ---
  console.log('\n==========================================');
  console.log('✅ تم إعداد يوزرات الديمو بنجاح!');
  console.log('==========================================\n');
  console.log('📋 بيانات الدخول للتدريب (اسم المستخدم = اليوزر):');
  console.log('─────────────────────────────────────────');
  console.log('  👤 المبيعات:    اليوزر: مبيعات     | الباسورد: sales123');
  console.log('  👤 المشتريات:   اليوزر: مشتريات    | الباسورد: purchases123');
  console.log('  👤 المخازن:     اليوزر: مخازن      | الباسورد: inventory123');
  console.log('  👤 المحاسبة:    اليوزر: محاسبه     | الباسورد: accounting123');
  console.log('  👤 المدير العام: اليوزر: مدير       | الباسورد: manager123');
  console.log('─────────────────────────────────────────');
  console.log('ملاحظة: يمكنك تعديل صلاحيات أي يوزر من شاشة الإعدادات في النظام.');
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
