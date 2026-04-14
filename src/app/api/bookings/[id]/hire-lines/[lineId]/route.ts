import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { lineId } = await params;

    const data = await request.json();

    const line = await prisma.hireLineItem.update({
      where: { id: lineId },
      data: {
        description: data.description,
        amount: parseFloat(data.amount),
      },
    });

    return NextResponse.json(line);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { lineId } = await params;

    await prisma.hireLineItem.delete({ where: { id: lineId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
