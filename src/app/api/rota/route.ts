import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const bookingDayDateWhere = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };

    const where: any = {
      status: { in: ["CONFIRMED", "IN_PROGRESS", "READY", "DAY_OF"] },
      chargeModel: { not: "INTERNAL" },
      OR: [
        { bookingDays: { some: {} } },
        { eventDate: { not: null } },
      ],
    };

    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    if (fromDate || toDate) {
      where.OR = [
        {
          bookingDays: {
            some: {
              date: bookingDayDateWhere,
            },
          },
        },
        {
          AND: [
            { bookingDays: { none: {} } },
            {
              eventDate: {
                not: null,
                ...(fromDate ? { gte: fromDate } : {}),
                ...(toDate ? { lte: toDate } : {}),
              },
            },
          ],
        },
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        eventName: true,
        eventNameTBC: true,
        eventDate: true,
        eventTime: true,
        eventEndTime: true,
        bookerName: true,
        chargeModel: true,
        status: true,
        techRequired: true,
        barRequired: true,
        fohRequired: true,
        stairClimberRequired: true,
        createdByUser: { select: { name: true } },
        bookingDays: {
          where: {
            date: bookingDayDateWhere,
          },
          select: {
            date: true,
            startTime: true,
            endTime: true,
          },
          orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
        },
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

    const expandedBookings = bookings.flatMap((booking) => {
      if (booking.bookingDays.length > 0) {
        return booking.bookingDays.map((day, index) => ({
          ...booking,
          id: `${booking.id}:${index}`,
          bookingId: booking.id,
          eventDate: day.date,
          eventTime: day.startTime,
          eventEndTime: day.endTime,
        }));
      }

      if (!booking.eventDate) {
        return [];
      }

      return [
        {
          ...booking,
          bookingId: booking.id,
          eventDate: booking.eventDate,
          eventEndTime: booking.eventEndTime,
        },
      ];
    });

    return NextResponse.json(expandedBookings);
  } catch (error) {
    return handleApiError(error);
  }
}
