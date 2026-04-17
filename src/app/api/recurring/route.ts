import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function GET() {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");

    const recurring = await prisma.recurringBooking.findMany({
      orderBy: { groupName: "asc" },
      include: {
        _count: { select: { occurrences: true } },
      },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const data = await request.json();

    const recurring = await prisma.recurringBooking.create({
      data: {
        groupName: data.groupName,
        contactName: data.contactName,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        daysOfWeek: data.daysOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        recurrenceStart: new Date(data.recurrenceStart),
        recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
        chargeModel: data.chargeModel || "INTERNAL",
        ticketPrice: data.ticketPrice ? parseFloat(data.ticketPrice) : null,
        techRequired: data.techRequired ?? false,
        barRequired: data.barRequired ?? false,
        fohRequired: data.fohRequired ?? false,
        stairClimberRequired: data.stairClimberRequired ?? false,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(recurring, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
