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

    const dates = await prisma.provisionalDate.findMany({
      where: { bookingId: id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(dates);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { id } = await params;
    const data = await request.json();

    const date = await prisma.provisionalDate.create({
      data: {
        bookingId: id,
        date: new Date(data.date),
        notes: data.notes || null,
      },
    });

    return NextResponse.json(date, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
