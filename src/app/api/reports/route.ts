import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function GET(request: Request) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");

    const { searchParams } = new URL(request.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), 0, 1);
    const to = toStr ? new Date(toStr) : new Date();
    to.setHours(23, 59, 59, 999);

    const bookings = await prisma.booking.findMany({
      where: {
        eventDate: { gte: from, lte: to },
      },
      select: {
        id: true,
        status: true,
        eventName: true,
        eventNameTBC: true,
        eventDate: true,
        eventTime: true,
        chargeModel: true,
        ticketPrice: true,
        bookerName: true,
        techRequired: true,
        barRequired: true,
        fohRequired: true,
        recurringBookingId: true,
        staffAssignments: { select: { staffName: true, role: true } },
        hireLineItems: { select: { amount: true } },
      },
    });

    // 1. Totals by status
    const byStatus: Record<string, number> = {};
    for (const b of bookings) {
      byStatus[b.status] = (byStatus[b.status] || 0) + 1;
    }

    // 2. Totals by charge model
    const byChargeModel: Record<string, number> = {};
    for (const b of bookings) {
      byChargeModel[b.chargeModel] = (byChargeModel[b.chargeModel] || 0) + 1;
    }

    // 3. Revenue summary (hire line totals)
    let totalHireRevenue = 0;
    for (const b of bookings) {
      for (const line of b.hireLineItems) {
        totalHireRevenue += Number(line.amount);
      }
    }

    // 4. Bookings by month
    const byMonth: Record<string, { total: number; internal: number; external: number }> = {};
    for (const b of bookings) {
      if (!b.eventDate) continue;
      const d = new Date(b.eventDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { total: 0, internal: 0, external: 0 };
      byMonth[key].total++;
      if (b.chargeModel === "INTERNAL") byMonth[key].internal++;
      else byMonth[key].external++;
    }

    // 5. Busiest days of week
    const byDayOfWeek: Record<string, number> = {
      Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0,
    };
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (const b of bookings) {
      if (!b.eventDate) continue;
      const day = dayNames[new Date(b.eventDate).getDay()];
      byDayOfWeek[day]++;
    }

    // 6. Top bookers (regular users)
    const bookerCounts: Record<string, number> = {};
    for (const b of bookings) {
      bookerCounts[b.bookerName] = (bookerCounts[b.bookerName] || 0) + 1;
    }
    const topBookers = Object.entries(bookerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    // 7. Recurring vs one-off
    const recurringCount = bookings.filter((b) => b.recurringBookingId).length;
    const oneOffCount = bookings.length - recurringCount;

    // 8. Staff workload
    const staffCounts: Record<string, { name: string; count: number; roles: Set<string> }> = {};
    for (const b of bookings) {
      for (const a of b.staffAssignments) {
        if (!staffCounts[a.staffName]) {
          staffCounts[a.staffName] = { name: a.staffName, count: 0, roles: new Set() };
        }
        staffCounts[a.staffName].count++;
        staffCounts[a.staffName].roles.add(a.role);
      }
    }
    const staffWorkload = Object.values(staffCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)
      .map((s) => ({ name: s.name, count: s.count, roles: Array.from(s.roles) }));

    // 9. Venue utilisation (days with at least one booking / total days in range)
    const daysWithBooking = new Set<string>();
    for (const b of bookings) {
      if (!b.eventDate) continue;
      const d = new Date(b.eventDate);
      daysWithBooking.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const utilisationPct = totalDays > 0 ? Math.round((daysWithBooking.size / totalDays) * 100) : 0;

    return NextResponse.json({
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      totalBookings: bookings.length,
      byStatus,
      byChargeModel,
      totalHireRevenue,
      byMonth: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)),
      byDayOfWeek,
      topBookers,
      recurringCount,
      oneOffCount,
      staffWorkload,
      utilisationPct,
      daysUsed: daysWithBooking.size,
      totalDays,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
