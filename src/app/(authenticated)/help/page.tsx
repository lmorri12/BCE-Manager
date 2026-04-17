"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar, CalendarDays, ClipboardList, Users, Repeat, Shield,
  ScrollText, Database, Bell, ChevronDown, ChevronRight, HelpCircle,
  BookOpen, Search, Pencil, Plus, Download, Upload, Printer, Moon,
} from "lucide-react";

type Section = {
  id: string;
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
};

function Accordion({ sections }: { sections: Section[] }) {
  const [openId, setOpenId] = useState<string | null>(sections[0]?.id || null);

  return (
    <div className="space-y-2">
      {sections.map((s) => {
        const isOpen = openId === s.id;
        return (
          <div key={s.id} className="rounded-lg border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : s.id)}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-[var(--muted)] transition-colors"
            >
              <span className="text-[var(--bce-blue)]">{s.icon}</span>
              <span className="flex-1 font-medium">{s.title}</span>
              {isOpen ? <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" /> : <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)]" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
                {s.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HelpPage() {
  const sections: Section[] = [
    {
      id: "dashboard",
      icon: <BookOpen className="h-5 w-5" />,
      title: "Dashboard",
      content: (
        <>
          <p>The dashboard is your home page. It shows:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Conflict warnings</strong> — dates with multiple bookings that need resolving, shown in an amber banner at the top.</li>
            <li><strong>Your pending assignments</strong> — if you are a Tech or Bar admin, bookings needing your staff type assigned (only visible to those roles).</li>
            <li><strong>Stats cards</strong> — quick counts of enquiries, confirmed, and in-progress bookings. Click any card to jump to that filtered view.</li>
            <li><strong>Upcoming events</strong> — the next 5 events with their status and any pending tasks. Use the &quot;Hide internal events&quot; toggle to focus on external bookings.</li>
          </ul>
        </>
      ),
    },
    {
      id: "bookings",
      icon: <Calendar className="h-5 w-5" />,
      title: "Bookings",
      content: (
        <>
          <p>The main bookings list shows all events. Use the <strong>status tabs</strong> to filter by stage and the <strong>search bar</strong> to find bookings by event name, booker, or date. The &quot;Hide internal&quot; toggle removes internal/free bookings from the list.</p>

          <p className="font-medium mt-2">Creating a booking</p>
          <p>Click <strong>New Booking</strong> and choose one of three types:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Pencil Booking</strong> — a provisional enquiry. Add the booker&apos;s details and pencil dates (which appear on the calendar). Full details are added later when confirming.</li>
            <li><strong>Confirmed Booking</strong> — an external booking with all details ready. Choose Straight Hire or Box Office Split as the charge model.</li>
            <li><strong>Internal Booking</strong> — a free/non-chargeable event. No charge fields shown.</li>
          </ul>

          <p className="font-medium mt-2">Booking lifecycle</p>
          <p>Each booking moves through these stages (shown in the status timeline on the detail page):</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Enquiry</strong> — provisional. Add pencil dates, edit details, then click &quot;Confirm Booking&quot;.</li>
            <li><strong>Confirmed</strong> — full details entered. Tasks are spawned for required staff areas.</li>
            <li><strong>In Progress</strong> — staff assignment underway. Tech/Bar/FoH admins assign people.</li>
            <li><strong>Ready</strong> — all staff assigned (or skipped if N/A). Event is good to go.</li>
            <li><strong>Post Event</strong> — after the event. Complete ticket reconciliation and add feedback.</li>
            <li><strong>Closed</strong> — all done.</li>
          </ol>
          <p>If all staff areas are set to N/A (e.g. internal room-only bookings), the booking skips straight to Ready.</p>

          <p className="font-medium mt-2">Editing a confirmed booking</p>
          <p>Click <strong>Edit</strong> on the event details card to change the date, time, charge model, tech requirements, or staff requirements.</p>

          <p className="font-medium mt-2">Conflict detection</p>
          <p>When confirming a booking on a date that already has another event, you&apos;ll see a warning. You can choose to confirm anyway. If the conflict is with a recurring internal booking, confirming will automatically cancel that occurrence.</p>

          <p className="font-medium mt-2">Hire line items</p>
          <p>For Straight Hire bookings, add line items (description + amount) in the Hire Line Items section. Use <strong>Export CSV</strong> to download for your external finance system.</p>

          <p className="font-medium mt-2">Notes</p>
          <p>Leave notes on any booking for other admins to see. Press Enter to send, or Shift+Enter for a new line.</p>
        </>
      ),
    },
    {
      id: "calendar",
      icon: <CalendarDays className="h-5 w-5" />,
      title: "Calendar",
      content: (
        <>
          <p>A monthly calendar view showing all bookings colour-coded:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--bce-gold)] mr-1 align-middle" /> <strong>Gold</strong> — pencil/provisional dates</li>
            <li><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--bce-blue)] mr-1 align-middle" /> <strong>Blue</strong> — confirmed external bookings</li>
            <li><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--bce-green)] mr-1 align-middle" /> <strong>Green</strong> — internal/free bookings</li>
          </ul>
          <p>Dates with multiple confirmed bookings show a <strong>!!</strong> warning indicator.</p>
          <p><strong>Click any day</strong> to open a side panel showing all events on that date with times and booker details. Click an event to go to its booking page.</p>
          <p>Use the <strong>&quot;+ New booking on this day&quot;</strong> button in the day panel to create a booking pre-filled with that date.</p>
          <p>Navigate months with the arrow buttons. Click <strong>Today</strong> to jump back to the current month.</p>
        </>
      ),
    },
    {
      id: "rota",
      icon: <ClipboardList className="h-5 w-5" />,
      title: "Rota",
      content: (
        <>
          <p>The event rota shows a table of all upcoming confirmed events (excluding internal bookings) with columns for:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Date, time, event name, booker</li>
            <li>Who entered the booking into the system</li>
            <li>Assigned technician, bar volunteer, FoH volunteer, and duty manager</li>
            <li>Areas marked N/A show as greyed out</li>
            <li>Unassigned roles show &quot;Needed&quot; in amber</li>
          </ul>
          <p>Use the <strong>date range</strong> filters to adjust the time period. Click <strong>Print</strong> to print a clean version for the noticeboard (sidebar and header are hidden automatically).</p>
          <p>Click any row to go to that booking&apos;s detail page.</p>
        </>
      ),
    },
    {
      id: "staff",
      icon: <Users className="h-5 w-5" />,
      title: "Staff Directory",
      content: (
        <>
          <p>The staff directory is automatically built from everyone who has been assigned to a booking. No manual staff management needed — just type a name when assigning and they&apos;re tracked.</p>
          <p><strong>Filter by role</strong> using the tabs (Technicians, Bar, FoH, Duty Managers).</p>
          <p><strong>Click a name</strong> to see their full event history in a side panel — every event they&apos;ve worked, with dates and roles. The event count badge shows how experienced each person is.</p>
          <p>When assigning staff to a booking, previous names auto-suggest as you type, with their phone number pre-filled.</p>
        </>
      ),
    },
    {
      id: "recurring",
      icon: <Repeat className="h-5 w-5" />,
      title: "Recurring Bookings",
      content: (
        <>
          <p>Set up recurring internal bookings for community groups who use the venue regularly (e.g. every Monday and Thursday).</p>
          <p><strong>Creating:</strong> Click &quot;Add Recurring Booking&quot;, enter the group name, contact, days of the week, time, and date range.</p>
          <p><strong>Generating:</strong> Click <strong>Generate</strong> to create individual bookings for the next 12 weeks. Dates that conflict with existing bookings are automatically skipped (you&apos;ll see which dates were skipped).</p>
          <p><strong>Editing:</strong> Click &quot;Edit&quot; to change the group&apos;s details or deactivate the series. The edit page also shows all upcoming occurrences.</p>
          <p><strong>Overrides:</strong> If an external booking needs a date that has a recurring booking, the conflict dialog offers to cancel that single occurrence automatically — the rest of the series continues.</p>
          <p>Generated bookings are created as Confirmed/Internal with all staff set to N/A, so they go straight to Ready.</p>
        </>
      ),
    },
    {
      id: "staffassignment",
      icon: <Pencil className="h-5 w-5" />,
      title: "Staff Assignment",
      content: (
        <>
          <p>On each booking&apos;s detail page, the Staff Assignment section lets you assign people to roles:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Choose a role</strong> (Technician, Bar Volunteer, FoH Volunteer, Duty Manager)</li>
            <li><strong>Type a name</strong> — previous staff auto-suggest with their event count</li>
            <li>Optionally add a <strong>phone number</strong></li>
            <li>Click <strong>Assign</strong></li>
          </ul>
          <p>Assigning staff automatically completes the corresponding task. When all tasks are done, the booking moves to Ready.</p>
          <p><strong>Who can assign what:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Super User — all roles</li>
            <li>Bookings Admin — FoH and Duty Manager</li>
            <li>Tech Admin — Technicians only</li>
            <li>Bar Admin — Bar Volunteers only</li>
          </ul>
          <p>Staff areas can be marked N/A when creating or confirming a booking if they&apos;re not needed (e.g. rehearsals don&apos;t need bar or FoH).</p>
        </>
      ),
    },
    {
      id: "notifications",
      icon: <Bell className="h-5 w-5" />,
      title: "Notifications",
      content: (
        <>
          <p>The bell icon in the top bar shows your unread notification count. Click it to see recent notifications, or click &quot;View all&quot; for the full list.</p>
          <p>You&apos;ll get notified when:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>A booking is confirmed that needs your staff type (Tech/Bar admins)</li>
            <li>Staff is assigned to a booking you manage (Bookings Admin)</li>
            <li>All tasks are complete for a booking (event ready)</li>
            <li>A booking has incomplete tasks on the day of the event (via daily check)</li>
            <li>An event moves to post-event status</li>
          </ul>
          <p>Click any notification to jump to the relevant booking. Use &quot;Mark all as read&quot; to clear them.</p>
        </>
      ),
    },
    {
      id: "users",
      icon: <Shield className="h-5 w-5" />,
      title: "User Management (Super User)",
      content: (
        <>
          <p>Super Users can create and manage system accounts under <strong>Users</strong> in the sidebar.</p>
          <p><strong>Roles:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Super User</strong> — full access to everything</li>
            <li><strong>Bookings Admin</strong> — create/edit bookings, assign FoH and Duty Managers</li>
            <li><strong>Tech Admin</strong> — view bookings, assign technicians</li>
            <li><strong>Bar Admin</strong> — view bookings, assign bar volunteers</li>
          </ul>
          <p>When creating a user, set a temporary password. The user can change it via the user menu (top right).</p>
          <p>You can deactivate users without deleting them, and reset passwords if needed.</p>
        </>
      ),
    },
    {
      id: "audit",
      icon: <ScrollText className="h-5 w-5" />,
      title: "Audit Log (Super User)",
      content: (
        <>
          <p>The <strong>Audit Log</strong> page shows a full chronological record of every action in the system — who created, edited, confirmed, or closed bookings, who assigned staff, and bulk imports.</p>
          <p>Click any entry with changes to expand a diff showing exactly what was modified (old value → new value).</p>
          <p>Each booking also has its own Activity Log at the bottom of its detail page.</p>
        </>
      ),
    },
    {
      id: "data",
      icon: <Database className="h-5 w-5" />,
      title: "Data Export / Import (Super User)",
      content: (
        <>
          <p>Under <strong>Data</strong> in the sidebar:</p>
          <p><strong>Export:</strong> Download all bookings as a CSV file for backup or external processing.</p>
          <p><strong>Import:</strong> Upload a CSV to bulk-create bookings. The CSV must have at minimum a &quot;Booker Name&quot; column. Supported columns:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Event Name, Booker Name, Booker Email, Booker Phone</li>
            <li>Event Date (YYYY-MM-DD), Event Time (HH:MM), Doors Open</li>
            <li>Charge Model (STRAIGHT_HIRE / BOX_OFFICE_SPLIT / INTERNAL)</li>
            <li>Status (ENQUIRY / CONFIRMED / etc.)</li>
            <li>Tech Required, Bar Required, FoH Required (Yes/No)</li>
            <li>Tech Requirements, Ticket Price, Box Office Split %</li>
          </ul>
          <p>Rows with errors are skipped and reported — successfully imported rows are created immediately.</p>
        </>
      ),
    },
    {
      id: "darkmode",
      icon: <Moon className="h-5 w-5" />,
      title: "Dark Mode",
      content: (
        <p>Click the <strong>moon/sun icon</strong> in the top bar to toggle dark mode. Your preference is saved and persists between sessions.</p>
      ),
    },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-6 w-6 text-[var(--bce-blue)]" />
        <h1 className="text-2xl font-bold">Help &amp; User Guide</h1>
      </div>
      <p className="text-[var(--muted-foreground)]">
        Click any section below to expand it. This guide covers all features of the Biggar Corn Exchange Booking Management System.
      </p>
      <Accordion sections={sections} />
    </div>
  );
}
