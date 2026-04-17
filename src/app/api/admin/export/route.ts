import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function GET() {
  try {
    await requireRole("SUPER_USER");

    const bookings = await prisma.booking.findMany({
      orderBy: { eventDate: "asc" },
      include: {
        staffAssignments: true,
        createdByUser: { select: { name: true } },
      },
    });

    const headers = [
      "ID", "Status", "Event Name", "Booker Name", "Booker Email", "Booker Phone",
      "Event Date", "Event Time", "Doors Open", "Charge Model", "Box Office Split %",
      "Ticket Price", "Tech Required", "Bar Required", "FoH Required",
      "Tech Requirements", "Has Interval", "Created By", "Created At",
      "Technician", "Bar Volunteer", "FoH Volunteer", "Duty Manager",
    ];

    const rows = bookings.map((b) => {
      const getStaff = (role: string) =>
        b.staffAssignments.filter((a) => a.role === role).map((a) => a.staffName).join("; ");

      return [
        b.id,
        b.status,
        b.eventName || b.eventNameTBC || "",
        b.bookerName,
        b.bookerEmail || "",
        b.bookerPhone || "",
        b.eventDate ? new Date(b.eventDate).toISOString().split("T")[0] : "",
        b.eventTime || "",
        b.doorsOpenTime || "",
        b.chargeModel,
        b.boxOfficeSplitPct ? String(b.boxOfficeSplitPct) : "",
        b.ticketPrice ? String(b.ticketPrice) : "",
        b.techRequired ? "Yes" : "No",
        b.barRequired ? "Yes" : "No",
        b.fohRequired ? "Yes" : "No",
        b.techRequirements || "",
        b.hasInterval ? "Yes" : "No",
        b.createdByUser?.name || "",
        b.createdAt.toISOString(),
        getStaff("TECHNICIAN"),
        getStaff("BAR_VOLUNTEER"),
        getStaff("FOH_VOLUNTEER"),
        getStaff("DUTY_MANAGER"),
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="bce-bookings-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
