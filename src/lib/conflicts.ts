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
};

/**
 * Find bookings that conflict with a given date.
 * A conflict = another non-closed booking on the same date.
 * Optionally exclude a specific booking ID (for checking against itself).
 */
export async function findConflicts(
  date: Date,
  excludeBookingId?: string
): Promise<Conflict[]> {
  // Normalise to start/end of day
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

  const bookings = await prisma.booking.findMany({
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
    },
    orderBy: { eventTime: "asc" },
  });

  return bookings;
}

/**
 * Find all dates that have more than one booking (conflict summary).
 */
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
    },
    orderBy: { eventDate: "asc" },
  });

  // Group by date
  const byDate: Record<string, Conflict[]> = {};
  for (const b of bookings) {
    if (!b.eventDate) continue;
    const d = new Date(b.eventDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(b);
  }

  // Return only dates with > 1 booking
  return Object.entries(byDate)
    .filter(([, arr]) => arr.length > 1)
    .map(([date, bookings]) => ({ date, count: bookings.length, bookings }));
}
