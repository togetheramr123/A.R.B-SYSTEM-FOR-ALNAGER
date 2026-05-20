# خطوات رفع النظام مجاناً (Vercel + Neon)

بناءً على خبرتي، أفضل وأسهل طريقة مجانية لرفع هذا النظام هي استخدام **Vercel** (للموقع) و **Neon** (لقاعدة البيانات).

### الخطوة 1: تجهيز قاعدة البيانات (Neon)
1. ادخل على موقع [neon.tech](https://neon.tech) وسجل حساب مجاني.
2. اضغط **New Project**.
3. سينشئ لك قاعدة بيانات، انسخ "رابط الاتصال" (Connection String) الذي يشبه هذا:
   `postgres://user:password@ep-cool-site.us-east-2.aws.neon.tech/neondb?sslmode=require`

### الخطوة 2: رفع الكود (GitHub)
1. يجب أن يكون لديك حساب على [GitHub.com](https://github.com).
2. حمل برنامج [GitHub Desktop](https://desktop.github.com) على جهازك.
3. افتح البرنامج واختر **Add Existing Repository** واختر مجلد المشروع هذا (`smart-erp-demo`).
4. اضغط **Publish Repository**.

### الخطوة 3: تشغيل الموقع (Vercel)
1. ادخل على موقع [vercel.com](https://vercel.com) وسجل حساب (يفضل بنفس حساب GitHub).
2. اضغط **Add New Project** واختر مشروع `smart-erp-demo` الذي رفعته للتو.
3. في خانة **Environment Variables** (المتغيرات)، اضف متغير واحد:
   *   **الاسم:** `DATABASE_URL`
   *   **القيمة:** (الصق رابط Neon الذي نسخته في الخطوة 1).
4. اضغط **Deploy**.

---
**ملاحظة هامة جداً:**
لتشغيل النظام على Neon (PostgreSql) بدلاً من الملف المحلي، يجب تعديل كلمة واحدة في ملف `prisma/schema.prisma` قبل الرفع:
غير السطر:
`provider = "sqlite"`
إلى:
`provider = "postgresql"`

لكن انتبه! إذا فعلت هذا الآن سيتوقف النظام على جهازك المحلي. لذا الأفضل أن تفعل ذلك فقط عند الرفع، أو تستخدم ملفين منفصلين.
