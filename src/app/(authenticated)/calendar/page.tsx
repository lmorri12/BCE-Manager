"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Clock, MapPin } from "lucide-react";

type CalendarBooking = {
  id: string;
  status: string;
  eventName: string | null;
  eventNameTBC: string | null;
  eventDate: string | null;
  eventTime: string | null;
  doorsOpenTime: string | null;
  bookerName: string;
  chargeModel: string;
  recurringBookingId: string | null;
  isPencilDate: boolean;
  pencilNotes: string | null;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getEventStyle(booking: CalendarBooking) {
  if (booking.isPencilDate || booking.status === "ENQUIRY") {
    return {
      bg: "bg-amber-50",
      border: "border-l-amber-400",
      dot: "bg-amber-400",
      text: "text-amber-900",
      label: "Pencil",
    };
  }
  if (booking.chargeModel === "INTERNAL") {
    return {
      bg: "bg-emerald-50",
      border: "border-l-emerald-500",
      dot: "bg-emerald-500",
      text: "text-emerald-900",
      label: "Internal",
    };
  }
  return {
    bg: "bg-blue-50",
    border: "border-l-blue-500",
    dot: "bg-blue-500",
    text: "text-blue-900",
    label: "Confirmed",
  };
}

function getLabel(booking: CalendarBooking): string {
  return booking.eventName || booking.eventNameTBC || "Unnamed";
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?year=${year}&month=${month}`);
    if (res.ok) setBookings(await res.json());
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(year - 1); } else { setMonth(month - 1); }
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(year + 1); } else { setMonth(month + 1); }
    setSelectedDay(null);
  }
  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setSelectedDay(null);
  }

  // Build calendar grid (Monday start)
  const firstOfMonth = new Date(year, month - 1, 1);
  const lastOfMonth = new Date(year, month, 0);
  const dayOfWeek = firstOfMonth.getDay();
  const startOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
    if (cursor > lastOfMonth && w >= 4) break;
  }

  // Group bookings by date
  const bookingsByDate: Record<string, CalendarBooking[]> = {};
  for (const b of bookings) {
    if (b.eventDate) {
      const key = dateKey(new Date(b.eventDate));
      if (!bookingsByDate[key]) bookingsByDate[key] = [];
      bookingsByDate[key].push(b);
    }
  }

  const todayKey = dateKey(new Date());
  const dayBookings = selectedDay ? (bookingsByDate[selectedDay] || []) : [];
  const selectedDate = selectedDay ? new Date(selectedDay + "T00:00:00") : null;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-800">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
          <div className="flex items-center rounded-md border border-gray-200">
            <button
              onClick={prevMonth}
              className="px-2 py-1.5 hover:bg-gray-50 transition-colors rounded-l-md"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <button
              onClick={nextMonth}
              className="px-2 py-1.5 hover:bg-gray-50 transition-colors rounded-r-md border-l border-gray-200"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            Today
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Pencil
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Internal
          </span>
        </div>
      </div>

      {/* Calendar + Day Panel */}
      <div className="flex-1 flex gap-0 min-h-0">
        {/* Month Grid */}
        <div className={`flex-1 flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm ${selectedDay ? "" : ""}`}>
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2.5 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex-1 grid grid-rows-[repeat(auto-fill,1fr)]">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-gray-50 last:border-b-0 min-h-0">
                {week.map((day) => {
                  const key = dateKey(day);
                  const isCurrentMonth = day.getMonth() === month - 1;
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDay;
                  const events = bookingsByDate[key] || [];
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedDay(isSelected ? null : key)}
                      className={`
                        border-r border-gray-50 last:border-r-0 p-1 cursor-pointer transition-all min-h-[80px] overflow-hidden
                        ${!isCurrentMonth ? "bg-gray-25" : isWeekend ? "bg-gray-50/30" : "bg-white"}
                        ${isSelected ? "ring-2 ring-blue-500 ring-inset bg-blue-50/30" : "hover:bg-gray-50/50"}
                      `}
                    >
                      {/* Date number */}
                      <div className="flex items-center justify-between px-1 mb-0.5">
                        <span
                          className={`
                            text-xs leading-6
                            ${isToday ? "flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-semibold" : ""}
                            ${!isCurrentMonth ? "text-gray-300" : isToday ? "" : "text-gray-700 font-medium"}
                          `}
                        >
                          {day.getDate()}
                        </span>
                        {events.filter(e => e.status !== "ENQUIRY" && !e.isPencilDate).length > 1 && (
                          <span className="text-[10px] font-medium text-amber-600" title="Multiple bookings on this date">
                            !!
                          </span>
                        )}
                        {events.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{events.length - 3}</span>
                        )}
                      </div>

                      {/* Events */}
                      <div className="space-y-px">
                        {events.slice(0, 3).map((b, i) => {
                          const style = getEventStyle(b);
                          return (
                            <div
                              key={`${b.id}-${i}`}
                              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-tight truncate ${style.bg} ${style.text}`}
                              title={`${getLabel(b)} — ${b.bookerName}${b.pencilNotes ? ` (${b.pencilNotes})` : ""}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                              <span className="truncate">
                                {b.eventTime && <span className="opacity-60">{b.eventTime} </span>}
                                {getLabel(b)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Day Detail Panel */}
        {selectedDay && selectedDate && (
          <div className="w-80 ml-4 flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden shrink-0">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedDate.toLocaleDateString("en-GB", { weekday: "long" })}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Events list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {dayBookings.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No events on this day
                </p>
              ) : (
                dayBookings.map((b, i) => {
                  const style = getEventStyle(b);
                  return (
                    <div
                      key={`${b.id}-${i}`}
                      onClick={() => router.push(`/bookings/${b.id}`)}
                      className={`
                        rounded-lg border-l-[3px] p-3 cursor-pointer
                        transition-all hover:shadow-md
                        bg-white border border-gray-100
                        ${style.border}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-800 leading-tight">
                          {getLabel(b)}
                        </p>
                        <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                      </div>

                      {b.eventTime && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {b.eventTime}
                            {b.doorsOpenTime && ` (Doors ${b.doorsOpenTime})`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        <span>{b.bookerName}</span>
                      </div>

                      {b.pencilNotes && (
                        <p className="mt-1.5 text-xs text-amber-600 italic">
                          {b.pencilNotes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
