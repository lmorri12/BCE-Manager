import { prisma } from "./db";
import type { Booking, TaskArea } from "@prisma/client";

export async function notifyBookingConfirmed(booking: Booking) {
  const notifications: { userId: string; title: string; message: string; link: string }[] = [];

  const techAdmins = await prisma.user.findMany({
    where: { role: "TECH_ADMIN", active: true },
    select: { id: true },
  });

  const barAdmins = await prisma.user.findMany({
    where: { role: "BAR_ADMIN", active: true },
    select: { id: true },
  });

  const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
  const dateStr = booking.eventDate
    ? new Date(booking.eventDate).toLocaleDateString("en-GB")
    : "TBC";

  if (booking.techRequired) {
    for (const admin of techAdmins) {
      notifications.push({
        userId: admin.id,
        title: "Tech staff needed",
        message: `${eventName} on ${dateStr} requires technical support.`,
        link: `/bookings/${booking.id}`,
      });
    }
  }

  if (booking.barRequired) {
    for (const admin of barAdmins) {
      notifications.push({
        userId: admin.id,
        title: "Bar staff needed",
        message: `${eventName} on ${dateStr} needs bar volunteers.`,
        link: `/bookings/${booking.id}`,
      });
    }
  }

  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}

export async function notifyStaffAssigned(
  booking: Booking,
  area: TaskArea
) {
  const bookingsAdmins = await prisma.user.findMany({
    where: {
      role: { in: ["BOOKINGS_ADMIN", "SUPER_USER"] },
      active: true,
    },
    select: { id: true },
  });

  const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";
  const areaLabel = area === "TECH" ? "Tech" : area === "BAR" ? "Bar" : "FoH";

  await prisma.notification.createMany({
    data: bookingsAdmins.map((admin) => ({
      userId: admin.id,
      title: `${areaLabel} staff assigned`,
      message: `${areaLabel} staff has been assigned for ${eventName}.`,
      link: `/bookings/${booking.id}`,
    })),
  });
}

export async function notifyAllTasksComplete(booking: Booking) {
  const bookingsAdmins = await prisma.user.findMany({
    where: {
      role: { in: ["BOOKINGS_ADMIN", "SUPER_USER"] },
      active: true,
    },
    select: { id: true },
  });

  const eventName = booking.eventName || booking.eventNameTBC || "Unnamed Event";

  await prisma.notification.createMany({
    data: bookingsAdmins.map((admin) => ({
      userId: admin.id,
      title: "Event ready",
      message: `All staff assigned for ${eventName}. Event is ready.`,
      link: `/bookings/${booking.id}`,
    })),
  });
}
