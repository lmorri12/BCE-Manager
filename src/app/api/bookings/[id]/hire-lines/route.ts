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

    const lines = await prisma.hireLineItem.findMany({
      where: { bookingId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(lines);
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

    const maxSort = await prisma.hireLineItem.aggregate({
      where: { bookingId: id },
      _max: { sortOrder: true },
    });

    const line = await prisma.hireLineItem.create({
      data: {
        bookingId: id,
        description: data.description,
        amount: parseFloat(data.amount),
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(line, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
