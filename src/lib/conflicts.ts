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
    eventDate: { gte: dayStart, lte: dayEnd },
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
    },
    orderBy: { eventTime: "asc" },
  });
}

export async function findAllConflicts(): Promise<
  { date: string; count: number; bookings: Conflict[] }[]
> {
  const bookings = await prisma.booking.findMany({
    where: {
      eventDate: { not: null },
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
    },
    orderBy: { eventDate: "asc" },
  });

  const byDate: Record<string, Conflict[]> = {};
  for (const b of bookings) {
    if (!b.eventDate) continue;
    const d = new Date(b.eventDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(b);
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
