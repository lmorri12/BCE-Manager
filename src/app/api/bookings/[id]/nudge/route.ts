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

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        staffAssignments: true,
        tasks: { where: { completed: false } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
    const dateStr = booking.eventDate
      ? new Date(booking.eventDate).toLocaleDateString("en-GB")
      : "TBC";

    const incompleteAreas = booking.tasks.map((t) => t.area).join(", ");

    const notifications: { userId: string; title: string; message: string; link: string }[] = [];

    const techAdmins = await prisma.user.findMany({
      where: { role: "TECH_ADMIN", active: true },
      select: { id: true },
    });
    const barAdmins = await prisma.user.findMany({
      where: { role: "BAR_ADMIN", active: true },
      select: { id: true },
    });
    const bookingsAdmins = await prisma.user.findMany({
      where: { role: { in: ["BOOKINGS_ADMIN", "SUPER_USER"] }, active: true },
      select: { id: true },
    });

    const message = incompleteAreas
      ? `Reminder: "${eventName}" on ${dateStr} still needs: ${incompleteAreas}`
      : `Reminder: "${eventName}" on ${dateStr} — please check this booking.`;

    if (booking.techRequired && booking.tasks.some((t) => t.area === "TECH")) {
      for (const admin of techAdmins) {
        notifications.push({
          userId: admin.id,
          title: "Nudge: Staff needed",
          message,
          link: `/bookings/${booking.id}`,
        });
      }
    }

    if (booking.barRequired && booking.tasks.some((t) => t.area === "BAR")) {
      for (const admin of barAdmins) {
        notifications.push({
          userId: admin.id,
          title: "Nudge: Staff needed",
          message,
          link: `/bookings/${booking.id}`,
        });
      }
    }

    for (const admin of bookingsAdmins) {
      notifications.push({
        userId: admin.id,
        title: "Nudge: Booking reminder",
        message,
        link: `/bookings/${booking.id}`,
      });
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({ data: notifications });
    }

    await auditLog({
      action: "BOOKING_NUDGE",
      entity: "Booking",
      entityId: id,
      summary: `Manual nudge sent for "${eventName}" — ${notifications.length} notification(s)`,
    });

    return NextResponse.json({ sent: notifications.length });
  } catch (error) {
    return handleApiError(error);
  }
}
