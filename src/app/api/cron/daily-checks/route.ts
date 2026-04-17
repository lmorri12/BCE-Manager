import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
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

  const bookingsAdmins = await prisma.user.findMany({
    where: { role: { in: ["BOOKINGS_ADMIN", "SUPER_USER"] }, active: true },
    select: { id: true },
  });

  const notifications: { userId: string; title: string; message: string; link: string }[] = [];

  // 1. Day-of alerts: bookings today with incomplete tasks
  const todaysBookings = await prisma.booking.findMany({
    where: {
      eventDate: { gte: today, lt: tomorrow },
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    include: { tasks: { where: { completed: false } } },
  });

  for (const booking of todaysBookings) {
    if (booking.tasks.length > 0) {
      const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
      const incompleteAreas = booking.tasks.map((t) => t.area).join(", ");

      for (const admin of bookingsAdmins) {
        notifications.push({
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
      notifications.push({
        userId: admin.id,
        title: "Post-event action needed",
        message: `${eventName} has finished. Ticket reconciliation and feedback needed.`,
        link: `/bookings/${booking.id}`,
      });
    }
  }

  // 3. Staff cover alerts — escalating from weekly to daily
  // Daily alerts: events within 7 days that still need staff
  // Weekly alerts: events 8-28 days out that still need staff (only on Mondays)
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const isMonday = dayOfWeek === 1;

  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const twentyEightDaysOut = new Date(today);
  twentyEightDaysOut.setDate(twentyEightDaysOut.getDate() + 28);

  // Daily: events within next 7 days missing staff
  const urgentBookings = await prisma.booking.findMany({
    where: {
      eventDate: { gte: tomorrow, lte: sevenDaysOut },
      status: { in: ["CONFIRMED", "IN_PROGRESS"] },
    },
    include: { tasks: { where: { completed: false } } },
  });

  for (const booking of urgentBookings) {
    if (booking.tasks.length > 0) {
      const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
      const dateStr = booking.eventDate
        ? new Date(booking.eventDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
        : "TBC";
      const areas = booking.tasks.map((t) => t.area).join(", ");

      for (const admin of bookingsAdmins) {
        notifications.push({
          userId: admin.id,
          title: "Staff cover needed this week",
          message: `${eventName} on ${dateStr} still needs: ${areas}`,
          link: `/bookings/${booking.id}`,
        });
      }
    }
  }

  // Weekly (Mondays only): events 8-28 days out missing staff
  if (isMonday) {
    const weeklyBookings = await prisma.booking.findMany({
      where: {
        eventDate: { gt: sevenDaysOut, lte: twentyEightDaysOut },
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      include: { tasks: { where: { completed: false } } },
    });

    for (const booking of weeklyBookings) {
      if (booking.tasks.length > 0) {
        const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
        const dateStr = booking.eventDate
          ? new Date(booking.eventDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
          : "TBC";
        const areas = booking.tasks.map((t) => t.area).join(", ");

        for (const admin of bookingsAdmins) {
          notifications.push({
            userId: admin.id,
            title: "Staff cover needed (upcoming)",
            message: `${eventName} on ${dateStr} still needs: ${areas}`,
            link: `/bookings/${booking.id}`,
          });
        }
      }
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }

  return NextResponse.json({
    dayOfAlerts: todaysBookings.filter((b) => b.tasks.length > 0).length,
    movedToPostEvent: yesterdaysBookings.length,
    urgentStaffAlerts: urgentBookings.filter((b) => b.tasks.length > 0).length,
    notificationsSent: notifications.length,
  });
}
