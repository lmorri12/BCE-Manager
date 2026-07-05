export type BookingDayInput = {
  date: string;
  startTime: string;
  endTime: string;
  doorsOpenTime: string;
};

export function normalizeBookingDays(rawDays: unknown): BookingDayInput[] {
  if (!Array.isArray(rawDays)) {
    return [];
  }

  return rawDays
    .map((day) => {
      if (!day || typeof day !== "object") {
        return null;
      }

      const value = day as Record<string, unknown>;

      return {
        date: String(value.date ?? "").trim(),
        startTime: String(value.startTime ?? "").trim(),
        endTime: String(value.endTime ?? "").trim(),
        doorsOpenTime: String(value.doorsOpenTime ?? "").trim(),
      };
    })
    .filter((day): day is BookingDayInput => Boolean(day?.date))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function buildBookingDayCreateMany(days: BookingDayInput[]) {
  return days.map((day, index) => ({
    date: new Date(day.date),
    startTime: day.startTime || null,
    endTime: day.endTime || null,
    doorsOpenTime: day.doorsOpenTime || null,
    sortOrder: index,
  }));
}

export function buildPrimaryBookingFields(days: BookingDayInput[]) {
  const firstDay = days[0];

  return {
    eventDate: firstDay ? new Date(firstDay.date) : null,
    eventTime: firstDay?.startTime || null,
    eventEndTime: firstDay?.endTime || null,
    doorsOpenTime: firstDay?.doorsOpenTime || null,
  };
}

export function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime || endTime || "TBC";
}

export function formatDateRange(startIso: string | null, endIso: string | null) {
  if (!startIso) {
    return "TBC";
  }

  const start = new Date(startIso);
  const startLabel = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!endIso) {
    return startLabel;
  }

  const end = new Date(endIso);
  const endLabel = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}
