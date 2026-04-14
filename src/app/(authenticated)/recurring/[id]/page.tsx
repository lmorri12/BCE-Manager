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

  useEffect(() => {
    fetch(`/api/recurring/${params.id}`)
      .then((res) => res.json())
      .then(setItem);
  }, [params.id]);

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
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                name="notes"
                rows={2}
                defaultValue={item.notes || ""}
                className="flex w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
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
                  <div className="flex gap-2">
                    {occ.overriddenByBookingId && (
                      <Badge variant="destructive">Overridden</Badge>
                    )}
                    <Badge variant={occ.status === "CONFIRMED" ? "success" : "secondary"}>
                      {occ.status.replace(/_/g, " ")}
                    </Badge>
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
