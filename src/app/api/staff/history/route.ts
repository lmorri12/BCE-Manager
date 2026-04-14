import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name) {
      return NextResponse.json({ error: "name parameter required" }, { status: 400 });
    }

    const assignments = await prisma.eventStaff.findMany({
      where: { staffName: { equals: name, mode: "insensitive" } },
      include: {
        booking: {
          select: {
            id: true,
            eventName: true,
            eventNameTBC: true,
            eventDate: true,
            eventTime: true,
            status: true,
            chargeModel: true,
          },
        },
      },
      orderBy: { booking: { eventDate: "desc" } },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    return handleApiError(error);
  }
}
