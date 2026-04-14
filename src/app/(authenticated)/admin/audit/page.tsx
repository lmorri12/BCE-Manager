"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AuditEntry = {
  id: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
  changes: string | null;
  createdAt: string;
};

const ACTION_COLORS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  BOOKING_CREATED: "default",
  BOOKING_UPDATED: "warning",
  BOOKING_CONFIRMED: "success",
  BOOKING_CLOSED: "secondary",
  STAFF_ASSIGNED: "default",
  STAFF_REMOVED: "destructive",
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

export default function AdminAuditPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit?page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs);
        setTotalPages(data.pages);
        setLoading(false);
      });
  }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Audit Log</h1>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-[var(--muted-foreground)]">No log entries.</div>
          ) : (
            <div>
              {logs.map((log) => {
                const changes = log.changes ? JSON.parse(log.changes) : null;
                const hasChanges = changes && Object.keys(changes).length > 0;
                const isExpanded = expandedId === log.id;

                return (
                  <div
                    key={log.id}
                    className={`border-b p-4 text-sm ${hasChanges ? "cursor-pointer" : ""} hover:bg-[var(--muted)] transition-colors`}
                    onClick={() => hasChanges && setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge variant={ACTION_COLORS[log.action] || "secondary"} className="text-[10px]">
                        {log.action.replace(/_/g, " ")}
                      </Badge>
                      <span className="font-medium text-gray-800">{log.summary}</span>
                      {log.entityId && (
                        <button
                          className="text-xs text-blue-600 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (log.entity === "Booking") router.push(`/bookings/${log.entityId}`);
                          }}
                        >
                          View
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      <span className="font-medium text-gray-500">{log.userName}</span>
                      {" — "}
                      {new Date(log.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>

                    {isExpanded && changes && (
                      <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-3 text-xs space-y-1">
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--muted-foreground)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
