#!/usr/bin/env bash
# ============================================
# ERP 2026 — Setup Script
# ============================================
# يقوم هذا السكربت بإعداد قاعدة بيانات PostgreSQL
# وتهيئة النظام للاستخدام لأول مرة.
#
# المتطلبات:
#   1. PostgreSQL مُشغّل (Docker أو محلي أو Neon.tech)
#   2. DATABASE_URL مُعيّن في .env
#
# الاستخدام:
#   chmod +x setup.sh
#   ./setup.sh
# ============================================

set -e

echo "🚀 إعداد نظام ERP 2026..."
echo "=========================="

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js غير مثبت. الرجاء تثبيته أولاً."
    exit 1
fi

# 2. Install Dependencies
echo "📦 تثبيت المتطلبات..."
npm install --silent

# 3. Generate Prisma Client
echo "🔧 توليد Prisma Client..."
npx prisma generate

# 4. Push Database Schema
echo "🗄️ إنشاء جداول قاعدة البيانات..."
npx prisma db push --accept-data-loss

# 5. Seed Database
echo "🌱 إضافة البيانات الأساسية..."
npx prisma db seed 2>/dev/null || npx tsx prisma/seed.ts 2>/dev/null || echo "⚠️ لم يتم العثور على ملف seed"

# 6. Done
echo ""
echo "✅ تم إعداد النظام بنجاح!"
echo ""
echo "للتشغيل:"
echo "  npm run dev"
echo ""
echo "ثم افتح:"
echo "  http://localhost:3000"
echo ""
