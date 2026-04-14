"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

type Booking = {
  id: string;
  status: string;
  bookerName: string;
  eventName: string | null;
  eventNameTBC: string | null;
  eventDate: string | null;
  eventTime: string | null;
  chargeModel: string;
  enquiryDate: string;
  tasks: { id: string; completed: boolean }[];
  recurringBooking: { groupName: string } | null;
  createdByUser: { id: string; name: string } | null;
};

const STATUS_TABS = [
  { value: "ALL", label: "All" },
  { value: "ENQUIRY", label: "Enquiries" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "READY", label: "Ready" },
  { value: "POST_EVENT", label: "Post Event" },
  { value: "CLOSED", label: "Closed" },
];

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  ENQUIRY: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "warning",
  READY: "success",
  DAY_OF: "warning",
  POST_EVENT: "secondary",
  CLOSED: "secondary",
};

const CHARGE_LABELS: Record<string, string> = {
  STRAIGHT_HIRE: "Hire",
  BOX_OFFICE_SPLIT: "Box Office",
  INTERNAL: "Internal",
};

export default function BookingsPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <BookingsContent />
    </Suspense>
  );
}

function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const activeTab = searchParams.get("status") || "ALL";

  useEffect(() => {
    const url =
      activeTab === "ALL" ? "/api/bookings" : `/api/bookings?status=${activeTab}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setBookings(data);
        setLoading(false);
      });
  }, [activeTab]);

  function handleTabChange(value: string) {
    setLoading(true);
    if (value === "ALL") {
      router.push("/bookings");
    } else {
      router.push(`/bookings?status=${value}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <Link href="/bookings/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">
              Loading...
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">
              No bookings found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 font-medium">Event</th>
                    <th className="p-3 font-medium">Booker</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Charge</th>
                    <th className="p-3 font-medium">Entered by</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Tasks</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const incompleteTasks = b.tasks.filter(
                      (t) => !t.completed
                    ).length;
                    return (
                      <tr
                        key={b.id}
                        className="border-b cursor-pointer hover:bg-[var(--muted)] transition-colors"
                        onClick={() => router.push(`/bookings/${b.id}`)}
                      >
                        <td className="p-3">
                          <div className="font-medium">
                            {b.eventName || b.eventNameTBC || "Unnamed"}
                          </div>
                          {b.recurringBooking && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {b.recurringBooking.groupName}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {b.bookerName}
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {b.eventDate
                            ? new Date(b.eventDate).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "TBC"}
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {b.eventTime || "TBC"}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {CHARGE_LABELS[b.chargeModel] || b.chargeModel}
                          </Badge>
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {b.createdByUser?.name || "—"}
                        </td>
                        <td className="p-3">
                          <Badge variant={STATUS_VARIANTS[b.status] || "secondary"}>
                            {b.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {b.tasks.length > 0 && (
                            <span
                              className={
                                incompleteTasks > 0
                                  ? "text-[var(--warning)]"
                                  : "text-[var(--success)]"
                              }
                            >
                              {b.tasks.length - incompleteTasks}/{b.tasks.length}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
