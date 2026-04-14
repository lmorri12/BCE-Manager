"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type Assignment = {
  id: string;
  role: string;
  staffName: string;
  staffPhone: string | null;
};

type StaffSuggestion = {
  staffName: string;
  role: string;
  eventCount: number;
  lastKnownPhone: string | null;
};

const STAFF_TYPES = [
  { value: "TECHNICIAN", label: "Technician" },
  { value: "BAR_VOLUNTEER", label: "Bar Volunteer" },
  { value: "FOH_VOLUNTEER", label: "FoH Volunteer" },
  { value: "DUTY_MANAGER", label: "Duty Manager" },
];

export function StaffAssignment({
  bookingId,
  assignments,
  onUpdate,
}: {
  bookingId: string;
  assignments: Assignment[];
  onUpdate: () => void;
}) {
  const [suggestions, setSuggestions] = useState<StaffSuggestion[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetch("/api/staff")
      .then((res) => res.json())
      .then(setSuggestions);
  }, []);

  const filteredSuggestions = suggestions.filter(
    (s) =>
      (!selectedType || s.role === selectedType) &&
      s.staffName.toLowerCase().includes(staffName.toLowerCase()) &&
      staffName.length > 0
  );

  function selectSuggestion(s: StaffSuggestion) {
    setStaffName(s.staffName);
    setStaffPhone(s.lastKnownPhone || "");
    if (!selectedType) setSelectedType(s.role);
    setShowSuggestions(false);
  }

  async function handleAssign() {
    if (!staffName.trim() || !selectedType) return;
    setAssigning(true);

    await fetch(`/api/bookings/${bookingId}/assign-staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffName: staffName.trim(),
        staffPhone: staffPhone.trim() || null,
        role: selectedType,
      }),
    });

    setAssigning(false);
    setStaffName("");
    setStaffPhone("");
    setSelectedType("");
    onUpdate();
    // Refresh suggestions
    fetch("/api/staff").then((r) => r.json()).then(setSuggestions);
  }

  async function handleRemove(assignmentId: string) {
    await fetch(
      `/api/bookings/${bookingId}/assign-staff?assignmentId=${assignmentId}`,
      { method: "DELETE" }
    );
    onUpdate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignments */}
        {assignments.length > 0 ? (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {STAFF_TYPES.find((t) => t.value === a.role)?.label || a.role}
                  </Badge>
                  <span className="font-medium">{a.staffName}</span>
                  {a.staffPhone && (
                    <span className="text-sm text-[var(--muted-foreground)]">
                      {a.staffPhone}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(a.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            No staff assigned yet.
          </p>
        )}

        {/* Assign New */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Role</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex h-10 rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm"
              >
                <option value="">Select role...</option>
                {STAFF_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1 relative">
              <label className="text-xs font-medium">Name</label>
              <Input
                value={staffName}
                onChange={(e) => {
                  setStaffName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type a name..."
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-md border border-[var(--border)] bg-white shadow-lg max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={`${s.staffName}-${s.role}-${i}`}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--muted)] flex items-center justify-between"
                      onMouseDown={() => selectSuggestion(s)}
                    >
                      <span>{s.staffName}</span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {s.eventCount} event{s.eventCount !== 1 ? "s" : ""}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-36 space-y-1">
              <label className="text-xs font-medium">Phone</label>
              <Input
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button
              onClick={handleAssign}
              disabled={!staffName.trim() || !selectedType || assigning}
            >
              {assigning ? "..." : "Assign"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
