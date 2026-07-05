"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BookingDayInput } from "@/lib/booking-days";

export function EventDaysEditor({
  days,
  onChange,
}: {
  days: BookingDayInput[];
  onChange: (days: BookingDayInput[]) => void;
}) {
  function updateDay(index: number, field: keyof BookingDayInput, value: string) {
    onChange(
      days.map((day, currentIndex) =>
        currentIndex === index ? { ...day, [field]: value } : day
      )
    );
  }

  function addDay() {
    onChange([
      ...days,
      { date: "", startTime: "", endTime: "", doorsOpenTime: "" },
    ]);
  }

  function removeDay(index: number) {
    if (days.length === 1) {
      onChange([{ date: "", startTime: "", endTime: "", doorsOpenTime: "" }]);
      return;
    }

    onChange(days.filter((_, currentIndex) => currentIndex !== index));
  }

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">
        Event Days
      </legend>
      <p className="text-xs text-[var(--muted-foreground)]">
        Add one row per performance day. The first dated row becomes the booking&apos;s primary date.
      </p>
      <div className="space-y-3">
        {days.map((day, index) => (
          <div
            key={index}
            className="grid grid-cols-[1.2fr_1fr_1fr_1fr_auto] gap-3 rounded-md border border-[var(--border)] p-3"
          >
            <div className="space-y-2">
              <label className="text-xs font-medium">Date {index === 0 ? "*" : ""}</label>
              <Input
                type="date"
                value={day.date}
                onChange={(e) => updateDay(index, "date", e.target.value)}
                required={index === 0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Start time</label>
              <Input
                type="time"
                value={day.startTime}
                onChange={(e) => updateDay(index, "startTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">End time</label>
              <Input
                type="time"
                value={day.endTime}
                onChange={(e) => updateDay(index, "endTime", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Doors open</label>
              <Input
                type="time"
                value={day.doorsOpenTime}
                onChange={(e) => updateDay(index, "doorsOpenTime", e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => removeDay(index)}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" onClick={addDay}>
        Add another day
      </Button>
    </fieldset>
  );
}
