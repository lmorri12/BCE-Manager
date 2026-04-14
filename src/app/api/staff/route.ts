import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";

// GET: Returns staff history — unique names with assignment counts
// Also used for autocomplete suggestions
export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role");
    const search = searchParams.get("search");

    const where: any = {};
    if (roleFilter) where.role = roleFilter;
    if (search) where.staffName = { contains: search, mode: "insensitive" };

    const assignments = await prisma.eventStaff.groupBy({
      by: ["staffName", "role"],
      where,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Also get the latest phone number for each person
    const result = await Promise.all(
      assignments.map(async (a) => {
        const latest = await prisma.eventStaff.findFirst({
          where: { staffName: a.staffName, role: a.role },
          orderBy: { id: "desc" },
          select: { staffPhone: true },
        });
        return {
          staffName: a.staffName,
          role: a.role,
          eventCount: a._count.id,
          lastKnownPhone: latest?.staffPhone || null,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
