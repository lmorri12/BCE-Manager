"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";

type StaffAssignment = {
  id: string;
  role: string;
  staffName: string;
  staffPhone: string | null;
};

type RotaBooking = {
  id: string;
  eventName: string | null;
  eventNameTBC: string | null;
  eventDate: string;
  eventTime: string | null;
  bookerName: string;
  chargeModel: string;
  status: string;
  techRequired: boolean;
  barRequired: boolean;
  fohRequired: boolean;
  stairClimberRequired: boolean;
  createdByUser: { name: string } | null;
  staffAssignments: StaffAssignment[];
  tasks: { area: string; completed: boolean }[];
};

function getStaffForRole(assignments: StaffAssignment[], role: string): string {
  const matches = assignments.filter((a) => a.role === role);
  if (matches.length === 0) return "";
  return matches.map((a) => a.staffName).join(", ");
}

function getStaffPhonesForRole(assignments: StaffAssignment[], role: string): string {
  const matches = assignments.filter((a) => a.role === role && a.staffPhone);
  if (matches.length === 0) return "";
  return matches.map((a) => a.staffPhone).join(", ");
}

export default function RotaPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<RotaBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rota?from=${fromDate}&to=${toDate}`)
      .then((res) => res.json())
      .then((data) => {
        setBookings(data);
        setLoading(false);
      });
  }, [fromDate, toDate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Event Rota</h1>
          <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--muted-foreground)]">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-[var(--muted-foreground)]">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">
              No events in this date range.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Event</th>
                    <th className="p-3 font-medium">Booker</th>
                    <th className="p-3 font-medium">Entered by</th>
                    <th className="p-3 font-medium">Technician</th>
                    <th className="p-3 font-medium">Bar</th>
                    <th className="p-3 font-medium">FoH</th>
                    <th className="p-3 font-medium">Duty Manager</th>
                    <th className="p-3 font-medium">Stair Climber</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const tech = getStaffForRole(b.staffAssignments, "TECHNICIAN");
                    const bar = getStaffForRole(b.staffAssignments, "BAR_VOLUNTEER");
                    const foh = getStaffForRole(b.staffAssignments, "FOH_VOLUNTEER");
                    const dm = getStaffForRole(b.staffAssignments, "DUTY_MANAGER");
                    const stair = getStaffForRole(b.staffAssignments, "STAIR_CLIMBER_OPERATOR");

                    return (
                      <tr
                        key={b.id}
                        className="border-b border-[var(--border)] cursor-pointer transition-colors hover:bg-[var(--muted)]"
                        onClick={() => router.push(`/bookings/${b.id}`)}
                      >
                        <td className="p-3 whitespace-nowrap">
                          {new Date(b.eventDate).toLocaleDateString("en-GB", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {b.eventTime || "—"}
                        </td>
                        <td className="p-3 font-medium">
                          {b.eventName || b.eventNameTBC || "Unnamed"}
                          {b.chargeModel === "INTERNAL" && (
                            <Badge variant="outline" className="ml-2 text-[10px]">Internal</Badge>
                          )}
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {b.bookerName}
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {b.createdByUser?.name || "—"}
                        </td>
                        <td className="p-3">
                          {b.techRequired
                            ? tech || <span className="text-[var(--warning)]">Needed</span>
                            : <span className="text-[var(--muted-foreground)]">N/A</span>}
                        </td>
                        <td className="p-3">
                          {b.barRequired
                            ? bar || <span className="text-[var(--warning)]">Needed</span>
                            : <span className="text-[var(--muted-foreground)]">N/A</span>}
                        </td>
                        <td className="p-3">
                          {b.fohRequired
                            ? foh || <span className="text-[var(--warning)]">Needed</span>
                            : <span className="text-[var(--muted-foreground)]">N/A</span>}
                        </td>
                        <td className="p-3">
                          {b.fohRequired
                            ? dm || <span className="text-[var(--warning)]">Needed</span>
                            : <span className="text-[var(--muted-foreground)]">N/A</span>}
                        </td>
                        <td className="p-3">
                          {b.stairClimberRequired
                            ? stair || <span className="text-[var(--warning)]">Needed</span>
                            : <span className="text-[var(--muted-foreground)]">N/A</span>}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              b.status === "READY" ? "success" :
                              b.status === "IN_PROGRESS" ? "warning" : "default"
                            }
                          >
                            {b.status.replace(/_/g, " ")}
                          </Badge>
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
