import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, handleApiError } from "@/lib/authorize";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await requireRole("SUPER_USER");

    const text = await request.text();
    const lines = text.split("\n").filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    // Parse header
    const header = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

    // Map expected columns
    const col = (name: string) => header.indexOf(name);
    const eventNameIdx = col("event name");
    const bookerNameIdx = col("booker name");
    const bookerEmailIdx = col("booker email");
    const bookerPhoneIdx = col("booker phone");
    const eventDateIdx = col("event date");
    const eventTimeIdx = col("event time");
    const doorsOpenIdx = col("doors open");
    const chargeModelIdx = col("charge model");
    const statusIdx = col("status");
    const techRequiredIdx = col("tech required");
    const barRequiredIdx = col("bar required");
    const fohRequiredIdx = col("foh required");
    const techRequirementsIdx = col("tech requirements");
    const ticketPriceIdx = col("ticket price");
    const boxOfficeIdx = col("box office split %");

    if (bookerNameIdx === -1) {
      return NextResponse.json(
        { error: "CSV must have a 'Booker Name' column" },
        { status: 400 }
      );
    }

    const results = { created: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      try {
        const fields = parseCSVLine(lines[i]);
        const get = (idx: number) => (idx >= 0 && idx < fields.length ? fields[idx].trim() : "");

        const bookerName = get(bookerNameIdx);
        if (!bookerName) {
          results.errors.push(`Row ${i + 1}: Missing booker name`);
          continue;
        }

        const eventDate = get(eventDateIdx);
        const chargeModelRaw = get(chargeModelIdx).toUpperCase();
        const chargeModel =
          chargeModelRaw === "STRAIGHT_HIRE" || chargeModelRaw === "BOX_OFFICE_SPLIT"
            ? chargeModelRaw
            : "INTERNAL";

        const statusRaw = get(statusIdx).toUpperCase().replace(/ /g, "_");
        const validStatuses = ["ENQUIRY", "CONFIRMED", "IN_PROGRESS", "READY", "POST_EVENT", "CLOSED"];
        const status = validStatuses.includes(statusRaw) ? statusRaw : eventDate ? "CONFIRMED" : "ENQUIRY";

        const yesNo = (val: string) => val.toLowerCase() === "yes" || val === "true" || val === "1";

        await prisma.booking.create({
          data: {
            bookerName,
            bookerEmail: get(bookerEmailIdx) || null,
            bookerPhone: get(bookerPhoneIdx) || null,
            eventName: get(eventNameIdx) || null,
            eventNameTBC: get(eventNameIdx) || null,
            eventDate: eventDate ? new Date(`${eventDate}T12:00:00.000Z`) : null,
            eventTime: get(eventTimeIdx) || null,
            doorsOpenTime: get(doorsOpenIdx) || null,
            chargeModel: chargeModel as any,
            status: status as any,
            techRequired: techRequiredIdx >= 0 ? yesNo(get(techRequiredIdx)) : true,
            barRequired: barRequiredIdx >= 0 ? yesNo(get(barRequiredIdx)) : true,
            fohRequired: fohRequiredIdx >= 0 ? yesNo(get(fohRequiredIdx)) : true,
            techRequirements: get(techRequirementsIdx) || null,
            ticketPrice: get(ticketPriceIdx) ? parseFloat(get(ticketPriceIdx)) : null,
            boxOfficeSplitPct: get(boxOfficeIdx) ? parseFloat(get(boxOfficeIdx)) : null,
            createdByUserId: session.user.id,
          },
        });

        results.created++;
      } catch (err: any) {
        results.errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    await auditLog({
      action: "BULK_IMPORT",
      entity: "Booking",
      summary: `Imported ${results.created} bookings from CSV (${results.errors.length} errors)`,
    });

    return NextResponse.json(results);
  } catch (error) {
    return handleApiError(error);
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}
