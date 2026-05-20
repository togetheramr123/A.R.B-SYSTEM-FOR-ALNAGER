// lib/whatsapp.ts

export async function sendWhatsAppNotification(phoneNumber: string, message: string) {
    // In a real production environment, this would call Twilio or WhatsApp Business API.
    // Example:
    // await fetch('https://graph.facebook.com/v17.0/PHONE_NUMBER_ID/messages', { ... })
    
    console.log('====================================');
    console.log(`[WhatsApp API Mock] 📱 Sending message to: ${phoneNumber}`);
    console.log(`Message:\n${message}`);
    console.log('====================================');
    
    return { success: true, timestamp: new Date() };
}

export function buildManagerMistakeReport(
    userName: string, 
    errorType: string, 
    severity: number, 
    context: string,
    efficiencyScore: number
) {
    let severityIcon = '⚠️';
    if (severity >= 4) severityIcon = '🚨';
    if (severity <= 2) severityIcon = 'ℹ️';

    return `
*تقارير المُوجّه الذكي (Smart Coach)* ${severityIcon}
-----------------------------
*الموظف:* ${userName}
*كفاءة الموظف الحالية:* ${efficiencyScore.toFixed(1)}%

*تفاصيل الخطأ:*
نوع الخطأ: ${errorType}
درجة الخطورة: ${severity}/5
السياق/الشاشة: ${context}

_تم إيقاف الموظف مؤقتاً؟_ ${severity >= 4 ? 'نعم (3 دقائق)' : 'لا'}
_يرجى مراجعة نشاط الموظف لتقييم الاحتياج التدريبي._
    `.trim();
}
