"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, CalendarDays, AlertTriangle } from "lucide-react";

type PencilDate = {
  id: string;
  date: string;
  notes: string | null;
};

type ConflictBooking = {
  id: string;
  eventName: string | null;
  eventNameTBC: string | null;
  eventTime: string | null;
  bookerName: string;
  recurringBookingId: string | null;
};

function toDateKey(d: string): string {
  return new Date(d).toISOString().split("T")[0];
}

export function PencilDates({
  bookingId,
  dates,
  onUpdate,
}: {
  bookingId: string;
  dates: PencilDate[];
  onUpdate: () => void;
}) {
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [conflictsByDate, setConflictsByDate] = useState<Record<string, ConflictBooking[]>>({});
  const [newDateConflicts, setNewDateConflicts] = useState<ConflictBooking[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadConflicts() {
      const entries = await Promise.all(
        dates.map(async (d) => {
          const key = toDateKey(d.date);
          const res = await fetch(
            `/api/bookings/conflicts?date=${key}&excludeId=${bookingId}`
          );
          if (!res.ok) return [key, [] as ConflictBooking[]] as const;
          const conflicts: ConflictBooking[] = await res.json();
          return [key, conflicts] as const;
        })
      );
      if (cancelled) return;
      const map: Record<string, ConflictBooking[]> = {};
      for (const [k, v] of entries) map[k] = v;
      setConflictsByDate(map);
    }
    if (dates.length > 0) loadConflicts();
    else setConflictsByDate({});
    return () => {
      cancelled = true;
    };
  }, [dates, bookingId]);

  useEffect(() => {
    if (!newDate) {
      setNewDateConflicts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/bookings/conflicts?date=${newDate}&excludeId=${bookingId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setNewDateConflicts(data);
      });
    return () => {
      cancelled = true;
    };
  }, [newDate, bookingId]);

  async function handleAdd() {
    if (!newDate) return;
    setAdding(true);

    await fetch(`/api/bookings/${bookingId}/pencil-dates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, notes: newNotes }),
    });

    setAdding(false);
    setNewDate("");
    setNewNotes("");
    setNewDateConflicts([]);
    onUpdate();
  }

  async function handleRemove(dateId: string) {
    await fetch(`/api/bookings/${bookingId}/pencil-dates/${dateId}`, {
      method: "DELETE",
    });
    onUpdate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Pencil Dates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dates.length > 0 ? (
          <div className="space-y-2">
            {dates.map((d) => {
              const key = toDateKey(d.date);
              const conflicts = conflictsByDate[key] || [];
              const hasConflict = conflicts.length > 0;
              return (
                <div
                  key={d.id}
                  className={`rounded-lg border p-3 ${
                    hasConflict
                      ? "border-red-300 bg-red-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {hasConflict && (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium">
                        {new Date(d.date).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      {d.notes && (
                        <span className="text-sm text-[var(--muted-foreground)]">
                          — {d.notes}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(d.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {hasConflict && (
                    <div className="mt-2 space-y-1 text-xs text-red-700">
                      <p className="font-medium">
                        Conflicts with {conflicts.length} existing booking
                        {conflicts.length === 1 ? "" : "s"}:
                      </p>
                      <ul className="list-disc pl-5">
                        {conflicts.map((c) => (
                          <li key={c.id}>
                            {c.eventName || c.eventNameTBC || "Unnamed"}
                            {c.eventTime && ` at ${c.eventTime}`} — {c.bookerName}
                            {c.recurringBookingId && " (recurring)"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            No pencil dates added. Add dates being considered for this booking — they&apos;ll appear on the calendar.
          </p>
        )}

        <div className="space-y-2 border-t pt-3">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Date</label>
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium">Notes (optional)</label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Evening preferred"
              />
            </div>
            <Button onClick={handleAdd} disabled={!newDate || adding}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
          {newDate && newDateConflicts.length > 0 && (
            <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">
              <p className="flex items-center gap-1 font-medium">
                <AlertTriangle className="h-3 w-3" />
                This date already has {newDateConflicts.length} booking
                {newDateConflicts.length === 1 ? "" : "s"}:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {newDateConflicts.map((c) => (
                  <li key={c.id}>
                    {c.eventName || c.eventNameTBC || "Unnamed"}
                    {c.eventTime && ` at ${c.eventTime}`} — {c.bookerName}
                    {c.recurringBookingId && " (recurring)"}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
