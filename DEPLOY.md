# 🚀 دليل رفع ERP 2026 على Replit

## المتطلبات
- حساب على [Replit](https://replit.com)
- حساب على [GitHub](https://github.com) (اختياري لكن مفضل)

---

## الخطوة 1: رفع الكود

### الطريقة أ: عبر GitHub (مفضل)
1. أنشئ Repository جديد على GitHub
2. ارفع الكود:
```bash
git init
git add .
git commit -m "ERP 2026 - Initial Deploy"
git remote add origin https://github.com/YOUR_USERNAME/erp-2026.git
git push -u origin main
```
3. في Replit → **Create Repl** → **Import from GitHub** → الصق رابط الـ repo

### الطريقة ب: مباشرة على Replit
1. في Replit → **Create Repl** → **Upload folder**
2. ارفع مجلد المشروع بالكامل

---

## الخطوة 2: إعداد متغيرات البيئة (Secrets)

في Replit اذهب إلى **Tools → Secrets** وأضف:

| المفتاح | القيمة | ملاحظة |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite للبداية. يمكن تغييرها لـ PostgreSQL لاحقاً |
| `JWT_SECRET` | `كلمة-سر-عشوائية-قوية` | مهم جداً! لا تستخدم القيمة الافتراضية |
| `NODE_ENV` | `production` | لتفعيل وضع الإنتاج |

> ⚠️ **مهم:** في وضع الإنتاج (`NODE_ENV=production`)، يجب تسجيل الدخول يدوياً.
> لن يعمل Auto-login كما في التطوير.

---

## الخطوة 3: البناء والتشغيل

Replit سيقرأ ملف `.replit` تلقائياً ويعمل:
1. `npm install` — تثبيت المكتبات
2. `npx prisma generate` — إعداد قاعدة البيانات
3. `npm run build` — بناء المشروع
4. `npm run start` — تشغيل السيرفر

---

## الخطوة 4: إنشاء أول شركة ومستخدم

بعد التشغيل، افتح الرابط واذهب لـ `/ar/login`.

لإنشاء أول مستخدم أدمن، شغل في Replit Shell:
```bash
npx prisma db seed
```

هذا سينشئ:
- شركة افتراضية
- مستخدم أدمن (admin@smart.com / admin123)
- دليل حسابات أساسي

---

## تحديث النظام

### لو الكود على GitHub:
```bash
# على جهازك المحلي
git add .
git commit -m "تحديث: وصف التحديث"
git push

# في Replit
# اضغط زر "Pull" من Git panel ← Replit يعمل rebuild تلقائي
```

### لو الكود مباشر على Replit:
- عدّل مباشرة في Replit
- اضغط "Run" لإعادة البناء

---

## بيع النظام لعدة شركات (Multi-Tenant)

النظام جاهز لخدمة عدة شركات من نسخة واحدة:

1. **كل شركة** لها `companyId` خاص
2. **كل المستخدمين** مرتبطين بشركتهم
3. **كل البيانات** (فواتير، مبيعات، مخزون) مفلترة تلقائياً

### لإضافة شركة جديدة:
1. أنشئ `Company` في قاعدة البيانات
2. أنشئ `User` أدمن لهذه الشركة
3. أعطِ العميل رابط الدخول + بيانات حسابه

---

## ملاحظات أمان مهمة

- ❌ لا ترفع ملف `.env` على GitHub أبداً (محمي بـ `.gitignore`)
- ✅ استخدم Replit Secrets لتخزين المتغيرات الحساسة
- ✅ غيّر `JWT_SECRET` لقيمة عشوائية طويلة
- ✅ في الإنتاج، `NODE_ENV=production` يعطل Auto-login
