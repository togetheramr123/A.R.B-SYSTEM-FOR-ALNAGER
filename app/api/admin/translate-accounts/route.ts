import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const translations = {
      "Stock Valuation (Automated)": "تقييم المخزون (آلي)",
      "Stock Valuation": "تقييم المخزون (آلي)",
      "Stock Input (Interim)": "مدخلات المخزون (وسيط)",
      "Stock Output (Interim)": "مخرجات المخزون (وسيط)",
      "Cost of Goods Sold": "تكلفة البضائع المباعة",
      "Product Sales": "مبيعات المنتجات"
    };

    const results = [];

    for (const [englishName, arabicName] of Object.entries(translations)) {
      const updateResult = await prisma.account.updateMany({
        where: { name: englishName },
        data: { name: arabicName }
      });
      results.push(`${englishName} -> ${arabicName}: ${updateResult.count} updated`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
