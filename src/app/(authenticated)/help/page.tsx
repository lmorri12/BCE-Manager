"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HelpCircle,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Repeat,
  ClipboardList,
  Users,
  Shield,
  BarChart3,
  Database,
  Paperclip,
  Bell,
  Moon,
  ScrollText,
} from "lucide-react";

function Section({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[var(--primary)]" />
          <span className="font-semibold">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && <CardContent className="pt-0 text-sm space-y-3 text-[var(--foreground)]">{children}</CardContent>}
    </Card>
  );
}

export default function HelpPage() {
  const { data: session } = useSession();
  const isSuperUser = session?.user?.role === "SUPER_USER";

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <HelpCircle className="h-6 w-6 text-[var(--primary)]" />
        <h1 className="text-2xl font-bold">Help & User Guide</h1>
      </div>

      <Section icon={LayoutDashboard} title="Dashboard">
        <p>The dashboard shows an overview of the system at a glance:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Conflict warnings</strong> — dates with 2+ confirmed bookings are flagged</li>
          <li><strong>Pending assignments</strong> — your role-specific tasks (tech, bar, FoH)</li>
          <li><strong>Stats cards</strong> — total bookings, upcoming events, enquiries</li>
          <li><strong>Upcoming events</strong> — next events with a toggle to hide internal bookings</li>
        </ul>
      </Section>

      <Section icon={Calendar} title="Bookings">
        <p>Bookings follow a lifecycle from initial enquiry through to closure:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Enquiry</strong> — pencil booking with provisional dates shown on calendar</li>
          <li><strong>Confirmed</strong> — full event details, room layout, staff requirements set</li>
          <li><strong>In Progress</strong> — staff assignment tasks have been spawned</li>
          <li><strong>Ready</strong> — all staff assigned, event is fully prepared</li>
          <li><strong>Post Event</strong> — event has occurred, ticket reconciliation and feedback needed</li>
          <li><strong>Closed</strong> — event fully wrapped up</li>
          <li><strong>Cancelled</strong> — event cancelled with a required reason</li>
        </ul>
        <p><strong>Three booking types</strong> when creating:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Pencil Booking</strong> — enquiry stage, provisional dates</li>
          <li><strong>Confirmed Booking</strong> — external chargeable event</li>
          <li><strong>Internal Booking</strong> — free venue use</li>
        </ul>
        <p><strong>Application form tracker</strong> — on enquiries, tick when the theatre rental form has been sent to the client.</p>
        <p><strong>Conflict detection</strong> — when confirming a booking on a date that already has events, a warning shows with the option to force-confirm or cancel recurring occurrences.</p>
        <p><strong>Cancellation</strong> — any booking can be cancelled from any active state. A reason is required and recorded in the audit log.</p>
        <p><strong>Post-event revert</strong> — if a booking was moved to post-event prematurely, use "Move back to Ready".</p>
      </Section>

      <Section icon={CalendarDays} title="Calendar">
        <p>Monthly calendar view showing all bookings colour-coded:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Gold</strong> — pencil dates (provisional enquiries)</li>
          <li><strong>Blue</strong> — confirmed external bookings</li>
          <li><strong>Green</strong> — internal bookings</li>
          <li><strong>!!</strong> indicator — dates with 2+ confirmed bookings (potential conflict)</li>
        </ul>
        <p>Click a day to see events in the side panel. Use "New booking on this day" to pre-fill the date.</p>
      </Section>

      <Section icon={Repeat} title="Recurring Bookings">
        <p>Community groups with regular bookings (e.g. every Monday, every Thursday):</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Set group name, contact details, days of week, start/end times</li>
          <li>Configure charge model, staff requirements, and stair climber need</li>
          <li>"Generate" creates individual bookings for the next 12 weeks</li>
          <li>Dates with existing conflicts are automatically skipped</li>
          <li><strong>Cancel individual occurrences</strong> — on the edit page, each upcoming occurrence has a Cancel button with a required reason</li>
          <li>External bookings can override recurring occurrences — the displaced party notification flag tracks whether affected bookers have been informed</li>
        </ul>
      </Section>

      <Section icon={ClipboardList} title="Rota">
        <p>Table of all upcoming non-internal events with staff assignments:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Columns: Date, Time, Event, Booker, Entered by, Technician, Bar, FoH, Duty Manager, Stair Climber, Status</li>
          <li>Filterable by date range</li>
          <li>"Needed" shown in amber for unfilled roles</li>
          <li>Click any row to open the booking detail</li>
          <li>Print button for a landscape hard copy</li>
        </ul>
      </Section>

      <Section icon={Users} title="Staff Assignment">
        <p>Assign staff to bookings by role. Names are free-text with autocomplete from previous assignments.</p>
        <p><strong>Staff roles:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Technician</strong> — sound, lighting, AV</li>
          <li><strong>Bar Volunteer</strong> — bar service</li>
          <li><strong>FoH Volunteer</strong> — front of house</li>
          <li><strong>Duty Manager</strong> — overall event management</li>
          <li><strong>Stair Climber Operator</strong> — accessibility equipment operator</li>
          <li><strong>Setup Volunteer</strong> — room layout setup (seats in/out, tables). Multiple people can be assigned to this role.</li>
        </ul>
        <p>When a room layout is selected, a "Setup" task is automatically created. Setup volunteers appear on the calendar on the setup date (which can be the day before the event).</p>
        <p><strong>Nudge button</strong> — admins can send a reminder notification to all relevant staff admins about an event that still needs coverage.</p>
      </Section>

      <Section icon={Paperclip} title="File Attachments">
        <p>Upload files to confirmed bookings. Each file is tagged with a type:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Marketing Materials</li>
          <li>Theatre Rental Form</li>
          <li>Contract</li>
          <li>Tech Spec</li>
          <li>Other (free text description)</li>
        </ul>
        <p><strong>Uploading and deleting</strong> attachments is restricted to Super Users and Bookings Admins. Tech Admins, Bar Admins and Trustees can view and download attachments but cannot add or remove them.</p>
        <p>Files are stored on the server for 2 years. Older files can be exported to SharePoint via the Data admin page.</p>
      </Section>

      <Section icon={Shield} title="Trustee View-Only Access">
        <p>Trustees have read-only access for oversight purposes. They can:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>View the <strong>Dashboard</strong> (summary stats and upcoming events)</li>
          <li>View the <strong>Bookings</strong> list and any booking detail</li>
          <li>View the <strong>Calendar</strong> (read-only, no "new booking" button)</li>
          <li>View the <strong>Rota</strong> to see staff assignments for upcoming events</li>
          <li>Download attached files</li>
        </ul>
        <p>Trustees cannot create, edit, confirm, cancel, or close bookings; cannot assign staff; cannot upload or delete attachments; and cannot access Recurring, Staff, Reports, or Admin areas.</p>
      </Section>

      <Section icon={BarChart3} title="Reports">
        <p>Date-range filtered reports including:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Total bookings, venue utilisation %, hire revenue</li>
          <li>Recurring vs one-off split</li>
          <li>Bookings by month (stacked external/internal)</li>
          <li>Busiest days of the week</li>
          <li>Breakdown by charge model and status</li>
          <li>Top bookers (regular users) and staff workload</li>
        </ul>
      </Section>

      <Section icon={Bell} title="Notifications & Alerts">
        <p>In-app notifications triggered by:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Booking confirmed — Tech/Bar admins notified if their area is needed</li>
          <li>Staff assigned — Bookings admins notified</li>
          <li>All tasks complete — Bookings admins notified event is ready</li>
          <li><strong>Staff cover escalation</strong> — events without staff cover get weekly alerts (Mondays), escalating to daily alerts within 7 days of the event</li>
          <li>Day-of incomplete tasks — urgent alert on the morning of the event</li>
          <li>Post-event actions needed — triggered the day after an event</li>
        </ul>
        <p>Notifications are polled every 30 seconds. The bell icon shows unread count.</p>
      </Section>

      <Section icon={ScrollText} title="Audit Log">
        <p>Every significant action is logged with who did it, when, and what changed:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Booking created, updated, confirmed, cancelled, closed</li>
          <li>Staff assigned/removed</li>
          <li>Recurring bookings overridden</li>
          <li>Files uploaded/deleted</li>
          <li>Manual nudges sent</li>
        </ul>
        <p>Expand any entry to see the field-level diff of changes.</p>
      </Section>

      <Section icon={Database} title="Data Export & Import">
        <p><strong>Export</strong> — download all bookings as a CSV file for backup or external analysis.</p>
        <p><strong>Import</strong> — upload a CSV to bulk-create bookings. Required column: Booker Name. Optional: Event Name, Email, Phone, Date, Time, Charge Model.</p>
      </Section>

      <Section icon={Moon} title="Room Layout & Setup">
        <p>Confirmed bookings can specify a room layout:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Raked Seating 100</li>
          <li>Raked Seating 114</li>
          <li>Cabaret — Large Round Tables</li>
          <li>Cabaret — Small Round Tables</li>
          <li>Cabaret — Tressle Tables</li>
          <li>Market Style</li>
          <li>Other (free text)</li>
        </ul>
        <p><strong>Setup date</strong> can be different from the event date (e.g. the day before). Setup time and notes (seat-in/seat-out) are also recorded. When a layout is set, a Setup task is created requiring setup volunteer assignment.</p>
      </Section>

      {isSuperUser && (
        <>
          <h2 className="text-xl font-bold mt-8 mb-2">User Role Permissions</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">This section is only visible to Super Users.</p>
          <Card>
            <CardContent className="pt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                      <th className="p-3 font-medium">Capability</th>
                      <th className="p-3 font-medium text-center">Super User</th>
                      <th className="p-3 font-medium text-center">Bookings Admin</th>
                      <th className="p-3 font-medium text-center">Tech Admin</th>
                      <th className="p-3 font-medium text-center">Bar Admin</th>
                      <th className="p-3 font-medium text-center">Trustee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {[
                      ["Create/edit/confirm bookings", true, true, false, false, false],
                      ["Cancel bookings", true, true, false, false, false],
                      ["View all bookings", true, true, true, true, true],
                      ["Assign Technicians", true, false, true, false, false],
                      ["Assign Bar Volunteers", true, false, false, true, false],
                      ["Assign FoH / Duty Manager", true, true, false, false, false],
                      ["Assign Stair Climber Operator", true, true, true, false, false],
                      ["Assign Setup Volunteers", true, true, false, true, false],
                      ["Send nudge notifications", true, true, false, false, false],
                      ["Manage recurring bookings", true, true, false, false, false],
                      ["View reports", true, true, false, false, false],
                      ["View rota", true, true, true, true, true],
                      ["View calendar", true, true, true, true, true],
                      ["View attachments", true, true, true, true, true],
                      ["Upload / delete attachments", true, true, false, false, false],
                      ["Manage users", true, false, false, false, false],
                      ["View audit log", true, false, false, false, false],
                      ["Data export/import", true, false, false, false, false],
                      ["View this permissions table", true, false, false, false, false],
                    ].map(([label, su, ba, ta, bra, tr]) => (
                      <tr key={label as string}>
                        <td className="p-3">{label as string}</td>
                        <td className="p-3 text-center">{su ? "✓" : "—"}</td>
                        <td className="p-3 text-center">{ba ? "✓" : "—"}</td>
                        <td className="p-3 text-center">{ta ? "✓" : "—"}</td>
                        <td className="p-3 text-center">{bra ? "✓" : "—"}</td>
                        <td className="p-3 text-center">{tr ? "✓" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
