import { prisma } from "./db";

export type Conflict = {
  id: string;
  eventName: string | null;
  eventNameTBC: string | null;
  eventDate: Date | null;
  eventTime: string | null;
  bookerName: string;
  status: string;
  chargeModel: string;
  recurringBookingId: string | null;
};

export async function findConflicts(
  date: Date,
  excludeBookingId?: string
): Promise<Conflict[]> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const where: any = {
    OR: [
      { bookingDays: { some: { date: { gte: dayStart, lte: dayEnd } } } },
      { AND: [{ bookingDays: { none: {} } }, { eventDate: { gte: dayStart, lte: dayEnd } }] },
    ],
    status: { notIn: ["CLOSED", "POST_EVENT"] },
  };

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  return prisma.booking.findMany({
    where,
    select: {
      id: true,
      eventName: true,
      eventNameTBC: true,
      eventDate: true,
      eventTime: true,
      bookerName: true,
      status: true,
      chargeModel: true,
      recurringBookingId: true,
      bookingDays: {
        where: { date: { gte: dayStart, lte: dayEnd } },
        select: { startTime: true },
        orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      },
    },
    orderBy: { eventTime: "asc" },
  }).then((bookings) =>
    bookings.map((booking) => ({
      ...booking,
      eventTime: booking.bookingDays[0]?.startTime ?? booking.eventTime,
    }))
  );
}

export async function findAllConflicts(): Promise<
  { date: string; count: number; bookings: Conflict[] }[]
> {
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { bookingDays: { some: {} } },
        { AND: [{ bookingDays: { none: {} } }, { eventDate: { not: null } }] },
      ],
      status: { notIn: ["CLOSED", "POST_EVENT"] },
    },
    select: {
      id: true,
      eventName: true,
      eventNameTBC: true,
      eventDate: true,
      eventTime: true,
      bookerName: true,
      status: true,
      chargeModel: true,
      recurringBookingId: true,
      bookingDays: {
        select: {
          date: true,
          startTime: true,
        },
        orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      },
    },
    orderBy: { eventDate: "asc" },
  });

  const byDate: Record<string, Conflict[]> = {};
  for (const b of bookings) {
    const dayEntries =
      b.bookingDays.length > 0
        ? b.bookingDays.map((day) => ({
            eventDate: day.date,
            eventTime: day.startTime ?? b.eventTime,
          }))
        : b.eventDate
          ? [{ eventDate: b.eventDate, eventTime: b.eventTime }]
          : [];

    for (const day of dayEntries) {
      const d = new Date(day.eventDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push({
        id: b.id,
        eventName: b.eventName,
        eventNameTBC: b.eventNameTBC,
        eventDate: day.eventDate,
        eventTime: day.eventTime,
        bookerName: b.bookerName,
        status: b.status,
        chargeModel: b.chargeModel,
        recurringBookingId: b.recurringBookingId,
      });
    }
  }

  return Object.entries(byDate)
    .filter(([, arr]) => arr.length > 1)
    .map(([date, bookings]) => ({ date, count: bookings.length, bookings }));
}

/**
 * Cancel a recurring booking occurrence by closing it and linking the override.
 */
export async function overrideRecurringBooking(
  recurringBookingId: string,
  overridingBookingId: string
) {
  await prisma.booking.update({
    where: { id: recurringBookingId },
    data: {
      status: "CLOSED",
      overriddenByBookingId: overridingBookingId,
      closedAt: new Date(),
    },
  });
}
