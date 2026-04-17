import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";
import { auditLog } from "@/lib/audit";
import { readFile, unlink } from "fs/promises";
import path from "path";

type RouteParams = { params: Promise<{ id: string; attachmentId: string }> };

// GET /api/bookings/[id]/attachments/[attachmentId] — serve the file
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id, attachmentId } = await params;

    const attachment = await prisma.bookingAttachment.findFirst({
      where: { id: attachmentId, bookingId: id },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    let fileBuffer: Buffer;
    try {
      fileBuffer = await readFile(attachment.storedPath);
    } catch {
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 }
      );
    }

    const contentType = attachment.mimeType || "application/octet-stream";
    const fileName = attachment.fileName;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE /api/bookings/[id]/attachments/[attachmentId] — remove attachment
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await requireAuth();
    const { id, attachmentId } = await params;

    const attachment = await prisma.bookingAttachment.findFirst({
      where: { id: attachmentId, bookingId: id },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found" },
        { status: 404 }
      );
    }

    // Delete from disk (ignore error if file already missing)
    try {
      await unlink(attachment.storedPath);
    } catch {
      // File may have been manually removed — proceed with DB cleanup
    }

    // Delete from DB
    await prisma.bookingAttachment.delete({
      where: { id: attachmentId },
    });

    await auditLog({
      action: "DELETE",
      entity: "BookingAttachment",
      entityId: attachmentId,
      summary: `Deleted file "${attachment.fileName}" from booking ${id}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
