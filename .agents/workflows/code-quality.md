---
description: قاعدة جودة الكود والتوحيد - تضمن تناسق اللغة والأنماط والأمان عبر كل الملفات
---

# قاعدة جودة الكود والتوحيد (Code Quality & Consistency Guard)

## متى تُطبق؟
تُطبق **تلقائياً** عند كل تعديل. وتُفحص شاملاً عند طلب مراجعة عامة.

## القواعد الثابتة:

### 1. اللغة العربية (Localization)
- **كل النصوص المرئية للمستخدم** يجب أن تكون بالعربية (لا English في الأزرار أو التأكيدات).
- `confirm()` يجب أن يحتوي على نص عربي فقط (لا "Are you sure?").
- الأسماء التقنية (imports, functions, variables) تبقى بالإنجليزية.

### 2. الأمان (Security)
- **كل Server Action مالي أو كتابي** يجب أن يحتوي على `ensureAccess()`.
- القراءة العامة (getChartOfAccounts, getTrialBalance) مسموح بدون ensureAccess لأنها تحتاج فقط session.
- **لا hardcoded company IDs** — استخدم `session.companyId` أو `getFirstCompany()`.
- **لا hardcoded locale** — لا تستخدم `/ar/` مباشرة. استخدم `/${locale}/`.

### 3. تجربة المستخدم (UX)
- **لا `alert()`** — استخدم `toast` من sonner.
- **`confirm()`** مسموح مؤقتاً للعمليات الحرجة (حذف، إلغاء) لكن يجب أن يكون بالعربية.
- **التوجيه بعد الإنشاء**: عند إنشاء سجل جديد (فاتورة، دفعة)، وجّه المستخدم للسجل المُنشأ.
- **رسائل الخطأ**: واضحة وبالعربية. لا "Error occurred".

### 4. المعاملات الذرية (Transactions)
- **كل عملية تعدّل أكثر من جدول** يجب أن تستخدم `prisma.$transaction()`.
- الفوترة، المرتجعات، اعتماد المخزن — كلها يجب أن تكون ذرية.

### 5. أنماط Odoo القياسية (Odoo Patterns)
- **StatusBar** في كل صفحة تفاصيل (Draft → Confirmed → Done).
- **SmartButtons** في أعلى يمين الفورم (عدد الفواتير، عدد التوصيليات).
- **Chatter** في أسفل كل صفحة تفاصيل.
- **Breadcrumbs** في أعلى كل صفحة.

### 6. فحص تلقائي
عند طلب مراجعة شاملة، نفذ الفحوصات التالية:
```bash
# 1. English confirm() messages
grep -rn "confirm(" components/ --include="*.tsx" | grep -i "are you sure\|delete\|create new"

# 2. Hardcoded /ar/ locale
grep -rn '"/ar/' components/ --include="*.tsx"

# 3. alert() usage
grep -rn "alert(" components/ --include="*.tsx" | grep -v "AlertTriangle\|AlertCircle"

# 4. Server Actions without ensureAccess
grep -rn "export async function" app/actions/*.ts | grep -v "ensureAccess\|get\|fetch"

# 5. confirm() in English
grep -rn "confirm(" components/ --include="*.tsx" | grep "Are you"
```
