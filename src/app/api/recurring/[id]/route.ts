import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { id } = await params;

    const recurring = await prisma.recurringBooking.findUnique({
      where: { id },
      include: {
        occurrences: {
          orderBy: { eventDate: "asc" },
          select: {
            id: true,
            eventName: true,
            eventDate: true,
            status: true,
            overriddenByBookingId: true,
          },
        },
      },
    });

    if (!recurring) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(recurring);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { id } = await params;
    const data = await request.json();

    const recurring = await prisma.recurringBooking.update({
      where: { id },
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
        active: data.active ?? true,
      },
    });

    return NextResponse.json(recurring);
  } catch (error) {
    return handleApiError(error);
  }
}
