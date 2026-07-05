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
  isSetup: boolean;
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
      { setupDate: { gte: dayStart, lte: dayEnd } },
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
      setupDate: true,
      setupTime: true,
      bookingDays: {
        where: { date: { gte: dayStart, lte: dayEnd } },
        select: { startTime: true },
        orderBy: [{ date: "asc" }, { sortOrder: "asc" }],
      },
    },
    orderBy: { eventTime: "asc" },
  }).then((bookings) =>
    bookings.flatMap((booking) => {
      const conflicts: Conflict[] = [];
      const hasBookingDayOnDate = booking.bookingDays.length > 0;

      if (hasBookingDayOnDate) {
        conflicts.push({
          id: booking.id,
          eventName: booking.eventName,
          eventNameTBC: booking.eventNameTBC,
          eventDate: date,
          eventTime: booking.bookingDays[0]?.startTime ?? booking.eventTime,
          bookerName: booking.bookerName,
          status: booking.status,
          chargeModel: booking.chargeModel,
          recurringBookingId: booking.recurringBookingId,
          isSetup: false,
        });
      } else if (booking.eventDate) {
        conflicts.push({
          id: booking.id,
          eventName: booking.eventName,
          eventNameTBC: booking.eventNameTBC,
          eventDate: booking.eventDate,
          eventTime: booking.eventTime,
          bookerName: booking.bookerName,
          status: booking.status,
          chargeModel: booking.chargeModel,
          recurringBookingId: booking.recurringBookingId,
          isSetup: false,
        });
      }

      const setupIsSameDayAsEvent =
        hasBookingDayOnDate ||
        (booking.eventDate &&
          booking.eventDate >= dayStart &&
          booking.eventDate <= dayEnd);

      if (booking.setupDate && !setupIsSameDayAsEvent) {
        conflicts.push({
          id: booking.id,
          eventName: booking.eventName,
          eventNameTBC: booking.eventNameTBC,
          eventDate: booking.setupDate,
          eventTime: booking.setupTime,
          bookerName: booking.bookerName,
          status: booking.status,
          chargeModel: booking.chargeModel,
          recurringBookingId: booking.recurringBookingId,
          isSetup: true,
        });
      }

      return conflicts;
    })
  );
}

export async function findAllConflicts(): Promise<
  { date: string; count: number; bookings: Conflict[] }[]
> {
  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        { bookingDays: { some: {} } },
        { setupDate: { not: null } },
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
      setupDate: true,
      setupTime: true,
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
            isSetup: false,
          }))
        : b.eventDate
          ? [{ eventDate: b.eventDate, eventTime: b.eventTime, isSetup: false }]
          : [];

    const setupEntry =
      b.setupDate &&
      !dayEntries.some((entry) => entry.eventDate.getTime() === b.setupDate!.getTime())
        ? [{ eventDate: b.setupDate, eventTime: b.setupTime, isSetup: true }]
        : [];

    for (const day of [...dayEntries, ...setupEntry]) {
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
        isSetup: day.isSetup,
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
