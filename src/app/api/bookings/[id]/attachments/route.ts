import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, handleApiError } from "@/lib/authorize";
import { auditLog } from "@/lib/audit";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_FILE_TYPES = [
  "MARKETING_MATERIALS",
  "THEATRE_RENTAL_FORM",
  "CONTRACT",
  "TECH_SPEC",
  "OTHER",
] as const;

// GET /api/bookings/[id]/attachments — list attachments for a booking
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Verify the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const attachments = await prisma.bookingAttachment.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/bookings/[id]/attachments — upload a file attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;

    // Verify the booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("fileType") as string | null;
    const fileTypeOther = formData.get("fileTypeOther") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!fileType || !ALLOWED_FILE_TYPES.includes(fileType as any)) {
      return NextResponse.json(
        { error: `Invalid fileType. Must be one of: ${ALLOWED_FILE_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    if (fileType === "OTHER" && !fileTypeOther?.trim()) {
      return NextResponse.json(
        { error: "fileTypeOther is required when fileType is OTHER" },
        { status: 400 }
      );
    }

    // Build storage path
    const ext = path.extname(file.name) || "";
    const uniqueName = `${crypto.randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "uploads", "bookings", id);
    const storedPath = path.join(uploadDir, uniqueName);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write the file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(storedPath, buffer);

    // Store metadata in DB
    const attachment = await prisma.bookingAttachment.create({
      data: {
        bookingId: id,
        fileName: file.name,
        storedPath,
        fileSize: buffer.length,
        mimeType: file.type || null,
        fileType,
        fileTypeOther: fileType === "OTHER" ? fileTypeOther?.trim() || null : null,
        uploadedBy: session.user?.name || null,
      },
    });

    await auditLog({
      action: "CREATE",
      entity: "BookingAttachment",
      entityId: attachment.id,
      summary: `Uploaded file "${file.name}" (${fileType}) to booking ${id}`,
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
