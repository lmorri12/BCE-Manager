"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, ClipboardList, AlertTriangle, CheckCircle, TriangleAlert } from "lucide-react";

type Booking = {
  id: string;
  eventName: string | null;
  eventNameTBC: string | null;
  eventDate: string | null;
  eventTime: string | null;
  bookerName: string;
  status: string;
  chargeModel: string;
  tasks: { id: string; completed: boolean }[];
};

type Conflict = {
  date: string;
  count: number;
  bookings: {
    id: string;
    eventName: string | null;
    eventNameTBC: string | null;
    eventTime: string | null;
    bookerName: string;
  }[];
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({ enquiry: 0, confirmed: 0, inProgress: 0 });
  const [upcomingEvents, setUpcomingEvents] = useState<Booking[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideInternal, setHideInternal] = useState(false);

  useEffect(() => {
    async function load() {
      const [bookingsRes, conflictsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/bookings/conflicts"),
      ]);

      if (bookingsRes.ok) {
        const bookings: Booking[] = await bookingsRes.json();
        setStats({
          enquiry: bookings.filter((b) => b.status === "ENQUIRY").length,
          confirmed: bookings.filter((b) => b.status === "CONFIRMED").length,
          inProgress: bookings.filter((b) => b.status === "IN_PROGRESS").length,
        });

        const now = new Date();
        const upcoming = bookings
          .filter(
            (b) =>
              b.eventDate &&
              new Date(b.eventDate) >= now &&
              ["CONFIRMED", "IN_PROGRESS", "READY"].includes(b.status)
          )
          .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
          .slice(0, 5);
        setUpcomingEvents(upcoming);
      }

      if (conflictsRes.ok) {
        const allConflicts: Conflict[] = await conflictsRes.json();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setConflicts(allConflicts.filter((c) => new Date(c.date) >= today));
      }

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="p-6 text-[var(--muted-foreground)]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome, {session?.user?.name}
      </h1>

      {/* Conflict Warning Banner */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert className="h-5 w-5 text-amber-600" />
            <h2 className="font-semibold text-amber-800">
              Booking Conflicts ({conflicts.length} date{conflicts.length !== 1 ? "s" : ""})
            </h2>
          </div>
          <div className="space-y-2">
            {conflicts.map((conflict) => (
              <div key={conflict.date} className="rounded-md border border-amber-200 bg-white p-3">
                <p className="text-sm font-medium text-amber-900">
                  {new Date(conflict.date + "T12:00:00").toLocaleDateString("en-GB", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  <span className="ml-2 text-amber-600">
                    — {conflict.count} bookings
                  </span>
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {conflict.bookings.map((b) => (
                    <Link
                      key={b.id}
                      href={`/bookings/${b.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs hover:bg-amber-100 transition-colors"
                    >
                      <span className="font-medium">{b.eventName || b.eventNameTBC || "Unnamed"}</span>
                      {b.eventTime && <span className="text-amber-600">{b.eventTime}</span>}
                      <span className="text-amber-500">({b.bookerName})</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/bookings?status=ENQUIRY">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Enquiries
              </CardTitle>
              <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.enquiry}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bookings?status=CONFIRMED">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Confirmed
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-[var(--success)]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.confirmed}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/bookings?status=IN_PROGRESS">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                In Progress
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/rota">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
                Upcoming Events
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-[var(--muted-foreground)]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{upcomingEvents.length}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming Events List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upcoming Events</CardTitle>
          <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] cursor-pointer">
            <input
              type="checkbox"
              checked={hideInternal}
              onChange={(e) => setHideInternal(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Hide internal events
          </label>
        </CardHeader>
        <CardContent>
          {upcomingEvents.filter((b) => !hideInternal || b.chargeModel !== "INTERNAL").length === 0 ? (
            <p className="text-[var(--muted-foreground)]">
              No upcoming events scheduled.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.filter((b) => !hideInternal || b.chargeModel !== "INTERNAL").map((booking) => {
                const incompleteTasks = booking.tasks.filter(
                  (t) => !t.completed
                ).length;
                return (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-[var(--muted)] transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {booking.eventName || booking.eventNameTBC || "Unnamed Event"}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {booking.eventDate
                          ? new Date(booking.eventDate).toLocaleDateString("en-GB", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "Date TBC"}{" "}
                        {booking.eventTime && `at ${booking.eventTime}`}
                      </p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        Booked by: {booking.bookerName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          booking.status === "READY"
                            ? "success"
                            : booking.status === "IN_PROGRESS"
                              ? "warning"
                              : "default"
                        }
                      >
                        {booking.status.replace(/_/g, " ")}
                      </Badge>
                      {incompleteTasks > 0 && (
                        <Badge variant="destructive">
                          {incompleteTasks} task{incompleteTasks !== 1 ? "s" : ""} pending
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
