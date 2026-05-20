const cron = require('node-cron');
const { execSync } = require('child_process');

console.log('🕒 خدمة النسخ الاحتياطي التلقائي تعمل في الخلفية...');

// تشغيل النسخ الاحتياطي يومياً الساعة 12:00 منتصف الليل (00:00)
cron.schedule('0 0 * * *', () => {
  console.log('🔄 بدء عملية النسخ الاحتياطي التلقائي (الجدولة اليومية)...');
  try {
    execSync('npm run backup', { stdio: 'inherit' });
    console.log('✅ اكتمل النسخ التلقائي بنجاح.');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء النسخ التلقائي:', error);
  }
});
