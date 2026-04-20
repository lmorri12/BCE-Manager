"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

type BookingType = "ENQUIRY" | "CONFIRMED" | "INTERNAL";
type PencilDateEntry = { date: string; notes: string };

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillDate = searchParams.get("date") || "";
  const [bookingType, setBookingType] = useState<BookingType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chargeModel, setChargeModel] = useState("STRAIGHT_HIRE");
  const [pencilDates, setPencilDates] = useState<PencilDateEntry[]>([]);
  const [newPencilDate, setNewPencilDate] = useState("");
  const [newPencilNotes, setNewPencilNotes] = useState("");
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null);
  const [pendingConfirmData, setPendingConfirmData] = useState<Record<string, unknown> | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);

    if (bookingType === "ENQUIRY") {
      // Create as enquiry — minimal fields
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookerName: fd.get("bookerName"),
          bookerEmail: fd.get("bookerEmail"),
          bookerPhone: fd.get("bookerPhone"),
          eventNameTBC: fd.get("eventNameTBC"),
          provisionalDates: fd.get("provisionalDates"),
        }),
      });

      setLoading(false);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create");
      } else {
        const booking = await res.json();

        // Create pencil dates if any were added
        for (const pd of pencilDates) {
          await fetch(`/api/bookings/${booking.id}/pencil-dates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date: pd.date, notes: pd.notes }),
          });
        }

        router.push(`/bookings/${booking.id}`);
      }
    } else {
      // Create and immediately confirm
      const isInternal = bookingType === "INTERNAL";

      // First create the enquiry
      const createRes = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookerName: fd.get("bookerName"),
          bookerEmail: fd.get("bookerEmail"),
          bookerPhone: fd.get("bookerPhone"),
          eventNameTBC: fd.get("eventName"),
        }),
      });

      if (!createRes.ok) {
        setLoading(false);
        const data = await createRes.json();
        setError(data.error || "Failed to create");
        return;
      }

      const booking = await createRes.json();

      // Then confirm it with full details
      const confirmPayload = {
        eventName: fd.get("eventName"),
        eventDate: fd.get("eventDate"),
        eventTime: fd.get("eventTime"),
        doorsOpenTime: fd.get("doorsOpenTime"),
        buildingAccessTime: fd.get("buildingAccessTime"),
        hasInterval: fd.get("hasInterval") === "on",
        techRequirements: fd.get("techRequirements"),
        ticketPrice: fd.get("ticketPrice"),
        ticketSetupInfo: fd.get("ticketSetupInfo"),
        techContactName: fd.get("techContactName"),
        techContactPhone: fd.get("techContactPhone"),
        techContactEmail: fd.get("techContactEmail"),
        feedbackFormUrl: fd.get("feedbackFormUrl"),
        roomLayout: fd.get("roomLayout") || null,
        roomLayoutOther: fd.get("roomLayoutOther") || null,
        setupDate: fd.get("setupDate") || null,
        setupTime: fd.get("setupTime") || null,
        setupNotes: fd.get("setupNotes") || null,
        chargeModel: isInternal ? "INTERNAL" : fd.get("chargeModel"),
        boxOfficeSplitPct: fd.get("boxOfficeSplitPct"),
        techRequired: fd.get("techRequired") === "on",
        barRequired: fd.get("barRequired") === "on",
        fohRequired: fd.get("fohRequired") === "on",
        stairClimberRequired: fd.get("stairClimberRequired") === "on",
        marketingAssets: fd.get("marketingAssets") === "on",
        riskAssessment: fd.get("riskAssessment") === "on",
        insuranceProof: fd.get("insuranceProof") === "on",
      };

      const confirmRes = await fetch(`/api/bookings/${booking.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmPayload),
      });

      setLoading(false);
      if (confirmRes.status === 409) {
        const data = await confirmRes.json();
        setConflicts(data.conflicts);
        setPendingBookingId(booking.id);
        setPendingConfirmData(confirmPayload);
        return;
      }
      if (!confirmRes.ok) {
        const data = await confirmRes.json();
        setError(data.error || "Failed to confirm");
      } else {
        router.push(`/bookings/${booking.id}`);
      }
    }
  }

  async function handleForceConfirm() {
    if (!pendingBookingId || !pendingConfirmData) return;
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/bookings/${pendingBookingId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...pendingConfirmData, forceConfirm: true }),
    });

    setLoading(false);
    setConflicts([]);
    setPendingConfirmData(null);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to confirm");
    } else {
      router.push(`/bookings/${pendingBookingId}`);
    }
  }

  // Step 1: Choose type
  if (!bookingType) {
    return (
      <div className="max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold">New Booking</h1>
        <div className="grid grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-amber-400"
            onClick={() => setBookingType("ENQUIRY")}
          >
            <CardHeader>
              <CardTitle className="text-lg">Pencil Booking</CardTitle>
              <CardDescription>
                Provisional enquiry — dates and details to be confirmed later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full rounded bg-amber-400" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-500"
            onClick={() => setBookingType("CONFIRMED")}
          >
            <CardHeader>
              <CardTitle className="text-lg">Confirmed Booking</CardTitle>
              <CardDescription>
                External booking with all details ready. Chargeable (hire or box office split).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full rounded bg-blue-500" />
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-500"
            onClick={() => setBookingType("INTERNAL")}
          >
            <CardHeader>
              <CardTitle className="text-lg">Internal Booking</CardTitle>
              <CardDescription>
                Internal / non-chargeable event. Free use of the venue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full rounded bg-green-500" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isEnquiry = bookingType === "ENQUIRY";
  const isInternal = bookingType === "INTERNAL";

  const typeLabels: Record<BookingType, string> = {
    ENQUIRY: "Pencil Booking",
    CONFIRMED: "Confirmed Booking",
    INTERNAL: "Internal Booking",
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">New {typeLabels[bookingType]}</h1>
        <Button variant="outline" size="sm" onClick={() => setBookingType(null)}>
          Change type
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            {/* Booker Details — always shown */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                Booker Details
              </legend>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Booker Name *</Label>
                  <Input name="bookerName" required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="bookerEmail" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="bookerPhone" />
                </div>
              </div>
            </fieldset>

            {/* Enquiry-only fields */}
            {isEnquiry && (
              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                  Enquiry Info
                </legend>
                <div className="space-y-2">
                  <Label>Event Name (if known)</Label>
                  <Input name="eventNameTBC" placeholder="Can be added later" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea
                    name="provisionalDates"
                    rows={2}
                    placeholder="Any general notes about this enquiry"
                    className="flex w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                  />
                </div>

                {/* Pencil Dates */}
                <div className="space-y-3">
                  <Label>Pencil Dates (shown on calendar)</Label>

                  {pencilDates.length > 0 && (
                    <div className="space-y-2">
                      {pencilDates.map((pd, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm">
                          <div>
                            <span className="font-medium">
                              {new Date(pd.date + "T00:00:00").toLocaleDateString("en-GB", {
                                weekday: "short", day: "numeric", month: "short", year: "numeric",
                              })}
                            </span>
                            {pd.notes && <span className="ml-2 text-[var(--muted-foreground)]">— {pd.notes}</span>}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setPencilDates(pencilDates.filter((_, j) => j !== i))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Date</label>
                      <Input
                        type="date"
                        value={newPencilDate}
                        onChange={(e) => setNewPencilDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-xs font-medium">Notes</label>
                      <Input
                        value={newPencilNotes}
                        onChange={(e) => setNewPencilNotes(e.target.value)}
                        placeholder="e.g. Evening preferred"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (!newPencilDate) return;
                        setPencilDates([...pencilDates, { date: newPencilDate, notes: newPencilNotes }]);
                        setNewPencilDate("");
                        setNewPencilNotes("");
                      }}
                      disabled={!newPencilDate}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </fieldset>
            )}

            {/* Event Details — for confirmed and internal */}
            {!isEnquiry && (
              <>
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Event Details
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Event Name *</Label>
                      <Input name="eventName" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Event Date *</Label>
                      <Input name="eventDate" type="date" required defaultValue={prefillDate} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Event Time</Label>
                      <Input name="eventTime" type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label>Doors Open</Label>
                      <Input name="doorsOpenTime" type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label>Building Access</Label>
                      <Input name="buildingAccessTime" type="time" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="hasInterval" name="hasInterval" className="h-4 w-4" />
                    <Label htmlFor="hasInterval">Has Interval</Label>
                  </div>
                </fieldset>

                {/* Tech */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Technical
                  </legend>
                  <div className="space-y-2">
                    <Label>Tech Requirements</Label>
                    <textarea
                      name="techRequirements"
                      rows={2}
                      placeholder="Sound, lighting, projector, etc."
                      className="flex w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tech Contact Name</Label>
                      <Input name="techContactName" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tech Contact Phone</Label>
                      <Input name="techContactPhone" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tech Contact Email</Label>
                      <Input name="techContactEmail" type="email" />
                    </div>
                  </div>
                </fieldset>

                {/* Room Layout */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Room Layout
                  </legend>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Layout</Label>
                      <select name="roomLayout" className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                        <option value="">Not set</option>
                        <option value="RAKED_100">Raked Seating 100</option>
                        <option value="RAKED_114">Raked Seating 114</option>
                        <option value="CABARET_LARGE">Cabaret - Large Round Tables</option>
                        <option value="CABARET_SMALL">Cabaret - Small Round Tables</option>
                        <option value="CABARET_TRESSLE">Cabaret - Tressle Tables</option>
                        <option value="MARKET">Market Style</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Setup Date</Label>
                      <Input name="setupDate" type="date" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Setup Time</Label>
                      <Input name="setupTime" type="time" />
                    </div>
                    <div className="space-y-2">
                      <Label>Other Layout (if Other selected)</Label>
                      <Input name="roomLayoutOther" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Setup Notes</Label>
                    <Input name="setupNotes" placeholder="e.g. Seats in by 14:00, clear by 23:00" />
                  </div>
                </fieldset>

                {/* Staff Requirements */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Staff Requirements
                  </legend>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Untick any areas not needed for this event (e.g. rehearsals, dance lessons). Tick stair climber if an operator is required.
                  </p>
                  <div className="flex gap-6 flex-wrap">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="techRequired" defaultChecked className="h-4 w-4" />
                      Tech required
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="barRequired" defaultChecked className="h-4 w-4" />
                      Bar required
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="fohRequired" defaultChecked className="h-4 w-4" />
                      FoH required
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="stairClimberRequired" className="h-4 w-4" />
                      Stair climber operator
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Label>Feedback Form URL (optional)</Label>
                    <Input name="feedbackFormUrl" type="url" placeholder="https://..." />
                  </div>
                </fieldset>

                {/* Charge Model — only for non-internal */}
                {!isInternal && (
                  <fieldset className="space-y-4">
                    <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                      Charges
                    </legend>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Charge Model *</Label>
                        <select
                          name="chargeModel"
                          value={chargeModel}
                          onChange={(e) => setChargeModel(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                        >
                          <option value="STRAIGHT_HIRE">Straight Hire</option>
                          <option value="BOX_OFFICE_SPLIT">Box Office Split</option>
                        </select>
                      </div>
                      {chargeModel === "BOX_OFFICE_SPLIT" && (
                        <div className="space-y-2">
                          <Label>Box Office Split %</Label>
                          <Input name="boxOfficeSplitPct" type="number" step="0.01" min="0" max="100" placeholder="e.g. 80" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Ticket Price (£)</Label>
                        <Input name="ticketPrice" type="number" step="0.01" min="0" />
                      </div>
                      <div className="space-y-2">
                        <Label>Ticket Setup Info</Label>
                        <Input name="ticketSetupInfo" placeholder="Pricing tiers, concessions, etc." />
                      </div>
                    </div>
                  </fieldset>
                )}

                {/* Checklists */}
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
                    Checklists
                  </legend>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="marketingAssets" className="h-4 w-4" />
                      Marketing Assets
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="riskAssessment" className="h-4 w-4" />
                      Risk Assessment
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="insuranceProof" className="h-4 w-4" />
                      Insurance Proof
                    </label>
                  </div>
                </fieldset>
              </>
            )}

            {/* Conflict Warning */}
            {conflicts.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
                <p className="font-medium text-amber-800">
                  Booking conflict detected
                </p>
                <p className="text-sm text-amber-700">
                  There {conflicts.length === 1 ? "is" : "are"} {conflicts.length} other booking{conflicts.length === 1 ? "" : "s"} on this date:
                </p>
                <div className="space-y-2">
                  {conflicts.map((c: any) => (
                    <div key={c.id} className="rounded border border-amber-200 bg-white p-2 text-sm">
                      <span className="font-medium">{c.eventName || c.eventNameTBC || "Unnamed"}</span>
                      {c.eventTime && <span className="text-amber-600"> at {c.eventTime}</span>}
                      <span className="text-amber-600"> — {c.bookerName}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleForceConfirm}
                    disabled={loading}
                  >
                    Confirm Anyway
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setConflicts([]); setPendingConfirmData(null); }}
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t">
              <Button type="submit" disabled={loading || conflicts.length > 0}>
                {loading
                  ? "Creating..."
                  : isEnquiry
                    ? "Create Enquiry"
                    : `Create ${isInternal ? "Internal" : "Confirmed"} Booking`}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/bookings")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
