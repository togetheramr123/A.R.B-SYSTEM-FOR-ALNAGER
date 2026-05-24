import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const accounts = await prisma.account.findMany({
      select: {
        code: true,
        name: true
      }
    });
    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
