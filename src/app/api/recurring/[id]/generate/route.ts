import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";
import { findConflicts } from "@/lib/conflicts";
import type { DayOfWeek } from "@prisma/client";

const DAY_MAP: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { id } = await params;

    const { weeksAhead } = await request.json();
    const weeks = weeksAhead || 12;

    const recurring = await prisma.recurringBooking.findUnique({
      where: { id },
      include: { occurrences: { select: { eventDate: true } } },
    });

    if (!recurring || !recurring.active) {
      return NextResponse.json({ error: "Not found or inactive" }, { status: 404 });
    }

    const targetDays = recurring.daysOfWeek.map((d) => DAY_MAP[d]);

    // Build set of existing dates using local date strings to avoid timezone issues
    const existingDates = new Set(
      recurring.occurrences
        .filter((o) => o.eventDate)
        .map((o) => {
          const d = new Date(o.eventDate!);
          return toLocalDateStr(d);
        })
    );

    const startDate = new Date();
    startDate.setHours(12, 0, 0, 0); // Use noon to avoid DST edge cases

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7);

    const maxDate = recurring.recurrenceEnd
      ? new Date(Math.min(endDate.getTime(), recurring.recurrenceEnd.getTime()))
      : endDate;

    const toCreate: {
      bookerName: string;
      eventName: string;
      eventDate: Date;
      eventTime: string;
      status: "CONFIRMED";
      chargeModel: "INTERNAL";
      recurringBookingId: string;
      techRequired: boolean;
      barRequired: boolean;
      fohRequired: boolean;
    }[] = [];

    const skippedConflicts: string[] = [];

    const cursor = new Date(startDate);
    while (cursor <= maxDate) {
      const dayOfWeek = cursor.getDay();
      if (targetDays.includes(dayOfWeek)) {
        const dateStr = toLocalDateStr(cursor);
        if (!existingDates.has(dateStr)) {
          // Check for conflicts with existing non-recurring bookings
          const eventDate = new Date(`${dateStr}T12:00:00.000Z`);
          const conflicts = await findConflicts(eventDate);
          if (conflicts.length > 0) {
            skippedConflicts.push(dateStr);
          } else {
            toCreate.push({
              bookerName: recurring.contactName,
              eventName: recurring.groupName,
              eventDate,
              eventTime: recurring.startTime,
              status: "CONFIRMED",
              chargeModel: "INTERNAL",
              recurringBookingId: id,
              techRequired: false,
              barRequired: false,
              fohRequired: false,
            });
          }
        }
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (toCreate.length > 0) {
      await prisma.booking.createMany({ data: toCreate });
    }

    let message = `Generated ${toCreate.length} booking(s) for the next ${weeks} weeks.`;
    if (skippedConflicts.length > 0) {
      message += ` Skipped ${skippedConflicts.length} date(s) due to conflicts: ${skippedConflicts.join(", ")}`;
    }

    return NextResponse.json({
      generated: toCreate.length,
      skipped: skippedConflicts.length,
      skippedDates: skippedConflicts,
      message,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
