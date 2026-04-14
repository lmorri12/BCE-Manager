import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {
      status: { in: ["CONFIRMED", "IN_PROGRESS", "READY", "DAY_OF"] },
      chargeModel: { not: "INTERNAL" },
      eventDate: { not: null },
    };

    if (from) where.eventDate = { ...where.eventDate, gte: new Date(from) };
    if (to) where.eventDate = { ...where.eventDate, lte: new Date(to) };

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        eventName: true,
        eventNameTBC: true,
        eventDate: true,
        eventTime: true,
        bookerName: true,
        chargeModel: true,
        status: true,
        techRequired: true,
        barRequired: true,
        fohRequired: true,
        createdByUser: { select: { name: true } },
        staffAssignments: {
          select: {
            id: true,
            role: true,
            staffName: true,
            staffPhone: true,
          },
        },
        tasks: {
          select: { area: true, completed: true },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return handleApiError(error);
  }
}
