import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/authorize";
import { findConflicts, findAllConflicts } from "@/lib/conflicts";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const excludeId = searchParams.get("excludeId");

    if (date) {
      // Check conflicts for a specific date
      const conflicts = await findConflicts(
        new Date(date),
        excludeId || undefined
      );
      return NextResponse.json(conflicts);
    }

    // Return all conflict dates
    const allConflicts = await findAllConflicts();
    return NextResponse.json(allConflicts);
  } catch (error) {
    return handleApiError(error);
  }
}
