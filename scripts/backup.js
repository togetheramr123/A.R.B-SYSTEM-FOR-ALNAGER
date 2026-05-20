const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const ENV_PATH = path.join(process.cwd(), '.env');

// التأكد من وجود مجلد النسخ الاحتياطية
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// إنشاء اسم الملف بناءً على التاريخ
const date = new Date();
const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
const timestamp = date.toISOString().replace(/[:.]/g, '-');

// 1. مسارات النسخ
const dbBackupPath = path.join(BACKUP_DIR, `database_${timestamp}.sqlite`);
const envBackupPath = path.join(BACKUP_DIR, `env_backup_${timestamp}.txt`);

console.log('⏳ جاري أخذ النسخة الاحتياطية...');

// 2. نسخ قاعدة البيانات
if (fs.existsSync(DB_PATH)) {
  fs.copyFileSync(DB_PATH, dbBackupPath);
  console.log(`✅ تم حفظ نسخة من قاعدة البيانات: ${dbBackupPath}`);
} else {
  console.log(`❌ لم يتم العثور على قاعدة البيانات في: ${DB_PATH}`);
}

// 3. نسخ ملف الإعدادات السري
if (fs.existsSync(ENV_PATH)) {
  fs.copyFileSync(ENV_PATH, envBackupPath);
  console.log(`✅ تم حفظ نسخة من الإعدادات: ${envBackupPath}`);
}

// 4. تنظيف النسخ القديمة (الاحتفاظ بآخر 7 أيام فقط لتوفير المساحة في Replit)
const MAX_BACKUPS = 7;
const files = fs.readdirSync(BACKUP_DIR)
  .filter(f => f.startsWith('database_'))
  .map(f => ({
    name: f,
    time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time); // الأحدث أولاً

if (files.length > MAX_BACKUPS) {
  const filesToDelete = files.slice(MAX_BACKUPS);
  filesToDelete.forEach(file => {
    fs.unlinkSync(path.join(BACKUP_DIR, file.name));
    console.log(`🗑️ تم مسح النسخة القديمة لتوفير المساحة: ${file.name}`);
  });
}

console.log('🎉 اكتملت عملية النسخ الاحتياطي بنجاح!');
