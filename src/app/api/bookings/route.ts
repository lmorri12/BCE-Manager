import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, requireAuth, handleApiError } from "@/lib/authorize";
import { auditLog } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const bookings = await prisma.booking.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: [
        { eventDate: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      include: {
        tasks: true,
        staffAssignments: true,
        recurringBooking: { select: { groupName: true } },
        createdByUser: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireRole("SUPER_USER", "BOOKINGS_ADMIN");

    const data = await request.json();

    // Verify the user still exists in DB (JWT may outlive a DB reset)
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    const booking = await prisma.booking.create({
      data: {
        bookerName: data.bookerName,
        bookerEmail: data.bookerEmail || null,
        bookerPhone: data.bookerPhone || null,
        eventNameTBC: data.eventNameTBC || null,
        provisionalDates: data.provisionalDates || null,
        status: "ENQUIRY",
        chargeModel: "INTERNAL",
        createdByUserId: userExists ? session.user.id : null,
      },
    });

    await auditLog({
      action: "BOOKING_CREATED",
      entity: "Booking",
      entityId: booking.id,
      summary: `Created enquiry for "${booking.eventNameTBC || booking.bookerName}"`,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
