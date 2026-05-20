import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        error: 'Unauthorized'
      }, {
        status: 401
      });
    }
    const {
      message
    } = await req.json();
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({
        error: 'Message is required'
      }, {
        status: 400
      });
    }
    if (message.length > 2000) {
      return NextResponse.json({
        error: 'Message too long'
      }, {
        status: 400
      });
    }
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    let reply = "";
    if (hasOpenAI) {
      reply = "تم التعرف على مفتاح API ولكن الواجهة قيد التطوير.";
    } else {
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('مبيعات') || lowerMsg.includes('بيع') || lowerMsg.includes('فاتورة')) {
        reply = "لإدارة المبيعات، يمكنك الدخول إلى شاشة 'أوامر البيع'. هل تريد مساعدة في إنشاء أمر بيع جديد أو عرض التحليلات الخاصة بمبيعاتك؟";
      } else if (lowerMsg.includes('منتجات') || lowerMsg.includes('مخزن')) {
        reply = "يدعم نظامنا المخزني إدارة الوحدات المزدوجة، والباركود، وتقييم المخزون المباشر. يمكنك إنشاء منتجات جديدة عبر قسم المستودعات بحرية تامة.";
      } else if (lowerMsg.includes('شكرا') || lowerMsg.includes('تمام')) {
        reply = "العفو! أنا تحت أمرك في أي وقت لتسهيل إدارة شركتك.";
      } else {
        reply = "أنا المساعد الذكي لنظام ERP الخاص بك. (هذه نسخة تجريبية للذكاء الاصطناعي وستكون متصلة بالكامل بمجرد تفعيل المفتاح). كيف يمكنني تبسيط مهامك؟";
      }
    }
    new Promise(resolve => setTimeout(resolve, 800));
    return NextResponse.json({
      reply
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({
      error: 'Internal Server Error'
    }, {
      status: 500
    });
  }
}