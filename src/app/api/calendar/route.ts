import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString());

    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    // Extend range to cover full calendar weeks (start Monday)
    const startDate = new Date(firstDay);
    const dayOfWeek = startDate.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const endDate = new Date(lastDay);
    const endDayOfWeek = endDate.getDay();
    if (endDayOfWeek !== 0) {
      endDate.setDate(endDate.getDate() + (7 - endDayOfWeek));
    }

    // Get confirmed/in-progress bookings with event dates in range
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [
          { bookingDays: { some: { date: { gte: startDate, lte: endDate } } } },
          { AND: [{ eventDate: { gte: startDate, lte: endDate } }, { bookingDays: { none: {} } }] },
        ],
        status: { not: "CLOSED" },
      },
      select: {
        id: true,
        status: true,
        eventName: true,
        eventNameTBC: true,
        eventDate: true,
        eventTime: true,
        doorsOpenTime: true,
        bookerName: true,
        chargeModel: true,
        recurringBookingId: true,
        bookingDays: {
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
          select: {
            date: true,
            startTime: true,
            endTime: true,
            doorsOpenTime: true,
          },
        },
      },
      orderBy: [{ eventDate: "asc" }, { eventTime: "asc" }],
    });

    // Get pencil dates from enquiries in this range
    const pencilDates = await prisma.provisionalDate.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        booking: { status: "ENQUIRY" },
      },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            eventNameTBC: true,
            bookerName: true,
            chargeModel: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Convert pencil dates to the same shape as bookings for the calendar
    const pencilBookings = pencilDates.map((pd) => ({
      id: pd.booking.id,
      status: "ENQUIRY" as const,
      eventName: null,
      eventNameTBC: pd.booking.eventNameTBC,
      eventDate: pd.date.toISOString(),
      eventTime: null,
      doorsOpenTime: null,
      bookerName: pd.booking.bookerName,
      chargeModel: pd.booking.chargeModel,
      recurringBookingId: null,
      isPencilDate: true,
      pencilNotes: pd.notes,
    }));

    const allItems = [
      ...bookings.flatMap((booking) => {
        if (booking.bookingDays.length > 0) {
          return booking.bookingDays.map((day) => ({
            id: booking.id,
            status: booking.status,
            eventName: booking.eventName,
            eventNameTBC: booking.eventNameTBC,
            eventDate: day.date.toISOString(),
            eventTime: day.startTime,
            doorsOpenTime: day.doorsOpenTime,
            bookerName: booking.bookerName,
            chargeModel: booking.chargeModel,
            recurringBookingId: booking.recurringBookingId,
            isPencilDate: false,
            pencilNotes: null,
          }));
        }

        return [{
          id: booking.id,
          status: booking.status,
          eventName: booking.eventName,
          eventNameTBC: booking.eventNameTBC,
          eventDate: booking.eventDate?.toISOString() ?? null,
          eventTime: booking.eventTime,
          doorsOpenTime: booking.doorsOpenTime,
          bookerName: booking.bookerName,
          chargeModel: booking.chargeModel,
          recurringBookingId: booking.recurringBookingId,
          isPencilDate: false,
          pencilNotes: null,
        }];
      }),
      ...pencilBookings,
    ].sort((a, b) => {
      const dateCompare = (a.eventDate || "").localeCompare(b.eventDate || "");
      if (dateCompare !== 0) {
        return dateCompare;
      }

      return (a.eventTime || "").localeCompare(b.eventTime || "");
    });

    return NextResponse.json(allItems);
  } catch (error) {
    return handleApiError(error);
  }
}
