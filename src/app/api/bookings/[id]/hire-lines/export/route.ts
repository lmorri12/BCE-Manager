import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { eventName: true, eventNameTBC: true, bookerName: true },
    });

    const lines = await prisma.hireLineItem.findMany({
      where: { bookingId: id },
      orderBy: { sortOrder: "asc" },
    });

    const eventName = booking?.eventName || booking?.eventNameTBC || "Unknown";

    // Build CSV
    const rows = [["Description", "Amount (£)"]];
    let total = 0;
    for (const line of lines) {
      const amount = Number(line.amount);
      rows.push([line.description, amount.toFixed(2)]);
      total += amount;
    }
    rows.push(["TOTAL", total.toFixed(2)]);

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hire-lines-${eventName.replace(/[^a-zA-Z0-9]/g, "-")}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
