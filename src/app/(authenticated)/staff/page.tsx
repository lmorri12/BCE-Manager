"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ArrowLeft } from "lucide-react";

type StaffEntry = {
  staffName: string;
  role: string;
  eventCount: number;
  lastKnownPhone: string | null;
};

type HistoryEntry = {
  id: string;
  role: string;
  staffPhone: string | null;
  booking: {
    id: string;
    eventName: string | null;
    eventNameTBC: string | null;
    eventDate: string | null;
    eventTime: string | null;
    status: string;
    chargeModel: string;
  };
};

const ROLE_LABELS: Record<string, string> = {
  TECHNICIAN: "Technician",
  BAR_VOLUNTEER: "Bar Volunteer",
  FOH_VOLUNTEER: "FoH Volunteer",
  DUTY_MANAGER: "Duty Manager",
};

const ROLE_TABS = [
  { value: "ALL", label: "All" },
  { value: "TECHNICIAN", label: "Technicians" },
  { value: "BAR_VOLUNTEER", label: "Bar" },
  { value: "FOH_VOLUNTEER", label: "FoH" },
  { value: "DUTY_MANAGER", label: "Duty Managers" },
];

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const url =
      roleFilter === "ALL" ? "/api/staff" : `/api/staff?role=${roleFilter}`;
    setLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setStaff(data);
        setLoading(false);
      });
  }, [roleFilter]);

  async function showHistory(name: string) {
    setSelectedPerson(name);
    setHistoryLoading(true);
    const res = await fetch(
      `/api/staff/history?name=${encodeURIComponent(name)}`
    );
    if (res.ok) {
      setHistory(await res.json());
    }
    setHistoryLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Staff Directory</h1>
        <p className="text-[var(--muted-foreground)] text-sm mt-1">
          People who have been assigned to events. Click a name to see their
          event history.
        </p>
      </div>

      <Tabs value={roleFilter} onValueChange={setRoleFilter}>
        <TabsList>
          {ROLE_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex gap-4">
        {/* Staff List */}
        <div className={selectedPerson ? "flex-1" : "w-full"}>
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-[var(--muted-foreground)]">
                  Loading...
                </div>
              ) : staff.length === 0 ? (
                <div className="p-6 text-center text-[var(--muted-foreground)]">
                  No staff assignments found. Assign someone to a booking and
                  they&apos;ll appear here.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left bg-[var(--muted)]">
                      <th className="p-3 font-medium">Name</th>
                      <th className="p-3 font-medium">Role</th>
                      <th className="p-3 font-medium">Phone</th>
                      <th className="p-3 font-medium text-right">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((s, i) => (
                      <tr
                        key={`${s.staffName}-${s.role}-${i}`}
                        className={`border-b cursor-pointer hover:bg-[var(--muted)] transition-colors ${
                          selectedPerson === s.staffName ? "bg-blue-50" : ""
                        }`}
                        onClick={() => showHistory(s.staffName)}
                      >
                        <td className="p-3 font-medium text-[var(--primary)]">
                          {s.staffName}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">
                            {ROLE_LABELS[s.role] || s.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-[var(--muted-foreground)]">
                          {s.lastKnownPhone || "—"}
                        </td>
                        <td className="p-3 text-right">
                          <Badge
                            variant={
                              s.eventCount >= 5 ? "success" : "outline"
                            }
                          >
                            {s.eventCount}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History Panel */}
        {selectedPerson && (
          <div className="w-96 shrink-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">
                  {selectedPerson} — Event History
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPerson(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Loading...
                  </p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No events found.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="rounded-md border p-3 text-sm cursor-pointer hover:bg-[var(--muted)] transition-colors"
                        onClick={() => router.push(`/bookings/${h.booking.id}`)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {h.booking.eventName ||
                              h.booking.eventNameTBC ||
                              "Unnamed"}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">
                            {ROLE_LABELS[h.role] || h.role}
                          </Badge>
                        </div>
                        <div className="text-[var(--muted-foreground)] mt-1">
                          {h.booking.eventDate
                            ? new Date(h.booking.eventDate).toLocaleDateString(
                                "en-GB",
                                {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                }
                              )
                            : "Date TBC"}
                          {h.booking.eventTime && ` at ${h.booking.eventTime}`}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-[var(--muted-foreground)] pt-2 text-center">
                      {history.length} event{history.length !== 1 ? "s" : ""}{" "}
                      total
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
