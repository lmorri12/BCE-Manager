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

    const booking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CLOSED",
        ticketsReconciled: data.ticketsReconciled ?? false,
        feedbackNotes: data.feedbackNotes || null,
        closedAt: new Date(),
      },
    });

    await auditLog({
      action: "BOOKING_CLOSED",
      entity: "Booking",
      entityId: id,
      summary: `Closed "${booking.eventName || "Unnamed"}"${booking.ticketsReconciled ? " (tickets reconciled)" : ""}`,
    });

    return NextResponse.json(booking);
  } catch (error) {
    return handleApiError(error);
  }
}
