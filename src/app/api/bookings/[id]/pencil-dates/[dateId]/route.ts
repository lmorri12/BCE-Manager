import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; dateId: string }> }
) {
  try {
    await requireRole("SUPER_USER", "BOOKINGS_ADMIN");
    const { dateId } = await params;

    await prisma.provisionalDate.delete({ where: { id: dateId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
