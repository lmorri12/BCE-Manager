import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function GET(request: Request) {
  try {
    await requireRole("SUPER_USER");

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    return handleApiError(error);
  }
}
