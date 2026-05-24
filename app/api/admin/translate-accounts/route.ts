import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const accounts = await prisma.account.findMany();
    const categories = await prisma.productCategory.findMany();
    return NextResponse.json({ success: true, accounts, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
