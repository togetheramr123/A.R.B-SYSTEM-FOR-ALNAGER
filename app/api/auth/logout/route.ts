import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";
export async function GET(request: Request) {
  await logout();
  return NextResponse.redirect(new URL("/ar/login", request.url));
}