import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; /** * Health Check API * GET /api/health * Returns system health status for monitoring tools (Docker, K8s, uptime monitors). */
export async function GET() {
  const startTime = Date.now();
  try {
    /* Check database connection */await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - startTime;
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: "connected",
        latencyMs: dbLatency
      },
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development"
    }, {
      status: 200
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: {
        status: "disconnected",
        error: error.message
      }
    }, {
      status: 503
    });
  }
}