"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

type Occurrence = {
  id: string;
  eventName: string | null;
  eventDate: string | null;
  status: string;
  overriddenByBookingId: string | null;
};

type RecurringBooking = {
  id: string;
  groupName: string;
  contactName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  recurrenceStart: string;
  recurrenceEnd: string | null;
  chargeModel: string;
  ticketPrice: string | null;
  techRequired: boolean;
  barRequired: boolean;
  fohRequired: boolean;
  stairClimberRequired: boolean;
  notes: string | null;
  active: boolean;
  occurrences: Occurrence[];
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu",
  FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
};

export default function EditRecurringPage() {
  const router = useRouter();
  const params = useParams();
  const [item, setItem] = useState<RecurringBooking | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function fetchItem() {
    fetch(`/api/recurring/${params.id}`)
      .then((res) => res.json())
      .then(setItem);
  }

  useEffect(() => {
    fetchItem();
  }, [params.id]);

  async function handleCancelOccurrence(occId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const reason = prompt("Reason for cancelling this occurrence:");
    if (!reason?.trim()) return;
    setCancellingId(occId);
    const res = await fetch(`/api/bookings/${occId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setCancellingId(null);
    if (res.ok) fetchItem();
  }

  if (!item) return <div className="p-6">Loading...</div>;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
      .filter((d) => fd.get(d) === "on");

    const res = await fetch(`/api/recurring/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupName: fd.get("groupName"),
        contactName: fd.get("contactName"),
        contactEmail: fd.get("contactEmail"),
        contactPhone: fd.get("contactPhone"),
        daysOfWeek: days,
        startTime: fd.get("startTime"),
        endTime: fd.get("endTime"),
        recurrenceStart: fd.get("recurrenceStart"),
        recurrenceEnd: fd.get("recurrenceEnd") || null,
        chargeModel: fd.get("chargeModel") || "INTERNAL",
        ticketPrice: fd.get("ticketPrice") || null,
        techRequired: fd.get("techRequired") === "on",
        barRequired: fd.get("barRequired") === "on",
        fohRequired: fd.get("fohRequired") === "on",
        stairClimberRequired: fd.get("stairClimberRequired") === "on",
        notes: fd.get("notes"),
        active: fd.get("active") === "on",
      }),
    });

    setSaving(false);
    if (res.ok) {
      router.push("/recurring");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update");
    }
  }

  const futureOccurrences = item.occurrences.filter(
    (o) => o.eventDate && new Date(o.eventDate) >= new Date()
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/recurring")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Edit: {item.groupName}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recurring Booking Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input name="groupName" defaultValue={item.groupName} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Name</Label>
                <Input name="contactName" defaultValue={item.contactName} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input name="contactEmail" type="email" defaultValue={item.contactEmail || ""} />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input name="contactPhone" defaultValue={item.contactPhone || ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(DAY_LABELS).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      name={value}
                      defaultChecked={item.daysOfWeek.includes(value)}
                      className="h-4 w-4"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input name="startTime" type="time" defaultValue={item.startTime} required />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input name="endTime" type="time" defaultValue={item.endTime} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recurrence Start</Label>
                <Input
                  name="recurrenceStart"
                  type="date"
                  defaultValue={item.recurrenceStart.split("T")[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Recurrence End</Label>
                <Input
                  name="recurrenceEnd"
                  type="date"
                  defaultValue={item.recurrenceEnd?.split("T")[0] || ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Charge Model</Label>
                <select name="chargeModel" defaultValue={item.chargeModel} className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm">
                  <option value="INTERNAL">Internal (Free)</option>
                  <option value="STRAIGHT_HIRE">Straight Hire</option>
                  <option value="BOX_OFFICE_SPLIT">Box Office Split</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Ticket Price</Label>
                <Input name="ticketPrice" type="number" step="0.01" defaultValue={item.ticketPrice ? Number(item.ticketPrice) : ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Staff Requirements</Label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="techRequired" defaultChecked={item.techRequired} className="h-4 w-4" /> Tech
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="barRequired" defaultChecked={item.barRequired} className="h-4 w-4" /> Bar
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="fohRequired" defaultChecked={item.fohRequired} className="h-4 w-4" /> FoH
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="stairClimberRequired" defaultChecked={item.stairClimberRequired} className="h-4 w-4" /> Stair Climber
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={item.notes || ""}
                className="flex w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" name="active" defaultChecked={item.active} className="h-4 w-4" />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/recurring")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Upcoming Occurrences */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Occurrences ({futureOccurrences.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {futureOccurrences.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              No upcoming occurrences. Click "Generate" on the recurring bookings list to create them.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {futureOccurrences.map((occ) => (
                <div
                  key={occ.id}
                  className="flex items-center justify-between rounded-md border p-2 text-sm cursor-pointer hover:bg-[var(--muted)]"
                  onClick={() => router.push(`/bookings/${occ.id}`)}
                >
                  <span>
                    {occ.eventDate
                      ? new Date(occ.eventDate).toLocaleDateString("en-GB", {
                          weekday: "short", day: "numeric", month: "short",
                        })
                      : "TBC"}
                  </span>
                  <div className="flex items-center gap-2">
                    {occ.overriddenByBookingId && (
                      <Badge variant="destructive">Overridden</Badge>
                    )}
                    <Badge variant={occ.status === "CANCELLED" ? "destructive" : occ.status === "CONFIRMED" ? "success" : occ.status === "READY" ? "success" : "secondary"}>
                      {occ.status.replace(/_/g, " ")}
                    </Badge>
                    {!["CANCELLED", "CLOSED"].includes(occ.status) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[var(--destructive)] hover:bg-[var(--destructive)]/10"
                        onClick={(e) => handleCancelOccurrence(occ.id, e)}
                        disabled={cancellingId === occ.id}
                      >
                        {cancellingId === occ.id ? "..." : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
