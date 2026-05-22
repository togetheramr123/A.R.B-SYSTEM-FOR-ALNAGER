// lib/whatsapp.ts

export async function sendWhatsAppNotification(phoneNumber: string, message: string) {
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!instanceId || !token) {
        console.log('====================================');
        console.log(`[WhatsApp API Mock] 📱 Sending message to: ${phoneNumber}`);
        console.log(`Message:\n${message}`);
        console.log('====================================');
        return { success: true, mock: true, timestamp: new Date() };
    }

    let formattedPhone = phoneNumber.replace(/\D/g, '');
    // Simple logic for Egyptian numbers: if it starts with 01, prepend 2
    if (formattedPhone.startsWith('01') && formattedPhone.length === 11) {
        formattedPhone = '2' + formattedPhone;
    } else if (formattedPhone.startsWith('1') && formattedPhone.length === 10) {
        formattedPhone = '20' + formattedPhone;
    }

    try {
        const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                token: token,
                to: formattedPhone,
                body: message
            })
        });
        const data = await response.json();
        if (data && (data.sent === 'true' || data.id)) {
            console.log(`[WhatsApp Direct API] Message sent successfully to ${formattedPhone}`);
            return { success: true, timestamp: new Date(), data };
        } else {
            console.error(`[WhatsApp Direct API] Failed to send message:`, data);
            return { success: false, error: data };
        }
    } catch (e) {
        console.error("[WhatsApp Direct API] Error during sending:", e);
        return { success: false, error: e };
    }
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
