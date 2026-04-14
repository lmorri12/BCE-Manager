import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  // Verify cron secret (checked by middleware, but double-check here)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 1. Day-of alerts: bookings today with incomplete tasks
  const todaysBookings = await prisma.booking.findMany({
    where: {
      eventDate: { gte: today, lt: tomorrow },
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    include: { tasks: { where: { completed: false } } },
  });

  const bookingsAdmins = await prisma.user.findMany({
    where: { role: { in: ["BOOKINGS_ADMIN", "SUPER_USER"] }, active: true },
    select: { id: true },
  });

  const dayOfNotifications: { userId: string; title: string; message: string; link: string }[] = [];

  for (const booking of todaysBookings) {
    if (booking.tasks.length > 0) {
      const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
      const incompleteAreas = booking.tasks.map((t) => t.area).join(", ");

      for (const admin of bookingsAdmins) {
        dayOfNotifications.push({
          userId: admin.id,
          title: "Incomplete tasks — event today!",
          message: `${eventName} is today but has incomplete tasks: ${incompleteAreas}`,
          link: `/bookings/${booking.id}`,
        });
      }
    }
  }

  // 2. Post-event: move yesterday's events to POST_EVENT
  const yesterdaysBookings = await prisma.booking.findMany({
    where: {
      eventDate: { gte: yesterday, lt: today },
      status: { in: ["READY", "DAY_OF", "IN_PROGRESS", "CONFIRMED"] },
    },
  });

  for (const booking of yesterdaysBookings) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "POST_EVENT" },
    });

    const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
    for (const admin of bookingsAdmins) {
      dayOfNotifications.push({
        userId: admin.id,
        title: "Post-event action needed",
        message: `${eventName} has finished. Ticket reconciliation and feedback needed.`,
        link: `/bookings/${booking.id}`,
      });
    }
  }

  if (dayOfNotifications.length > 0) {
    await prisma.notification.createMany({ data: dayOfNotifications });
  }

  return NextResponse.json({
    dayOfAlerts: todaysBookings.filter((b) => b.tasks.length > 0).length,
    movedToPostEvent: yesterdaysBookings.length,
    notificationsSent: dayOfNotifications.length,
  });
}
