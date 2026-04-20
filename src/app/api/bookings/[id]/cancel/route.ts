import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";
import { auditLog } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { id } = await params;

    const data = await request.json();
    const reason = data.reason?.trim();

    if (!reason) {
      return NextResponse.json(
        { error: "A cancellation reason is required" },
        { status: 400 }
      );
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { status: true, eventName: true, eventNameTBC: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (existing.status === "CANCELLED") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
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

    const eventName = existing.eventName || existing.eventNameTBC || "Unnamed";
    await auditLog({
      action: "BOOKING_CANCELLED",
      entity: "Booking",
      entityId: id,
      summary: `Cancelled "${eventName}" — Reason: ${reason}`,
    });

    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error);
  }
}
