"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { HireLines } from "@/components/hire-lines";
import { StaffAssignment } from "@/components/staff-assignment";
import { PencilDates } from "@/components/pencil-dates";
import { BookingAuditLog } from "@/components/audit-log";
import { ArrowLeft, CheckCircle } from "lucide-react";

type Task = {
  id: string;
  area: string;
  description: string;
  completed: boolean;
};

type Assignment = {
  id: string;
  role: string;
  staffName: string;
  staffPhone: string | null;
};

type HireLine = {
  id: string;
  description: string;
  amount: string;
  sortOrder: number;
};

type Booking = {
  id: string;
  status: string;
  bookerName: string;
  bookerEmail: string | null;
  bookerPhone: string | null;
  eventNameTBC: string | null;
  eventName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  doorsOpenTime: string | null;
  hasInterval: boolean | null;
  techRequirements: string | null;
  ticketPrice: string | null;
  ticketSetupInfo: string | null;
  techContactName: string | null;
  techContactPhone: string | null;
  techContactEmail: string | null;
  chargeModel: string;
  boxOfficeSplitPct: string | null;
  techRequired: boolean;
  barRequired: boolean;
  fohRequired: boolean;
  marketingAssets: boolean;
  riskAssessment: boolean;
  insuranceProof: boolean;
  ticketsReconciled: boolean;
  feedbackNotes: string | null;
  provisionalDates: string | null;
  enquiryDate: string;
  tasks: Task[];
  staffAssignments: Assignment[];
  hireLineItems: HireLine[];
  pencilDates: { id: string; date: string; notes: string | null }[];
  recurringBooking: { groupName: string } | null;
  createdByUser: { id: string; name: string } | null;
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "warning" | "destructive"> = {
  ENQUIRY: "secondary",
  CONFIRMED: "default",
  IN_PROGRESS: "warning",
  READY: "success",
  DAY_OF: "warning",
  POST_EVENT: "secondary",
  CLOSED: "secondary",
};

export default function BookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmForm, setShowConfirmForm] = useState(false);

  const fetchBooking = useCallback(async () => {
    const res = await fetch(`/api/bookings/${params.id}`);
    if (res.ok) {
      setBooking(await res.json());
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!booking) return <div className="p-6">Booking not found.</div>;

  const isEnquiry = booking.status === "ENQUIRY";
  const isPostEvent = ["POST_EVENT", "CLOSED"].includes(booking.status);
  const canEdit = ["ENQUIRY", "CONFIRMED"].includes(booking.status);

  async function handleSaveEnquiry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    const res = await fetch(`/api/bookings/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookerName: fd.get("bookerName"),
        bookerEmail: fd.get("bookerEmail"),
        bookerPhone: fd.get("bookerPhone"),
        eventNameTBC: fd.get("eventNameTBC"),
        provisionalDates: fd.get("provisionalDates"),
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to save");
    } else {
      setBooking(await res.json());
    }
  }

  function getConfirmData(fd: FormData, forceConfirm = false) {
    return {
      eventName: fd.get("eventName"),
      eventDate: fd.get("eventDate"),
      eventTime: fd.get("eventTime"),
      doorsOpenTime: fd.get("doorsOpenTime"),
      hasInterval: fd.get("hasInterval") === "on",
      techRequirements: fd.get("techRequirements"),
      ticketPrice: fd.get("ticketPrice"),
      ticketSetupInfo: fd.get("ticketSetupInfo"),
      techContactName: fd.get("techContactName"),
      techContactPhone: fd.get("techContactPhone"),
      techContactEmail: fd.get("techContactEmail"),
      chargeModel: fd.get("chargeModel"),
      boxOfficeSplitPct: fd.get("boxOfficeSplitPct"),
      techRequired: fd.get("techRequired") === "on",
      barRequired: fd.get("barRequired") === "on",
      fohRequired: fd.get("fohRequired") === "on",
      marketingAssets: fd.get("marketingAssets") === "on",
      riskAssessment: fd.get("riskAssessment") === "on",
      insuranceProof: fd.get("insuranceProof") === "on",
      forceConfirm,
    };
  }

  const [conflictInfo, setConflictInfo] = useState<{ conflicts: any[]; savedData: Record<string, unknown> | null }>({ conflicts: [], savedData: null });

  async function handleConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setConflictInfo({ conflicts: [], savedData: null });
    const fd = new FormData(e.currentTarget);
    const confirmData = getConfirmData(fd);

    const res = await fetch(`/api/bookings/${params.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(confirmData),
    });

    setSaving(false);
    if (res.status === 409) {
      const data = await res.json();
      setConflictInfo({ conflicts: data.conflicts, savedData: confirmData });
      return;
    }
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to confirm");
    } else {
      setBooking(await res.json());
      setShowConfirmForm(false);
    }
  }

  async function handleForceConfirm() {
    if (!conflictInfo.savedData) return;
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/bookings/${params.id}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...conflictInfo.savedData, forceConfirm: true }),
    });

    setSaving(false);
    setConflictInfo({ conflicts: [], savedData: null });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to confirm");
    } else {
      setBooking(await res.json());
      setShowConfirmForm(false);
    }
  }

  async function handleClose(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    const res = await fetch(`/api/bookings/${params.id}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketsReconciled: fd.get("ticketsReconciled") === "on",
        feedbackNotes: fd.get("feedbackNotes"),
      }),
    });

    setSaving(false);
    if (res.ok) {
      setBooking(await res.json());
    }
  }

  async function handleMoveToPostEvent() {
    const res = await fetch(`/api/bookings/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "POST_EVENT" }),
    });
    if (res.ok) setBooking(await res.json());
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/bookings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {booking.eventName || booking.eventNameTBC || "Unnamed Event"}
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Booked by {booking.bookerName} — Enquiry {new Date(booking.enquiryDate).toLocaleDateString("en-GB")}
            {booking.createdByUser && (
              <span> — Entered by {booking.createdByUser.name}</span>
            )}
          </p>
        </div>
        <Badge variant={STATUS_VARIANTS[booking.status] || "secondary"} className="text-sm px-3 py-1">
          {booking.status.replace(/_/g, " ")}
        </Badge>
        {booking.recurringBooking && (
          <Badge variant="outline">{booking.recurringBooking.groupName}</Badge>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Enquiry Details (editable when ENQUIRY) */}
      {isEnquiry && (
        <Card>
          <CardHeader>
            <CardTitle>Enquiry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveEnquiry} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Booker Name</Label>
                  <Input name="bookerName" defaultValue={booking.bookerName} required />
                </div>
                <div className="space-y-2">
                  <Label>Event Name (if known)</Label>
                  <Input name="eventNameTBC" defaultValue={booking.eventNameTBC || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Booker Email</Label>
                  <Input name="bookerEmail" type="email" defaultValue={booking.bookerEmail || ""} />
                </div>
                <div className="space-y-2">
                  <Label>Booker Phone</Label>
                  <Input name="bookerPhone" defaultValue={booking.bookerPhone || ""} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Provisional Dates</Label>
                <textarea
                  name="provisionalDates"
                  rows={2}
                  defaultValue={booking.provisionalDates || ""}
                  className="flex w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button type="button" onClick={() => setShowConfirmForm(true)}>
                  Confirm Booking
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pencil Dates — shown for enquiries */}
      {isEnquiry && (
        <PencilDates
          bookingId={booking.id}
          dates={booking.pencilDates}
          onUpdate={fetchBooking}
        />
      )}

      {/* Confirmation Form */}
      {(showConfirmForm || (isEnquiry && showConfirmForm)) && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Booking — Full Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input name="eventName" defaultValue={booking.eventNameTBC || ""} required />
                </div>
                <div className="space-y-2">
                  <Label>Event Date *</Label>
                  <Input name="eventDate" type="date" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Event Time</Label>
                  <Input name="eventTime" type="time" />
                </div>
                <div className="space-y-2">
                  <Label>Doors Open</Label>
                  <Input name="doorsOpenTime" type="time" />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <input type="checkbox" id="hasInterval" name="hasInterval" className="h-4 w-4" />
                  <Label htmlFor="hasInterval">Interval</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tech Requirements</Label>
                <textarea
                  name="techRequirements"
                  rows={3}
                  placeholder="Sound, lighting, projector, etc."
                  className="flex w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tech Contact Name</Label>
                  <Input name="techContactName" />
                </div>
                <div className="space-y-2">
                  <Label>Tech Contact Phone</Label>
                  <Input name="techContactPhone" />
                </div>
                <div className="space-y-2">
                  <Label>Tech Contact Email</Label>
                  <Input name="techContactEmail" type="email" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ticket Price (£)</Label>
                  <Input name="ticketPrice" type="number" step="0.01" min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Ticket Setup Info</Label>
                  <Input name="ticketSetupInfo" placeholder="Pricing tiers, concessions, etc." />
                </div>
              </div>

              {/* Charge Model */}
              <div className="space-y-2">
                <Label>Charge Model *</Label>
                <select
                  name="chargeModel"
                  defaultValue="STRAIGHT_HIRE"
                  className="flex h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <option value="STRAIGHT_HIRE">Straight Hire</option>
                  <option value="BOX_OFFICE_SPLIT">Box Office Split</option>
                  <option value="INTERNAL">Internal (Free)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Box Office Split % (if applicable)</Label>
                <Input name="boxOfficeSplitPct" type="number" step="0.01" min="0" max="100" placeholder="e.g. 80" />
              </div>

              {/* Staff Requirements */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-base font-semibold">Staff Requirements</Label>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Untick any areas not needed for this event.
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="techRequired" defaultChecked className="h-4 w-4" />
                    Tech required
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="barRequired" defaultChecked className="h-4 w-4" />
                    Bar required
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="fohRequired" defaultChecked className="h-4 w-4" />
                    FoH required
                  </label>
                </div>
              </div>

              {/* Checklists */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-base font-semibold">Checklists</Label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="marketingAssets" className="h-4 w-4" />
                    Marketing Assets Received
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="riskAssessment" className="h-4 w-4" />
                    Risk Assessment
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="insuranceProof" className="h-4 w-4" />
                    Insurance Proof
                  </label>
                </div>
              </div>

              {/* Conflict Warning */}
              {conflictInfo.conflicts.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-3">
                  <p className="font-medium text-amber-800">
                    Booking conflict detected
                  </p>
                  <p className="text-sm text-amber-700">
                    There {conflictInfo.conflicts.length === 1 ? "is" : "are"} {conflictInfo.conflicts.length} other booking{conflictInfo.conflicts.length === 1 ? "" : "s"} on this date:
                  </p>
                  <div className="space-y-2">
                    {conflictInfo.conflicts.map((c: any) => (
                      <div key={c.id} className="rounded border border-amber-200 bg-white p-2 text-sm">
                        <span className="font-medium">{c.eventName || c.eventNameTBC || "Unnamed"}</span>
                        {c.eventTime && <span className="text-amber-600"> at {c.eventTime}</span>}
                        <span className="text-amber-600"> — {c.bookerName}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleForceConfirm}
                      disabled={saving}
                    >
                      Confirm Anyway
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConflictInfo({ conflicts: [], savedData: null })}
                    >
                      Go Back
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saving || conflictInfo.conflicts.length > 0}>
                  {saving ? "Confirming..." : "Confirm Booking"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowConfirmForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Booking Details (read-only summary) */}
      {!isEnquiry && !isPostEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div>
                <span className="font-medium text-[var(--muted-foreground)]">Event Name</span>
                <p>{booking.eventName}</p>
              </div>
              <div>
                <span className="font-medium text-[var(--muted-foreground)]">Booker</span>
                <p>{booking.bookerName} {booking.bookerPhone && `(${booking.bookerPhone})`}</p>
              </div>
              <div>
                <span className="font-medium text-[var(--muted-foreground)]">Date</span>
                <p>{booking.eventDate ? new Date(booking.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "TBC"}</p>
              </div>
              <div>
                <span className="font-medium text-[var(--muted-foreground)]">Time</span>
                <p>{booking.eventTime || "TBC"} {booking.doorsOpenTime && `(Doors: ${booking.doorsOpenTime})`}</p>
              </div>
              {booking.techRequirements && (
                <div className="col-span-2">
                  <span className="font-medium text-[var(--muted-foreground)]">Tech Requirements</span>
                  <p>{booking.techRequirements}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-[var(--muted-foreground)]">Charge Model</span>
                <p>
                  {booking.chargeModel === "STRAIGHT_HIRE" && "Straight Hire"}
                  {booking.chargeModel === "BOX_OFFICE_SPLIT" && `Box Office Split (${booking.boxOfficeSplitPct}%)`}
                  {booking.chargeModel === "INTERNAL" && "Internal (Free)"}
                </p>
              </div>
              <div>
                <span className="font-medium text-[var(--muted-foreground)]">Ticket Price</span>
                <p>{booking.ticketPrice ? `£${Number(booking.ticketPrice).toFixed(2)}` : "N/A"}</p>
              </div>
              <div className="col-span-2 flex gap-3 flex-wrap">
                {booking.techRequired ? <Badge variant="default">Tech</Badge> : <Badge variant="secondary">Tech N/A</Badge>}
                {booking.barRequired ? <Badge variant="default">Bar</Badge> : <Badge variant="secondary">Bar N/A</Badge>}
                {booking.fohRequired ? <Badge variant="default">FoH</Badge> : <Badge variant="secondary">FoH N/A</Badge>}
                {booking.hasInterval && <Badge variant="secondary">Has Interval</Badge>}
              </div>
              <div className="col-span-2 flex gap-3 flex-wrap">
                {booking.marketingAssets && <Badge variant="success">Marketing Assets</Badge>}
                {booking.riskAssessment && <Badge variant="success">Risk Assessment</Badge>}
                {booking.insuranceProof && <Badge variant="success">Insurance Proof</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      {booking.tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {booking.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  {task.completed ? (
                    <CheckCircle className="h-5 w-5 text-[var(--success)]" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-[var(--muted-foreground)]" />
                  )}
                  <span className={task.completed ? "text-[var(--muted-foreground)] line-through" : ""}>
                    {task.description} ({task.area})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Assignment */}
      {!isEnquiry && !isPostEvent && booking.status !== "CLOSED" && (
        <StaffAssignment
          bookingId={booking.id}
          assignments={booking.staffAssignments}
          onUpdate={fetchBooking}
        />
      )}

      {/* Hire Lines (for Straight Hire bookings) */}
      {booking.chargeModel === "STRAIGHT_HIRE" && !isEnquiry && (
        <HireLines bookingId={booking.id} lines={booking.hireLineItems} onUpdate={fetchBooking} />
      )}

      {/* Post-Event Actions */}
      {["READY", "DAY_OF", "IN_PROGRESS"].includes(booking.status) && (
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleMoveToPostEvent}>
            Move to Post-Event
          </Button>
        </div>
      )}

      {booking.status === "POST_EVENT" && (
        <Card>
          <CardHeader>
            <CardTitle>Post-Event</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleClose} className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="ticketsReconciled"
                  defaultChecked={booking.ticketsReconciled}
                  className="h-4 w-4"
                />
                Tickets Reconciled
              </label>
              <div className="space-y-2">
                <Label>Feedback / Notes</Label>
                <textarea
                  name="feedbackNotes"
                  rows={3}
                  defaultValue={booking.feedbackNotes || ""}
                  className="flex w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Closing..." : "Close Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Audit Log */}
      <BookingAuditLog bookingId={booking.id} />
    </div>
  );
}
