import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";
import { notifyBookingConfirmed } from "@/lib/notifications";
import { findConflicts, overrideRecurringBooking } from "@/lib/conflicts";
import { auditLog } from "@/lib/audit";
import {
  buildBookingDayCreateMany,
  buildPrimaryBookingFields,
  normalizeBookingDays,
} from "@/lib/booking-days";
import { normalizeTicketPriceInput } from "@/lib/ticket-price";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { id } = await params;

    const data = await request.json();
    const bookingDays = normalizeBookingDays(data.bookingDays);
    if (bookingDays.length === 0 && data.eventDate) {
      bookingDays.push({
        date: String(data.eventDate),
        startTime: String(data.eventTime ?? ""),
        endTime: String(data.eventEndTime ?? ""),
        doorsOpenTime: String(data.doorsOpenTime ?? ""),
      });
    }
    const setupDate = data.setupDate ? new Date(String(data.setupDate)) : null;
    const datesToCheck = [
      ...bookingDays.map((day) => day.date),
      ...(setupDate &&
      !bookingDays.some((day) => new Date(day.date).toDateString() === setupDate.toDateString())
        ? [String(data.setupDate)]
        : []),
    ];

    // Check for conflicts unless explicitly overridden
    if (datesToCheck.length > 0 && !data.forceConfirm) {
      const conflictsByBookingId = new Map<string, Awaited<ReturnType<typeof findConflicts>>[number]>();

      for (const dateToCheck of datesToCheck) {
        const conflicts = await findConflicts(new Date(dateToCheck), id);
        for (const conflict of conflicts) {
          const key = `${conflict.id}:${conflict.isSetup ? "setup" : "event"}`;
          conflictsByBookingId.set(key, conflict);
        }
      }

      const conflicts = Array.from(conflictsByBookingId.values());
      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: "conflict",
            message: `There ${conflicts.length === 1 ? "is" : "are"} ${conflicts.length} conflicting booking${conflicts.length === 1 ? "" : "s"} across the selected event or setup days.`,
            conflicts,
          },
          { status: 409 }
        );
      }
    }

    // Override recurring bookings if requested
    let hasOverrides = false;
    if (data.forceConfirm && data.overrideRecurringIds && Array.isArray(data.overrideRecurringIds)) {
      for (const recurringId of data.overrideRecurringIds) {
        await overrideRecurringBooking(recurringId, id);
        await auditLog({
          action: "RECURRING_OVERRIDDEN",
          entity: "Booking",
          entityId: recurringId,
          summary: `Recurring booking cancelled — overridden by new booking`,
        });
        hasOverrides = true;
      }
    }

    const techRequired = data.techRequired ?? true;
    const barRequired = data.barRequired ?? true;
    const fohRequired = data.fohRequired ?? true;
    const stairClimberRequired = data.stairClimberRequired ?? false;
    const { ticketPrice, ticketPriceDisplay } = normalizeTicketPriceInput(
      data.ticketPrice
    );
    const primaryDayFields = buildPrimaryBookingFields(bookingDays);

    // Update the booking with full confirmation details
    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CONFIRMED",
        eventName: data.eventName,
        eventDate: primaryDayFields.eventDate,
        eventTime: primaryDayFields.eventTime,
        eventEndTime: primaryDayFields.eventEndTime,
        doorsOpenTime: primaryDayFields.doorsOpenTime,
        buildingAccessTime: data.buildingAccessTime || null,
        hasInterval: data.hasInterval ?? null,
        techRequirements: data.techRequirements || null,
        ticketPrice,
        ticketPriceDisplay,
        ticketSetupInfo: data.ticketSetupInfo || null,
        techContactName: data.techContactName || null,
        techContactPhone: data.techContactPhone || null,
        techContactEmail: data.techContactEmail || null,
        feedbackFormUrl: data.feedbackFormUrl || null,
        chargeModel: data.chargeModel || "INTERNAL",
        boxOfficeSplitPct: data.boxOfficeSplitPct
          ? parseFloat(data.boxOfficeSplitPct)
          : null,
        techRequired,
        barRequired,
        fohRequired,
        stairClimberRequired,
        roomLayout: data.roomLayout || null,
        roomLayoutOther: data.roomLayoutOther || null,
        setupDate: data.setupDate ? new Date(data.setupDate) : null,
        setupTime: data.setupTime || null,
        setupEndTime: data.setupEndTime || null,
        setupNotes: data.setupNotes || null,
        marketingAssets: data.marketingAssets ?? false,
        riskAssessment: data.riskAssessment ?? false,
        insuranceProof: data.insuranceProof ?? false,
        displacedPartyNotified: hasOverrides ? false : undefined,
        bookingDays: {
          deleteMany: {},
          create: buildBookingDayCreateMany(bookingDays),
        },
      },
    });

    // Spawn booking tasks only for required sub-areas
    const tasks: { bookingId: string; area: "TECH" | "BAR" | "FOH" | "STAIR_CLIMBER" | "SETUP"; description: string }[] = [];

    if (techRequired) {
      tasks.push({
        bookingId: id,
        area: "TECH",
        description: "Assign technician",
      });
    }

    if (barRequired) {
      tasks.push({
        bookingId: id,
        area: "BAR",
        description: "Assign bar volunteer",
      });
    }

    if (fohRequired) {
      tasks.push({
        bookingId: id,
        area: "FOH",
        description: "Assign FoH volunteer and Duty Manager",
      });
    }

    if (stairClimberRequired) {
      tasks.push({
        bookingId: id,
        area: "STAIR_CLIMBER",
        description: "Assign stair climber operator",
      });
    }

    if (data.roomLayout) {
      tasks.push({
        bookingId: id,
        area: "SETUP",
        description: "Assign setup volunteer(s)",
      });
    }

    if (tasks.length > 0) {
      await prisma.bookingTask.createMany({ data: tasks });

      // Move to IN_PROGRESS since tasks have been spawned
      await prisma.booking.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    } else {
      // No staff needed — skip straight to READY
      await prisma.booking.update({
        where: { id },
        data: { status: "READY" },
      });
    }

    // Send notifications to relevant admins
    await notifyBookingConfirmed(booking);

    const updated = await prisma.booking.findUnique({
      where: { id },
      include: {
        tasks: true,
        staffAssignments: true,
        bookingDays: { orderBy: [{ date: "asc" }, { sortOrder: "asc" }] },
        hireLineItems: { orderBy: { sortOrder: "asc" } },
      },
    });

    await auditLog({
      action: "BOOKING_CONFIRMED",
      entity: "Booking",
      entityId: id,
      summary: `Confirmed "${booking.eventName}" on ${booking.eventDate ? new Date(booking.eventDate).toLocaleDateString("en-GB") : "TBC"}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
