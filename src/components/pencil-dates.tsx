"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, CalendarDays } from "lucide-react";

type PencilDate = {
  id: string;
  date: string;
  notes: string | null;
};

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
            {dates.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3"
              >
                <div>
                  <span className="font-medium">
                    {new Date(d.date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {d.notes && (
                    <span className="ml-2 text-sm text-[var(--muted-foreground)]">
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
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            No pencil dates added. Add dates being considered for this booking — they&apos;ll appear on the calendar.
          </p>
        )}

        <div className="flex items-end gap-3 border-t pt-3">
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
      </CardContent>
    </Card>
  );
}
