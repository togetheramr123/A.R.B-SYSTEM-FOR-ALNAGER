import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function GET(request: Request) {
  await logout();
  
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;
  
  return NextResponse.redirect(new URL("/ar/login", baseUrl));
}