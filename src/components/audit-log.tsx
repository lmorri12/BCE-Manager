"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ChevronDown, ChevronUp } from "lucide-react";

type AuditEntry = {
  id: string;
  userName: string;
  action: string;
  summary: string;
  changes: string | null;
  createdAt: string;
};

const ACTION_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  BOOKING_CREATED: { label: "Created", variant: "default" },
  BOOKING_UPDATED: { label: "Updated", variant: "warning" },
  BOOKING_CONFIRMED: { label: "Confirmed", variant: "success" },
  BOOKING_CLOSED: { label: "Closed", variant: "secondary" },
  STAFF_ASSIGNED: { label: "Staff", variant: "default" },
  STAFF_REMOVED: { label: "Staff Removed", variant: "destructive" },
};

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  bookerName: "Booker Name",
  bookerEmail: "Booker Email",
  bookerPhone: "Booker Phone",
  eventName: "Event Name",
  eventNameTBC: "Event Name (TBC)",
  eventDate: "Event Date",
  eventTime: "Event Time",
  doorsOpenTime: "Doors Open",
  chargeModel: "Charge Model",
  techRequirements: "Tech Requirements",
  techRequired: "Tech Required",
  barRequired: "Bar Required",
  fohRequired: "FoH Required",
};

function formatValue(val: unknown): string {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "string" && val.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(val).toLocaleDateString("en-GB");
  }
  return String(val);
}

export function BookingAuditLog({ bookingId }: { bookingId: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bookings/${bookingId}/audit`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return null;
  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-0">
            {logs.map((log) => {
              const actionInfo = ACTION_LABELS[log.action] || { label: log.action, variant: "secondary" as const };
              const changes = log.changes ? JSON.parse(log.changes) : null;
              const hasChanges = changes && Object.keys(changes).length > 0;
              const isExpanded = expandedId === log.id;

              return (
                <div key={log.id} className="relative pl-8 pb-4">
                  {/* Timeline dot */}
                  <div className="absolute left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-gray-300" />

                  <div
                    className={`text-sm ${hasChanges ? "cursor-pointer" : ""}`}
                    onClick={() => hasChanges && setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={actionInfo.variant} className="text-[10px] px-1.5 py-0">
                        {actionInfo.label}
                      </Badge>
                      <span className="text-gray-700">{log.summary}</span>
                      {hasChanges && (
                        isExpanded
                          ? <ChevronUp className="h-3 w-3 text-gray-400" />
                          : <ChevronDown className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {log.userName} — {new Date(log.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {/* Changes diff */}
                    {isExpanded && changes && (
                      <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-2 text-xs space-y-1">
                        {Object.entries(changes).map(([field, diff]: [string, any]) => (
                          <div key={field} className="flex gap-2">
                            <span className="font-medium text-gray-600 min-w-[120px]">
                              {FIELD_LABELS[field] || field}:
                            </span>
                            <span className="text-red-500 line-through">{formatValue(diff.from)}</span>
                            <span className="text-gray-400">&rarr;</span>
                            <span className="text-green-600">{formatValue(diff.to)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
