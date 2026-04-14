"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, RefreshCw } from "lucide-react";

type RecurringBooking = {
  id: string;
  groupName: string;
  contactName: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  active: boolean;
  _count: { occurrences: number };
};

const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon",
  TUESDAY: "Tue",
  WEDNESDAY: "Wed",
  THURSDAY: "Thu",
  FRIDAY: "Fri",
  SATURDAY: "Sat",
  SUNDAY: "Sun",
};

export default function RecurringPage() {
  const router = useRouter();
  const [items, setItems] = useState<RecurringBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const res = await fetch("/api/recurring");
    setItems(await res.json());
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]
      .filter((d) => fd.get(d) === "on");

    if (days.length === 0) {
      setError("Select at least one day");
      setSaving(false);
      return;
    }

    const res = await fetch("/api/recurring", {
      method: "POST",
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
      }),
    });

    setSaving(false);
    if (res.ok) {
      setShowNew(false);
      fetchItems();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create");
    }
  }

  async function handleGenerate(id: string) {
    setGenerating(id);
    const res = await fetch(`/api/recurring/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weeksAhead: 12 }),
    });
    const data = await res.json();
    setGenerating(null);
    if (res.ok) {
      alert(data.message);
      fetchItems();
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recurring Bookings</h1>
        <Button onClick={() => setShowNew(!showNew)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring Booking
        </Button>
      </div>

      {/* New Recurring Booking Form */}
      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle>New Recurring Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Group Name *</Label>
                  <Input name="groupName" required placeholder="e.g. Drama Club" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Name *</Label>
                  <Input name="contactName" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input name="contactEmail" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input name="contactPhone" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Days of Week *</Label>
                <div className="flex gap-4 flex-wrap">
                  {Object.entries(DAY_LABELS).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" name={value} className="h-4 w-4" />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input name="startTime" type="time" required />
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input name="endTime" type="time" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recurrence Start *</Label>
                  <Input name="recurrenceStart" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>Recurrence End (optional)</Label>
                  <Input name="recurrenceEnd" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  name="notes"
                  rows={2}
                  className="flex w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Creating..." : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNew(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">
              No recurring bookings set up.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 font-medium">Group</th>
                  <th className="p-3 font-medium">Contact</th>
                  <th className="p-3 font-medium">Days</th>
                  <th className="p-3 font-medium">Time</th>
                  <th className="p-3 font-medium">Bookings</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-3 font-medium">{item.groupName}</td>
                    <td className="p-3 text-[var(--muted-foreground)]">{item.contactName}</td>
                    <td className="p-3">
                      {item.daysOfWeek.map((d) => DAY_LABELS[d] || d).join(", ")}
                    </td>
                    <td className="p-3 text-[var(--muted-foreground)]">
                      {item.startTime} - {item.endTime}
                    </td>
                    <td className="p-3">{item._count.occurrences}</td>
                    <td className="p-3">
                      <Badge variant={item.active ? "success" : "secondary"}>
                        {item.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGenerate(item.id)}
                          disabled={generating === item.id}
                        >
                          <RefreshCw className={`mr-1 h-3 w-3 ${generating === item.id ? "animate-spin" : ""}`} />
                          Generate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/recurring/${item.id}`)}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
