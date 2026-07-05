export function normalizeTicketPriceInput(value: unknown): {
  ticketPrice: number | null;
  ticketPriceDisplay: string | null;
} {
  const raw = value == null ? "" : String(value).trim();

  if (!raw) {
    return {
      ticketPrice: null,
      ticketPriceDisplay: null,
    };
  }

  const normalizedNumeric = raw.replace(/^£\s*/, "");
  if (/^\d+(\.\d{1,2})?$/.test(normalizedNumeric)) {
    return {
      ticketPrice: Number.parseFloat(normalizedNumeric),
      ticketPriceDisplay: null,
    };
  }

  return {
    ticketPrice: null,
    ticketPriceDisplay: raw,
  };
}

export function formatTicketPriceDisplay(
  ticketPriceDisplay: string | null | undefined,
  ticketPrice: unknown
): string {
  if (ticketPriceDisplay?.trim()) {
    return ticketPriceDisplay.trim();
  }

  if (ticketPrice == null || ticketPrice === "") {
    return "N/A";
  }

  const numericValue =
    typeof ticketPrice === "number" ? ticketPrice : Number(String(ticketPrice));

  if (Number.isNaN(numericValue)) {
    return String(ticketPrice);
  }

  return `£${numericValue.toFixed(2)}`;
}
