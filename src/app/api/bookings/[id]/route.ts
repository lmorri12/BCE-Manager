import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";
import { auditLog, diffChanges } from "@/lib/audit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        tasks: true,
        staffAssignments: true,
        hireLineItems: { orderBy: { sortOrder: "asc" } },
        pencilDates: { orderBy: { date: "asc" } },
        attachments: { orderBy: { createdAt: "desc" }, select: { id: true, fileName: true, fileType: true, fileTypeOther: true, fileSize: true, createdAt: true } },
        overrides: { select: { id: true, eventName: true, bookerName: true } },
        recurringBooking: { select: { groupName: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Check permission: SuperUser can edit all, creator can edit own, Bookings Admin can edit all
    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { createdByUserId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const canEdit =
      session.user.role === "SUPER_USER" ||
      session.user.role === "BOOKINGS_ADMIN" ||
      existing.createdByUserId === session.user.id;

    if (!canEdit) {
      return NextResponse.json({ error: "You can only edit bookings you created" }, { status: 403 });
    }

    const data = await request.json();

    // Get current state for diff
    const before = await prisma.booking.findUnique({ where: { id } });

    // Remove fields that shouldn't be directly updated
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.tasks;
    delete data.staffAssignments;
    delete data.hireLineItems;
    delete data.pencilDates;
    delete data.recurringBooking;
    delete data.createdByUser;
    delete data.createdByUserId;

    const booking = await prisma.booking.update({
      where: { id },
      data,
      include: {
        tasks: true,
        staffAssignments: true,
        hireLineItems: { orderBy: { sortOrder: "asc" } },
        pencilDates: { orderBy: { date: "asc" } },
        attachments: { orderBy: { createdAt: "desc" }, select: { id: true, fileName: true, fileType: true, fileTypeOther: true, fileSize: true, createdAt: true } },
        overrides: { select: { id: true, eventName: true, bookerName: true } },
        recurringBooking: { select: { groupName: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    const trackFields = [
      "status", "bookerName", "bookerEmail", "bookerPhone",
      "eventName", "eventNameTBC", "eventDate", "eventTime",
      "doorsOpenTime", "buildingAccessTime", "chargeModel", "techRequirements",
      "techRequired", "barRequired", "fohRequired", "stairClimberRequired",
      "feedbackFormUrl", "roomLayout", "roomLayoutOther", "setupTime",
      "applicationFormSent", "displacedPartyNotified",
    ];
    const changes = before ? diffChanges(before as any, booking as any, trackFields) : null;
    const eventName = booking.eventName || booking.eventNameTBC || "Unnamed";

    await auditLog({
      action: "BOOKING_UPDATED",
      entity: "Booking",
      entityId: id,
      summary: `Updated "${eventName}"`,
      changes: changes || undefined,
    });

    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { createdByUserId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const canDelete =
      session.user.role === "SUPER_USER" ||
      existing.createdByUserId === session.user.id;

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.booking.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
